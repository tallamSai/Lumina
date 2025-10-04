// Comprehensive Metrics Aggregation System
// Combines audio, video, and NLP analysis for holistic presentation feedback

export class MetricsAggregator {
  constructor() {
    this.weights = {
      audio: 0.3,
      video: 0.3,
      nlp: 0.2,
      engagement: 0.2
    };
  }

  // Aggregate all analysis results with content validation
  aggregateAnalysis(audioAnalysis, videoAnalysis, nlpAnalysis) {
    // Check for content validation
    const audioValid = audioAnalysis?.contentValidation?.hasValidContent !== false;
    const videoValid = videoAnalysis?.contentValidation?.hasValidContent !== false;
    
    // If content is insufficient, return zero scores
    if (!audioValid && !videoValid) {
      console.warn('Insufficient content for meaningful analysis');
      return {
        timestamp: Date.now(),
        overall: 0,
        categories: {
          voice: { clarity: 0, volume: 0, pace: 0, pitch: 0 },
          bodyLanguage: { posture: 0, gestures: 0, eyeContact: 0, presence: 0 },
          content: { clarity: 0, structure: 0, flow: 0, impact: 0 },
          engagement: { energy: 0, connection: 0, delivery: 0, overall: 0 }
        },
        insights: ['Insufficient content detected for meaningful analysis'],
        recommendations: ['Please ensure your video contains clear speech and visible person'],
        contentIssues: {
          audio: audioAnalysis?.contentValidation?.issues || [],
          video: videoAnalysis?.contentValidation?.issues || []
        }
      };
    }

    // Only proceed if we have real data - no fallbacks
    if (!audioAnalysis || !videoAnalysis || !nlpAnalysis) {
      console.warn('Incomplete analysis data - cannot generate aggregated metrics');
      return {
        timestamp: Date.now(),
        overall: 0,
        categories: {
          voice: { clarity: 0, volume: 0, pace: 0, pitch: 0 },
          bodyLanguage: { posture: 0, gestures: 0, eyeContact: 0, presence: 0 },
          content: { clarity: 0, structure: 0, flow: 0, impact: 0 },
          engagement: { energy: 0, connection: 0, delivery: 0, overall: 0 }
        },
        insights: ['Incomplete analysis data - cannot generate meaningful metrics'],
        recommendations: ['Please ensure your video contains clear speech and visible person'],
        contentIssues: {
          audio: ['Audio analysis failed'],
          video: ['Video analysis failed']
        }
      };
    }

    try {
    const aggregated = {
      timestamp: Date.now(),
      overall: this.calculateOverallScore(audioAnalysis, videoAnalysis, nlpAnalysis),
      categories: {
        voice: this.aggregateVoiceMetrics(audioAnalysis),
        bodyLanguage: this.aggregateBodyLanguageMetrics(videoAnalysis),
        content: this.aggregateContentMetrics(nlpAnalysis),
        engagement: this.aggregateEngagementMetrics(audioAnalysis, videoAnalysis)
      },
      insights: this.generateInsights(audioAnalysis, videoAnalysis, nlpAnalysis),
      recommendations: this.generateRecommendations(audioAnalysis, videoAnalysis, nlpAnalysis)
    };

    return aggregated;
    } catch (error) {
      console.error('Error in metrics aggregation:', error);
      return {
        timestamp: Date.now(),
        overall: 0,
        categories: {
          voice: { clarity: 0, volume: 0, pace: 0, pitch: 0 },
          bodyLanguage: { posture: 0, gestures: 0, eyeContact: 0, presence: 0 },
          content: { clarity: 0, structure: 0, flow: 0, impact: 0 },
          engagement: { energy: 0, connection: 0, delivery: 0, overall: 0 }
        },
        insights: ['Error in analysis - insufficient data for meaningful metrics'],
        recommendations: ['Please ensure your video contains clear speech and visible person'],
        contentIssues: {
          audio: ['Audio analysis error'],
          video: ['Video analysis error']
        }
      };
    }
  }

  // Calculate overall presentation score - PURELY DYNAMIC (0-100)
  calculateOverallScore(audio, video, nlp) {
    const voiceScore = this.calculateVoiceScore(audio);
    const bodyScore = this.calculateBodyScore(video);
    const contentScore = this.calculateContentScore(nlp);
    const engagementScore = this.calculateEngagementScore(audio, video);

    // Dynamic weighting based on available data quality
    const weights = this.calculateDynamicWeights(audio, video, nlp);
    
    const overallScore = Math.round(
      (voiceScore * weights.audio) +
      (bodyScore * weights.video) +
      (contentScore * weights.nlp) +
      (engagementScore * weights.engagement)
    );

    // Pure dynamic scoring range (0-100)
    return Math.max(0, Math.min(100, overallScore));
  }

