// Interview Preparation and Coaching Service
// Provides interview questions, practice sessions, and feedback

export class InterviewCoach {
  constructor() {
    this.interviewTypes = [
      'technical',
      'behavioral',
      'situational',
      'leadership',
      'problem-solving',
      'communication',
      'teamwork',
      'stress-interview'
    ];
    
    this.questionBank = this.initializeQuestionBank();
    this.practiceSessions = [];
    this.userProgress = {
      strengths: [],
      weaknesses: [],
      improvementAreas: [],
      confidenceLevel: 0
    };
  }

  // Initialize comprehensive question bank
  initializeQuestionBank() {
    return {
      technical: [
        {
          question: "Tell me about a challenging technical problem you solved recently.",
          category: "problem-solving",
          difficulty: "medium",
          followUps: [
            "What was your approach to solving it?",
            "How did you ensure the solution was robust?",
            "What would you do differently next time?"
          ]
        },
        {
          question: "How do you stay updated with the latest technologies in your field?",
          category: "learning",
          difficulty: "easy",
          followUps: [
            "Can you give me an example of a new technology you learned recently?",
            "How do you evaluate which technologies to learn?"
          ]
        },
        {
          question: "Describe your experience with [specific technology relevant to the role].",
          category: "experience",
          difficulty: "medium",
          followUps: [
            "What was the most challenging aspect?",
            "How did you overcome any difficulties?"
          ]
        }
      ],
      behavioral: [
        {
          question: "Tell me about a time when you had to work with a difficult team member.",
          category: "teamwork",
          difficulty: "medium",
          followUps: [
            "How did you handle the situation?",
            "What was the outcome?",
            "What did you learn from this experience?"
          ]
        },
        {
          question: "Describe a situation where you had to meet a tight deadline.",
          category: "time-management",
          difficulty: "medium",
          followUps: [
            "How did you prioritize your tasks?",
            "What strategies did you use to meet the deadline?",
            "How did you handle any obstacles?"
          ]
        },
        {
          question: "Give me an example of a time when you failed and how you handled it.",
          category: "resilience",
          difficulty: "hard",
          followUps: [
            "What did you learn from this failure?",
            "How did you prevent similar failures in the future?",
            "How did this experience change your approach?"
          ]
        }
      ],
      situational: [
        {
          question: "How would you handle a situation where a client is extremely unhappy with your work?",
          category: "client-management",
          difficulty: "medium",
          followUps: [
            "What steps would you take to resolve the issue?",
            "How would you prevent this from happening again?",
            "How would you communicate with your team about this?"
          ]
        },
        {
          question: "What would you do if you disagreed with your manager's decision?",
          category: "leadership",
          difficulty: "medium",
          followUps: [
            "How would you express your disagreement professionally?",
            "What if your manager doesn't change their mind?",
            "How would you maintain a good working relationship?"
          ]
        }
      ],
      leadership: [
        {
          question: "Tell me about a time when you had to lead a team through a difficult change.",
          category: "change-management",
          difficulty: "hard",
          followUps: [
            "How did you communicate the change to your team?",
            "How did you handle resistance to the change?",
            "What was the result of your leadership?"
          ]
        },
        {
          question: "Describe a situation where you had to make a difficult decision without all the information you needed.",
          category: "decision-making",
          difficulty: "hard",
          followUps: [
            "How did you gather the information you could?",
            "What factors did you consider in your decision?",
            "How did you communicate your decision to stakeholders?"
          ]
        }
      ]
    };
  }

  // Start interview practice session
  startPracticeSession(type = 'mixed', difficulty = 'medium', duration = 30) {
    const session = {
      id: Date.now(),
      type,
      difficulty,
      duration,
      startTime: Date.now(),
      questions: this.generateQuestionSet(type, difficulty),
      currentQuestionIndex: 0,
      responses: [],
      feedback: [],
      isActive: true
    };

    this.practiceSessions.push(session);
    return session;
  }

  // Generate question set based on type and difficulty
  generateQuestionSet(type, difficulty) {
    let questions = [];
    
    if (type === 'mixed') {
      // Mix different types
      const types = ['technical', 'behavioral', 'situational'];
      types.forEach(t => {
        const typeQuestions = this.questionBank[t] || [];
        const filteredQuestions = typeQuestions.filter(q => q.difficulty === difficulty);
        questions = questions.concat(filteredQuestions.slice(0, 2));
      });
    } else {
      const typeQuestions = this.questionBank[type] || [];
      questions = typeQuestions.filter(q => q.difficulty === difficulty);
    }

    // Shuffle and limit questions
    return this.shuffleArray(questions).slice(0, 5);
  }

