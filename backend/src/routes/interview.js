const express = require('express');
const Interview = require('../models/Interview');
const { authenticateToken } = require('../middleware/auth');
const fetch = require('node-fetch');

const router = express.Router();
const token = process.env.OPENROUTER_API_KEY;

// Function to generate interview questions based on the role
const generateQuestionsForRole = async (role) => {
  const prompt = `Generate 5 technical interview questions for a ${role} position. Format each question as a complete sentence ending with a question mark. Return ONLY a JSON array of strings.

Example format:
[
  "What is the difference between let and const in JavaScript?",
  "Can you explain how React's virtual DOM works?",
  "What are the benefits of using TypeScript over JavaScript?",
  "How does event delegation work in the DOM?",
  "What is the purpose of the useEffect hook in React?"
]`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": process.env.SITE_NAME || "Technical Interview Assistant"
      },
      body: JSON.stringify({
        model: "sophosympatheia/rogue-rose-103b-v0.2:free",
        messages: [
          {
            role: "system",
            content: "You are an expert technical interviewer. Generate challenging and relevant interview questions. Always respond with a valid JSON array of strings."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from OpenRouter API:', errorData);
      throw new Error(`OpenRouter API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('AI Response:', data.choices?.[0]?.message?.content);
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from AI model');
    }

    const questionsText = data.choices[0].message.content.trim();
    
    // Try parsing as JSON first
    try {
      const questions = JSON.parse(questionsText);
      if (Array.isArray(questions) && questions.length > 0) {
        // Validate each question ends with a question mark
        const validQuestions = questions
          .map(q => q.trim())
          .filter(q => q.endsWith('?'));
        
        if (validQuestions.length >= 3) { // At least 3 valid questions
          return validQuestions.slice(0, 5); // Return max 5 questions
        }
      }
    } catch (error) {
      console.log('Failed to parse JSON response, attempting text extraction');
    }

    // Fallback: Extract questions from text
    const questionRegex = /(?:^|\n)(?:\d+\.\s*)?([^.\n]+\?)/g;
    const matches = [...questionsText.matchAll(questionRegex)]
      .map(match => match[1].trim())
      .filter(q => q.length > 10 && q.endsWith('?')); // Ensure meaningful questions

    if (matches.length >= 3) {
      return matches.slice(0, 5);
    }

    // If we still don't have enough questions, try line-by-line extraction
    const lineQuestions = questionsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10 && line.endsWith('?'))
      .slice(0, 5);

    if (lineQuestions.length >= 3) {
      return lineQuestions;
    }

    throw new Error('Failed to extract valid questions');
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
};

// Function to process AI response for answer feedback
const processAIResponse = async (content) => {
  try {
    // Try parsing as JSON first
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed.feedback === 'string' && typeof parsed.score === 'number') {
        return {
          feedback: parsed.feedback,
          score: Math.min(Math.max(Math.round(parsed.score), 0), 10) // Ensure score is between 0-10
        };
      }
    } catch (e) {
      console.log('Failed to parse JSON response, attempting text extraction');
    }

    // Enhanced regex patterns for better extraction
    const patterns = [
      // Pattern 1: JSON-like format with quotes
      {
        feedback: /["']?feedback["']?\s*:\s*["']([^"']+)["']/i,
        score: /["']?score["']?\s*:\s*(\d+(?:\.\d+)?)/i
      },
      // Pattern 2: Simple format
      {
        feedback: /feedback:\s*([\s\S]*?)\n\s*score:\s*(\d+(?:\.\d+)?)/i
      },
      // Pattern 3: Natural language format
      {
        feedback: /((?:feedback|response|evaluation):[^\n]*(?:\n(?![^\n]*score:)[^\n]*)*)/i,
        score: /(?:score|rating|points?):\s*(\d+(?:\.\d+)?)/i
      }
    ];

    for (const pattern of patterns) {
      if (pattern.feedback && pattern.score) {
        const feedbackMatch = content.match(pattern.feedback);
        const scoreMatch = content.match(pattern.score);
        
        if (feedbackMatch && scoreMatch) {
          const score = Math.min(Math.max(Math.round(parseFloat(scoreMatch[1])), 0), 10);
          return {
            feedback: feedbackMatch[1].trim(),
            score
          };
        }
      } else if (pattern.feedback) {
        const match = content.match(pattern.feedback);
        if (match && match[1] && match[2]) {
          const score = Math.min(Math.max(Math.round(parseFloat(match[2])), 0), 10);
          return {
            feedback: match[1].trim(),
            score
          };
        }
      }
    }

    // Fallback: Extract any feedback-like content and assign a neutral score
    const feedbackMatch = content.match(/([^.!?]+[.!?])\s*(?:\d+|score|rating|points?|\/10)?/i);
    if (feedbackMatch) {
      return {
        feedback: feedbackMatch[1].trim(),
        score: 5 // Neutral score when we can't extract one
      };
    }

    throw new Error('Could not extract feedback and score from response');
  } catch (error) {
    console.error('Error processing AI response:', error);
    throw new Error('Failed to process AI response');
  }
};

// Route to create a new interview session
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const questions = await generateQuestionsForRole(role);
    
    if (!questions || questions.length === 0) {
      return res.status(500).json({ message: 'Failed to generate interview questions' });
    }

    const formattedQuestions = questions.map(question => ({
      question,
      answer: null,
      feedback: null,
      score: null
    }));

    const interview = new Interview({
      userId: req.user.userId,
      role,
      questions: formattedQuestions,
    });

    await interview.save();
    res.status(201).json(interview);
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({ message: 'Failed to create interview session' });
  }
});

// Route to fetch interviews for the authenticated user
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(interviews);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ message: 'Failed to fetch interviews' });
  }
});

// Route to fetch questions for a specific interview
router.get('/:id/questions', authenticateToken, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id).select('questions');
    
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json(interview.questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
});

// Route to submit an answer for a specific question in an interview
router.post('/:id/answer', authenticateToken, async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    
    if (!questionId) {
      return res.status(400).json({ message: 'Question ID is required' });
    }
    
    if (!answer || answer.trim() === '') {
      return res.status(400).json({ message: 'Answer is required and cannot be empty' });
    }

    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const questionIndex = interview.questions.findIndex(q => q._id.toString() === questionId);
    if (questionIndex === -1) {
      return res.status(404).json({ message: 'Question not found in this interview' });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": process.env.SITE_NAME || "Technical Interview Assistant"
      },
      body: JSON.stringify({
        model: "sophosympatheia/rogue-rose-103b-v0.2:free",
        messages: [
          { 
            role: "system", 
            content: "You are an expert technical interviewer. Analyze the following interview answer and provide constructive feedback and a score out of 10. Return a JSON object with 'feedback' and 'score' fields." 
          },
          { 
            role: "user", 
            content: `Question: ${interview.questions[questionIndex].question}\nAnswer: ${answer}\n\nProvide feedback and score in JSON format like: {"feedback": "Your detailed feedback here", "score": 7}`
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from OpenRouter API:', errorData);
      throw new Error(`OpenRouter API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from AI');
    }

    const { feedback, score } = await processAIResponse(data.choices[0].message.content);

    if (!feedback || typeof score !== 'number' || score < 0 || score > 10) {
      throw new Error('Invalid feedback or score values');
    }

    interview.questions[questionIndex].answer = answer;
    interview.questions[questionIndex].feedback = feedback;
    interview.questions[questionIndex].score = score;

    await interview.save();

    res.json({ feedback, score });
  } catch (error) {
    console.error('Error processing answer:', error);
    res.status(500).json({ 
      message: 'Error processing answer',
      details: error.message 
    });
  }
});

module.exports = router;