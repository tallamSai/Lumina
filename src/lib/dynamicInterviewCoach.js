// Dynamic Interview Coach using Gemini AI
// Provides intelligent, contextual interview preparation and practice

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class DynamicInterviewCoach {
  constructor() {
    this.genAI = null;
    this.workingModelName = 'gemini-2.5-flash-lite';
    this.currentSession = null;
    this.conversationHistory = [];
    this.userProfile = {
      experience: 'unknown',
      industry: 'unknown',
      role: 'unknown',
      strengths: [],
      weaknesses: [],
      goals: []
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
      console.log('Dynamic Interview Coach initialized with Gemini AI');
    } else {
      console.error('Gemini API key not found for Interview Coach');
    }
  }

  // Start a dynamic interview session
  async startInterviewSession(type = 'mixed', difficulty = 'medium', userContext = {}) {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized');
    }

    try {
      const session = {
        id: Date.now(),
        type,
        difficulty,
        startTime: Date.now(),
        userContext,
        questions: [],
        currentQuestionIndex: 0,
        responses: [],
        feedback: [],
        isActive: true,
        overallScore: 0,
        strengths: [],
        improvements: []
      };

      // Generate personalized questions using Gemini
      const questions = await this.generatePersonalizedQuestions(type, difficulty, userContext);
      session.questions = questions;

      this.currentSession = session;
      this.conversationHistory = [];
      
      console.log('Dynamic interview session started:', session);
      return session;
    } catch (error) {
      console.error('Error starting interview session:', error);
      throw error;
    }
  }

  // Generate personalized questions using Gemini AI
  async generatePersonalizedQuestions(type, difficulty, userContext) {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized');
    }

    try {
      const modelName = this.workingModelName || 'gemini-2.5-flash-lite';
      const model = this.genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `You are an expert interview coach. Generate 5 personalized interview questions based on the following criteria:

INTERVIEW TYPE: ${type}
DIFFICULTY LEVEL: ${difficulty}
USER CONTEXT: ${JSON.stringify(userContext)}

Generate questions that are:
1. Relevant to the interview type and difficulty
2. Personalized based on the user's context
3. Progressive in complexity
4. Realistic and commonly asked in actual interviews
5. Designed to assess different skills and competencies

For each question, provide:
- The question text
- The category (technical, behavioral, situational, etc.)
- The difficulty level
- The skills being assessed
- Suggested follow-up questions
- Key points the interviewer is looking for

Format the response as a JSON array with this structure:
[
  {
    "question": "Question text here",
    "category": "behavioral",
    "difficulty": "medium",
    "skills": ["leadership", "problem-solving"],
    "followUps": ["Can you elaborate on that?", "What was the outcome?"],
    "keyPoints": ["Specific examples", "Clear outcomes", "Leadership demonstration"]
  }
]

Generate exactly 5 questions that are diverse and comprehensive.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      const questions = JSON.parse(text);
      console.log('Generated personalized questions:', questions);
      
      return questions;
    } catch (error) {
      console.error('Error generating questions:', error);
      // Fallback to basic questions if AI fails
      return this.getFallbackQuestions(type, difficulty);
    }
  }

  // Get current question
  getCurrentQuestion() {
    if (!this.currentSession || !this.currentSession.isActive) {
      return null;
    }

    const question = this.currentSession.questions[this.currentSession.currentQuestionIndex];
    if (!question) return null;

    return {
      ...question,
      questionNumber: this.currentSession.currentQuestionIndex + 1,
      totalQuestions: this.currentSession.questions.length,
      timeRemaining: this.calculateTimeRemaining()
    };
  }

  // Submit answer and get AI-powered feedback
  async submitAnswer(answer, analysis = {}) {
    if (!this.currentSession || !this.currentSession.isActive) {
      throw new Error('No active interview session');
    }

    try {
      const currentQuestion = this.getCurrentQuestion();
      if (!currentQuestion) {
        throw new Error('No current question available');
      }

      // Generate AI-powered feedback using Gemini
      const feedback = await this.generateAnswerFeedback(answer, currentQuestion, analysis);
      
      // Store the response
      const response = {
        questionIndex: this.currentSession.currentQuestionIndex,
        question: currentQuestion,
        answer,
        analysis,
        feedback,
        timestamp: Date.now(),
        duration: this.calculateAnswerDuration()
      };

      this.currentSession.responses.push(response);
      this.currentSession.feedback.push(feedback);

      // Move to next question
      this.currentSession.currentQuestionIndex++;

      // Check if session is complete
      const isComplete = this.currentSession.currentQuestionIndex >= this.currentSession.questions.length;
      
      if (isComplete) {
        await this.completeSession();
      }

      return {
        feedback,
        isComplete,
        nextQuestion: isComplete ? null : this.getCurrentQuestion(),
        progress: {
          completed: this.currentSession.currentQuestionIndex,
          total: this.currentSession.questions.length
        }
      };
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }

  // Generate AI-powered feedback for answers
  async generateAnswerFeedback(answer, question, analysis) {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized');
    }

    try {
      const modelName = this.workingModelName || 'gemini-2.5-flash-lite';
      const model = this.genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `You are an expert interview coach providing detailed feedback on an interview answer.

QUESTION: ${question.question}
CATEGORY: ${question.category}
DIFFICULTY: ${question.difficulty}
SKILLS BEING ASSESSED: ${question.skills?.join(', ') || 'General communication'}

CANDIDATE'S ANSWER: "${answer}"

ANALYSIS DATA:
- Overall Score: ${analysis.overallScore || 0}%
- Voice Clarity: ${analysis.voiceClarity || 0}%
- Confidence: ${analysis.confidence || 0}%
- Engagement: ${analysis.engagement || 0}%

Provide comprehensive feedback in this JSON format:
{
  "score": 85,
  "strengths": ["Clear structure", "Specific examples"],
  "improvements": ["More quantifiable results", "Stronger conclusion"],
  "recommendations": ["Use the STAR method", "Add more metrics"],
  "overallFeedback": "Good answer with room for improvement",
  "specificAdvice": "Try to include more specific numbers and outcomes",
  "followUpSuggestions": ["Can you give me a specific example?", "What were the measurable results?"]
}

Focus on:
1. Content quality and relevance
2. Structure and organization
3. Specific examples and evidence
4. Communication effectiveness
5. Areas for improvement
6. Actionable advice

Be encouraging but constructive. Provide specific, actionable feedback.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      const feedback = JSON.parse(text);
      console.log('Generated feedback:', feedback);
      
      return feedback;
    } catch (error) {
      console.error('Error generating feedback:', error);
      // Fallback to basic feedback
      return this.getFallbackFeedback(answer, question, analysis);
    }
  }

  // Complete the interview session
  async completeSession() {
    if (!this.currentSession) {
      throw new Error('No active session to complete');
    }

    try {
      this.currentSession.isActive = false;
      this.currentSession.endTime = Date.now();
      this.currentSession.totalDuration = this.currentSession.endTime - this.currentSession.startTime;

      // Generate comprehensive session summary using Gemini
      const summary = await this.generateSessionSummary();
      
      this.currentSession.summary = summary;
      
      console.log('Interview session completed:', summary);
      return summary;
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  }

  // Generate comprehensive session summary
  async generateSessionSummary() {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized');
    }

    try {
      const modelName = this.workingModelName || 'gemini-2.5-flash-lite';
      const model = this.genAI.getGenerativeModel({ model: modelName });
      
      const sessionData = {
        responses: this.currentSession.responses,
        feedback: this.currentSession.feedback,
        duration: this.currentSession.totalDuration,
        questions: this.currentSession.questions.length
      };

      const prompt = `You are an expert interview coach analyzing a complete interview session.

SESSION DATA:
- Total Questions: ${sessionData.questions}
- Duration: ${Math.round(sessionData.duration / 1000)} seconds
- Responses: ${sessionData.responses.length}

FEEDBACK HISTORY:
${sessionData.feedback.map((f, i) => `Question ${i + 1}: Score ${f.score}, Strengths: ${f.strengths?.join(', ')}, Improvements: ${f.improvements?.join(', ')}`).join('\n')}

Generate a comprehensive session summary in this JSON format:
{
  "overallScore": 78,
  "totalQuestions": ${sessionData.questions},
  "averageScore": 78,
  "duration": ${Math.round(sessionData.duration / 1000)},
  "strengths": ["Strong communication", "Good examples"],
  "improvements": ["More specific metrics", "Better structure"],
  "recommendations": ["Practice STAR method", "Prepare more examples"],
  "nextSteps": ["Focus on behavioral questions", "Practice technical skills"],
  "overallFeedback": "Good performance with room for improvement",
  "detailedAnalysis": {
    "communication": 85,
    "content": 75,
    "structure": 80,
    "examples": 70
  }
}

Provide detailed, actionable feedback for improvement.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      const summary = JSON.parse(text);
      console.log('Generated session summary:', summary);
      
      return summary;
    } catch (error) {
      console.error('Error generating session summary:', error);
      // Fallback to basic summary
      return this.getFallbackSummary();
    }
  }

  // Get interview tips dynamically
  async getInterviewTips(category = 'general', userContext = {}) {
    if (!this.genAI) {
      return this.getFallbackTips(category);
    }

    try {
      const modelName = this.workingModelName || 'gemini-2.5-flash-lite';
      const model = this.genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `You are an expert interview coach. Provide personalized interview tips for:

CATEGORY: ${category}
USER CONTEXT: ${JSON.stringify(userContext)}

Generate 5-7 specific, actionable tips that are:
1. Relevant to the category
2. Personalized based on user context
3. Practical and implementable
4. Professional and effective

Format as a JSON array:
[
  "Tip 1: Specific actionable advice",
  "Tip 2: Another practical suggestion",
  ...
]

Focus on practical, actionable advice that will help the user succeed.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      const tips = JSON.parse(text);
      console.log('Generated interview tips:', tips);
      
      return tips;
    } catch (error) {
      console.error('Error generating tips:', error);
      return this.getFallbackTips(category);
    }
  }

  // Update user profile for better personalization
  updateUserProfile(profile) {
    this.userProfile = { ...this.userProfile, ...profile };
    console.log('User profile updated:', this.userProfile);
  }

  // Get current session
  getCurrentSession() {
    return this.currentSession;
  }

  // Check if session is active
  isSessionActive() {
    return this.currentSession && this.currentSession.isActive;
  }

  // Fallback methods for when AI is unavailable
  getFallbackQuestions(type, difficulty) {
    return [
      {
        question: "Tell me about yourself and your background.",
        category: "behavioral",
        difficulty: "easy",
        skills: ["communication", "self-awareness"],
        followUps: ["What are your key strengths?", "What motivates you?"],
        keyPoints: ["Clear structure", "Relevant experience", "Professional tone"]
      },
      {
        question: "Describe a challenging situation you faced and how you handled it.",
        category: "behavioral",
        difficulty: "medium",
        skills: ["problem-solving", "resilience"],
        followUps: ["What was the outcome?", "What did you learn?"],
        keyPoints: ["Specific example", "Clear actions", "Positive outcome"]
      }
    ];
  }

  getFallbackFeedback(answer, question, analysis) {
    return {
      score: Math.round((analysis.overallScore || 70)),
      strengths: ["Good communication", "Clear structure"],
      improvements: ["Add more specific examples", "Include measurable results"],
      recommendations: ["Use the STAR method", "Practice more examples"],
      overallFeedback: "Good answer with room for improvement",
      specificAdvice: "Try to include more specific details and outcomes",
      followUpSuggestions: ["Can you elaborate on that?", "What were the results?"]
    };
  }

  getFallbackSummary() {
    return {
      overallScore: 75,
      totalQuestions: this.currentSession?.questions.length || 0,
      averageScore: 75,
      duration: this.currentSession?.totalDuration || 0,
      strengths: ["Good communication", "Clear examples"],
      improvements: ["More specific metrics", "Better structure"],
      recommendations: ["Practice more", "Prepare examples"],
      nextSteps: ["Continue practicing", "Focus on weak areas"],
      overallFeedback: "Good performance with room for improvement"
    };
  }

  getFallbackTips(category) {
    const tips = {
      general: [
        "Research the company and role thoroughly",
        "Prepare specific examples using the STAR method",
        "Practice your answers out loud",
        "Prepare thoughtful questions to ask the interviewer",
        "Dress professionally and arrive early"
      ],
      technical: [
        "Review relevant technical concepts",
        "Prepare to explain your technical projects",
        "Practice coding problems if applicable",
        "Be ready to discuss your technical decision-making process"
      ],
      behavioral: [
        "Use the STAR method: Situation, Task, Action, Result",
        "Prepare examples for common behavioral questions",
        "Be specific and detailed in your responses",
        "Focus on your role and contributions"
      ]
    };
    return tips[category] || tips.general;
  }

  // Utility methods
  calculateTimeRemaining() {
    if (!this.currentSession) return 0;
    const elapsed = Date.now() - this.currentSession.startTime;
    const totalTime = 30 * 60 * 1000; // 30 minutes
    return Math.max(0, totalTime - elapsed);
  }

  calculateAnswerDuration() {
    // This would be implemented based on when the question was asked
    return 0; // Placeholder
  }

  // Cleanup
  cleanup() {
    this.currentSession = null;
    this.conversationHistory = [];
  }
}

export default DynamicInterviewCoach;
