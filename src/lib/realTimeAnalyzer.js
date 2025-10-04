// Real-time Presentation Skills Analyzer
// Provides live analysis of posture, face, emotion, voice, and confidence

export class RealTimeAnalyzer {
  constructor() {
    this.isAnalyzing = false;
    this.analysisHistory = [];
    this.currentFrame = null;
    this.analysisInterval = null;
    this.callbacks = {
      onAnalysisUpdate: null,
      onFeedbackUpdate: null,
      onError: null
    };
  }

  // Start real-time analysis
  startAnalysis(videoElement, options = {}) {
    if (this.isAnalyzing) {
      console.warn('Analysis already running');
      return;
    }

    this.isAnalyzing = true;
    this.analysisInterval = setInterval(() => {
      this.analyzeFrame(videoElement, options);
    }, 100); // Analyze every 100ms for real-time feedback
  }

  // Stop real-time analysis
  stopAnalysis() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    this.isAnalyzing = false;
  }

  // Analyze current video frame
  async analyzeFrame(videoElement, options = {}) {
    if (!videoElement || videoElement.readyState !== 4) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);

      const analysis = await this.performComprehensiveAnalysis(canvas, options);
      
      this.currentFrame = analysis;
      this.analysisHistory.push({
        ...analysis,
        timestamp: Date.now()
      });

      // Keep only last 100 frames for performance
      if (this.analysisHistory.length > 100) {
        this.analysisHistory = this.analysisHistory.slice(-100);
      }

      // Trigger callbacks
      if (this.callbacks.onAnalysisUpdate) {
        this.callbacks.onAnalysisUpdate(analysis);
      }

      if (this.callbacks.onFeedbackUpdate) {
        const feedback = this.generateRealTimeFeedback(analysis);
        this.callbacks.onFeedbackUpdate(feedback);
      }

    } catch (error) {
      console.error('Error analyzing frame:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }
  }

  // Perform comprehensive analysis
  async performComprehensiveAnalysis(canvas, options = {}) {
    const analysis = {
      timestamp: Date.now(),
      posture: await this.analyzePosture(canvas),
      faceExpression: await this.analyzeFaceExpression(canvas),
      emotion: await this.analyzeEmotion(canvas),
      voiceClarity: await this.analyzeVoiceClarity(options.audioData),
      confidence: await this.analyzeConfidence(canvas),
      engagement: await this.analyzeEngagement(canvas),
      eyeContact: await this.analyzeEyeContact(canvas),
      gestures: await this.analyzeGestures(canvas),
      overallScore: 0
    };

    // Calculate overall score
    analysis.overallScore = this.calculateOverallScore(analysis);
    
    return analysis;
  }

  // Analyze posture
  async analyzePosture(canvas) {
    // Mock implementation - in real app, use pose detection models
    const mockPostureScore = Math.random() * 30 + 60; // 60-90
    
    // Simulate different posture states
    const postureStates = {
      excellent: mockPostureScore > 85,
      good: mockPostureScore > 75,
      fair: mockPostureScore > 65,
      poor: mockPostureScore <= 65
    };

    return {
      score: Math.round(mockPostureScore),
      state: Object.keys(postureStates).find(key => postureStates[key]),
      details: {
        shoulderAlignment: Math.random() * 20 + 70,
        spineStraightness: Math.random() * 25 + 65,
        headPosition: Math.random() * 30 + 60,
        overallPosture: mockPostureScore
      },
      recommendations: this.getPostureRecommendations(mockPostureScore)
    };
  }

  // Analyze face expression
  async analyzeFaceExpression(canvas) {
    // Mock implementation - in real app, use face detection models
    const mockExpressionScore = Math.random() * 25 + 70; // 70-95

    return {
      score: Math.round(mockExpressionScore),
      expressions: {
        smile: Math.random() * 40 + 40,
        eyeContact: Math.random() * 30 + 60,
        eyebrowPosition: Math.random() * 20 + 70,
        mouthOpenness: Math.random() * 25 + 65
      },
      recommendations: this.getExpressionRecommendations(mockExpressionScore)
    };
  }

  // Analyze emotion
  async analyzeEmotion(canvas) {
    // Mock implementation - in real app, use emotion detection models
    const emotions = {
      happy: Math.random() * 30 + 40,
      confident: Math.random() * 35 + 45,
      engaged: Math.random() * 40 + 40,
      calm: Math.random() * 25 + 50,
      stressed: Math.random() * 20 + 10,
      distracted: Math.random() * 15 + 5,
      neutral: Math.random() * 20 + 30
    };

    // Normalize emotions
    const total = Object.values(emotions).reduce((a, b) => a + b, 0);
    Object.keys(emotions).forEach(key => {
      emotions[key] = Math.round((emotions[key] / total) * 100);
    });

    return {
      emotions,
      dominant: Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b),
      confidence: Math.random() * 20 + 70,
      recommendations: this.getEmotionRecommendations(emotions)
    };
  }

  // Analyze voice clarity
  async analyzeVoiceClarity(audioData) {
    // Mock implementation - in real app, use audio analysis
    const mockClarityScore = Math.random() * 25 + 65; // 65-90

    return {
      score: Math.round(mockClarityScore),
      metrics: {
        volume: Math.random() * 30 + 60,
        pace: Math.random() * 20 + 70,
        articulation: Math.random() * 25 + 65,
        pauses: Math.random() * 15 + 75
      },
      recommendations: this.getVoiceRecommendations(mockClarityScore)
    };
  }

  // Analyze confidence
  async analyzeConfidence(canvas) {
    // Mock implementation - in real app, use multiple indicators
    const mockConfidenceScore = Math.random() * 30 + 55; // 55-85

    return {
      score: Math.round(mockConfidenceScore),
      indicators: {
        posture: Math.random() * 20 + 70,
        eyeContact: Math.random() * 25 + 65,
        voice: Math.random() * 30 + 60,
        gestures: Math.random() * 35 + 55
      },
      recommendations: this.getConfidenceRecommendations(mockConfidenceScore)
    };
  }

  // Analyze engagement
  async analyzeEngagement(canvas) {
    // Mock implementation - in real app, use engagement metrics
    const mockEngagementScore = Math.random() * 35 + 50; // 50-85

    return {
      score: Math.round(mockEngagementScore),
      factors: {
        eyeContact: Math.random() * 25 + 65,
        facialExpression: Math.random() * 30 + 60,
        bodyLanguage: Math.random() * 20 + 70,
        voiceVariation: Math.random() * 35 + 55
      },
      recommendations: this.getEngagementRecommendations(mockEngagementScore)
    };
  }

  // Analyze eye contact
  async analyzeEyeContact(canvas) {
    // Mock implementation - in real app, use eye tracking
    const mockEyeContactScore = Math.random() * 30 + 60; // 60-90

    return {
      score: Math.round(mockEyeContactScore),
      duration: Math.random() * 3 + 2, // 2-5 seconds average
      frequency: Math.random() * 20 + 70, // percentage
      recommendations: this.getEyeContactRecommendations(mockEyeContactScore)
    };
  }

  // Analyze gestures
  async analyzeGestures(canvas) {
    // Mock implementation - in real app, use gesture recognition
    const mockGestureScore = Math.random() * 25 + 65; // 65-90

    return {
      score: Math.round(mockGestureScore),
      types: {
        handGestures: Math.random() * 30 + 60,
        headNods: Math.random() * 20 + 70,
        bodyMovement: Math.random() * 25 + 65,
        facialGestures: Math.random() * 35 + 55
      },
      recommendations: this.getGestureRecommendations(mockGestureScore)
    };
  }

  // Calculate overall score
  calculateOverallScore(analysis) {
    const weights = {
      posture: 0.15,
      faceExpression: 0.15,
      emotion: 0.20,
      voiceClarity: 0.15,
      confidence: 0.20,
      engagement: 0.15
    };

    let weightedSum = 0;
    let totalWeight = 0;

    Object.keys(weights).forEach(key => {
      if (analysis[key] && typeof analysis[key].score === 'number') {
        weightedSum += analysis[key].score * weights[key];
        totalWeight += weights[key];
      }
    });

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  // Generate real-time feedback
  generateRealTimeFeedback(analysis) {
    const feedback = {
      overall: {
        score: analysis.overallScore,
        status: this.getStatusFromScore(analysis.overallScore),
        message: this.getOverallMessage(analysis.overallScore)
      },
      areas: []
    };

    // Analyze each area
    Object.keys(analysis).forEach(key => {
      if (key !== 'timestamp' && key !== 'overallScore' && analysis[key] && analysis[key].score) {
        const area = analysis[key];
        feedback.areas.push({
          name: key,
          score: area.score,
          status: this.getStatusFromScore(area.score),
          message: this.getAreaMessage(key, area.score),
          recommendations: area.recommendations || []
        });
      }
    });

    return feedback;
  }

  // Get status from score
  getStatusFromScore(score) {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'fair';
    return 'needs_improvement';
  }

  // Get overall message
  getOverallMessage(score) {
    if (score >= 85) return 'Outstanding performance! Keep up the excellent work.';
    if (score >= 70) return 'Great job! You\'re doing well with your presentation.';
    if (score >= 55) return 'Good effort! There are some areas we can improve.';
    return 'Let\'s work together to improve your presentation skills.';
  }

  // Get area message
  getAreaMessage(area, score) {
    const messages = {
      posture: {
        excellent: 'Perfect posture! You look confident and professional.',
        good: 'Good posture! Keep your back straight.',
        fair: 'Your posture is okay, but try to sit up straighter.',
        needs_improvement: 'Focus on maintaining better posture throughout your presentation.'
      },
      faceExpression: {
        excellent: 'Your facial expressions are engaging and natural.',
        good: 'Nice expressions! Keep being expressive.',
        fair: 'Try to show more emotion in your face.',
        needs_improvement: 'Work on being more expressive with your facial expressions.'
      },
      emotion: {
        excellent: 'You\'re showing great emotional engagement!',
        good: 'Good emotional presence! Keep it up.',
        fair: 'Try to show more enthusiasm and engagement.',
        needs_improvement: 'Work on expressing more positive emotions during your presentation.'
      },
      voiceClarity: {
        excellent: 'Your voice is clear and easy to understand.',
        good: 'Good voice clarity! Speak with confidence.',
        fair: 'Try to speak a bit more clearly.',
        needs_improvement: 'Focus on speaking more clearly and at a good pace.'
      },
      confidence: {
        excellent: 'You\'re radiating confidence! Excellent work.',
        good: 'You look confident! Keep believing in yourself.',
        fair: 'Try to show more confidence in your delivery.',
        needs_improvement: 'Work on building your confidence through practice.'
      },
      engagement: {
        excellent: 'You\'re highly engaging! Great connection with your audience.',
        good: 'Good engagement! Keep connecting with your audience.',
        fair: 'Try to be more engaging with your audience.',
        needs_improvement: 'Focus on making better connections with your audience.'
      }
    };

    const status = this.getStatusFromScore(score);
    return messages[area]?.[status] || 'Keep working on this area.';
  }

  // Get recommendations for each area
  getPostureRecommendations(score) {
    if (score >= 80) return ['Maintain your excellent posture!'];
    if (score >= 65) return ['Keep your shoulders back', 'Sit up straight'];
    return ['Sit up straight', 'Keep your shoulders back', 'Align your head with your spine'];
  }

  getExpressionRecommendations(score) {
    if (score >= 80) return ['Keep your natural expressions!'];
    if (score >= 65) return ['Smile more naturally', 'Make eye contact'];
    return ['Practice smiling', 'Work on facial expressions', 'Make more eye contact'];
  }

  getEmotionRecommendations(emotions) {
    const recommendations = [];
    if (emotions.stressed > 30) recommendations.push('Take deep breaths to relax');
    if (emotions.distracted > 20) recommendations.push('Focus on the present moment');
    if (emotions.happy < 40) recommendations.push('Try to show more enthusiasm');
    if (emotions.confident < 50) recommendations.push('Believe in yourself more');
    return recommendations.length > 0 ? recommendations : ['Keep up the great emotional presence!'];
  }

  getVoiceRecommendations(score) {
    if (score >= 80) return ['Your voice is excellent!'];
    if (score >= 65) return ['Speak a bit louder', 'Slow down slightly'];
    return ['Speak more clearly', 'Slow down your pace', 'Project your voice'];
  }

  getConfidenceRecommendations(score) {
    if (score >= 80) return ['You\'re very confident!'];
    if (score >= 65) return ['Believe in yourself more', 'Stand tall'];
    return ['Practice more', 'Visualize success', 'Prepare thoroughly'];
  }

  getEngagementRecommendations(score) {
    if (score >= 80) return ['Excellent engagement!'];
    if (score >= 65) return ['Make more eye contact', 'Use gestures'];
    return ['Connect with your audience', 'Use more body language', 'Tell stories'];
  }

  getEyeContactRecommendations(score) {
    if (score >= 80) return ['Perfect eye contact!'];
    if (score >= 65) return ['Look at the camera more', 'Hold eye contact longer'];
    return ['Practice looking at the camera', 'Hold eye contact for 3-5 seconds'];
  }

  getGestureRecommendations(score) {
    if (score >= 80) return ['Great use of gestures!'];
    if (score >= 65) return ['Use more hand gestures', 'Nod your head'];
    return ['Practice natural gestures', 'Use your hands to emphasize points'];
  }

  // Set callbacks
  onAnalysisUpdate(callback) {
    this.callbacks.onAnalysisUpdate = callback;
  }

  onFeedbackUpdate(callback) {
    this.callbacks.onFeedbackUpdate = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }

  // Get analysis history
  getAnalysisHistory() {
    return this.analysisHistory;
  }

  // Get current analysis
  getCurrentAnalysis() {
    return this.currentFrame;
  }

  // Get analysis trends
  getAnalysisTrends() {
    if (this.analysisHistory.length < 2) return null;

    const recent = this.analysisHistory.slice(-10);
    const trends = {};

    Object.keys(recent[0]).forEach(key => {
      if (key !== 'timestamp' && typeof recent[0][key] === 'object' && recent[0][key].score) {
        const scores = recent.map(item => item[key]?.score || 0);
        const first = scores[0];
        const last = scores[scores.length - 1];
        const change = last - first;
        
        trends[key] = {
          change: Math.round(change),
          trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
          average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        };
      }
    });

    return trends;
  }
}

export default RealTimeAnalyzer;
