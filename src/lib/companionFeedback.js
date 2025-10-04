// AI Companion Feedback System
// Provides intelligent, personalized feedback for presentation skills improvement

export class CompanionFeedback {
  constructor() {
    this.feedbackHistory = [];
    this.userProfile = {};
    this.learningGoals = [];
    this.personality = 'encouraging'; // encouraging, direct, supportive, analytical
    this.feedbackStyle = 'constructive'; // constructive, positive, detailed, brief
  }

  // Set user profile for personalized feedback
  setUserProfile(profile) {
    this.userProfile = {
      name: profile.name || 'User',
      experience: profile.experience || 'beginner', // beginner, intermediate, advanced
      goals: profile.goals || ['improve_confidence', 'better_engagement'],
      preferences: profile.preferences || {},
      ...profile
    };
  }

  // Set learning goals
  setLearningGoals(goals) {
    this.learningGoals = goals;
  }

  // Set companion personality
  setPersonality(personality) {
    this.personality = personality;
  }

  // Set feedback style
  setFeedbackStyle(style) {
    this.feedbackStyle = style;
  }

  // Generate real-time feedback
  generateRealTimeFeedback(analysis) {
    const feedback = {
      timestamp: Date.now(),
      type: 'real_time',
      priority: this.determinePriority(analysis),
      message: this.generateMessage(analysis),
      suggestions: this.generateSuggestions(analysis),
      encouragement: this.generateEncouragement(analysis),
      areas: this.analyzeAreas(analysis),
      tone: this.determineTone(analysis)
    };

    this.feedbackHistory.push(feedback);
    return feedback;
  }

  // Generate comprehensive feedback
  generateComprehensiveFeedback(analysisHistory) {
    const summary = this.analyzePerformanceSummary(analysisHistory);
    const trends = this.analyzeTrends(analysisHistory);
    const strengths = this.identifyStrengths(analysisHistory);
    const improvements = this.identifyImprovements(analysisHistory);

    const feedback = {
      timestamp: Date.now(),
      type: 'comprehensive',
      summary,
      trends,
      strengths,
      improvements,
      recommendations: this.generateRecommendations(summary, trends, strengths, improvements),
      nextSteps: this.generateNextSteps(improvements),
      encouragement: this.generateOverallEncouragement(summary)
    };

    this.feedbackHistory.push(feedback);
    return feedback;
  }

  // Determine feedback priority
  determinePriority(analysis) {
    const criticalAreas = ['confidence', 'engagement', 'voiceClarity'];
    const scores = [];

    criticalAreas.forEach(area => {
      if (analysis[area] && analysis[area].score) {
        scores.push(analysis[area].score);
      }
    });

    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    if (averageScore < 40) return 'high';
    if (averageScore < 60) return 'medium';
    return 'low';
  }

  // Generate personalized message
  generateMessage(analysis) {
    const overallScore = analysis.overallScore || 0;
    const userName = this.userProfile.name || 'there';

    const messages = {
      excellent: [
        `Wow, ${userName}! You're absolutely crushing it! Your presentation skills are outstanding.`,
        `Incredible work, ${userName}! You're a natural at this. Keep up the amazing performance!`,
        `${userName}, you're doing phenomenally well! Your confidence and engagement are top-notch.`
      ],
      good: [
        `Great job, ${userName}! You're doing really well with your presentation.`,
        `Nice work, ${userName}! I can see you're improving with each session.`,
        `You're doing well, ${userName}! Keep up the good work and you'll keep getting better.`
      ],
      fair: [
        `You're making progress, ${userName}! Let's work on a few areas together.`,
        `Good effort, ${userName}! I can see potential for improvement in some areas.`,
        `You're on the right track, ${userName}! Let me help you polish a few things.`
      ],
      needs_improvement: [
        `Don't worry, ${userName}! Every expert was once a beginner. Let's work on this together.`,
        `I believe in you, ${userName}! With practice, you'll see amazing improvements.`,
        `Let's take this step by step, ${userName}. I'm here to help you succeed.`
      ]
    };

    const status = this.getPerformanceStatus(overallScore);
    const messageArray = messages[status] || messages.needs_improvement;
    
    return messageArray[Math.floor(Math.random() * messageArray.length)];
  }

