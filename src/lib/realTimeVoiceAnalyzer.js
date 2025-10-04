// Real-time Voice Analysis Service
// Analyzes voice quality, pitch, volume, and speech patterns in real-time

export class RealTimeVoiceAnalyzer {
  constructor() {
    this.isAnalyzing = false;
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.dataArray = null;
    this.voiceData = {
      volume: { current: 0, average: 0, consistency: 0 },
      pitch: { current: 0, average: 0, stability: 0 },
      clarity: { score: 0, confidence: 0 },
      pace: { wordsPerMinute: 0, rhythm: 0 },
      quality: { overall: 0, consistency: 0 }
    };
    this.speechBuffer = [];
    this.silenceTimeout = null;
    this.silenceThreshold = 2000; // 2 seconds
    this.minSpeechLength = 1000; // 1 second
    this.callbacks = {
      onVoiceAnalysis: null,
      onError: null
    };
  }

  // Initialize audio context and analyser
  async initialize() {
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      console.log('Voice analyzer initialized');
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
    if (this.isAnalyzing) return;

    try {
      this.isAnalyzing = true;
      
      // Set up microphone input
      if (stream) {
        this.microphone = this.audioContext.createMediaStreamSource(stream);
        this.microphone.connect(this.analyser);
      }

      // Start analysis loop
      this.analyzeVoice();
      
      console.log('Voice analysis started');
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
    
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    console.log('Voice analysis stopped');
  }

  // Main voice analysis loop
  analyzeVoice() {
    if (!this.isAnalyzing) return;

    try {
      // Get frequency data
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Analyze current voice
      const analysis = this.performVoiceAnalysis();
      
      // Update voice data
      this.updateVoiceData(analysis);
      
      // Trigger callback
      if (this.callbacks.onVoiceAnalysis) {
        this.callbacks.onVoiceAnalysis(this.voiceData);
      }
      
    } catch (error) {
      console.error('Error in voice analysis loop:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }

    // Continue analysis
    if (this.isAnalyzing) {
      requestAnimationFrame(() => this.analyzeVoice());
    }
  }

  // Perform comprehensive voice analysis
  performVoiceAnalysis() {
    const analysis = {
      volume: this.analyzeVolume(),
      pitch: this.analyzePitch(),
      clarity: this.analyzeClarity(),
      pace: this.analyzePace(),
      quality: this.analyzeQuality()
    };

    return analysis;
  }

  // Analyze volume levels
  analyzeVolume() {
    if (!this.dataArray) return { current: 0, average: 0, consistency: 0 };

    // Calculate current volume
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const currentVolume = (sum / this.dataArray.length) * 2; // Amplify for better detection

    // Calculate average volume over time
    this.speechBuffer.push(currentVolume);
    if (this.speechBuffer.length > 100) { // Keep last 100 samples
      this.speechBuffer.shift();
    }

    const averageVolume = this.speechBuffer.reduce((a, b) => a + b, 0) / this.speechBuffer.length;

    // Calculate volume consistency
    const variance = this.speechBuffer.reduce((acc, vol) => acc + Math.pow(vol - averageVolume, 2), 0) / this.speechBuffer.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance) * 10);

    return {
      current: Math.round(currentVolume),
      average: Math.round(averageVolume),
      consistency: Math.round(consistency)
    };
  }

  // Analyze pitch
  analyzePitch() {
    if (!this.dataArray) return { current: 0, average: 0, stability: 0 };

    // Find dominant frequency (pitch)
    let maxValue = 0;
    let maxIndex = 0;
    
    for (let i = 0; i < this.dataArray.length; i++) {
      if (this.dataArray[i] > maxValue) {
        maxValue = this.dataArray[i];
        maxIndex = i;
      }
    }

    // Convert frequency bin to Hz
    const frequency = (maxIndex * this.audioContext.sampleRate) / (this.analyser.fftSize * 2);
    const currentPitch = Math.round(frequency);

    // Calculate average pitch over time
    const pitchBuffer = this.speechBuffer.slice(-50); // Last 50 samples
    const averagePitch = pitchBuffer.length > 0 ? 
      pitchBuffer.reduce((a, b) => a + b, 0) / pitchBuffer.length : 0;

    // Calculate pitch stability
    const pitchVariance = pitchBuffer.reduce((acc, pitch) => acc + Math.pow(pitch - averagePitch, 2), 0) / pitchBuffer.length;
    const stability = Math.max(0, 100 - Math.sqrt(pitchVariance) * 5);

    return {
      current: currentPitch,
      average: Math.round(averagePitch),
      stability: Math.round(stability)
    };
  }

  // Analyze voice clarity
  analyzeClarity() {
    if (!this.dataArray) return { score: 0, confidence: 0 };

    // Analyze frequency distribution for clarity indicators
    const lowFreq = this.dataArray.slice(0, this.dataArray.length / 4);
    const midFreq = this.dataArray.slice(this.dataArray.length / 4, this.dataArray.length / 2);
    const highFreq = this.dataArray.slice(this.dataArray.length / 2, this.dataArray.length);

    const lowEnergy = lowFreq.reduce((a, b) => a + b, 0) / lowFreq.length;
    const midEnergy = midFreq.reduce((a, b) => a + b, 0) / midFreq.length;
    const highEnergy = highFreq.reduce((a, b) => a + b, 0) / highFreq.length;

    // Good clarity has balanced frequency distribution
    const totalEnergy = lowEnergy + midEnergy + highEnergy;
    const clarityScore = totalEnergy > 0 ? 
      Math.round((midEnergy / totalEnergy) * 100) : 0;

    // Confidence based on overall energy
    const confidence = Math.min(100, Math.round(totalEnergy / 10));

    return {
      score: clarityScore,
      confidence: confidence
    };
  }

  // Analyze speaking pace
  analyzePace() {
    // This is a simplified pace analysis
    // In a real implementation, you'd use speech recognition to count words
    
    const currentVolume = this.voiceData.volume.current;
    const isSpeaking = currentVolume > 30;
    
    // Estimate pace based on volume patterns
    let wordsPerMinute = 0;
    let rhythm = 0;
    
    if (isSpeaking) {
      // Rough estimation based on volume patterns
      const volumePatterns = this.speechBuffer.slice(-20);
      const peaks = volumePatterns.filter((vol, i) => 
        vol > 40 && (i === 0 || vol > volumePatterns[i-1]) && 
        (i === volumePatterns.length - 1 || vol > volumePatterns[i+1])
      ).length;
      
      wordsPerMinute = Math.round(peaks * 3); // Rough estimation
      rhythm = Math.max(0, 100 - Math.abs(wordsPerMinute - 150) / 2);
    }

    return {
      wordsPerMinute: wordsPerMinute,
      rhythm: Math.round(rhythm)
    };
  }

  // Analyze overall voice quality
  analyzeQuality() {
    const volume = this.voiceData.volume;
    const pitch = this.voiceData.pitch;
    const clarity = this.voiceData.clarity;
    const pace = this.voiceData.pace;

    // Calculate overall quality score
    const overallScore = Math.round(
      (volume.consistency + pitch.stability + clarity.score + pace.rhythm) / 4
    );

    // Calculate consistency score
    const consistencyScore = Math.round(
      (volume.consistency + pitch.stability) / 2
    );

    return {
      overall: overallScore,
      consistency: consistencyScore
    };
  }

  // Update voice data with smoothing
  updateVoiceData(newAnalysis) {
    const smoothingFactor = 0.3; // Adjust for more/less smoothing
    
    // Update volume data
    this.voiceData.volume.current = newAnalysis.volume.current;
    this.voiceData.volume.average = Math.round(
      this.voiceData.volume.average * (1 - smoothingFactor) + 
      newAnalysis.volume.average * smoothingFactor
    );
    this.voiceData.volume.consistency = Math.round(
      this.voiceData.volume.consistency * (1 - smoothingFactor) + 
      newAnalysis.volume.consistency * smoothingFactor
    );

    // Update pitch data
    this.voiceData.pitch.current = newAnalysis.pitch.current;
    this.voiceData.pitch.average = Math.round(
      this.voiceData.pitch.average * (1 - smoothingFactor) + 
      newAnalysis.pitch.average * smoothingFactor
    );
    this.voiceData.pitch.stability = Math.round(
      this.voiceData.pitch.stability * (1 - smoothingFactor) + 
      newAnalysis.pitch.stability * smoothingFactor
    );

    // Update clarity data
    this.voiceData.clarity.score = Math.round(
      this.voiceData.clarity.score * (1 - smoothingFactor) + 
      newAnalysis.clarity.score * smoothingFactor
    );
    this.voiceData.clarity.confidence = Math.round(
      this.voiceData.clarity.confidence * (1 - smoothingFactor) + 
      newAnalysis.clarity.confidence * smoothingFactor
    );

    // Update pace data
    this.voiceData.pace.wordsPerMinute = newAnalysis.pace.wordsPerMinute;
    this.voiceData.pace.rhythm = Math.round(
      this.voiceData.pace.rhythm * (1 - smoothingFactor) + 
      newAnalysis.pace.rhythm * smoothingFactor
    );

    // Update quality data
    this.voiceData.quality.overall = Math.round(
      this.voiceData.quality.overall * (1 - smoothingFactor) + 
      newAnalysis.quality.overall * smoothingFactor
    );
    this.voiceData.quality.consistency = Math.round(
      this.voiceData.quality.consistency * (1 - smoothingFactor) + 
      newAnalysis.quality.consistency * smoothingFactor
    );
  }

  // Get current voice data
  getVoiceData() {
    return this.voiceData;
  }

  // Set callbacks
  onVoiceAnalysis(callback) {
    this.callbacks.onVoiceAnalysis = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
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

export default RealTimeVoiceAnalyzer;