  // Calculate dynamic weights based on data quality
  calculateDynamicWeights(audio, video, nlp) {
    let totalWeight = 0;
    const weights = { audio: 0, video: 0, nlp: 0, engagement: 0 };

    // Audio quality assessment
    if (audio?.audio?.quality?.clarity > 50) {
      weights.audio = 0.35;
      totalWeight += 0.35;
    } else if (audio?.audio?.quality?.clarity > 30) {
      weights.audio = 0.25;
      totalWeight += 0.25;
    }

    // Video quality assessment
    if (video?.aggregated?.bodyLanguage?.overall > 50) {
      weights.video = 0.35;
      totalWeight += 0.35;
    } else if (video?.aggregated?.bodyLanguage?.overall > 30) {
      weights.video = 0.25;
      totalWeight += 0.25;
    }

    // NLP quality assessment
    if (nlp?.clarity?.score > 50) {
      weights.nlp = 0.2;
      totalWeight += 0.2;
    } else if (nlp?.clarity?.score > 30) {
      weights.nlp = 0.15;
      totalWeight += 0.15;
    }

    // Engagement quality assessment
    if (audio?.audio?.quality?.consistency > 50 && video?.aggregated?.engagement?.overall > 50) {
      weights.engagement = 0.2;
      totalWeight += 0.2;
    } else if (audio?.audio?.quality?.consistency > 30 || video?.aggregated?.engagement?.overall > 30) {
      weights.engagement = 0.15;
      totalWeight += 0.15;
    }

    // Normalize weights if total is less than 1
    if (totalWeight < 1) {
      const remaining = 1 - totalWeight;
      weights.audio += remaining * 0.4;
      weights.video += remaining * 0.3;
      weights.nlp += remaining * 0.2;
      weights.engagement += remaining * 0.1;
    }

    return weights;
  }

  // Calculate voice score from audio analysis - PURELY DYNAMIC
  calculateVoiceScore(audio) {
    if (!audio || !audio.audio) return 0; // No fallback - return 0 if no data
    
    // Check if content validation failed
    if (audio.contentValidation && !audio.contentValidation.hasValidContent) {
      return 0; // Return 0 for insufficient content
    }

    const { volume, pitch, quality, speech } = audio.audio;
    const { clarity, fillerWords, structure } = audio.nlp || {};
    const transcript = audio.transcript || {};
    const pauses = transcript.pauses || {};
    const realTimeMetrics = audio.realTimeMetrics || {};

    // Pure dynamic scoring based on actual metrics (0-100 range)
    let volumeScore = 0;
    if (volume?.consistency > 0) volumeScore += Math.min(25, volume.consistency * 0.25);
    if (volume?.average > 0) volumeScore += Math.min(20, volume.average * 200);
    if (volume?.stability > 0) volumeScore += Math.min(20, volume.stability * 0.2);
    
    let pitchScore = 0;
    if (pitch?.stability > 0) pitchScore += Math.min(30, pitch.stability * 0.3);
    if (pitch?.average > 100 && pitch.average < 300) pitchScore += 20; // Good pitch range
    if (pitch?.variance > 0) pitchScore += Math.max(0, 15 - pitch.variance * 0.3); // Lower variance is better
    
    let clarityScore = 0;
    if (quality?.clarity > 0) clarityScore += Math.min(25, quality.clarity * 0.25);
    if (clarity?.score > 0) clarityScore += Math.min(20, clarity.score * 0.2);
    if (fillerWords?.percentage > 0) clarityScore += Math.max(0, 15 - fillerWords.percentage * 3); // Lower filler % is better
    if (pauses && typeof pauses.frequency === 'number' && pauses.frequency > 0) clarityScore += Math.max(0, 10 - pauses.frequency * 1); // Lower pause frequency is better
    
    let speechScore = 0;
    if (speech?.rate > 0) {
      if (speech.rate >= 120 && speech.rate <= 180) speechScore += 20; // Optimal range
      else if (speech.rate < 120) speechScore += Math.max(0, 20 - (120 - speech.rate) * 0.5); // Too slow penalty
      else speechScore += Math.max(0, 20 - (speech.rate - 180) * 0.3); // Too fast penalty
    }
    if (speech?.rhythm > 0) speechScore += Math.min(15, speech.rhythm * 0.15);
    if (speech?.segments > 0) speechScore += Math.min(10, speech.segments * 2); // More segments = better

    // Real-time metrics bonus
    if (realTimeMetrics.volumeConsistency > 0) volumeScore += Math.min(10, realTimeMetrics.volumeConsistency * 0.1);
    if (realTimeMetrics.pitchStability > 0) pitchScore += Math.min(10, realTimeMetrics.pitchStability * 0.1);
    if (realTimeMetrics.clarity > 0) clarityScore += Math.min(10, realTimeMetrics.clarity * 0.1);

    const baseScore = (volumeScore + pitchScore + clarityScore + speechScore) / 4;
    
    // Return pure calculated score without random variation for accuracy
    return Math.round(Math.min(100, Math.max(0, baseScore)));
  }

