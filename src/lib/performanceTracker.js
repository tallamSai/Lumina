// Advanced Performance Tracking Service
// Tracks presentation performance over time and provides insights

export class PerformanceTracker {
  constructor() {
    this.analyses = [];
    this.trends = {
      overall: [],
      voiceClarity: [],
      bodyLanguage: [],
      pacing: [],
      confidence: [],
      engagement: []
    };
  }

  // Add new analysis to tracking
  addAnalysis(analysisData) {
    const analysis = {
      id: analysisData.id || Date.now(),
      timestamp: analysisData.timestamp || Date.now(),
      scores: {
        overall: analysisData.overallScore || 0,
        voiceClarity: analysisData.voiceClarity || 0,
        bodyLanguage: analysisData.bodyLanguage || 0,
        pacing: analysisData.pacing || 0,
        confidence: analysisData.confidence || 0,
        engagement: analysisData.engagement || 0,
        contentQuality: analysisData.contentQuality || 0,
        professionalism: analysisData.professionalism || 0
      },
      strengths: analysisData.strengths || [],
      improvements: analysisData.areasForImprovement || [],
      duration: analysisData.duration || 0
    };

    this.analyses.push(analysis);
    this.updateTrends(analysis);
    
    return analysis;
  }

  // Update trend data
  updateTrends(analysis) {
    const date = new Date(analysis.timestamp);
    const dayKey = date.toISOString().split('T')[0];
    
    Object.keys(analysis.scores).forEach(metric => {
      if (!this.trends[metric]) {
        this.trends[metric] = [];
      }
      
      this.trends[metric].push({
        date: dayKey,
        score: analysis.scores[metric],
        timestamp: analysis.timestamp
      });
    });
  }

  // Get performance trends
  getTrends(metric = 'overall', days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const trendData = this.trends[metric] || [];
    return trendData.filter(point => new Date(point.timestamp) >= cutoffDate);
  }

  // Calculate performance improvement
  getImprovement(metric = 'overall', days = 7) {
    const recentTrends = this.getTrends(metric, days);
    if (recentTrends.length < 2) return null;

    const first = recentTrends[0].score;
    const last = recentTrends[recentTrends.length - 1].score;
    const improvement = last - first;
    const percentage = first > 0 ? (improvement / first) * 100 : 0;

    return {
      improvement,
      percentage: Math.round(percentage * 10) / 10,
      direction: improvement > 0 ? 'up' : improvement < 0 ? 'down' : 'stable',
      trend: this.calculateTrend(recentTrends)
    };
  }

