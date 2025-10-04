// AI Companion Service
// Handles realistic AI companion interactions with character face and human-like speech

export class AICompanion {
  constructor() {
    this.isActive = false;
    this.currentExpression = 'neutral';
    this.isTalking = false;
    this.isListening = false;
    this.conversationHistory = [];
    this.personality = 'coach'; // coach, friend, mentor, professional
    this.voiceSettings = {
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8,
      voice: 'default'
    };
    this.callbacks = {
      onExpressionChange: null,
      onTalkingStart: null,
      onTalkingEnd: null,
      onListeningStart: null,
      onListeningEnd: null,
      onMessage: null
    };
  }

  // Initialize the AI companion
  async initialize() {
    this.isActive = true;
    this.setExpression('happy');
    await this.speak("Hello! I'm your AI presentation coach. I'm here to help you improve your speaking skills. Let's start with a warm greeting!");
  }

  // Set companion personality
  setPersonality(personality) {
    this.personality = personality;
  }

  // Set voice settings
  setVoiceSettings(settings) {
    this.voiceSettings = { ...this.voiceSettings, ...settings };
  }

  // Generate human-like response based on analysis
  async generateResponse(analysis, userMessage = null) {
    const timestamp = new Date();
    let response = '';

    // Analyze the current performance
    const performanceLevel = this.analyzePerformance(analysis);
    const areasToImprove = this.identifyImprovementAreas(analysis);
    const strengths = this.identifyStrengths(analysis);

    // Generate contextual response
    if (userMessage) {
      response = await this.generateConversationalResponse(userMessage, analysis);
    } else {
      response = await this.generateFeedbackResponse(analysis, performanceLevel, areasToImprove, strengths);
    }

    // Add to conversation history
    this.conversationHistory.push({
      timestamp,
      type: 'ai_response',
      message: response,
      analysis: analysis,
      performanceLevel,
      areasToImprove,
      strengths
    });

    return {
      message: response,
      expression: this.determineExpression(analysis, performanceLevel),
      timestamp,
      analysis,
      performanceLevel,
      areasToImprove,
      strengths
    };
  }

  // Analyze overall performance
  analyzePerformance(analysis) {
    if (!analysis || !analysis.overallScore) return 'unknown';
    
    const score = analysis.overallScore;
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'fair';
    return 'needs_improvement';
  }

  // Identify areas that need improvement
  identifyImprovementAreas(analysis) {
    const areas = [];
    
    if (analysis.posture && analysis.posture.score < 70) {
      areas.push({
        area: 'posture',
        score: analysis.posture.score,
        message: 'Your posture could be more confident'
      });
    }
    
    if (analysis.confidence && analysis.confidence.score < 70) {
      areas.push({
        area: 'confidence',
        score: analysis.confidence.score,
        message: 'Let\'s work on building your confidence'
      });
    }
    
    if (analysis.engagement && analysis.engagement.score < 60) {
      areas.push({
        area: 'engagement',
        score: analysis.engagement.score,
        message: 'Try to connect more with your audience'
      });
    }
    
    if (analysis.voiceClarity && analysis.voiceClarity.score < 70) {
      areas.push({
        area: 'voice',
        score: analysis.voiceClarity.score,
        message: 'Your voice clarity needs improvement'
      });
    }

    return areas;
  }

  // Identify strengths
  identifyStrengths(analysis) {
    const strengths = [];
    
    if (analysis.posture && analysis.posture.score >= 80) {
      strengths.push({
        area: 'posture',
        score: analysis.posture.score,
        message: 'Your posture is excellent!'
      });
    }
    
    if (analysis.confidence && analysis.confidence.score >= 80) {
      strengths.push({
        area: 'confidence',
        score: analysis.confidence.score,
        message: 'You\'re radiating confidence!'
      });
    }
    
    if (analysis.engagement && analysis.engagement.score >= 70) {
      strengths.push({
        area: 'engagement',
        score: analysis.engagement.score,
        message: 'Great audience engagement!'
      });
    }

    return strengths;
  }