  // Calculate body language score from video analysis - PURELY DYNAMIC
  calculateBodyScore(video) {
    if (!video || !video.aggregated) return 0; // No fallback - return 0 if no data
    
    // Check if content validation failed
    if (video.contentValidation && !video.contentValidation.hasValidContent) {
      return 0; // Return 0 for insufficient content
    }

    const { bodyLanguage, engagement } = video.aggregated;
    const realTimeMetrics = video.realTimeMetrics || {};
    
    // Pure dynamic scoring based on actual pose detection data (0-100 range)
    let postureScore = 0;
    if (bodyLanguage?.posture > 0) postureScore += Math.min(40, bodyLanguage.posture * 0.4);
    
    let gestureScore = 0;
    if (bodyLanguage?.gestures > 0) gestureScore += Math.min(40, bodyLanguage.gestures * 0.4);
    
    let presenceScore = 0;
    if (engagement?.overall > 0) presenceScore += Math.min(40, engagement.overall * 0.4);
    
    let eyeContactScore = 0;
    if (engagement?.eyeContact > 0) eyeContactScore += Math.min(40, engagement.eyeContact * 0.4);

    // Real-time metrics bonus
    if (realTimeMetrics.posture && realTimeMetrics.posture.length > 0) {
      const avgPosture = realTimeMetrics.posture.reduce((a, b) => a + b, 0) / realTimeMetrics.posture.length;
      if (avgPosture > 0) postureScore += Math.min(20, avgPosture * 0.2);
    }
    
    if (realTimeMetrics.gestures && realTimeMetrics.gestures.length > 0) {
      const avgGestures = realTimeMetrics.gestures.reduce((a, b) => a + b, 0) / realTimeMetrics.gestures.length;
      if (avgGestures > 0) gestureScore += Math.min(20, avgGestures * 0.2);
    }

    const baseScore = (postureScore + gestureScore + presenceScore + eyeContactScore) / 4;
    
    // Return pure calculated score without random variation for accuracy
    return Math.round(Math.min(100, Math.max(0, baseScore)));
  }

  // Calculate content score from NLP analysis - PURELY DYNAMIC
  calculateContentScore(nlp) {
    if (!nlp) return 0; // No fallback - return 0 if no data

    const { clarity, structure, repetition } = nlp;
    
    let clarityScore = 0;
    if (clarity?.score > 0) clarityScore += Math.min(40, clarity.score * 0.4);
    
    let structureScore = 0;
    if (structure?.avgSentenceLength > 0) {
      // Optimal sentence length is 15-20 words
      if (structure.avgSentenceLength >= 15 && structure.avgSentenceLength <= 20) {
        structureScore += 40;
      } else if (structure.avgSentenceLength < 15) {
        structureScore += Math.max(0, 40 - (15 - structure.avgSentenceLength) * 2); // Too short penalty
      } else {
        structureScore += Math.max(0, 40 - (structure.avgSentenceLength - 20) * 1.5); // Too long penalty
      }
    }
    
    let repetitionScore = 0;
    if (repetition?.repetitionScore > 0) repetitionScore += Math.min(40, repetition.repetitionScore * 0.4);
    
    const baseScore = (clarityScore + structureScore + repetitionScore) / 3;
    
    // Return pure calculated score without random variation for accuracy
    return Math.round(Math.min(100, Math.max(0, baseScore)));
  }

  // Calculate engagement score - PURELY DYNAMIC
  calculateEngagementScore(audio, video) {
    let audioEngagement = 0;
    if (audio?.audio?.quality?.consistency > 0) {
      audioEngagement = Math.min(50, audio.audio.quality.consistency * 0.5);
    }
    
    let videoEngagement = 0;
    if (video?.aggregated?.engagement?.overall > 0) {
      videoEngagement = Math.min(50, video.aggregated.engagement.overall * 0.5);
    }
    
    const baseScore = audioEngagement + videoEngagement;
    
    // Return pure calculated score without random variation for accuracy
    return Math.round(Math.min(100, Math.max(0, baseScore)));
  }