  // Calculate trend direction
  calculateTrend(data) {
    if (data.length < 3) return 'insufficient_data';
    
    const scores = data.map(d => d.score);
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  // Get performance insights
  getInsights() {
    const insights = {
      totalAnalyses: this.analyses.length,
      averageScore: 0,
      bestScore: 0,
      worstScore: 100,
      mostImproved: null,
      needsAttention: [],
      strengths: [],
      weaknesses: []
    };

    if (this.analyses.length === 0) return insights;

    // Calculate averages and extremes
    const allScores = this.analyses.map(a => a.scores.overall);
    insights.averageScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    insights.bestScore = Math.max(...allScores);
    insights.worstScore = Math.min(...allScores);

    // Find most improved metric
    const improvements = {};
    Object.keys(this.trends).forEach(metric => {
      const improvement = this.getImprovement(metric, 30);
      if (improvement && improvement.percentage > 0) {
        improvements[metric] = improvement.percentage;
      }
    });

    if (Object.keys(improvements).length > 0) {
      const mostImproved = Object.entries(improvements).reduce((a, b) => 
        improvements[a[0]] > improvements[b[0]] ? a : b
      );
      insights.mostImproved = {
        metric: mostImproved[0],
        improvement: mostImproved[1]
      };
    }

    // Find areas needing attention
    const latestAnalysis = this.analyses[this.analyses.length - 1];
    if (latestAnalysis) {
      Object.entries(latestAnalysis.scores).forEach(([metric, score]) => {
        if (score < 60) {
          insights.needsAttention.push({
            metric,
            score,
            priority: score < 40 ? 'high' : score < 50 ? 'medium' : 'low'
          });
        }
      });
    }

    // Analyze common strengths and weaknesses
    const allStrengths = this.analyses.flatMap(a => a.strengths);
    const allImprovements = this.analyses.flatMap(a => a.improvements);

    // Count frequency of strengths and weaknesses
    const strengthCounts = {};
    const weaknessCounts = {};

    allStrengths.forEach(strength => {
      const key = strength.toLowerCase();
      strengthCounts[key] = (strengthCounts[key] || 0) + 1;
    });

    allImprovements.forEach(weakness => {
      const key = weakness.toLowerCase();
      weaknessCounts[key] = (weaknessCounts[key] || 0) + 1;
    });

    // Get most common strengths and weaknesses
    insights.strengths = Object.entries(strengthCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([strength, count]) => ({ strength, frequency: count }));

    insights.weaknesses = Object.entries(weaknessCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([weakness, frequency]) => ({ weakness, frequency }));

    return insights;
  }

  // Get performance recommendations
  getRecommendations() {
    const insights = this.getInsights();
    const recommendations = [];

    // Based on trends
    Object.keys(this.trends).forEach(metric => {
      const improvement = this.getImprovement(metric, 14);
      if (improvement) {
        if (improvement.direction === 'down' && improvement.percentage < -10) {
          recommendations.push({
            type: 'urgent',
            metric,
            message: `${metric} has declined by ${Math.abs(improvement.percentage)}% in the last 2 weeks. Focus on this area immediately.`,
            action: `Practice ${metric} exercises daily for 15 minutes`
          });
        } else if (improvement.direction === 'up' && improvement.percentage > 10) {
          recommendations.push({
            type: 'positive',
            metric,
            message: `Great job! ${metric} has improved by ${improvement.percentage}% in the last 2 weeks.`,
            action: `Continue your current ${metric} practice routine`
          });
        }
      }
    });

    // Based on current performance
    if (insights.needsAttention.length > 0) {
      const highPriority = insights.needsAttention.filter(area => area.priority === 'high');
      if (highPriority.length > 0) {
        recommendations.push({
          type: 'urgent',
          message: `Critical areas need immediate attention: ${highPriority.map(a => a.metric).join(', ')}`,
          action: 'Focus on these areas with daily practice sessions'
        });
      }
    }

    // Based on consistency
    if (insights.totalAnalyses >= 5) {
      const recentScores = this.analyses.slice(-5).map(a => a.scores.overall);
      const variance = this.calculateVariance(recentScores);
      
      if (variance > 20) {
        recommendations.push({
          type: 'consistency',
          message: 'Your performance is inconsistent. Work on maintaining steady improvement.',
          action: 'Practice daily and track your progress consistently'
        });
      }
    }

    return recommendations;
  }

  // Calculate variance
  calculateVariance(scores) {
    if (scores.length < 2) return 0;
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }

  // Get performance summary
  getPerformanceSummary() {
    const insights = this.getInsights();
    const recommendations = this.getRecommendations();
    
    return {
      insights,
      recommendations,
      trends: {
        overall: this.getTrends('overall', 30),
        voiceClarity: this.getTrends('voiceClarity', 30),
        bodyLanguage: this.getTrends('bodyLanguage', 30),
        pacing: this.getTrends('pacing', 30),
        confidence: this.getTrends('confidence', 30),
        engagement: this.getTrends('engagement', 30)
      },
      improvements: {
        overall: this.getImprovement('overall', 30),
        voiceClarity: this.getImprovement('voiceClarity', 30),
        bodyLanguage: this.getImprovement('bodyLanguage', 30),
        pacing: this.getImprovement('pacing', 30),
        confidence: this.getImprovement('confidence', 30),
        engagement: this.getImprovement('engagement', 30)
      }
    };
  }

  // Export data for backup
  exportData() {
    return {
      analyses: this.analyses,
      trends: this.trends,
      exportedAt: new Date().toISOString()
    };
  }

  // Import data from backup
  importData(data) {
    if (data.analyses) {
      this.analyses = data.analyses;
    }
    if (data.trends) {
      this.trends = data.trends;
    }
  }
}

export default PerformanceTracker;
