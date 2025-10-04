// Conversation Flow Manager
// Manages the 1-to-1 interaction flow between user and AI companion

export class ConversationFlowManager {
  constructor() {
    this.currentState = 'waiting'; // waiting, listening, analyzing, responding
    this.userInput = null;
    this.analysisResult = null;
    this.aiResponse = null;
    this.conversationHistory = [];
    this.sessionStartTime = null;
    this.isActive = false;
    this.callbacks = {
      onStateChange: null,
      onUserInputReceived: null,
      onAnalysisComplete: null,
      onAIResponseReady: null,
      onError: null
    };
  }

  // Start conversation session
  startSession() {
    this.isActive = true;
    this.sessionStartTime = Date.now();
    this.currentState = 'waiting';
    this.conversationHistory = [];
    
    this.notifyStateChange('waiting');
    console.log('Conversation session started - waiting for user input');
  }

  // End conversation session
  endSession() {
    this.isActive = false;
    this.currentState = 'inactive';
    this.userInput = null;
    this.analysisResult = null;
    this.aiResponse = null;
    
    this.notifyStateChange('inactive');
    console.log('Conversation session ended');
  }

  // Handle user input received
  async handleUserInput(input) {
    if (!this.isActive || this.currentState !== 'waiting') {
      console.warn('Cannot handle user input in current state:', this.currentState);
      return;
    }

    this.userInput = input;
    this.currentState = 'listening';
    this.notifyStateChange('listening');
    
    console.log('User input received:', input);
    
    if (this.callbacks.onUserInputReceived) {
      this.callbacks.onUserInputReceived(input);
    }

    // Start analysis
    await this.startAnalysis();
  }

