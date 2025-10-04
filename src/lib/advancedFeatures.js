// Advanced Features for Enhanced User Experience
// Provides intelligent features like conversation memory, adaptive learning, and smart suggestions

export class AdvancedFeatures {
  constructor() {
    this.conversationMemory = [];
    this.userPreferences = {
      speakingStyle: 'conversational',
      feedbackLevel: 'detailed',
      preferredTopics: [],
      learningGoals: [],
      difficultyPreference: 'medium'
    };
    this.learningAnalytics = {
      strengths: [],
      weaknesses: [],
      improvementAreas: [],
      progressHistory: [],
      skillLevel: 'beginner'
    };
    this.smartSuggestions = [];
    this.adaptiveLearning = {
      isEnabled: true,
      learningRate: 0.1,
      adaptationThreshold: 0.7
    };
    this.conversationContext = {
      currentTopic: null,
      conversationFlow: 'natural',
      emotionalTone: 'neutral',
      userEngagement: 'medium'
    };
  }

  // Analyze conversation patterns and provide insights
  analyzeConversationPatterns(conversationHistory) {
    const patterns = {
      commonTopics: [],
      speakingStyle: 'formal',
      questionTypes: [],
      responseLength: 'medium',
      engagementLevel: 'medium',
      improvementTrends: []
    };

    // Analyze topics
    const topics = conversationHistory.map(msg => this.extractTopics(msg.message));
    patterns.commonTopics = this.getMostFrequent(topics.flat());

    // Analyze speaking style
    const formalWords = ['therefore', 'however', 'furthermore', 'consequently'];
    const casualWords = ['yeah', 'okay', 'cool', 'awesome', 'great'];
    
    const formalCount = conversationHistory.reduce((count, msg) => 
      count + formalWords.filter(word => msg.message.toLowerCase().includes(word)).length, 0);
    const casualCount = conversationHistory.reduce((count, msg) => 
      count + casualWords.filter(word => msg.message.toLowerCase().includes(word)).length, 0);
    
    patterns.speakingStyle = formalCount > casualCount ? 'formal' : 'casual';

    // Analyze question types
    patterns.questionTypes = this.analyzeQuestionTypes(conversationHistory);

    // Analyze response length
    const avgLength = conversationHistory.reduce((sum, msg) => sum + msg.message.length, 0) / conversationHistory.length;
    patterns.responseLength = avgLength > 100 ? 'long' : avgLength > 50 ? 'medium' : 'short';

    return patterns;
  }

