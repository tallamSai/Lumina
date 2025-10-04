// Advanced Emotion Analysis Service
// Analyzes emotional state and engagement during presentation

export class EmotionAnalyzer {
  constructor() {
    this.emotionData = [];
    this.engagementLevels = [];
    this.confidenceMetrics = [];
  }

  // Analyze emotions from video frames
  analyzeEmotions(frames) {
    if (!frames || frames.length === 0) return null;

    const emotions = {
      happy: 0,
      neutral: 0,
      focused: 0,
      confident: 0,
      engaged: 0,
      stressed: 0,
      distracted: 0
    };

    let totalConfidence = 0;
    let validFrames = 0;

    frames.forEach(frame => {
      if (frame.emotion && frame.emotion.confidence > 0.3) {
        const emotion = frame.emotion.detected;
        const confidence = frame.emotion.confidence;
        
        totalConfidence += confidence;
        validFrames++;

        // Map detected emotions to our categories
        switch (emotion) {
          case 'happy':
          case 'joy':
          case 'smile':
            emotions.happy += confidence;
            break;
          case 'neutral':
          case 'calm':
            emotions.neutral += confidence;
            break;
          case 'focused':
          case 'concentrated':
            emotions.focused += confidence;
            break;
          case 'confident':
          case 'proud':
            emotions.confident += confidence;
            break;
          case 'engaged':
          case 'interested':
            emotions.engaged += confidence;
            break;
          case 'stressed':
          case 'anxious':
          case 'worried':
            emotions.stressed += confidence;
            break;
          case 'distracted':
          case 'confused':
            emotions.distracted += confidence;
            break;
          default:
            emotions.neutral += confidence;
        }
      }
    });

    if (validFrames === 0) return null;

    // Normalize emotions to percentages
    const totalEmotionScore = Object.values(emotions).reduce((a, b) => a + b, 0);
    const normalizedEmotions = {};

    Object.keys(emotions).forEach(emotion => {
      normalizedEmotions[emotion] = totalEmotionScore > 0 ? 
        Math.round((emotions[emotion] / totalEmotionScore) * 100) : 0;
    });

    const averageConfidence = totalConfidence / validFrames;

    return {
      emotions: normalizedEmotions,
      averageConfidence: Math.round(averageConfidence * 100),
      validFrames,
      totalFrames: frames.length,
      engagementScore: this.calculateEngagementScore(normalizedEmotions),
      confidenceScore: this.calculateConfidenceScore(normalizedEmotions, averageConfidence)
    };
  }

  // Calculate engagement score based on emotions
  calculateEngagementScore(emotions) {
    const positiveEmotions = emotions.happy + emotions.focused + emotions.engaged + emotions.confident;
    const negativeEmotions = emotions.stressed + emotions.distracted;
    
    const engagement = Math.max(0, positiveEmotions - negativeEmotions);
    return Math.min(100, engagement);
  }

  // Calculate confidence score
  calculateConfidenceScore(emotions, averageConfidence) {
    const confidenceEmotions = emotions.confident + emotions.focused;
    const stressEmotions = emotions.stressed + emotions.distracted;
    
    const confidence = Math.max(0, confidenceEmotions - stressEmotions + (averageConfidence * 0.5));
    return Math.min(100, confidence);
  }

  // Analyze emotional trends over time
  analyzeEmotionalTrends(emotionData) {
    if (!emotionData || emotionData.length < 2) return null;

    const trends = {
      engagement: [],
      confidence: [],
      stress: [],
      positivity: []
    };

    emotionData.forEach((data, index) => {
      const timestamp = index * 1000; // Assuming 1 second intervals
      
      trends.engagement.push({
        timestamp,
        value: data.engagementScore
      });
      
      trends.confidence.push({
        timestamp,
        value: data.confidenceScore
      });
      
      trends.stress.push({
        timestamp,
        value: data.emotions.stressed
      });
      
      trends.positivity.push({
        timestamp,
        value: data.emotions.happy + data.emotions.confident
      });
    });

    return {
      trends,
      summary: this.generateEmotionalSummary(emotionData),
      recommendations: this.generateEmotionalRecommendations(emotionData)
    };
  }

  // Generate emotional summary
  generateEmotionalSummary(emotionData) {
    const avgEngagement = emotionData.reduce((a, b) => a + b.engagementScore, 0) / emotionData.length;
    const avgConfidence = emotionData.reduce((a, b) => a + b.confidenceScore, 0) / emotionData.length;
    const avgStress = emotionData.reduce((a, b) => a + b.emotions.stressed, 0) / emotionData.length;
    const avgPositivity = emotionData.reduce((a, b) => a + b.emotions.happy + b.emotions.confident, 0) / emotionData.length;

    let emotionalState = 'neutral';
    if (avgEngagement > 70 && avgConfidence > 70) {
      emotionalState = 'excellent';
    } else if (avgEngagement > 50 && avgConfidence > 50) {
      emotionalState = 'good';
    } else if (avgStress > 40 || avgEngagement < 30) {
      emotionalState = 'needs_improvement';
    }

    return {
      emotionalState,
      engagement: Math.round(avgEngagement),
      confidence: Math.round(avgConfidence),
      stress: Math.round(avgStress),
      positivity: Math.round(avgPositivity),
      overall: Math.round((avgEngagement + avgConfidence + avgPositivity - avgStress) / 4)
    };
  }

