// Enhanced Interview Coach with Dynamic Question Generation and Rating
// Uses Gemini AI for intelligent question generation and comprehensive feedback

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class EnhancedInterviewCoach {
  constructor() {
    this.genAI = null;
    this.currentSession = null;
    this.conversationHistory = [];
    this.userProfile = {
      experience: 'unknown',
      industry: 'unknown',
      role: 'unknown',
      skills: [],
      strengths: [],
      weaknesses: []
    };
    this.interviewTypes = [
      'technical',
      'behavioral',
      'situational',
      'leadership',
      'problem-solving',
      'communication',
      'teamwork',
      'stress-interview',
      'case-study',
      'cultural-fit'
    ];
    
    // Initialize Gemini AI
    if (GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      console.log('Enhanced Interview Coach initialized with Gemini AI');
    } else {
      console.error('Gemini API key not found for Enhanced Interview Coach');
    }
  }

  // Start a new interview session
  async startInterviewSession(type = 'mixed', difficulty = 'medium', userContext = {}) {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized');
    }

    try {
      // Update user profile with context
      this.updateUserProfile(userContext);
      
      // Generate interview questions dynamically
      const questions = await this.generateInterviewQuestions(type, difficulty);
      
      // Create new session
      this.currentSession = {
        id: Date.now().toString(),
        type,
        difficulty,
        questions,
        currentQuestionIndex: 0,
        responses: [],
        feedback: [],
        scores: [],
        isActive: true,
        startTime: Date.now(),
        userProfile: { ...this.userProfile }
      };

      console.log(`Interview session started: ${type} interview, ${difficulty} difficulty`);
      return {
        sessionId: this.currentSession.id,
        totalQuestions: questions.length,
        firstQuestion: this.getCurrentQuestion()
      };
    } catch (error) {
      console.error('Error starting interview session:', error);
      throw error;
    }
  }

  // Generate dynamic interview questions using Gemini AI
  async generateInterviewQuestions(type, difficulty) {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
        You are an expert interview coach. Generate 5 ${difficulty} difficulty ${type} interview questions for a candidate with the following profile:
        
        Experience: ${this.userProfile.experience}
        Industry: ${this.userProfile.industry}
        Role: ${this.userProfile.role}
        Skills: ${this.userProfile.skills.join(', ')}
        
        Requirements:
        1. Questions should be specific to the role and industry
        2. Include follow-up questions for each main question
        3. Vary the question types (situational, behavioral, technical)
        4. Make questions challenging but fair for ${difficulty} level
        5. Include questions that test both technical and soft skills
        
        Format your response as a JSON array with this structure:
        [
          {
            "question": "Main question text",
            "category": "question category",
            "difficulty": "${difficulty}",
            "followUps": ["follow-up 1", "follow-up 2"],
            "evaluationCriteria": ["criterion 1", "criterion 2", "criterion 3"],
            "expectedKeywords": ["keyword 1", "keyword 2"]
          }
        ]
        
        Return only the JSON array, no additional text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const questions = JSON.parse(text);
      
      // Validate and enhance questions
      return questions.map((q, index) => ({
        id: `q_${index + 1}`,
        question: q.question,
        category: q.category || type,
        difficulty: q.difficulty || difficulty,
        followUps: q.followUps || [],
        evaluationCriteria: q.evaluationCriteria || [],
        expectedKeywords: q.expectedKeywords || [],
        timeLimit: this.getTimeLimit(difficulty),
        points: this.getPoints(difficulty)
      }));
      
    } catch (error) {
      console.error('Error generating questions:', error);
      // Fallback to predefined questions
      return this.getFallbackQuestions(type, difficulty);
    }
  }

  // Get current question
  getCurrentQuestion() {
    if (!this.currentSession || !this.currentSession.isActive) {
      return null;
    }

    const question = this.currentSession.questions[this.currentSession.currentQuestionIndex];
    if (!question) {
      return null;
    }

    return {
      id: question.id,
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      followUps: question.followUps,
      timeLimit: question.timeLimit,
      points: question.points,
      questionNumber: this.currentSession.currentQuestionIndex + 1,
      totalQuestions: this.currentSession.questions.length,
      progress: {
        completed: this.currentSession.currentQuestionIndex,
        total: this.currentSession.questions.length
      }
    };
  }

  // Submit answer and get comprehensive feedback
  async submitAnswer(answer, analysis = {}) {
    if (!this.currentSession || !this.currentSession.isActive) {
      throw new Error('No active interview session');
    }

    try {
      const currentQuestion = this.getCurrentQuestion();
      if (!currentQuestion) {
        throw new Error('No current question available');
      }

      // Generate comprehensive feedback using Gemini AI
      const feedback = await this.generateComprehensiveFeedback(answer, currentQuestion, analysis);
      
      // Calculate detailed scores
      const scores = this.calculateDetailedScores(answer, currentQuestion, analysis, feedback);
      
      // Store the response
      const response = {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        answer,
        analysis,
        feedback,
        scores,
        timestamp: Date.now(),
        duration: this.calculateAnswerDuration()
      };

      this.currentSession.responses.push(response);
      this.currentSession.feedback.push(feedback);
      this.currentSession.scores.push(scores);

      // Move to next question
      this.currentSession.currentQuestionIndex++;

      // Check if session is complete
      const isComplete = this.currentSession.currentQuestionIndex >= this.currentSession.questions.length;
      
      if (isComplete) {
        await this.completeSession();
      }

      return {
        feedback,
        scores,
        isComplete,
        nextQuestion: isComplete ? null : this.getCurrentQuestion(),
        progress: {
          completed: this.currentSession.currentQuestionIndex,
          total: this.currentSession.questions.length
        },
        overallScore: this.calculateOverallScore()
      };
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }

  // Generate comprehensive feedback using Gemini AI
  async generateComprehensiveFeedback(answer, question, analysis) {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
        You are an expert interview coach. Provide comprehensive feedback for this interview answer.
        
        Question: "${question.question}"
        Category: ${question.category}
        Difficulty: ${question.difficulty}
        
        Candidate's Answer: "${answer}"
        
        Analysis Data:
        - Speech Clarity: ${analysis.clarity || 'N/A'}
        - Confidence Level: ${analysis.confidence || 'N/A'}
        - Speaking Pace: ${analysis.pace || 'N/A'}
        - Engagement: ${analysis.engagement || 'N/A'}
        
        Evaluation Criteria: ${question.evaluationCriteria.join(', ')}
        Expected Keywords: ${question.expectedKeywords.join(', ')}
        
        Provide feedback in this JSON format:
        {
          "overallScore": 85,
          "strengths": ["strength 1", "strength 2"],
          "weaknesses": ["weakness 1", "weakness 2"],
          "specificFeedback": "Detailed feedback about the answer",
          "improvementSuggestions": ["suggestion 1", "suggestion 2"],
          "followUpQuestions": ["follow-up question 1", "follow-up question 2"],
          "scoreBreakdown": {
            "content": 80,
            "clarity": 85,
            "confidence": 90,
            "relevance": 75
          }
        }
        
        Be specific, constructive, and actionable. Focus on helping the candidate improve.
        Return only the JSON object, no additional text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const feedback = JSON.parse(text);
      
      // Add timestamp and question info
      feedback.timestamp = Date.now();
      feedback.questionId = question.id;
      feedback.questionCategory = question.category;
      
      return feedback;
      
    } catch (error) {
      console.error('Error generating feedback:', error);
      // Return basic feedback if AI fails
      return this.generateBasicFeedback(answer, question, analysis);
    }
  }

  // Calculate detailed scores
  calculateDetailedScores(answer, question, analysis, feedback) {
    const scores = {
      content: this.scoreContent(answer, question),
      clarity: this.scoreClarity(answer, analysis),
      confidence: this.scoreConfidence(answer, analysis),
      relevance: this.scoreRelevance(answer, question),
      structure: this.scoreStructure(answer),
      engagement: this.scoreEngagement(answer, analysis)
    };

    // Calculate weighted overall score
    const weights = {
      content: 0.25,
      clarity: 0.20,
      confidence: 0.15,
      relevance: 0.20,
      structure: 0.10,
      engagement: 0.10
    };

    const overallScore = Object.keys(scores).reduce((total, key) => {
      return total + (scores[key] * weights[key]);
    }, 0);

    return {
      ...scores,
      overall: Math.round(overallScore),
      breakdown: scores,
      weights
    };
  }

  // Score content quality
  scoreContent(answer, question) {
    let score = 50; // Base score
    
    // Check for expected keywords
    const keywordMatches = question.expectedKeywords.filter(keyword => 
      answer.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    score += (keywordMatches / question.expectedKeywords.length) * 30;
    
    // Check answer length (not too short, not too long)
    const wordCount = answer.split(' ').length;
    if (wordCount >= 20 && wordCount <= 200) {
      score += 10;
    } else if (wordCount < 10) {
      score -= 20;
    } else if (wordCount > 300) {
      score -= 10;
    }
    
    // Check for specific examples
    if (answer.toLowerCase().includes('for example') || answer.toLowerCase().includes('for instance')) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // Score clarity
  scoreClarity(answer, analysis) {
    let score = 70; // Base score
    
    // Use analysis data if available
    if (analysis.clarity) {
      score = analysis.clarity;
    }
    
    // Check for clear structure
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 3) {
      score += 10;
    }
    
    // Check for filler words
    const fillerWords = ['um', 'uh', 'ah', 'er', 'mm', 'hmm'];
    const fillerCount = fillerWords.reduce((count, filler) => {
      return count + (answer.toLowerCase().split(filler).length - 1);
    }, 0);
    
    score -= fillerCount * 2;
    
    return Math.max(0, Math.min(100, score));
  }

  // Score confidence
  scoreConfidence(answer, analysis) {
    let score = 70; // Base score
    
    // Use analysis data if available
    if (analysis.confidence) {
      score = analysis.confidence;
    }
    
    // Check for confidence indicators
    const confidenceWords = ['definitely', 'certainly', 'absolutely', 'clearly', 'confident'];
    const confidenceCount = confidenceWords.filter(word => 
      answer.toLowerCase().includes(word)
    ).length;
    
    score += confidenceCount * 5;
    
    // Check for uncertainty indicators
    const uncertaintyWords = ['maybe', 'perhaps', 'might', 'could', 'i think', 'i guess'];
    const uncertaintyCount = uncertaintyWords.filter(word => 
      answer.toLowerCase().includes(word)
    ).length;
    
    score -= uncertaintyCount * 3;
    
    return Math.max(0, Math.min(100, score));
  }

  // Score relevance
  scoreRelevance(answer, question) {
    let score = 50; // Base score
    
    // Check if answer addresses the question
    const questionWords = question.question.toLowerCase().split(' ');
    const answerWords = answer.toLowerCase().split(' ');
    
    const relevantWords = questionWords.filter(word => 
      answerWords.includes(word) && word.length > 3
    );
    
    score += (relevantWords.length / questionWords.length) * 30;
    
    // Check for direct addressing of the question
    if (answer.toLowerCase().includes('the question') || answer.toLowerCase().includes('you asked')) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // Score structure
  scoreStructure(answer) {
    let score = 60; // Base score
    
    // Check for clear beginning, middle, end
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 3) {
      score += 20;
    }
    
    // Check for transition words
    const transitionWords = ['first', 'second', 'then', 'next', 'finally', 'however', 'therefore'];
    const transitionCount = transitionWords.filter(word => 
      answer.toLowerCase().includes(word)
    ).length;
    
    score += transitionCount * 3;
    
    return Math.max(0, Math.min(100, score));
  }

  // Score engagement
  scoreEngagement(answer, analysis) {
    let score = 70; // Base score
    
    // Use analysis data if available
    if (analysis.engagement) {
      score = analysis.engagement;
    }
    
    // Check for engaging elements
    const engagingWords = ['you', 'your', 'we', 'us', 'our', 'together'];
    const engagingCount = engagingWords.filter(word => 
      answer.toLowerCase().includes(word)
    ).length;
    
    score += engagingCount * 2;
    
    // Check for questions back to interviewer
    const questionCount = (answer.match(/\?/g) || []).length;
    score += questionCount * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  // Calculate overall score
  calculateOverallScore() {
    if (!this.currentSession || this.currentSession.scores.length === 0) {
      return 0;
    }

    const totalScore = this.currentSession.scores.reduce((sum, score) => {
      return sum + score.overall;
    }, 0);

    return Math.round(totalScore / this.currentSession.scores.length);
  }

  // Complete session
  async completeSession() {
    if (!this.currentSession) return;

    this.currentSession.isActive = false;
    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
    this.currentSession.finalScore = this.calculateOverallScore();

    // Generate session summary
    const summary = await this.generateSessionSummary();
    this.currentSession.summary = summary;

    console.log('Interview session completed');
    return this.currentSession;
  }

  // Generate session summary
  async generateSessionSummary() {
    if (!this.genAI || !this.currentSession) {
      return null;
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
        Generate a comprehensive interview session summary based on the following data:
        
        Session Type: ${this.currentSession.type}
        Difficulty: ${this.currentSession.difficulty}
        Total Questions: ${this.currentSession.questions.length}
        Responses: ${this.currentSession.responses.length}
        Final Score: ${this.currentSession.finalScore}
        
        Provide a summary in this JSON format:
        {
          "overallPerformance": "Excellent/Good/Fair/Needs Improvement",
          "strengths": ["strength 1", "strength 2"],
          "areasForImprovement": ["area 1", "area 2"],
          "recommendations": ["recommendation 1", "recommendation 2"],
          "nextSteps": ["step 1", "step 2"]
        }
        
        Return only the JSON object, no additional text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return JSON.parse(text);
      
    } catch (error) {
      console.error('Error generating session summary:', error);
      return null;
    }
  }

  // Helper methods
  updateUserProfile(context) {
    this.userProfile = { ...this.userProfile, ...context };
  }

  getTimeLimit(difficulty) {
    const limits = {
      easy: 120, // 2 minutes
      medium: 180, // 3 minutes
      hard: 240 // 4 minutes
    };
    return limits[difficulty] || 180;
  }

  getPoints(difficulty) {
    const points = {
      easy: 10,
      medium: 15,
      hard: 20
    };
    return points[difficulty] || 15;
  }

  calculateAnswerDuration() {
    // This would be implemented based on your timing system
    return 0;
  }

  generateBasicFeedback(answer, question, analysis) {
    return {
      overallScore: 70,
      strengths: ['Provided an answer'],
      weaknesses: ['Could be more specific'],
      specificFeedback: 'Basic feedback - AI analysis unavailable',
      improvementSuggestions: ['Practice more', 'Be more specific'],
      followUpQuestions: [],
      scoreBreakdown: {
        content: 70,
        clarity: 70,
        confidence: 70,
        relevance: 70
      },
      timestamp: Date.now(),
      questionId: question.id,
      questionCategory: question.category
    };
  }

  getFallbackQuestions(type, difficulty) {
    // Fallback questions if AI generation fails
    return [
      {
        id: 'q_1',
        question: `Tell me about a challenging situation you faced in your ${this.userProfile.role} role.`,
        category: type,
        difficulty,
        followUps: ['How did you handle it?', 'What was the outcome?'],
        evaluationCriteria: ['Problem-solving', 'Communication', 'Results'],
        expectedKeywords: ['challenge', 'solution', 'outcome'],
        timeLimit: this.getTimeLimit(difficulty),
        points: this.getPoints(difficulty)
      }
    ];
  }
}