  // Get current question
  getCurrentQuestion(sessionId) {
    const session = this.practiceSessions.find(s => s.id === sessionId);
    if (!session || !session.isActive) return null;

    const question = session.questions[session.currentQuestionIndex];
    return {
      ...question,
      questionNumber: session.currentQuestionIndex + 1,
      totalQuestions: session.questions.length,
      timeRemaining: this.calculateTimeRemaining(session)
    };
  }

  // Submit answer for current question
  submitAnswer(sessionId, answer, analysis = {}) {
    const session = this.practiceSessions.find(s => s.id === sessionId);
    if (!session || !session.isActive) return null;

    const response = {
      questionIndex: session.currentQuestionIndex,
      question: session.questions[session.currentQuestionIndex],
      answer,
      analysis,
      timestamp: Date.now(),
      duration: this.calculateAnswerDuration(session)
    };

    session.responses.push(response);

    // Generate feedback for this answer
    const feedback = this.generateAnswerFeedback(response);
    session.feedback.push(feedback);

    // Move to next question
    session.currentQuestionIndex++;

    return {
      feedback,
      isComplete: session.currentQuestionIndex >= session.questions.length,
      nextQuestion: session.currentQuestionIndex < session.questions.length ? 
        this.getCurrentQuestion(sessionId) : null
    };
  }

  // Generate feedback for an answer
  generateAnswerFeedback(response) {
    const { answer, question, analysis } = response;
    
    const feedback = {
      question: question.question,
      answer: answer,
      strengths: [],
      improvements: [],
      score: 0,
      recommendations: []
    };

    // Analyze answer content
    const wordCount = answer.split(' ').length;
    const hasExamples = this.hasExamples(answer);
    const hasStructure = this.hasGoodStructure(answer);
    const hasConfidence = this.showsConfidence(answer);

    // Calculate score
    let score = 50; // Base score
    
    if (wordCount >= 50 && wordCount <= 200) score += 10; // Good length
    if (hasExamples) score += 15; // Examples are important
    if (hasStructure) score += 15; // Good structure
    if (hasConfidence) score += 10; // Confidence

    // Add specific feedback based on question type
    if (question.category === 'problem-solving') {
      if (this.mentionsProcess(answer)) {
        feedback.strengths.push("Good problem-solving approach");
        score += 10;
      } else {
        feedback.improvements.push("Try to explain your problem-solving process step by step");
      }
    }

    if (question.category === 'teamwork') {
      if (this.mentionsCollaboration(answer)) {
        feedback.strengths.push("Good teamwork examples");
        score += 10;
      } else {
        feedback.improvements.push("Include more details about how you worked with others");
      }
    }

    feedback.score = Math.min(100, Math.max(0, score));
    feedback.recommendations = this.generateRecommendations(feedback);

    return feedback;
  }

  // Analyze answer content
  hasExamples(answer) {
    const exampleWords = ['example', 'for instance', 'specifically', 'one time', 'recently', 'last year'];
    return exampleWords.some(word => answer.toLowerCase().includes(word));
  }

  hasGoodStructure(answer) {
    const structureWords = ['first', 'second', 'then', 'finally', 'initially', 'subsequently'];
    return structureWords.some(word => answer.toLowerCase().includes(word));
  }

  showsConfidence(answer) {
    const confidenceWords = ['confident', 'successful', 'achieved', 'accomplished', 'led', 'managed'];
    const uncertaintyWords = ['maybe', 'perhaps', 'i think', 'i guess', 'not sure'];
    
    const confidenceCount = confidenceWords.filter(word => answer.toLowerCase().includes(word)).length;
    const uncertaintyCount = uncertaintyWords.filter(word => answer.toLowerCase().includes(word)).length;
    
    return confidenceCount > uncertaintyCount;
  }

  mentionsProcess(answer) {
    const processWords = ['analyzed', 'identified', 'researched', 'implemented', 'evaluated', 'tested'];
    return processWords.some(word => answer.toLowerCase().includes(word));
  }

  mentionsCollaboration(answer) {
    const collaborationWords = ['team', 'collaborated', 'worked together', 'communicated', 'coordinated'];
    return collaborationWords.some(word => answer.toLowerCase().includes(word));
  }

