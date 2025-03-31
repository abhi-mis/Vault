const express = require('express');
const Interview = require('../models/Interview');
const { authenticateToken } = require('../middleware/auth');
const fetch = require('node-fetch');

const router = express.Router();
const token = process.env.OPENROUTER_API_KEY;

// Predefined positions with their descriptions
const POSITIONS = {
  'SDE': 'Software Development Engineer - Full-time position focusing on building and maintaining software applications',
  'Intern SDE': 'Software Development Engineer Intern - Entry-level position for students or recent graduates',
  'Senior SDE': 'Senior Software Development Engineer - Leadership role with extensive development experience',
  'Frontend Engineer': 'Frontend Development Specialist - Focus on user interfaces and web applications',
  'Backend Engineer': 'Backend Development Specialist - Focus on server-side applications and databases',
  'Full Stack Engineer': 'Full Stack Developer - Capable of working on both frontend and backend',
  'DevOps Engineer': 'DevOps Specialist - Focus on deployment, automation, and infrastructure',
  'Mobile Developer': 'Mobile Application Developer - Specializing in iOS/Android development',
  'ML Engineer': 'Machine Learning Engineer - Focus on AI and machine learning applications',
  'QA Engineer': 'Quality Assurance Engineer - Focus on testing and quality assurance',
  'Embedded Software Engineer': 'Develops software for embedded systems and IoT devices',
  'Security Engineer': 'Cybersecurity Specialist - Protects applications and infrastructure from threats',
  'Site Reliability Engineer (SRE)': 'Ensures system reliability, scalability, and performance through automation',
  'Cloud Engineer': 'Works on cloud infrastructure, deployment, and scalability using AWS, Azure, or GCP',
  'Data Engineer': 'Designs and maintains data pipelines, databases, and ETL processes for analytics',
  'Blockchain Engineer': 'Develops blockchain-based applications, smart contracts, and decentralized systems',
  'Game Developer': 'Specializes in game design, development, and optimization using engines like Unity or Unreal',
  'AR/VR Engineer': 'Focuses on augmented reality (AR) and virtual reality (VR) applications',
  'Firmware Engineer': 'Develops low-level software that interacts with hardware components',
  'Network Engineer': 'Manages and optimizes network infrastructure and protocols',
  'Computer Vision Engineer': 'Works on image processing, object detection, and AI-driven vision applications',
  'Hardware Engineer': 'Designs and tests computer hardware components and embedded systems',
  'Big Data Engineer': 'Handles large-scale data processing and analytics using tools like Hadoop and Spark'
};

// Technical topics with descriptions
const TOPICS = {
  'Data Structures': 'Arrays, Linked Lists, Trees, Graphs, Hash Tables, etc.',
  'Algorithms': 'Sorting, Searching, Dynamic Programming, Greedy Algorithms, etc.',
  'Java': 'Core Java, Collections, Multithreading, Spring Framework, etc.',
  'Python': 'Core Python, Django, Flask, Data Science Libraries, etc.',
  'JavaScript': 'ES6+, DOM, Async Programming, Node.js, etc.',
  'Operating Systems': 'Process Management, Memory Management, File Systems, etc.',
  'Database Systems': 'SQL, NoSQL, Indexing, Transactions, ACID Properties, etc.',
  'System Design': 'Scalability, Load Balancing, Caching, Microservices, etc.',
  'Computer Networks': 'TCP/IP, HTTP, DNS, Network Security, etc.',
  'Web Development': 'HTML, CSS, React, Angular, Vue.js, etc.',
  'Cloud Computing': 'AWS, Azure, GCP, Docker, Kubernetes, etc.',
  'Security': 'Cryptography, Authentication, Authorization, Security Protocols, etc.',
  'Machine Learning': 'Supervised Learning, Neural Networks, NLP, Computer Vision, etc.',
  'Software Engineering': 'Design Patterns, SOLID Principles, Agile, Testing, etc.',
  'DevOps': 'CI/CD, Infrastructure as Code, Monitoring, etc.'
};

// Question count options
const QUESTION_COUNTS = [5, 10, 15, 20];

// Difficulty level descriptions
const DIFFICULTY_LEVELS = {
  1: 'Basic',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert',
  5: 'Master'
};

// Function to adjust prompt based on difficulty level
const getDifficultyPrompt = (level) => {
  const prompts = {
    1: 'Focus on basic concepts and fundamentals. Questions should be suitable for beginners.',
    2: 'Include moderate complexity questions covering standard practices.',
    3: 'Ask about complex scenarios and architectural decisions.',
    4: 'Focus on advanced concepts and system design challenges.',
    5: 'Include highly complex problems and cutting-edge technology questions.'
  };
  return prompts[level] || prompts[3];
};