  // Start analysis of user input
  async startAnalysis() {
    if (!this.isActive || this.currentState !== 'listening') return;

    this.currentState = 'analyzing';
    this.notifyStateChange('analyzing');
    
    console.log('Starting analysis of user input...');
    
    try {
      // Perform comprehensive analysis
      const analysis = await this.performComprehensiveAnalysis();
      
      this.analysisResult = analysis;
      this.currentState = 'analyzing';
      this.notifyStateChange('analyzing');
      
      console.log('Analysis complete:', analysis);
      
      if (this.callbacks.onAnalysisComplete) {
        this.callbacks.onAnalysisComplete(analysis);
      }

      // Generate AI response
      await this.generateAIResponse();
      
    } catch (error) {
      console.error('Error during analysis:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      
      // Reset to waiting state
      this.currentState = 'waiting';
      this.notifyStateChange('waiting');
    }
  }

  // Perform comprehensive analysis
  async performComprehensiveAnalysis() {
    const analysis = {
      timestamp: Date.now(),
      userInput: this.userInput,
      speechAnalysis: this.analyzeSpeech(this.userInput),
      contentAnalysis: this.analyzeContent(this.userInput),
      deliveryAnalysis: this.analyzeDelivery(this.userInput),
      engagementAnalysis: this.analyzeEngagement(this.userInput),
      confidenceAnalysis: this.analyzeConfidence(this.userInput),
      overallScore: 0,
      strengths: [],
      improvements: [],
      recommendations: []
    };

    // Calculate overall score
    analysis.overallScore = Math.round(
      (analysis.speechAnalysis.score + analysis.contentAnalysis.score + 
       analysis.deliveryAnalysis.score + analysis.engagementAnalysis.score + 
       analysis.confidenceAnalysis.score) / 5
    );

    // Identify strengths and improvements
    analysis.strengths = this.identifyStrengths(analysis);
    analysis.improvements = this.identifyImprovements(analysis);
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  // Analyze speech quality
  analyzeSpeech(input) {
    const words = input.split(' ');
    const wordCount = words.length;
    
    // Check for filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'well', 'actually'];
    const fillerCount = words.filter(word => 
      fillerWords.includes(word.toLowerCase())
    ).length;
    
    // Check for clarity indicators
    const clarityWords = ['clearly', 'specifically', 'exactly', 'precisely'];
    const clarityCount = words.filter(word => 
      clarityWords.includes(word.toLowerCase())
    ).length;
    
    let score = 70;
    score -= fillerCount * 5; // Penalize filler words
    score += clarityCount * 3; // Reward clarity words
    
    return {
      score: Math.max(0, Math.min(100, score)),
      wordCount,
      fillerCount,
      clarityCount
    };
  }

  // Analyze content quality
  analyzeContent(input) {
    const words = input.split(' ');
    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Check for structure
    const hasIntroduction = sentences.length > 0 && sentences[0].length > 10;
    const hasConclusion = sentences.length > 1 && sentences[sentences.length - 1].length > 10;
    
    // Check for key points
    const keyWords = ['first', 'second', 'third', 'important', 'key', 'main', 'primary'];
    const keyWordCount = words.filter(word => 
      keyWords.includes(word.toLowerCase())
    ).length;
    
    // Check for examples
    const exampleWords = ['example', 'for instance', 'such as', 'like', 'including'];
    const exampleCount = words.filter(word => 
      exampleWords.includes(word.toLowerCase())
    ).length;
    
    let score = 70;
    if (hasIntroduction) score += 10;
    if (hasConclusion) score += 10;
    score += keyWordCount * 2;
    score += exampleCount * 3;
    
    return {
      score: Math.max(0, Math.min(100, score)),
      hasIntroduction,
      hasConclusion,
      keyWordCount,
      exampleCount
    };
  }

  // Analyze delivery
  analyzeDelivery(input) {
    const words = input.split(' ');
    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Check for pace variation
    const sentenceLengths = sentences.map(s => s.trim().split(' ').length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
    
    // Check for emphasis
    const emphasisWords = ['very', 'really', 'extremely', 'absolutely', 'definitely'];
    const emphasisCount = words.filter(word => 
      emphasisWords.includes(word.toLowerCase())
    ).length;
    
    // Check for pauses
    const pauseCount = (input.match(/[.!?]/g) || []).length;
    
    let score = 70;
    if (variance > 20) score += 15; // Good variation
    if (emphasisCount > 0 && emphasisCount < 5) score += 10; // Good emphasis
    if (pauseCount > 0 && pauseCount < sentences.length * 0.5) score += 10; // Good pauses
    
    return {
      score: Math.max(0, Math.min(100, score)),
      avgSentenceLength: avgLength,
      variance,
      emphasisCount,
      pauseCount
    };
  }

  // Analyze engagement
  analyzeEngagement(input) {
    const words = input.toLowerCase().split(' ');
    
    // Check for audience connection
    const audienceWords = ['you', 'your', 'we', 'us', 'our', 'together'];
    const audienceCount = words.filter(word => 
      audienceWords.includes(word)
    ).length;
    
    // Check for questions
    const questionCount = (input.match(/\?/g) || []).length;
    
    // Check for storytelling
    const storyWords = ['story', 'example', 'imagine', 'picture', 'suppose'];
    const storyCount = words.filter(word => 
      storyWords.includes(word)
    ).length;
    
    // Check for emotional words
    const emotionalWords = ['exciting', 'amazing', 'incredible', 'important', 'crucial'];
    const emotionalCount = words.filter(word => 
      emotionalWords.includes(word)
    ).length;
    
    let score = 70;
    score += audienceCount * 2;
    score += questionCount * 5;
    score += storyCount * 8;
    score += emotionalCount * 5;
    
    return {
      score: Math.max(0, Math.min(100, score)),
      audienceCount,
      questionCount,
      storyCount,
      emotionalCount
    };
  }

  // Analyze confidence
  analyzeConfidence(input) {
    const words = input.toLowerCase().split(' ');
    
    // Check for confidence indicators
    const confidenceWords = ['definitely', 'certainly', 'absolutely', 'clearly', 'obviously'];
    const confidenceCount = words.filter(word => 
      confidenceWords.includes(word)
    ).length;
    
    // Check for uncertainty indicators
    const uncertaintyWords = ['maybe', 'perhaps', 'might', 'could', 'possibly', 'i think'];
    const uncertaintyCount = words.filter(word => 
      uncertaintyWords.includes(word)
    ).length;
    
    // Check for hedging
    const hedgingWords = ['kind of', 'sort of', 'a bit', 'somewhat', 'rather'];
    const hedgingCount = words.filter(word => 
      hedgingWords.includes(word)
    ).length;
    
    let score = 70;
    score += confidenceCount * 5;
    score -= uncertaintyCount * 3;
    score -= hedgingCount * 2;
    
    return {
      score: Math.max(0, Math.min(100, score)),
      confidenceCount,
      uncertaintyCount,
      hedgingCount
    };
  }

  // Identify strengths
  identifyStrengths(analysis) {
    const strengths = [];
    
    if (analysis.speechAnalysis.score >= 80) {
      strengths.push({
        area: 'speech',
        score: analysis.speechAnalysis.score,
        message: 'Your speech is clear and well-articulated'
      });
    }
    
    if (analysis.contentAnalysis.score >= 80) {
      strengths.push({
        area: 'content',
        score: analysis.contentAnalysis.score,
        message: 'Your content is well-structured and engaging'
      });
    }
    
    if (analysis.deliveryAnalysis.score >= 80) {
      strengths.push({
        area: 'delivery',
        score: analysis.deliveryAnalysis.score,
        message: 'Your delivery has good pace and variation'
      });
    }
    
    if (analysis.engagementAnalysis.score >= 80) {
      strengths.push({
        area: 'engagement',
        score: analysis.engagementAnalysis.score,
        message: 'You\'re doing great at engaging your audience'
      });
    }
    
    if (analysis.confidenceAnalysis.score >= 80) {
      strengths.push({
        area: 'confidence',
        score: analysis.confidenceAnalysis.score,
        message: 'You\'re speaking with great confidence'
      });
    }
    
    return strengths;
  }

  // Identify improvements
  identifyImprovements(analysis) {
    const improvements = [];
    
    if (analysis.speechAnalysis.score < 70) {
      improvements.push({
        area: 'speech',
        score: analysis.speechAnalysis.score,
        message: 'Work on reducing filler words and speaking more clearly',
        priority: 'high'
      });
    }
    
    if (analysis.contentAnalysis.score < 70) {
      improvements.push({
        area: 'content',
        score: analysis.contentAnalysis.score,
        message: 'Structure your content with clear introduction and conclusion',
        priority: 'medium'
      });
    }
    
    if (analysis.deliveryAnalysis.score < 70) {
      improvements.push({
        area: 'delivery',
        score: analysis.deliveryAnalysis.score,
        message: 'Vary your sentence length and use more pauses for emphasis',
        priority: 'medium'
      });
    }
    
    if (analysis.engagementAnalysis.score < 70) {
      improvements.push({
        area: 'engagement',
        score: analysis.engagementAnalysis.score,
        message: 'Connect more with your audience using questions and examples',
        priority: 'high'
      });
    }
    
    if (analysis.confidenceAnalysis.score < 70) {
      improvements.push({
        area: 'confidence',
        score: analysis.confidenceAnalysis.score,
        message: 'Speak with more conviction and reduce uncertainty words',
        priority: 'high'
      });
    }
    
    return improvements;
  }

  // Generate recommendations
  generateRecommendations(analysis) {
    const recommendations = [];
    
    // Overall recommendations
    if (analysis.overallScore >= 85) {
      recommendations.push('Excellent presentation! Keep up the great work.');
    } else if (analysis.overallScore >= 70) {
      recommendations.push('Good presentation! Focus on the areas we discussed.');
    } else if (analysis.overallScore >= 50) {
      recommendations.push('You\'re making progress! Let\'s work on the key areas together.');
    } else {
      recommendations.push('Don\'t worry, every expert was once a beginner. Let\'s practice together.');
    }
    
    // Specific recommendations based on improvements
    analysis.improvements.forEach(improvement => {
      if (improvement.priority === 'high') {
        recommendations.push(`Priority: ${improvement.message}`);
      }
    });
    
    return recommendations;
  }

  // Generate AI response
  async generateAIResponse() {
    if (!this.isActive || this.currentState !== 'analyzing') return;

    this.currentState = 'responding';
    this.notifyStateChange('responding');
    
    console.log('Generating AI response...');
    
    try {
      // Generate contextual response based on analysis
      const response = this.createContextualResponse();
      
      this.aiResponse = response;
      
      // Add to conversation history
      this.conversationHistory.push({
        timestamp: Date.now(),
        userInput: this.userInput,
        analysis: this.analysisResult,
        aiResponse: response
      });
      
      console.log('AI response ready:', response);
      
      if (this.callbacks.onAIResponseReady) {
        this.callbacks.onAIResponseReady(response);
      }

      // Reset for next interaction
      this.resetForNextInteraction();
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      
      // Reset to waiting state
      this.currentState = 'waiting';
      this.notifyStateChange('waiting');
    }
  }

  // Create contextual response
  createContextualResponse() {
    const analysis = this.analysisResult;
    const overallScore = analysis.overallScore;
    const strengths = analysis.strengths;
    const improvements = analysis.improvements;
    
    let response = '';
    
    // Start with overall assessment
    if (overallScore >= 85) {
      response = "Wow! That was an excellent presentation! ";
    } else if (overallScore >= 70) {
      response = "Great job! You delivered a solid presentation. ";
    } else if (overallScore >= 50) {
      response = "Good effort! I can see you're improving. ";
    } else {
      response = "I appreciate your effort! Let's work together to improve. ";
    }
    
    // Add strengths
    if (strengths.length > 0) {
      response += `I particularly liked how ${strengths[0].message.toLowerCase()}. `;
    }
    
    // Add improvements
    if (improvements.length > 0) {
      const highPriorityImprovements = improvements.filter(imp => imp.priority === 'high');
      if (highPriorityImprovements.length > 0) {
        response += `Let's focus on ${highPriorityImprovements[0].message.toLowerCase()}. `;
      }
    }
    
    // Add encouragement
    response += "Keep practicing and you'll continue to improve!";
    
    return response;
  }

  // Reset for next interaction
  resetForNextInteraction() {
    this.userInput = null;
    this.analysisResult = null;
    this.aiResponse = null;
    this.currentState = 'waiting';
    
    this.notifyStateChange('waiting');
    console.log('Ready for next user input');
  }

  // Notify state change
  notifyStateChange(newState) {
    this.currentState = newState;
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(newState);
    }
  }

  // Set callbacks
  onStateChange(callback) {
    this.callbacks.onStateChange = callback;
  }

  onUserInputReceived(callback) {
    this.callbacks.onUserInputReceived = callback;
  }

  onAnalysisComplete(callback) {
    this.callbacks.onAnalysisComplete = callback;
  }

  onAIResponseReady(callback) {
    this.callbacks.onAIResponseReady = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }

  // Get current state
  getCurrentState() {
    return this.currentState;
  }

  // Get conversation history
  getConversationHistory() {
    return this.conversationHistory;
  }

  // Check if ready for user input
  isReadyForInput() {
    return this.isActive && this.currentState === 'waiting';
  }
}

export default ConversationFlowManager;
