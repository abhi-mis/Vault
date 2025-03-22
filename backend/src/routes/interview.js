const express = require('express');
const Interview = require('../models/Interview');
const { authenticateToken } = require('../middleware/auth');
const fetch = require('node-fetch');

const router = express.Router();
const token = process.env.OPENROUTER_API_KEY;
const YOUR_SITE_URL = process.env.YOUR_SITE_URL;
const YOUR_SITE_NAME = process.env.YOUR_SITE_NAME;

// Function to generate interview questions based on the role
const generateQuestionsForRole = async (role) => {
  const prompt = `Generate 5 technical interview questions for a ${role} position. The questions should be challenging and cover important aspects of ${role} development. Format the response as a JSON array of strings containing only the questions.`;

  try {
    console.log('Using OpenRouter API Key:', token);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "HTTP-Referer": YOUR_SITE_URL,
        "X-Title": YOUR_SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "sophosympatheia/rogue-rose-103b-v0.2:free",
        messages: [
          {
            role: "system",
            content: "You are an expert technical interviewer. Generate challenging and relevant interview questions."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from OpenRouter API:', errorData);
      throw new Error(`OpenRouter API error: ${errorData.error.message}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid response from AI model:', data);
      throw new Error('Invalid response from AI model');
    }

    const questionsText = data.choices[0].message.content;
    
    try {
      const questions = JSON.parse(questionsText);
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions format');
      }
      return questions;
    } catch (error) {
      const extractedQuestions = questionsText
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0 && line.endsWith('?'))
        .slice(0, 5);

      if (extractedQuestions.length === 0) {
        throw new Error('Failed to extract valid questions');
      }

      return extractedQuestions;
    }
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
          score: parsed.score
        };
      }
    } catch (e) {
      console.log('Failed to parse JSON response, attempting text extraction');
    }

    // Try regex parsing with multiple patterns
    const patterns = [
      // Pattern 1: JSON-like format with quotes
      {
        feedback: /["']?feedback["']?\s*:\s*["']([^"']+)["']/i,
        score: /["']?score["']?\s*:\s*(\d+)/i
      },
      // Pattern 2: Simple format
      {
        feedback: /feedback:\s*([\s\S]*?)\n\nscore:\s*(\d+)/i
      }
    ];

    for (const pattern of patterns) {
      if (pattern.feedback && pattern.score) {
        const feedbackMatch = content.match(pattern.feedback);
        const scoreMatch = content.match(pattern.score);
        
        if (feedbackMatch && scoreMatch) {
          return {
            feedback: feedbackMatch[1].trim(),
            score: parseInt(scoreMatch[1], 10)
          };
        }
      } else if (pattern.feedback) {
        const match = content.match(pattern.feedback);
        if (match && match[1] && match[2]) {
          return {
            feedback: match[1].trim(),
            score: parseInt(match[2], 10)
          };
        }
      }
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

    console.log('Sending questions:', interview.questions);
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
    
    // Add detailed validation
    if (!questionId) {
      console.log('Missing questionId in request body:', req.body);
      return res.status(400).json({ message: 'Question ID is required' });
    }
    
    if (!answer || answer.trim() === '') {
      console.log('Missing or empty answer in request body:', req.body);
      return res.status(400).json({ message: 'Answer is required and cannot be empty' });
    }

    console.log('Processing answer submission:', { interviewId: req.params.id, questionId, answer });

    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      console.log('Interview not found:', req.params.id);
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.userId.toString() !== req.user.userId) {
      console.log('Unauthorized access attempt:', { userId: req.user.userId, interviewUserId: interview.userId });
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Validate the question exists in the interview
    const questionIndex = interview.questions.findIndex(q => q._id.toString() === questionId);
    if (questionIndex === -1) {
      console.log('Question not found in interview:', { questionId, interviewId: req.params.id });
      return res.status(404).json({ message: 'Question not found in this interview' });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "HTTP-Referer": YOUR_SITE_URL,
        "X-Title": YOUR_SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "sophosympatheia/rogue-rose-103b-v0.2:free",
        messages: [
          { 
            role: "system", 
            content: "You are an expert technical interviewer. Analyze the following interview answer and provide constructive feedback and a score out of 10. Return ONLY a JSON object with 'feedback' and 'score' fields, nothing else." 
          },
          { 
            role: "user", 
            content: `Question: ${interview.questions[questionIndex].question}\nAnswer: ${answer}`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from OpenRouter API:', errorData);
      throw new Error(`OpenRouter API error: ${errorData.error.message}`);
    }

    const data = await response.json();
    console.log('AI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from AI');
    }

    const { feedback, score } = await processAIResponse(data.choices[0].message.content);

    // Validate extracted data
    if (!feedback || typeof score !== 'number' || score < 0 || score > 10) {
      console.error('Invalid feedback or score:', { feedback, score });
      throw new Error('Invalid feedback or score values');
    }

    // Update the interview with the processed answer and feedback
    interview.questions[questionIndex].answer = answer;
    interview.questions[questionIndex].feedback = feedback;
    interview.questions[questionIndex].score = score;

    await interview.save();
    console.log('Successfully saved answer and feedback');

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