  // Aggregate voice metrics - PURELY DYNAMIC
  aggregateVoiceMetrics(audio) {
    if (!audio || !audio.audio) {
      return { clarity: 0, volume: 0, pace: 0, pitch: 0 }; // No fallback data
    }

    const { volume, pitch, quality, speech } = audio.audio;
    const { structure } = audio.nlp || {};

    return {
      clarity: Math.round(quality?.clarity || 0),
      volume: Math.round(volume?.consistency || 0),
      pace: speech?.rate ? Math.round(Math.min(100, Math.max(0, 100 - Math.abs(speech.rate - 150) / 2))) : 0,
      pitch: Math.round(pitch?.stability || 0)
    };
  }

  // Aggregate body language metrics - PURELY DYNAMIC
  aggregateBodyLanguageMetrics(video) {
    if (!video || !video.aggregated) {
      return { posture: 0, gestures: 0, eyeContact: 0, presence: 0 }; // No fallback data
    }

    const { bodyLanguage, engagement } = video.aggregated;

    return {
      posture: Math.round(bodyLanguage?.posture || 0),
      gestures: Math.round(bodyLanguage?.gestures || 0),
      eyeContact: Math.round(engagement?.eyeContact || 0),
      presence: Math.round(engagement?.overall || 0)
    };
  }

  // Aggregate content metrics - PURELY DYNAMIC
  aggregateContentMetrics(nlp) {
    if (!nlp) {
      return { clarity: 0, structure: 0, flow: 0, impact: 0 }; // No fallback data
    }

    const { clarity, structure, repetition } = nlp;

    return {
      clarity: Math.round(clarity?.score || 0),
      structure: structure?.avgSentenceLength ? Math.round(Math.min(100, Math.max(0, 100 - (structure.avgSentenceLength - 15) * 2))) : 0,
      flow: repetition?.repeatedWords ? Math.round(Math.min(100, Math.max(0, 100 - repetition.repeatedWords.length * 10))) : 0,
      impact: clarity?.score && structure?.avgSentenceLength ? Math.round((clarity.score + structure.avgSentenceLength * 2) / 2) : 0
    };
  }

  // Aggregate engagement metrics - PURELY DYNAMIC
  aggregateEngagementMetrics(audio, video) {
    const audioEngagement = audio?.audio?.quality?.consistency || 0;
    const videoEngagement = video?.aggregated?.engagement?.overall || 0;
    const nlpEngagement = audio?.nlp?.clarity?.score || 0;

    return {
      energy: Math.round((audioEngagement + videoEngagement) / 2),
      connection: Math.round(videoEngagement),
      delivery: Math.round((audioEngagement + nlpEngagement) / 2),
      overall: Math.round((audioEngagement + videoEngagement + nlpEngagement) / 3)
    };
  }

  // Generate comprehensive insights
  generateInsights(audio, video, nlp) {
    const insights = [];

    // Voice insights
    if (audio?.audio?.volume?.consistency > 80) {
      insights.push('Excellent volume consistency throughout your presentation');
    } else if (audio?.audio?.volume?.consistency < 60) {
      insights.push('Volume consistency needs improvement - practice maintaining steady volume');
    }

    if (audio?.nlp?.fillerWords?.percentage < 3) {
      insights.push('Great job minimizing filler words');
    } else if (audio?.nlp?.fillerWords?.percentage > 8) {
      insights.push('High filler word usage detected - practice pausing instead of using "um" or "uh"');
    }

    // Body language insights
    if (video?.aggregated?.bodyLanguage?.posture > 80) {
      insights.push('Strong posture and body positioning');
    } else if (video?.aggregated?.bodyLanguage?.posture < 60) {
      insights.push('Posture could be improved - stand straight and centered');
    }

    if (video?.aggregated?.engagement?.eyeContact > 70) {
      insights.push('Good eye contact maintained with the camera');
    } else if (video?.aggregated?.engagement?.eyeContact < 50) {
      insights.push('Eye contact needs improvement - look directly at the camera more often');
    }

    // Content insights
    if (nlp?.structure?.speakingRate > 120 && nlp?.structure?.speakingRate < 180) {
      insights.push('Excellent speaking pace - not too fast or slow');
    } else if (nlp?.structure?.speakingRate > 200) {
      insights.push('Speaking too fast - slow down for better comprehension');
    } else if (nlp?.structure?.speakingRate < 100) {
      insights.push('Speaking too slowly - increase your pace slightly');
    }

    if (nlp?.repetition?.repeatedWords?.length < 2) {
      insights.push('Good variety in word choice');
    } else if (nlp?.repetition?.repeatedWords?.length > 5) {
      insights.push('Repetitive language detected - vary your vocabulary');
    }

    return insights;
  }