// Function to generate interview questions based on the type (position/topic) and difficulty
const generateQuestions = async (type, subject, difficulty = 3, count = 5) => {
  const difficultyPrompt = getDifficultyPrompt(difficulty);
  const isPosition = type === 'position';
  
  const prompt = `Generate ${count} technical interview questions for ${isPosition ? `a ${subject} position` : `the topic: ${subject}`} at difficulty level ${difficulty}/5. ${difficultyPrompt}

Format each question as a complete sentence ending with a question mark. Return ONLY a JSON array of strings.

Example format:
[
  "What is the difference between let and const in JavaScript?",
  "Can you explain how React's virtual DOM works?",
  "What are the benefits of using TypeScript over JavaScript?"
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
            content: `You are an expert technical interviewer. Generate challenging and relevant interview questions at difficulty level ${difficulty}/5. Always respond with a valid JSON array of strings.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
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
        
        if (validQuestions.length >= 3) {
          return validQuestions.slice(0, count);
        }
      }
    } catch (error) {
      console.log('Failed to parse JSON response, attempting text extraction');
    }

    // Fallback: Extract questions from text
    const questionRegex = /(?:^|\n)(?:\d+\.\s*)?([^.\n]+\?)/g;
    const matches = [...questionsText.matchAll(questionRegex)]
      .map(match => match[1].trim())
      .filter(q => q.length > 10 && q.endsWith('?'));

    if (matches.length >= 3) {
      return matches.slice(0, count);
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
          score: Math.min(Math.max(Math.round(parsed.score), 0), 10)
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
        score: 5
      };
    }

    throw new Error('Could not extract feedback and score from response');
  } catch (error) {
    console.error('Error processing AI response:', error);
    throw new Error('Failed to process AI response');
  }
};

// Route to get available positions, topics, and question counts
router.get('/options', authenticateToken, (req, res) => {
  res.json({
    positions: Object.entries(POSITIONS).map(([id, description]) => ({
      id,
      description
    })),
    topics: Object.entries(TOPICS).map(([id, description]) => ({
      id,
      description
    })),
    questionCounts: QUESTION_COUNTS,
    difficultyLevels: Object.entries(DIFFICULTY_LEVELS).map(([level, description]) => ({
      level: parseInt(level),
      description
    }))
  });
});

// Route to create a new interview session
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, subject, difficulty, questionCount } = req.body;
    
    if (!type || !subject) {
      return res.status(400).json({ message: 'Type and subject are required' });
    }

    if (type !== 'position' && type !== 'topic') {
      return res.status(400).json({ message: 'Invalid type. Must be either "position" or "topic"' });
    }

    if (type === 'position' && !POSITIONS[subject]) {
      return res.status(400).json({ message: 'Invalid position selected' });
    }

    if (type === 'topic' && !TOPICS[subject]) {
      return res.status(400).json({ message: 'Invalid topic selected' });
    }

    // Validate difficulty level
    const difficultyLevel = parseInt(difficulty) || 3;
    if (difficultyLevel < 1 || difficultyLevel > 5) {
      return res.status(400).json({ message: 'Difficulty level must be between 1 and 5' });
    }

    // Validate question count
    const count = parseInt(questionCount) || 5;
    if (!QUESTION_COUNTS.includes(count)) {
      return res.status(400).json({ message: 'Invalid question count' });
    }

    const questions = await generateQuestions(type, subject, difficultyLevel, count);
    
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
      type,
      subject,
      difficulty: difficultyLevel,
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
    const interview = await Interview.findById(req.params.id).select('questions type subject difficulty');
    
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const description = interview.type === 'position' ? 
      POSITIONS[interview.subject] : 
      TOPICS[interview.subject];

    res.json({
      questions: interview.questions,
      type: interview.type,
      subject: interview.subject,
      difficulty: interview.difficulty,
      subjectDescription: description,
      difficultyDescription: DIFFICULTY_LEVELS[interview.difficulty]
    });
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
            content: `You are an expert technical interviewer evaluating a candidate for ${interview.type === 'position' ? `a ${interview.subject} position` : `questions about ${interview.subject}`} at difficulty level ${interview.difficulty}/5. Analyze the following interview answer and provide constructive feedback and a score out of 10. Return a JSON object with 'feedback' and 'score' fields.` 
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

    res.json({ 
      feedback, 
      score,
      difficulty: interview.difficulty,
      difficultyDescription: DIFFICULTY_LEVELS[interview.difficulty]
    });
  } catch (error) {
    console.error('Error processing answer:', error);
    res.status(500).json({ 
      message: 'Error processing answer',
      details: error.message 
    });
  }
});

module.exports = router;