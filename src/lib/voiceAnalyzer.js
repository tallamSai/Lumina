// Voice Analysis Service
// Analyzes voice clarity, pace, tone, and confidence in real-time

export class VoiceAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.dataArray = null;
    this.isAnalyzing = false;
    this.voiceData = [];
    this.callbacks = {
      onVoiceUpdate: null,
      onError: null
    };
  }

  // Initialize audio context and microphone
  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      return true;
    } catch (error) {
      console.error('Error initializing voice analyzer:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      return false;
    }
  }

  // Start voice analysis
  async startAnalysis(stream) {
    if (this.isAnalyzing) {
      console.warn('Voice analysis already running');
      return;
    }

    try {
      if (!this.audioContext) {
        await this.initialize();
      }

      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      this.isAnalyzing = true;
      this.analyzeVoice();
    } catch (error) {
      console.error('Error starting voice analysis:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }
  }

  // Stop voice analysis
  stopAnalysis() {
    this.isAnalyzing = false;
    
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
  }

  // Analyze voice in real-time
  analyzeVoice() {
    if (!this.isAnalyzing) return;

    this.analyser.getByteFrequencyData(this.dataArray);
    
    const analysis = this.performVoiceAnalysis();
    
    this.voiceData.push({
      ...analysis,
      timestamp: Date.now()
    });

    // Keep only last 100 samples for performance
    if (this.voiceData.length > 100) {
      this.voiceData = this.voiceData.slice(-100);
    }

    if (this.callbacks.onVoiceUpdate) {
      this.callbacks.onVoiceUpdate(analysis);
    }

    // Continue analysis
    requestAnimationFrame(() => this.analyzeVoice());
  }

  // Perform voice analysis
  performVoiceAnalysis() {
    const volume = this.calculateVolume();
    const pitch = this.calculatePitch();
    const clarity = this.calculateClarity();
    const pace = this.calculatePace();
    const confidence = this.calculateConfidence(volume, pitch, clarity);
    const engagement = this.calculateEngagement(volume, pitch);

    return {
      volume: {
        level: volume,
        status: this.getVolumeStatus(volume)
      },
      pitch: {
        level: pitch,
        status: this.getPitchStatus(pitch)
      },
      clarity: {
        score: clarity,
        status: this.getClarityStatus(clarity)
      },
      pace: {
        score: pace,
        status: this.getPaceStatus(pace)
      },
      confidence: {
        score: confidence,
        status: this.getConfidenceStatus(confidence)
      },
      engagement: {
        score: engagement,
        status: this.getEngagementStatus(engagement)
      },
      overall: {
        score: Math.round((clarity + confidence + engagement) / 3),
        status: this.getOverallVoiceStatus((clarity + confidence + engagement) / 3)
      }
    };
  }

  // Calculate volume level
  calculateVolume() {
    if (!this.dataArray) return 0;
    
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    
    const average = sum / this.dataArray.length;
    return Math.round((average / 255) * 100);
  }

  // Calculate pitch (simplified)
  calculatePitch() {
    if (!this.dataArray) return 0;
    
    // Find the dominant frequency
    let maxValue = 0;
    let maxIndex = 0;
    
    for (let i = 0; i < this.dataArray.length; i++) {
      if (this.dataArray[i] > maxValue) {
        maxValue = this.dataArray[i];
        maxIndex = i;
      }
    }
    
    // Convert to pitch score (0-100)
    const pitchScore = Math.round((maxIndex / this.dataArray.length) * 100);
    return pitchScore;
  }

  // Calculate clarity (simplified)
  calculateClarity() {
    if (!this.dataArray) return 0;
    
    // Analyze frequency distribution for clarity
    let clarityScore = 0;
    const midRange = this.dataArray.length / 2;
    
    for (let i = 0; i < midRange; i++) {
      clarityScore += this.dataArray[i];
    }
    
    return Math.round((clarityScore / (midRange * 255)) * 100);
  }

  // Calculate pace (simplified)
  calculatePace() {
    if (this.voiceData.length < 2) return 50;
    
    // Calculate pace based on volume variations
    const recentData = this.voiceData.slice(-5);
    let variations = 0;
    
    for (let i = 1; i < recentData.length; i++) {
      variations += Math.abs(recentData[i].volume.level - recentData[i-1].volume.level);
    }
    
    const averageVariation = variations / (recentData.length - 1);
    return Math.min(100, Math.round(averageVariation * 2));
  }

  // Calculate confidence
  calculateConfidence(volume, pitch, clarity) {
    // Confidence is based on consistent volume, good pitch, and clarity
    const volumeScore = volume > 30 && volume < 80 ? 100 : Math.max(0, 100 - Math.abs(volume - 55));
    const pitchScore = pitch > 20 && pitch < 80 ? 100 : Math.max(0, 100 - Math.abs(pitch - 50));
    const clarityScore = clarity;
    
    return Math.round((volumeScore + pitchScore + clarityScore) / 3);
  }

  // Calculate engagement
  calculateEngagement(volume, pitch) {
    // Engagement is based on variation in volume and pitch
    const volumeVariation = Math.min(100, volume * 1.5);
    const pitchVariation = Math.min(100, pitch * 1.2);
    
    return Math.round((volumeVariation + pitchVariation) / 2);
  }

  // Get volume status
  getVolumeStatus(volume) {
    if (volume < 20) return 'too_quiet';
    if (volume > 90) return 'too_loud';
    if (volume >= 40 && volume <= 80) return 'good';
    return 'needs_adjustment';
  }

  // Get pitch status
  getPitchStatus(pitch) {
    if (pitch < 20) return 'too_low';
    if (pitch > 80) return 'too_high';
    if (pitch >= 30 && pitch <= 70) return 'good';
    return 'needs_adjustment';
  }

  // Get clarity status
  getClarityStatus(clarity) {
    if (clarity >= 80) return 'excellent';
    if (clarity >= 60) return 'good';
    if (clarity >= 40) return 'fair';
    return 'needs_improvement';
  }

  // Get pace status
  getPaceStatus(pace) {
    if (pace >= 60 && pace <= 80) return 'good';
    if (pace < 40) return 'too_slow';
    if (pace > 90) return 'too_fast';
    return 'needs_adjustment';
  }

  // Get confidence status
  getConfidenceStatus(confidence) {
    if (confidence >= 80) return 'excellent';
    if (confidence >= 60) return 'good';
    if (confidence >= 40) return 'fair';
    return 'needs_improvement';
  }

  // Get engagement status
  getEngagementStatus(engagement) {
    if (engagement >= 80) return 'excellent';
    if (engagement >= 60) return 'good';
    if (engagement >= 40) return 'fair';
    return 'needs_improvement';
  }

  // Get overall voice status
  getOverallVoiceStatus(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'needs_improvement';
  }

  // Generate voice recommendations
  generateVoiceRecommendations(analysis) {
    const recommendations = [];

    // Volume recommendations
    if (analysis.volume.status === 'too_quiet') {
      recommendations.push('Speak louder to ensure you\'re heard clearly');
    } else if (analysis.volume.status === 'too_loud') {
      recommendations.push('Lower your voice slightly for better comfort');
    }

    // Pitch recommendations
    if (analysis.pitch.status === 'too_low') {
      recommendations.push('Try speaking in a slightly higher pitch');
    } else if (analysis.pitch.status === 'too_high') {
      recommendations.push('Lower your pitch for a more natural sound');
    }

    // Clarity recommendations
    if (analysis.clarity.status === 'needs_improvement') {
      recommendations.push('Speak more clearly and articulate your words');
    }

    // Pace recommendations
    if (analysis.pace.status === 'too_slow') {
      recommendations.push('Try speaking a bit faster to maintain engagement');
    } else if (analysis.pace.status === 'too_fast') {
      recommendations.push('Slow down your speech for better understanding');
    }

    // Confidence recommendations
    if (analysis.confidence.status === 'needs_improvement') {
      recommendations.push('Project confidence through your voice');
    }

    // Engagement recommendations
    if (analysis.engagement.status === 'needs_improvement') {
      recommendations.push('Vary your tone and pace to keep your audience engaged');
    }

    return recommendations.length > 0 ? recommendations : ['Your voice sounds great! Keep it up!'];
  }

  // Get voice trends
  getVoiceTrends() {
    if (this.voiceData.length < 10) return null;

    const recent = this.voiceData.slice(-10);
    const trends = {};

    Object.keys(recent[0]).forEach(key => {
      if (key !== 'timestamp' && typeof recent[0][key] === 'object') {
        const scores = recent.map(item => {
          if (item[key] && typeof item[key].score === 'number') {
            return item[key].score;
          } else if (item[key] && typeof item[key].level === 'number') {
            return item[key].level;
          }
          return 0;
        });
        
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

  // Set callbacks
  onVoiceUpdate(callback) {
    this.callbacks.onVoiceUpdate = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }

  // Get voice data
  getVoiceData() {
    return this.voiceData;
  }

  // Get current voice analysis
  getCurrentAnalysis() {
    return this.voiceData[this.voiceData.length - 1] || null;
  }

  // Cleanup
  cleanup() {
    this.stopAnalysis();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export default VoiceAnalyzer;