  // Generate emotional recommendations
  generateEmotionalRecommendations(emotionData) {
    const summary = this.generateEmotionalSummary(emotionData);
    const recommendations = [];

    if (summary.stress > 50) {
      recommendations.push({
        type: 'stress_management',
        priority: 'high',
        message: 'High stress levels detected during presentation',
        suggestions: [
          'Practice deep breathing exercises before presenting',
          'Use relaxation techniques like meditation',
          'Prepare thoroughly to reduce anxiety',
          'Practice in a comfortable environment first'
        ]
      });
    }

    if (summary.engagement < 40) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        message: 'Low engagement detected - work on connecting with your audience',
        suggestions: [
          'Practice making eye contact with the camera',
          'Use more expressive facial expressions',
          'Vary your tone and pace to maintain interest',
          'Practice storytelling techniques'
        ]
      });
    }

    if (summary.confidence < 50) {
      recommendations.push({
        type: 'confidence',
        priority: 'high',
        message: 'Confidence levels need improvement',
        suggestions: [
          'Practice power poses before recording',
          'Record practice sessions to build confidence',
          'Focus on your strengths and past successes',
          'Prepare talking points thoroughly'
        ]
      });
    }

    if (summary.positivity < 30) {
      recommendations.push({
        type: 'positivity',
        priority: 'medium',
        message: 'Work on maintaining a positive demeanor',
        suggestions: [
          'Practice smiling naturally during presentations',
          'Focus on the value you\'re providing to your audience',
          'Use positive self-talk before presenting',
          'Practice gratitude exercises'
        ]
      });
    }

    return recommendations;
  }

  // Get real-time emotional feedback
  getRealTimeFeedback(currentEmotion) {
    if (!currentEmotion) return null;

    const feedback = {
      engagement: {
        score: currentEmotion.engagementScore,
        status: currentEmotion.engagementScore > 70 ? 'Excellent' : 
                currentEmotion.engagementScore > 50 ? 'Good' : 'Needs work',
        message: currentEmotion.engagementScore > 70 ? 'Great engagement!' :
                currentEmotion.engagementScore > 50 ? 'Good engagement, keep it up!' :
                'Try to be more expressive and engaging'
      },
      confidence: {
        score: currentEmotion.confidenceScore,
        status: currentEmotion.confidenceScore > 70 ? 'Very confident' :
                currentEmotion.confidenceScore > 50 ? 'Confident' : 'Build confidence',
        message: currentEmotion.confidenceScore > 70 ? 'Excellent confidence!' :
                currentEmotion.confidenceScore > 50 ? 'Good confidence level' :
                'Work on building your confidence'
      },
      stress: {
        score: currentEmotion.emotions.stressed,
        status: currentEmotion.emotions.stressed > 40 ? 'High stress' :
                currentEmotion.emotions.stressed > 20 ? 'Moderate stress' : 'Low stress',
        message: currentEmotion.emotions.stressed > 40 ? 'Take a deep breath and relax' :
                currentEmotion.emotions.stressed > 20 ? 'Try to stay calm' :
                'Great job staying relaxed!'
      }
    };

    return feedback;
  }

  // Analyze emotional consistency
  analyzeConsistency(emotionData) {
    if (!emotionData || emotionData.length < 3) return null;

    const engagementScores = emotionData.map(d => d.engagementScore);
    const confidenceScores = emotionData.map(d => d.confidenceScore);

    const engagementVariance = this.calculateVariance(engagementScores);
    const confidenceVariance = this.calculateVariance(confidenceScores);

    return {
      engagementConsistency: engagementVariance < 15 ? 'consistent' : 
                           engagementVariance < 25 ? 'moderate' : 'inconsistent',
      confidenceConsistency: confidenceVariance < 15 ? 'consistent' :
                            confidenceVariance < 25 ? 'moderate' : 'inconsistent',
      overallConsistency: (engagementVariance + confidenceVariance) / 2 < 20 ? 'consistent' :
                         (engagementVariance + confidenceVariance) / 2 < 30 ? 'moderate' : 'inconsistent'
    };
  }

  // Calculate variance
  calculateVariance(scores) {
    if (scores.length < 2) return 0;
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }
}

export default EmotionAnalyzer;