  // Generate specific suggestions
  generateSuggestions(analysis) {
    const suggestions = [];
    const areas = this.analyzeAreas(analysis);

    areas.forEach(area => {
      if (area.status === 'needs_improvement' || area.status === 'fair') {
        suggestions.push(...this.getAreaSuggestions(area.name, area.score));
      }
    });

    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }

  // Generate encouragement
  generateEncouragement(analysis) {
    const encouragements = [
      "You've got this! Every practice session makes you better.",
      "I can see your potential! Keep pushing forward.",
      "Remember, even the best speakers started somewhere. You're doing great!",
      "Your dedication to improvement is inspiring!",
      "I believe in your ability to master these skills!",
      "You're making progress every time we practice together!",
      "Your commitment to learning is commendable!",
      "I'm proud of your effort and determination!"
    ];

    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }

  // Analyze specific areas
  analyzeAreas(analysis) {
    const areas = [];
    
    Object.keys(analysis).forEach(key => {
      if (key !== 'timestamp' && key !== 'overallScore' && analysis[key] && analysis[key].score) {
        areas.push({
          name: key,
          score: analysis[key].score,
          status: this.getPerformanceStatus(analysis[key].score),
          message: this.getAreaMessage(key, analysis[key].score)
        });
      }
    });

    return areas;
  }

  // Determine tone based on performance
  determineTone(analysis) {
    const overallScore = analysis.overallScore || 0;
    
    if (overallScore >= 80) return 'celebratory';
    if (overallScore >= 60) return 'encouraging';
    if (overallScore >= 40) return 'supportive';
    return 'gentle';
  }

  // Get performance status
  getPerformanceStatus(score) {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'fair';
    return 'needs_improvement';
  }

  // Get area-specific suggestions
  getAreaSuggestions(areaName, score) {
    const suggestions = {
      posture: [
        "Try sitting up straight with your shoulders back",
        "Keep your head aligned with your spine",
        "Practice the 'power pose' before presenting"
      ],
      faceExpression: [
        "Smile naturally to appear more approachable",
        "Make eye contact with the camera",
        "Use facial expressions to emphasize key points"
      ],
      emotion: [
        "Show enthusiasm for your topic",
        "Take deep breaths to stay calm and focused",
        "Remember why your message matters to your audience"
      ],
      voiceClarity: [
        "Speak clearly and at a moderate pace",
        "Project your voice with confidence",
        "Practice tongue twisters to improve articulation"
      ],
      confidence: [
        "Believe in your knowledge and preparation",
        "Stand tall and maintain good posture",
        "Remember your past successes"
      ],
      engagement: [
        "Connect with your audience through eye contact",
        "Use gestures to emphasize important points",
        "Tell stories to make your content more engaging"
      ]
    };

    return suggestions[areaName] || ["Keep working on this area - you're making progress!"];
  }