  // Generate targeted recommendations
  generateRecommendations(audio, video, nlp) {
    const recommendations = [];

    // Voice recommendations
    if (audio?.audio?.volume?.consistency < 70) {
      recommendations.push('Practice with a microphone to maintain consistent volume levels');
    }

    if (audio?.nlp?.fillerWords?.percentage > 5) {
      recommendations.push('Record yourself speaking and identify your filler words, then practice pausing instead');
    }

    if (audio?.audio?.pitch?.stability < 60) {
      recommendations.push('Work on vocal variety - practice changing pitch for emphasis');
    }

    // Body language recommendations
    if (video?.aggregated?.bodyLanguage?.gestures < 60) {
      recommendations.push('Use more hand gestures to emphasize key points');
    }

    if (video?.aggregated?.engagement?.eyeContact < 60) {
      recommendations.push('Practice looking directly at the camera lens, not the screen');
    }

    if (video?.aggregated?.bodyLanguage?.posture < 70) {
      recommendations.push('Stand with feet shoulder-width apart and shoulders back');
    }

    // Content recommendations
    if (nlp?.structure?.avgSentenceLength > 25) {
      recommendations.push('Simplify your sentences for better clarity');
    }

    if (nlp?.repetition?.repeatedWords?.length > 3) {
      recommendations.push('Expand your vocabulary to avoid repetitive language');
    }

    if (nlp?.structure?.speakingRate < 120 || nlp?.structure?.speakingRate > 200) {
      recommendations.push('Practice with a metronome to find your optimal speaking pace');
    }

    return recommendations;
  }

  // No fallback analysis - system requires real data

  // Generate personalized feedback summary
  generatePersonalizedFeedback(aggregated) {
    const { overall, categories, insights, recommendations } = aggregated;
    
    let summary = `Your presentation scored ${overall}% overall. `;
    
    // Add category-specific feedback
    if (categories.voice.clarity > 80) {
      summary += 'Excellent voice clarity. ';
    } else if (categories.voice.clarity < 60) {
      summary += 'Voice clarity needs improvement. ';
    }
    
    if (categories.bodyLanguage.gestures > 80) {
      summary += 'Great use of gestures. ';
    } else if (categories.bodyLanguage.gestures < 60) {
      summary += 'Consider using more gestures. ';
    }
    
    if (categories.engagement.overall > 80) {
      summary += 'Strong audience engagement. ';
    } else if (categories.engagement.overall < 60) {
      summary += 'Work on increasing audience engagement. ';
    }
    
    return {
      summary: summary.trim(),
      strengths: this.identifyStrengths(categories),
      improvements: this.identifyImprovements(categories),
      nextSteps: recommendations.slice(0, 3)
    };
  }

  // Identify key strengths
  identifyStrengths(categories) {
    const strengths = [];
    
    if (categories.voice.clarity > 80) strengths.push('Clear and articulate speech');
    if (categories.voice.volume > 80) strengths.push('Consistent volume control');
    if (categories.bodyLanguage.posture > 80) strengths.push('Good posture and presence');
    if (categories.bodyLanguage.gestures > 80) strengths.push('Effective use of gestures');
    if (categories.engagement.eyeContact > 80) strengths.push('Strong eye contact');
    if (categories.content.clarity > 80) strengths.push('Clear and well-structured content');
    
    return strengths.length > 0 ? strengths : ['Overall solid presentation skills'];
  }

  // Identify areas for improvement
  identifyImprovements(categories) {
    const improvements = [];
    
    if (categories.voice.clarity < 70) improvements.push('Improve voice clarity and articulation');
    if (categories.voice.volume < 70) improvements.push('Work on volume consistency');
    if (categories.bodyLanguage.posture < 70) improvements.push('Enhance posture and body positioning');
    if (categories.bodyLanguage.gestures < 70) improvements.push('Use more expressive gestures');
    if (categories.engagement.eyeContact < 70) improvements.push('Maintain better eye contact');
    if (categories.content.clarity < 70) improvements.push('Improve content structure and flow');
    
    return improvements.length > 0 ? improvements : ['Continue practicing for overall improvement'];
  }
}

export default MetricsAggregator;

