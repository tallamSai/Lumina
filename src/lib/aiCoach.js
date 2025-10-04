// Advanced AI Coaching Service
// Provides personalized coaching recommendations and practice plans

export class AICoach {
  constructor() {
    this.coachingHistory = [];
    this.practicePlans = [];
    this.learningPath = [];
  }

  // Generate personalized coaching plan
  generateCoachingPlan(analysisData, performanceHistory = []) {
    const plan = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      focusAreas: this.identifyFocusAreas(analysisData),
      practicePlan: this.createPracticePlan(analysisData),
      milestones: this.setMilestones(analysisData),
      recommendations: this.generateRecommendations(analysisData, performanceHistory),
      timeline: this.createTimeline(analysisData)
    };

    this.coachingHistory.push(plan);
    return plan;
  }

  // Identify focus areas based on analysis
  identifyFocusAreas(analysis) {
    const focusAreas = [];
    const scores = {
      voiceClarity: analysis.voiceClarity || 0,
      bodyLanguage: analysis.bodyLanguage || 0,
      pacing: analysis.pacing || 0,
      confidence: analysis.confidence || 0,
      engagement: analysis.engagement || 0,
      contentQuality: analysis.contentQuality || 0,
      professionalism: analysis.professionalism || 0
    };

    // Identify areas below 70% as focus areas
    Object.entries(scores).forEach(([area, score]) => {
      if (score < 70) {
        focusAreas.push({
          area,
          score,
          priority: score < 50 ? 'high' : score < 60 ? 'medium' : 'low',
          description: this.getAreaDescription(area),
          improvementPotential: this.calculateImprovementPotential(score)
        });
      }
    });

    // Sort by priority and improvement potential
    return focusAreas.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.improvementPotential - a.improvementPotential;
    });
  }

  // Get area description
  getAreaDescription(area) {
    const descriptions = {
      voiceClarity: 'Clear and articulate speech delivery',
      bodyLanguage: 'Effective use of gestures and posture',
      pacing: 'Optimal speaking speed and rhythm',
      confidence: 'Self-assured and composed delivery',
      engagement: 'Ability to connect with and captivate audience',
      contentQuality: 'Well-structured and clear content',
      professionalism: 'Overall professional presentation style'
    };
    return descriptions[area] || 'Presentation skill area';
  }

  // Calculate improvement potential
  calculateImprovementPotential(score) {
    if (score < 30) return 90; // High potential for improvement
    if (score < 50) return 70;
    if (score < 70) return 50;
    return 30; // Lower potential for high scores
  }

  // Create personalized practice plan
  createPracticePlan(analysis) {
    const focusAreas = this.identifyFocusAreas(analysis);
    const plan = {
      daily: [],
      weekly: [],
      monthly: [],
      exercises: []
    };

    focusAreas.forEach(area => {
      const exercises = this.getExercisesForArea(area.area, area.score);
      plan.exercises.push(...exercises);
      
      if (area.priority === 'high') {
        plan.daily.push(...exercises.filter(e => e.frequency === 'daily'));
      } else if (area.priority === 'medium') {
        plan.weekly.push(...exercises.filter(e => e.frequency === 'weekly'));
      } else {
        plan.monthly.push(...exercises.filter(e => e.frequency === 'monthly'));
      }
    });

    return plan;
  }

  // Get exercises for specific area
  getExercisesForArea(area, score) {
    const exerciseLibrary = {
      voiceClarity: [
        {
          name: 'Tongue Twisters',
          description: 'Practice tongue twisters daily to improve articulation',
          duration: '5 minutes',
          frequency: 'daily',
          difficulty: 'beginner',
          instructions: 'Start with simple phrases and gradually increase complexity'
        },
        {
          name: 'Vocal Warm-ups',
          description: 'Daily vocal exercises to improve clarity',
          duration: '10 minutes',
          frequency: 'daily',
          difficulty: 'beginner',
          instructions: 'Practice humming, lip trills, and vowel exercises'
        },
        {
          name: 'Reading Aloud',
          description: 'Read passages aloud focusing on clear pronunciation',
          duration: '15 minutes',
          frequency: 'daily',
          difficulty: 'intermediate',
          instructions: 'Record yourself and listen for unclear words'
        }
      ],
      bodyLanguage: [
        {
          name: 'Mirror Practice',
          description: 'Practice gestures and posture in front of a mirror',
          duration: '10 minutes',
          frequency: 'daily',
          difficulty: 'beginner',
          instructions: 'Practice natural gestures while speaking'
        },
        {
          name: 'Power Poses',
          description: 'Practice confident body positions',
          duration: '5 minutes',
          frequency: 'daily',
          difficulty: 'beginner',
          instructions: 'Hold confident poses for 2 minutes each'
        },
        {
          name: 'Gesture Mapping',
          description: 'Plan specific gestures for key points',
          duration: '20 minutes',
          frequency: 'weekly',
          difficulty: 'intermediate',
          instructions: 'Create a gesture plan for your presentation'
        }
      ],
      pacing: [
        {
          name: 'Metronome Practice',
          description: 'Practice speaking with a metronome',
          duration: '10 minutes',
          frequency: 'daily',
          difficulty: 'beginner',
          instructions: 'Start at 120 BPM and adjust to your comfort level'
        },
        {
          name: 'Pause Practice',
          description: 'Practice strategic pausing',
          duration: '15 minutes',
          frequency: 'daily',
          difficulty: 'intermediate',
          instructions: 'Practice pausing after key points for emphasis'
        },
        {
          name: 'Speed Variation',
          description: 'Practice varying your speaking speed',
          duration: '20 minutes',
          frequency: 'weekly',
          difficulty: 'advanced',
          instructions: 'Practice slowing down for important points, speeding up for excitement'
        }
      ],
      confidence: [
        {
          name: 'Confidence Building',
          description: 'Daily confidence exercises',
          duration: '10 minutes',
          frequency: 'daily',
          difficulty: 'beginner',
          instructions: 'Practice positive self-talk and visualization'
        },
        {
          name: 'Public Speaking Practice',
          description: 'Practice speaking to small groups',
          duration: '30 minutes',
          frequency: 'weekly',
          difficulty: 'intermediate',
          instructions: 'Start with friends and family, gradually increase audience size'
        },
        {
          name: 'Fear Confrontation',
          description: 'Gradually face speaking fears',
          duration: '45 minutes',
          frequency: 'weekly',
          difficulty: 'advanced',
          instructions: 'Identify specific fears and create exposure exercises'
        }
      ],
      engagement: [
        {
          name: 'Eye Contact Practice',
          description: 'Practice maintaining eye contact',
          duration: '10 minutes',
          frequency: 'daily',
          difficulty: 'beginner',
          instructions: 'Practice looking at camera for 3-5 seconds at a time'
        },
        {
          name: 'Storytelling',
          description: 'Practice engaging storytelling techniques',
          duration: '20 minutes',
          frequency: 'weekly',
          difficulty: 'intermediate',
          instructions: 'Practice telling personal stories with emotion and detail'
        },
        {
          name: 'Audience Interaction',
          description: 'Practice engaging with virtual audience',
          duration: '30 minutes',
          frequency: 'weekly',
          difficulty: 'advanced',
          instructions: 'Practice asking questions and responding to audience'
        }
      ]
    };

    return exerciseLibrary[area] || [];
  }

  // Set milestones for improvement
  setMilestones(analysis) {
    const milestones = [];
    const focusAreas = this.identifyFocusAreas(analysis);
    
    focusAreas.forEach((area, index) => {
      const targetScore = Math.min(100, area.score + 20);
      const timeline = this.calculateTimeline(area.score, targetScore);
      
      milestones.push({
        id: `milestone_${index + 1}`,
        area: area.area,
        currentScore: area.score,
        targetScore,
        timeline: timeline,
        description: `Improve ${area.area} from ${area.score}% to ${targetScore}%`,
        priority: area.priority
      });
    });

    return milestones;
  }

  // Calculate timeline for improvement
  calculateTimeline(currentScore, targetScore) {
    const improvement = targetScore - currentScore;
    const weeks = Math.ceil(improvement / 5); // Assume 5% improvement per week
    return Math.max(2, Math.min(12, weeks)); // 2-12 weeks range
  }

  // Generate personalized recommendations
  generateRecommendations(analysis, history) {
    const recommendations = [];
    const focusAreas = this.identifyFocusAreas(analysis);

    // Immediate recommendations
    focusAreas.filter(area => area.priority === 'high').forEach(area => {
      recommendations.push({
        type: 'immediate',
        priority: 'high',
        area: area.area,
        message: `Focus on ${area.area} immediately - current score is ${area.score}%`,
        action: `Start daily practice for ${area.area}`,
        timeline: 'This week'
      });
    });

    // Progress-based recommendations
    if (history && history.length > 0) {
      const recentTrend = this.analyzeTrend(history);
      if (recentTrend.improving) {
        recommendations.push({
          type: 'positive',
          message: 'Great progress! Keep up the current practice routine',
          action: 'Continue your current approach',
          timeline: 'Ongoing'
        });
      } else if (recentTrend.declining) {
        recommendations.push({
          type: 'urgent',
          message: 'Performance has declined recently',
          action: 'Review and adjust your practice routine',
          timeline: 'This week'
        });
      }
    }

    // Long-term recommendations
    recommendations.push({
      type: 'long_term',
      message: 'Develop a consistent practice routine',
      action: 'Set aside 30 minutes daily for presentation practice',
      timeline: 'Next month'
    });

    return recommendations;
  }

  // Analyze performance trend
  analyzeTrend(history) {
    if (history.length < 3) return { improving: false, declining: false, stable: true };

    const recentScores = history.slice(-3).map(h => h.overallScore || 0);
    const trend = recentScores[2] - recentScores[0];
    
    return {
      improving: trend > 10,
      declining: trend < -10,
      stable: Math.abs(trend) <= 10
    };
  }

  // Create timeline for improvement
  createTimeline(analysis) {
    const timeline = [];
    const focusAreas = this.identifyFocusAreas(analysis);
    
    let currentWeek = 1;
    focusAreas.forEach(area => {
      const weeks = this.calculateTimeline(area.score, Math.min(100, area.score + 20));
      
      timeline.push({
        week: currentWeek,
        focus: area.area,
        goal: `Improve ${area.area} by 10%`,
        activities: this.getExercisesForArea(area.area, area.score).slice(0, 2)
      });
      
      currentWeek += Math.ceil(weeks / 2);
    });

    return timeline;
  }

  // Get coaching insights
  getCoachingInsights(analysis, history = []) {
    const insights = {
      strengths: this.identifyStrengths(analysis),
      weaknesses: this.identifyWeaknesses(analysis),
      opportunities: this.identifyOpportunities(analysis, history),
      threats: this.identifyThreats(analysis, history),
      recommendations: this.generateRecommendations(analysis, history)
    };

    return insights;
  }

  // Identify strengths
  identifyStrengths(analysis) {
    const strengths = [];
    const scores = {
      voiceClarity: analysis.voiceClarity || 0,
      bodyLanguage: analysis.bodyLanguage || 0,
      pacing: analysis.pacing || 0,
      confidence: analysis.confidence || 0,
      engagement: analysis.engagement || 0
    };

    Object.entries(scores).forEach(([area, score]) => {
      if (score >= 80) {
        strengths.push({
          area,
          score,
          description: `Excellent ${area} performance`,
          recommendation: 'Leverage this strength in your presentations'
        });
      }
    });

    return strengths;
  }

  // Identify weaknesses
  identifyWeaknesses(analysis) {
    return this.identifyFocusAreas(analysis).filter(area => area.priority === 'high');
  }

  // Identify opportunities
  identifyOpportunities(analysis, history) {
    const opportunities = [];
    
    // Quick wins (areas close to next level)
    const scores = {
      voiceClarity: analysis.voiceClarity || 0,
      bodyLanguage: analysis.bodyLanguage || 0,
      pacing: analysis.pacing || 0,
      confidence: analysis.confidence || 0,
      engagement: analysis.engagement || 0
    };

    Object.entries(scores).forEach(([area, score]) => {
      if (score >= 65 && score < 80) {
        opportunities.push({
          area,
          currentScore: score,
          potential: 80 - score,
          description: `${area} is close to excellent level`,
          action: `Focus on ${area} for quick improvement`
        });
      }
    });

    return opportunities;
  }

  // Identify threats
  identifyThreats(analysis, history) {
    const threats = [];
    
    // Declining performance
    if (history && history.length >= 3) {
      const recentTrend = this.analyzeTrend(history);
      if (recentTrend.declining) {
        threats.push({
          type: 'performance_decline',
          description: 'Recent performance has been declining',
          action: 'Review practice routine and identify issues'
        });
      }
    }

    // Low scores in critical areas
    const criticalAreas = ['confidence', 'engagement'];
    criticalAreas.forEach(area => {
      const score = analysis[area] || 0;
      if (score < 40) {
        threats.push({
          type: 'critical_weakness',
          area,
          description: `Very low ${area} score (${score}%)`,
          action: `Immediate focus needed on ${area}`
        });
      }
    });

    return threats;
  }
}

export default AICoach;