  // Generate recommendations
  generateRecommendations(feedback) {
    const recommendations = [];
    
    if (feedback.score < 60) {
      recommendations.push("Practice using the STAR method (Situation, Task, Action, Result)");
      recommendations.push("Prepare specific examples for common interview questions");
    }
    
    if (feedback.improvements.length > 0) {
      recommendations.push("Focus on the areas mentioned in the feedback");
    }
    
    if (feedback.score >= 80) {
      recommendations.push("Excellent answer! Keep up the great work");
    }

    return recommendations;
  }

  // Complete practice session
  completeSession(sessionId) {
    const session = this.practiceSessions.find(s => s.id === sessionId);
    if (!session) return null;

    session.isActive = false;
    session.endTime = Date.now();
    session.totalDuration = session.endTime - session.startTime;

    // Calculate overall performance
    const overallScore = session.feedback.reduce((sum, f) => sum + f.score, 0) / session.feedback.length;
    const strengths = this.identifyOverallStrengths(session);
    const improvements = this.identifyOverallImprovements(session);

    const summary = {
      sessionId,
      overallScore: Math.round(overallScore),
      strengths,
      improvements,
      totalQuestions: session.questions.length,
      totalDuration: session.totalDuration,
      recommendations: this.generateSessionRecommendations(session)
    };

    session.summary = summary;
    return summary;
  }

  // Identify overall strengths
  identifyOverallStrengths(session) {
    const strengths = [];
    const allStrengths = session.feedback.flatMap(f => f.strengths);
    
    // Count frequency of strengths
    const strengthCounts = {};
    allStrengths.forEach(strength => {
      strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
    });

    // Get most common strengths
    Object.entries(strengthCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([strength, count]) => {
        strengths.push({ strength, frequency: count });
      });

    return strengths;
  }

  // Identify overall improvements
  identifyOverallImprovements(session) {
    const improvements = [];
    const allImprovements = session.feedback.flatMap(f => f.improvements);
    
    // Count frequency of improvements
    const improvementCounts = {};
    allImprovements.forEach(improvement => {
      improvementCounts[improvement] = (improvementCounts[improvement] || 0) + 1;
    });

    // Get most common improvements
    Object.entries(improvementCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([improvement, count]) => {
        improvements.push({ improvement, frequency: count });
      });

    return improvements;
  }

  // Generate session recommendations
  generateSessionRecommendations(session) {
    const recommendations = [];
    const overallScore = session.feedback.reduce((sum, f) => sum + f.score, 0) / session.feedback.length;

    if (overallScore < 60) {
      recommendations.push("Practice more interview questions to build confidence");
      recommendations.push("Focus on preparing specific examples using the STAR method");
    } else if (overallScore < 80) {
      recommendations.push("Good progress! Continue practicing to improve consistency");
      recommendations.push("Work on the specific areas mentioned in feedback");
    } else {
      recommendations.push("Excellent performance! You're well-prepared for interviews");
      recommendations.push("Continue practicing to maintain your skills");
    }

    return recommendations;
  }

  // Get interview tips
  getInterviewTips(category = 'general') {
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

  // Get practice questions by category
  getPracticeQuestions(category, count = 5) {
    const questions = this.questionBank[category] || [];
    return this.shuffleArray(questions).slice(0, count);
  }

  // Utility functions
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  calculateTimeRemaining(session) {
    const elapsed = Date.now() - session.startTime;
    const remaining = (session.duration * 60 * 1000) - elapsed;
    return Math.max(0, remaining);
  }

  calculateAnswerDuration(session) {
    // This would be implemented based on when the question was asked
    return 0; // Placeholder
  }

  // Get user progress
  getUserProgress() {
    return this.userProgress;
  }

  // Update user progress
  updateProgress(sessionSummary) {
    this.userProgress.confidenceLevel = sessionSummary.overallScore;
    
    // Update strengths and weaknesses based on session
    sessionSummary.strengths.forEach(s => {
      if (!this.userProgress.strengths.includes(s.strength)) {
        this.userProgress.strengths.push(s.strength);
      }
    });

    sessionSummary.improvements.forEach(i => {
      if (!this.userProgress.improvementAreas.includes(i.improvement)) {
        this.userProgress.improvementAreas.push(i.improvement);
      }
    });
  }
}

export default InterviewCoach;