  // Extract topics from text
  extractTopics(text) {
    const topicKeywords = {
      'technology': ['tech', 'software', 'programming', 'coding', 'development', 'AI', 'machine learning'],
      'career': ['job', 'career', 'work', 'employment', 'professional', 'interview'],
      'education': ['learn', 'study', 'education', 'course', 'training', 'skill'],
      'communication': ['speak', 'presentation', 'communication', 'public speaking', 'voice'],
      'leadership': ['lead', 'leadership', 'manage', 'team', 'project', 'decision'],
      'problem-solving': ['problem', 'solve', 'solution', 'challenge', 'difficulty', 'issue']
    };

    const topics = [];
    const lowerText = text.toLowerCase();
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        topics.push(topic);
      }
    });

    return topics;
  }

  // Analyze question types
  analyzeQuestionTypes(conversationHistory) {
    const questionTypes = {
      'what': 0,
      'how': 0,
      'why': 0,
      'when': 0,
      'where': 0,
      'who': 0,
      'which': 0
    };

    conversationHistory.forEach(msg => {
      const questions = msg.message.match(/\?/g) || [];
      questions.forEach(() => {
        Object.keys(questionTypes).forEach(type => {
          if (msg.message.toLowerCase().includes(type)) {
            questionTypes[type]++;
          }
        });
      });
    });

    return Object.entries(questionTypes)
      .filter(([type, count]) => count > 0)
      .sort(([,a], [,b]) => b - a)
      .map(([type]) => type);
  }

  // Get most frequent items
  getMostFrequent(items) {
    const frequency = {};
    items.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([item]) => item);
  }

  // Generate smart suggestions based on conversation history
  generateSmartSuggestions(conversationHistory, currentContext) {
    const suggestions = [];
    const patterns = this.analyzeConversationPatterns(conversationHistory);

    // Topic-based suggestions
    if (patterns.commonTopics.includes('technology')) {
      suggestions.push({
        type: 'topic',
        suggestion: 'Would you like to practice explaining a technical concept?',
        category: 'technical_practice'
      });
    }

    if (patterns.commonTopics.includes('career')) {
      suggestions.push({
        type: 'topic',
        suggestion: 'Let\'s work on your elevator pitch for your career goals.',
        category: 'career_development'
      });
    }

    // Style-based suggestions
    if (patterns.speakingStyle === 'formal') {
      suggestions.push({
        type: 'style',
        suggestion: 'Try using more conversational language to connect better with your audience.',
        category: 'communication_style'
      });
    }

    // Engagement-based suggestions
    if (patterns.responseLength === 'short') {
      suggestions.push({
        type: 'engagement',
        suggestion: 'Try elaborating more on your points with specific examples.',
        category: 'content_development'
      });
    }

    // Question-based suggestions
    if (patterns.questionTypes.includes('how')) {
      suggestions.push({
        type: 'question',
        suggestion: 'Practice explaining processes step-by-step using the STAR method.',
        category: 'structured_thinking'
      });
    }

    return suggestions;
  }

  // Adaptive learning - adjust difficulty and approach based on performance
  adaptLearningApproach(performanceData) {
    const { recentScores, improvementRate, engagementLevel } = performanceData;
    
    if (improvementRate > 0.8 && engagementLevel === 'high') {
      // User is doing well, increase difficulty
      this.userPreferences.difficultyPreference = this.increaseDifficulty(this.userPreferences.difficultyPreference);
      return {
        action: 'increase_difficulty',
        message: 'Great progress! Let\'s try some more challenging scenarios.',
        newDifficulty: this.userPreferences.difficultyPreference
      };
    } else if (improvementRate < 0.3 && engagementLevel === 'low') {
      // User is struggling, decrease difficulty
      this.userPreferences.difficultyPreference = this.decreaseDifficulty(this.userPreferences.difficultyPreference);
      return {
        action: 'decrease_difficulty',
        message: 'Let\'s focus on the fundamentals and build your confidence.',
        newDifficulty: this.userPreferences.difficultyPreference
      };
    } else {
      // Maintain current approach
      return {
        action: 'maintain',
        message: 'Keep up the good work! Continue with your current approach.',
        newDifficulty: this.userPreferences.difficultyPreference
      };
    }
  }

  // Increase difficulty level
  increaseDifficulty(currentLevel) {
    const levels = ['beginner', 'easy', 'medium', 'hard', 'expert'];
    const currentIndex = levels.indexOf(currentLevel);
    return levels[Math.min(currentIndex + 1, levels.length - 1)];
  }

  // Decrease difficulty level
  decreaseDifficulty(currentLevel) {
    const levels = ['beginner', 'easy', 'medium', 'hard', 'expert'];
    const currentIndex = levels.indexOf(currentLevel);
    return levels[Math.max(currentIndex - 1, 0)];
  }

  // Generate personalized learning path
  generateLearningPath(userGoals, currentSkills) {
    const learningPath = {
      shortTerm: [],
      mediumTerm: [],
      longTerm: [],
      milestones: [],
      resources: []
    };

    // Short-term goals (1-2 weeks)
    if (currentSkills.includes('basic_communication')) {
      learningPath.shortTerm.push('Practice clear articulation and pacing');
      learningPath.shortTerm.push('Work on reducing filler words');
    }

    // Medium-term goals (1-2 months)
    if (userGoals.includes('interview_preparation')) {
      learningPath.mediumTerm.push('Master the STAR method for behavioral questions');
      learningPath.mediumTerm.push('Practice technical problem-solving explanations');
    }

    // Long-term goals (3-6 months)
    if (userGoals.includes('leadership_communication')) {
      learningPath.longTerm.push('Develop executive presence and authority');
      learningPath.longTerm.push('Practice high-stakes presentations');
    }

    // Set milestones
    learningPath.milestones = [
      { goal: 'Complete 10 practice sessions', timeframe: '2 weeks' },
      { goal: 'Achieve 80% confidence score', timeframe: '1 month' },
      { goal: 'Master 5 different presentation styles', timeframe: '3 months' }
    ];

    return learningPath;
  }

  // Track learning progress
  trackProgress(sessionData) {
    const progressEntry = {
      timestamp: Date.now(),
      sessionScore: sessionData.overallScore,
      improvements: sessionData.improvements,
      strengths: sessionData.strengths,
      topics: sessionData.topics || [],
      duration: sessionData.duration
    };

    this.learningAnalytics.progressHistory.push(progressEntry);

    // Update strengths and weaknesses
    this.updateStrengthsAndWeaknesses(sessionData);
    
    // Calculate overall progress
    const progress = this.calculateOverallProgress();
    
    return progress;
  }

  // Update strengths and weaknesses based on session data
  updateStrengthsAndWeaknesses(sessionData) {
    // Update strengths
    sessionData.strengths.forEach(strength => {
      if (!this.learningAnalytics.strengths.includes(strength)) {
        this.learningAnalytics.strengths.push(strength);
      }
    });

    // Update weaknesses
    sessionData.improvements.forEach(improvement => {
      if (!this.learningAnalytics.weaknesses.includes(improvement)) {
        this.learningAnalytics.weaknesses.push(improvement);
      }
    });
  }

  // Calculate overall progress
  calculateOverallProgress() {
    const recentSessions = this.learningAnalytics.progressHistory.slice(-10);
    if (recentSessions.length === 0) return { score: 0, trend: 'stable' };

    const avgScore = recentSessions.reduce((sum, session) => sum + session.sessionScore, 0) / recentSessions.length;
    
    // Calculate trend
    const firstHalf = recentSessions.slice(0, Math.floor(recentSessions.length / 2));
    const secondHalf = recentSessions.slice(Math.floor(recentSessions.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, session) => sum + session.sessionScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, session) => sum + session.sessionScore, 0) / secondHalf.length;
    
    const trend = secondAvg > firstAvg ? 'improving' : secondAvg < firstAvg ? 'declining' : 'stable';

    return {
      score: Math.round(avgScore),
      trend,
      sessionsCompleted: recentSessions.length,
      strengths: this.learningAnalytics.strengths,
      weaknesses: this.learningAnalytics.weaknesses
    };
  }

  // Generate contextual responses based on conversation history
  generateContextualResponse(userMessage, conversationHistory) {
    const context = this.analyzeConversationContext(conversationHistory);
    const suggestions = this.generateSmartSuggestions(conversationHistory, context);
    
    return {
      context,
      suggestions,
      personalizedResponse: this.createPersonalizedResponse(userMessage, context)
    };
  }

  // Analyze conversation context
  analyzeConversationContext(conversationHistory) {
    const recentMessages = conversationHistory.slice(-5);
    const topics = recentMessages.flatMap(msg => this.extractTopics(msg.message));
    const commonTopics = this.getMostFrequent(topics);

    return {
      currentTopics: commonTopics,
      conversationLength: conversationHistory.length,
      recentEngagement: this.calculateEngagement(recentMessages),
      userPreferences: this.userPreferences
    };
  }

  // Calculate engagement level
  calculateEngagement(messages) {
    if (messages.length === 0) return 'low';
    
    const avgLength = messages.reduce((sum, msg) => sum + msg.message.length, 0) / messages.length;
    const questionCount = messages.filter(msg => msg.message.includes('?')).length;
    
    if (avgLength > 100 && questionCount > 2) return 'high';
    if (avgLength > 50 && questionCount > 1) return 'medium';
    return 'low';
  }

  // Create personalized response
  createPersonalizedResponse(userMessage, context) {
    const response = {
      tone: 'encouraging',
      focus: 'general',
      suggestions: []
    };

    // Adjust tone based on context
    if (context.recentEngagement === 'high') {
      response.tone = 'enthusiastic';
    } else if (context.recentEngagement === 'low') {
      response.tone = 'supportive';
    }

    // Adjust focus based on topics
    if (context.currentTopics.includes('technology')) {
      response.focus = 'technical';
    } else if (context.currentTopics.includes('career')) {
      response.focus = 'professional';
    }

    return response;
  }

  // Get user preferences
  getUserPreferences() {
    return this.userPreferences;
  }

  // Update user preferences
  updateUserPreferences(preferences) {
    this.userPreferences = { ...this.userPreferences, ...preferences };
  }

  // Get learning analytics
  getLearningAnalytics() {
    return {
      ...this.learningAnalytics,
      progress: this.calculateOverallProgress()
    };
  }

  // Reset learning data
  resetLearningData() {
    this.learningAnalytics = {
      strengths: [],
      weaknesses: [],
      improvementAreas: [],
      progressHistory: [],
      skillLevel: 'beginner'
    };
  }

  // Export learning data
  exportLearningData() {
    return {
      preferences: this.userPreferences,
      analytics: this.learningAnalytics,
      conversationMemory: this.conversationMemory,
      timestamp: Date.now()
    };
  }

  // Import learning data
  importLearningData(data) {
    if (data.preferences) {
      this.userPreferences = { ...this.userPreferences, ...data.preferences };
    }
    if (data.analytics) {
      this.learningAnalytics = { ...this.learningAnalytics, ...data.analytics };
    }
    if (data.conversationMemory) {
      this.conversationMemory = data.conversationMemory;
    }
  }
}

export default AdvancedFeatures;