  // Get area message
  getAreaMessage(areaName, score) {
    const messages = {
      posture: {
        excellent: "Your posture is perfect! You look confident and professional.",
        good: "Great posture! Keep maintaining that confident stance.",
        fair: "Your posture is good, but try to sit up a bit straighter.",
        needs_improvement: "Let's work on improving your posture for better confidence."
      },
      faceExpression: {
        excellent: "Your facial expressions are engaging and natural!",
        good: "Nice expressions! Keep being expressive with your face.",
        fair: "Try to show more emotion in your facial expressions.",
        needs_improvement: "Work on being more expressive with your face."
      },
      emotion: {
        excellent: "You're showing excellent emotional engagement!",
        good: "Great emotional presence! Keep it up.",
        fair: "Try to show more enthusiasm and engagement.",
        needs_improvement: "Work on expressing more positive emotions."
      },
      voiceClarity: {
        excellent: "Your voice is clear and easy to understand!",
        good: "Good voice clarity! Keep speaking with confidence.",
        fair: "Try to speak a bit more clearly.",
        needs_improvement: "Focus on speaking more clearly and at a good pace."
      },
      confidence: {
        excellent: "You're radiating confidence! Excellent work!",
        good: "You look confident! Keep believing in yourself.",
        fair: "Try to show more confidence in your delivery.",
        needs_improvement: "Work on building your confidence through practice."
      },
      engagement: {
        excellent: "You're highly engaging! Great connection with your audience!",
        good: "Good engagement! Keep connecting with your audience.",
        fair: "Try to be more engaging with your audience.",
        needs_improvement: "Focus on making better connections with your audience."
      }
    };

    const status = this.getPerformanceStatus(score);
    return messages[areaName]?.[status] || "Keep working on this area - you're making progress!";
  }

  // Analyze performance summary
  analyzePerformanceSummary(analysisHistory) {
    if (analysisHistory.length === 0) return null;

    const scores = analysisHistory.map(a => a.overallScore || 0);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    return {
      averageScore: Math.round(averageScore),
      highestScore: Math.round(highestScore),
      lowestScore: Math.round(lowestScore),
      totalSessions: analysisHistory.length,
      performanceLevel: this.getPerformanceStatus(averageScore),
      improvement: highestScore - lowestScore
    };
  }

  // Analyze trends
  analyzeTrends(analysisHistory) {
    if (analysisHistory.length < 3) return null;

    const recent = analysisHistory.slice(-5);
    const older = analysisHistory.slice(-10, -5);
    
    const recentAvg = recent.reduce((a, b) => a + (b.overallScore || 0), 0) / recent.length;
    const olderAvg = older.length > 0 ? 
      older.reduce((a, b) => a + (b.overallScore || 0), 0) / older.length : recentAvg;

    const trend = recentAvg - olderAvg;
    
    return {
      direction: trend > 5 ? 'improving' : trend < -5 ? 'declining' : 'stable',
      change: Math.round(trend),
      recentAverage: Math.round(recentAvg),
      olderAverage: Math.round(olderAvg)
    };
  }

  // Identify strengths
  identifyStrengths(analysisHistory) {
    const strengths = [];
    const areaScores = {};

    // Calculate average scores for each area
    analysisHistory.forEach(analysis => {
      Object.keys(analysis).forEach(key => {
        if (key !== 'timestamp' && key !== 'overallScore' && analysis[key] && analysis[key].score) {
          if (!areaScores[key]) areaScores[key] = [];
          areaScores[key].push(analysis[key].score);
        }
      });
    });

    // Find areas with consistently high scores
    Object.keys(areaScores).forEach(area => {
      const scores = areaScores[area];
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      if (average >= 75) {
        strengths.push({
          area,
          averageScore: Math.round(average),
          consistency: this.calculateConsistency(scores),
          message: this.getStrengthMessage(area, average)
        });
      }
    });

    return strengths;
  }