  // Generate conversational response
  async generateConversationalResponse(userMessage, analysis) {
    const responses = {
      greeting: [
        "Hello there! I'm excited to help you with your presentation skills today.",
        "Hi! Ready to work on your speaking skills together?",
        "Great to see you! Let's make this session productive and fun."
      ],
      question: [
        "That's a great question! Let me help you with that.",
        "I'm here to help! What would you like to know?",
        "Absolutely! I'd be happy to guide you through that."
      ],
      concern: [
        "Don't worry, I'm here to support you every step of the way.",
        "I understand your concern. Let's work through this together.",
        "That's completely normal. We'll practice until you feel confident."
      ],
      thanks: [
        "You're very welcome! I'm here to help you succeed.",
        "My pleasure! I love seeing you improve.",
        "Happy to help! Keep up the great work."
      ]
    };

    // Simple keyword-based response selection
    const message = userMessage.toLowerCase();
    
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return this.selectRandomResponse(responses.greeting);
    } else if (message.includes('?') || message.includes('how') || message.includes('what')) {
      return this.selectRandomResponse(responses.question);
    } else if (message.includes('worried') || message.includes('nervous') || message.includes('scared')) {
      return this.selectRandomResponse(responses.concern);
    } else if (message.includes('thank') || message.includes('thanks')) {
      return this.selectRandomResponse(responses.thanks);
    } else {
      return this.generateContextualResponse(analysis);
    }
  }

  // Generate feedback response
  async generateFeedbackResponse(analysis, performanceLevel, areasToImprove, strengths) {
    let response = '';

    // Start with performance level
    switch (performanceLevel) {
      case 'excellent':
        response = "Wow! You're doing absolutely fantastic! ";
        break;
      case 'good':
        response = "Great job! You're performing really well. ";
        break;
      case 'fair':
        response = "You're making good progress! ";
        break;
      case 'needs_improvement':
        response = "I can see areas where we can improve together. ";
        break;
      default:
        response = "Let me give you some feedback. ";
    }

    // Add strengths
    if (strengths.length > 0) {
      response += `I love how ${strengths[0].message.toLowerCase()} `;
    }

    // Add improvement areas
    if (areasToImprove.length > 0) {
      const area = areasToImprove[0];
      response += `However, ${area.message.toLowerCase()}. `;
      
      // Add specific advice
      response += this.getSpecificAdvice(area.area);
    }

    // Add encouragement
    response += this.getEncouragement(performanceLevel);

    return response;
  }

  // Generate contextual response
  generateContextualResponse(analysis) {
    const responses = [
      "I can see you're working hard on your presentation skills. Keep it up!",
      "Your dedication to improvement is really inspiring!",
      "I'm here to help you become the best presenter you can be.",
      "Let's continue working on your speaking skills together.",
      "I can see potential in your presentation style. Let's develop it further."
    ];

    return this.selectRandomResponse(responses);
  }

  // Get specific advice for improvement areas
  getSpecificAdvice(area) {
    const advice = {
      posture: "Try sitting up straight with your shoulders back. This will make you look more confident and professional.",
      confidence: "Remember to breathe deeply and believe in your knowledge. You've got this!",
      engagement: "Make more eye contact with the camera and use gestures to emphasize your points.",
      voice: "Speak clearly and at a moderate pace. Project your voice with confidence."
    };

    return advice[area] || "Keep practicing and you'll see improvement!";
  }

  // Get encouragement based on performance
  getEncouragement(performanceLevel) {
    const encouragement = {
      excellent: "You're a natural! Keep up this amazing work!",
      good: "You're doing great! Keep pushing forward!",
      fair: "Every practice session makes you better. Don't give up!",
      needs_improvement: "Remember, every expert was once a beginner. You're on the right path!"
    };

    return encouragement[performanceLevel] || "Keep up the great work!";
  }

  // Determine facial expression based on analysis
  determineExpression(analysis, performanceLevel) {
    if (performanceLevel === 'excellent') return 'happy';
    if (performanceLevel === 'good') return 'smile';
    if (performanceLevel === 'fair') return 'encouraging';
    return 'supportive';
  }

  // Set expression
  setExpression(expression) {
    this.currentExpression = expression;
    if (this.callbacks.onExpressionChange) {
      this.callbacks.onExpressionChange(expression);
    }
  }

  // Speak text with realistic voice
  async speak(text) {
    if (!text) return;

    this.isTalking = true;
    this.setExpression('talking');
    
    if (this.callbacks.onTalkingStart) {
      this.callbacks.onTalkingStart(text);
    }

    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = this.voiceSettings.rate;
        utterance.pitch = this.voiceSettings.pitch;
        utterance.volume = this.voiceSettings.volume;
        
        // Try to use a more natural voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Google') || 
          voice.name.includes('Microsoft') ||
          voice.name.includes('Natural')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.onstart = () => {
          this.setExpression('talking');
        };
        
        utterance.onend = () => {
          this.isTalking = false;
          this.setExpression('neutral');
          
          if (this.callbacks.onTalkingEnd) {
            this.callbacks.onTalkingEnd();
          }
          
          resolve();
        };
        
        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          this.isTalking = false;
          this.setExpression('neutral');
          resolve();
        };
        
        speechSynthesis.speak(utterance);
      } else {
        // Fallback if speech synthesis is not available
        setTimeout(() => {
          this.isTalking = false;
          this.setExpression('neutral');
          resolve();
        }, 1000);
      }
    });
  }

  // Start listening
  startListening() {
    this.isListening = true;
    this.setExpression('listening');
    
    if (this.callbacks.onListeningStart) {
      this.callbacks.onListeningStart();
    }
  }

  // Stop listening
  stopListening() {
    this.isListening = false;
    this.setExpression('neutral');
    
    if (this.callbacks.onListeningEnd) {
      this.callbacks.onListeningEnd();
    }
  }

  // Select random response from array
  selectRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Get conversation history
  getConversationHistory() {
    return this.conversationHistory;
  }

  // Clear conversation history
  clearConversationHistory() {
    this.conversationHistory = [];
  }

  // Set callbacks
  onExpressionChange(callback) {
    this.callbacks.onExpressionChange = callback;
  }

  onTalkingStart(callback) {
    this.callbacks.onTalkingStart = callback;
  }

  onTalkingEnd(callback) {
    this.callbacks.onTalkingEnd = callback;
  }

  onListeningStart(callback) {
    this.callbacks.onListeningStart = callback;
  }

  onListeningEnd(callback) {
    this.callbacks.onListeningEnd = callback;
  }

  onMessage(callback) {
    this.callbacks.onMessage = callback;
  }

  // Stop all activities
  stop() {
    this.isActive = false;
    this.isTalking = false;
    this.isListening = false;
    this.setExpression('neutral');
    
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
  }
}

export default AICompanion;