  // Identify improvements
  identifyImprovements(analysisHistory) {
    const improvements = [];
    const areaScores = {};

    // Calculate average scores for each area
    analysisHistory.forEach(analysis => {
      Object.keys(analysis).forEach(key => {
        if (key !== 'timestamp' && key !== 'overallScore' && analysis[key] && analysis[key].score) {
          if (!areaScores[key]) areaScores[key] = [];
          areaScores[key].push(analysis[key].score);
        }
      });
    });

    // Find areas that need improvement
    Object.keys(areaScores).forEach(area => {
      const scores = areaScores[area];
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      if (average < 70) {
        improvements.push({
          area,
          averageScore: Math.round(average),
          priority: average < 50 ? 'high' : average < 60 ? 'medium' : 'low',
          message: this.getImprovementMessage(area, average),
          suggestions: this.getAreaSuggestions(area, average)
        });
      }
    });

    return improvements.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Calculate consistency
  calculateConsistency(scores) {
    if (scores.length < 2) return 'unknown';
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    if (standardDeviation < 10) return 'very_consistent';
    if (standardDeviation < 20) return 'consistent';
    if (standardDeviation < 30) return 'moderately_consistent';
    return 'inconsistent';
  }

  // Get strength message
  getStrengthMessage(area, score) {
    const messages = {
      posture: "Your posture is consistently excellent! This gives you a professional, confident appearance.",
      faceExpression: "Your facial expressions are engaging and natural! You connect well with your audience.",
      emotion: "You show great emotional engagement! Your enthusiasm comes through clearly.",
      voiceClarity: "Your voice is clear and easy to understand! Great articulation skills.",
      confidence: "You radiate confidence! This makes your presentations very compelling.",
      engagement: "You're highly engaging! Your audience connection skills are excellent."
    };

    return messages[area] || `Your ${area} skills are consistently strong!`;
  }

  // Get improvement message
  getImprovementMessage(area, score) {
    const messages = {
      posture: "Focus on maintaining better posture throughout your presentations.",
      faceExpression: "Work on being more expressive with your facial expressions.",
      emotion: "Show more enthusiasm and emotional engagement in your presentations.",
      voiceClarity: "Practice speaking more clearly and at a comfortable pace.",
      confidence: "Build your confidence through practice and preparation.",
      engagement: "Work on connecting better with your audience through eye contact and gestures."
    };

    return messages[area] || `Focus on improving your ${area} skills.`;
  }

  // Generate recommendations
  generateRecommendations(summary, trends, strengths, improvements) {
    const recommendations = [];

    // Trend-based recommendations
    if (trends && trends.direction === 'improving') {
      recommendations.push({
        type: 'positive',
        message: 'Great progress! Keep up the current practice routine.',
        priority: 'low'
      });
    } else if (trends && trends.direction === 'declining') {
      recommendations.push({
        type: 'urgent',
        message: 'Let\'s review your practice routine and make some adjustments.',
        priority: 'high'
      });
    }

    // Improvement-based recommendations
    improvements.forEach(improvement => {
      recommendations.push({
        type: 'improvement',
        area: improvement.area,
        message: improvement.message,
        suggestions: improvement.suggestions,
        priority: improvement.priority
      });
    });

    // Strength-based recommendations
    if (strengths.length > 0) {
      recommendations.push({
        type: 'strength',
        message: `Leverage your strong ${strengths[0].area} skills in other areas.`,
        priority: 'low'
      });
    }

    return recommendations;
  }

  // Generate next steps
  generateNextSteps(improvements) {
    const nextSteps = [];

    improvements.slice(0, 3).forEach(improvement => {
      nextSteps.push({
        area: improvement.area,
        action: `Focus on ${improvement.area} improvement`,
        timeline: improvement.priority === 'high' ? 'This week' : 'Next week',
        priority: improvement.priority
      });
    });

    return nextSteps;
  }

  // Generate overall encouragement
  generateOverallEncouragement(summary) {
    if (!summary) return "Keep up the great work!";

    const encouragements = {
      excellent: "Outstanding performance! You're a natural presenter!",
      good: "Great job! You're well on your way to becoming an excellent presenter!",
      fair: "Good progress! With continued practice, you'll see amazing improvements!",
      needs_improvement: "Every expert was once a beginner. Keep practicing and you'll get there!"
    };

    return encouragements[summary.performanceLevel] || "Keep up the great work!";
  }

  // Get feedback history
  getFeedbackHistory() {
    return this.feedbackHistory;
  }

  // Clear feedback history
  clearFeedbackHistory() {
    this.feedbackHistory = [];
  }
}

export default CompanionFeedback;
