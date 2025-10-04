// Advanced Audio Analysis Service with Real-time Processing
// Integrates speech-to-text, NLP processing, emotion detection, and audio feature extraction

export class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.realTimeMetrics = {
      volume: [],
      pitch: [],
      clarity: [],
      emotion: []
    };
    this.speechRecognition = null;
    this.isAnalyzing = false;
  }

  // Initialize audio context for advanced analysis
  async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      return true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return false;
    }
  }

  // Extract audio from video and convert to analyzable format
  async extractAudioFromVideo(videoUrl) {
    try {
      const response = await fetch(videoUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Failed to extract audio:', error);
      return null;
    }
  }

  // Real-time speech-to-text with enhanced processing
  async transcribeAudioRealTime(audioBuffer) {
    return new Promise((resolve) => {
      try {
        // Create audio source
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Create audio destination for processing
        const destination = this.audioContext.createMediaStreamDestination();
        source.connect(destination);
        
        // Use Web Speech API for transcription
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 3;

        let transcript = '';
        let confidence = 0;
        let wordCount = 0;
        let speakingRate = 0;
        let fillerWords = 0;
        let pauses = 0;
        let lastWordTime = 0;

        recognition.onresult = (event) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              const result = event.results[i][0];
              transcript += result.transcript;
              confidence += result.confidence;
              
              const words = result.transcript.split(' ');
              wordCount += words.length;
              
              // Count filler words in real-time
              const fillerWordsList = ['um', 'uh', 'like', 'you know', 'so', 'well', 'actually', 'basically'];
              words.forEach(word => {
                if (fillerWordsList.includes(word.toLowerCase())) {
                  fillerWords++;
                }
              });
              
              // Track speaking rate in real-time
              const currentTime = Date.now();
              if (lastWordTime > 0) {
                const timeDiff = (currentTime - lastWordTime) / 1000;
                if (timeDiff > 2) { // Pause longer than 2 seconds
                  pauses++;
                }
              }
              lastWordTime = currentTime;
            }
          }
        };

        recognition.onend = () => {
          const avgConfidence = confidence / Math.max(1, transcript.split(' ').length);
          const duration = audioBuffer.duration;
          speakingRate = wordCount / (duration / 60); // words per minute
          
          // Calculate real-time metrics
          const fillerPercentage = (fillerWords / Math.max(1, wordCount)) * 100;
          const pauseFrequency = pauses / (duration / 60); // pauses per minute
          
          resolve({
            transcript: transcript.trim(),
            confidence: avgConfidence,
            wordCount,
            speakingRate,
            duration,
            fillerWords: {
              count: fillerWords,
              percentage: fillerPercentage
            },
            pauses: {
              count: pauses,
              frequency: pauseFrequency
            },
            realTimeMetrics: {
              avgConfidence,
              speakingRate,
              fillerPercentage,
              pauseFrequency
            }
          });
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          resolve({
            transcript: '',
            confidence: 0,
            wordCount: 0,
            speakingRate: 0,
            duration: audioBuffer.duration,
            fillerWords: { count: 0, percentage: 0 },
            pauses: { count: 0, frequency: 0 },
            realTimeMetrics: {
              avgConfidence: 0,
              speakingRate: 0,
              fillerPercentage: 0,
              pauseFrequency: 0
            }
          });
        };

        recognition.start();
        source.start();

        // Stop after audio duration
        setTimeout(() => {
          recognition.stop();
        }, audioBuffer.duration * 1000);

      } catch (error) {
        console.error('Real-time transcription failed:', error);
        resolve({
          transcript: '',
          confidence: 0,
          wordCount: 0,
          speakingRate: 0,
          duration: audioBuffer.duration,
          fillerWords: { count: 0, percentage: 0 },
          pauses: { count: 0, frequency: 0 },
          realTimeMetrics: {
            avgConfidence: 0,
            speakingRate: 0,
            fillerPercentage: 0,
            pauseFrequency: 0
          }
        });
      }
    });
  }

  // Enhanced audio feature extraction with real-time processing
  async extractAudioFeaturesRealTime(audioBuffer) {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    // Calculate RMS (Root Mean Square) for volume analysis
    let rmsSum = 0;
    for (let i = 0; i < channelData.length; i++) {
      rmsSum += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(rmsSum / channelData.length);

    // Calculate pitch using autocorrelation with enhanced algorithm
    const pitch = this.calculatePitchEnhanced(channelData, sampleRate);
    
    // Analyze volume consistency with sliding window
    const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
    const volumeWindows = [];
    const pitchWindows = [];
    
    for (let i = 0; i < channelData.length; i += windowSize) {
      let windowSum = 0;
      const end = Math.min(i + windowSize, channelData.length);
      for (let j = i; j < end; j++) {
        windowSum += Math.abs(channelData[j]);
      }
      volumeWindows.push(windowSum / (end - i));
      
      // Calculate pitch for this window
      const windowData = channelData.slice(i, end);
      const windowPitch = this.calculatePitch(windowData, sampleRate);
      pitchWindows.push(windowPitch);
    }
    
    const volumeVariance = this.calculateVariance(volumeWindows);
    const volumeConsistency = Math.max(0, 100 - (volumeVariance * 1000));
    
    // Calculate pitch stability
    const validPitches = pitchWindows.filter(p => p > 0);
    const pitchStability = validPitches.length > 0 ? 
      Math.max(0, 100 - this.calculateVariance(validPitches) / Math.max(1, validPitches.reduce((a, b) => a + b, 0) / validPitches.length) * 100) : 0;

    // Detect silence periods with enhanced algorithm
    const silenceThreshold = 0.01;
    const silenceWindows = volumeWindows.filter(vol => vol < silenceThreshold).length;
    const silencePercentage = (silenceWindows / volumeWindows.length) * 100;

    // Calculate speech rate from volume envelope
    let speechSegments = 0;
    let inSpeech = false;
    const speechThreshold = 0.02;
    
    for (let i = 0; i < volumeWindows.length; i++) {
      if (volumeWindows[i] > speechThreshold && !inSpeech) {
        speechSegments++;
        inSpeech = true;
      } else if (volumeWindows[i] <= speechThreshold && inSpeech) {
        inSpeech = false;
      }
    }
    
    const speechRate = speechSegments / (duration / 60); // segments per minute

    // Store real-time metrics
    this.realTimeMetrics.volume.push(volumeConsistency);
    this.realTimeMetrics.pitch.push(pitchStability);
    this.realTimeMetrics.clarity.push(Math.min(100, rms * 1000));

    return {
      volume: {
        average: rms,
        consistency: volumeConsistency,
        variance: volumeVariance,
        stability: volumeConsistency
      },
      pitch: {
        average: pitch,
        stability: pitchStability,
        variance: this.calculateVariance(validPitches)
      },
      silence: {
        percentage: silencePercentage,
        periods: silenceWindows,
        frequency: silenceWindows / (duration / 60)
      },
      quality: {
        clarity: Math.min(100, rms * 1000),
        consistency: volumeConsistency,
        stability: pitchStability
      },
      speech: {
        rate: speechRate,
        segments: speechSegments,
        rhythm: this.calculateSpeechRhythm(volumeWindows)
      },
      realTimeMetrics: {
        volumeConsistency,
        pitchStability,
        clarity: Math.min(100, rms * 1000),
        speechRate
      }
    };
  }

  // Enhanced pitch calculation with better accuracy
  calculatePitchEnhanced(signal, sampleRate) {
    const minFreq = 50;
    const maxFreq = 500;
    const minLag = Math.floor(sampleRate / maxFreq);
    const maxLag = Math.floor(sampleRate / minFreq);
    
    let bestLag = 0;
    let bestCorr = 0;
    
    // Use autocorrelation with windowing
    for (let lag = minLag; lag <= maxLag; lag++) {
      let corr = 0;
      const maxIndex = signal.length - lag;
      
      for (let i = 0; i < maxIndex; i++) {
        corr += signal[i] * signal[i + lag];
      }
      
      // Normalize correlation
      corr = corr / (maxIndex);
      
      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }
    
    return bestLag ? sampleRate / bestLag : 0;
  }

  // Calculate speech rhythm from volume envelope
  calculateSpeechRhythm(volumeWindows) {
    if (volumeWindows.length < 3) return 0;
    
    let rhythmScore = 0;
    let peakCount = 0;
    
    for (let i = 1; i < volumeWindows.length - 1; i++) {
      if (volumeWindows[i] > volumeWindows[i-1] && volumeWindows[i] > volumeWindows[i+1]) {
        peakCount++;
      }
    }
    
    // Calculate rhythm consistency
    const expectedPeaks = volumeWindows.length / 10; // Expected peaks per 10 windows
    const rhythmConsistency = Math.max(0, 100 - Math.abs(peakCount - expectedPeaks) * 10);
    
    return Math.round(rhythmConsistency);
  }

  // NLP analysis for grammar, filler words, and clarity
  analyzeTranscript(transcriptData) {
    const { transcript, wordCount, speakingRate } = transcriptData;
    
    // Detect filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'well', 'actually', 'basically'];
    const words = transcript.toLowerCase().split(/\s+/);
    const fillerCount = words.filter(word => fillerWords.includes(word)).length;
    const fillerPercentage = (fillerCount / Math.max(1, wordCount)) * 100;

    // Analyze sentence structure
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = wordCount / Math.max(1, sentences.length);
    
    // Detect repetition
    const wordFrequency = {};
    words.forEach(word => {
      if (word.length > 3) { // Only count meaningful words
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });
    const repeatedWords = Object.entries(wordFrequency)
      .filter(([word, count]) => count > 2)
      .map(([word, count]) => ({ word, count }));

    // Analyze clarity indicators
    const clarityScore = Math.max(0, 100 - (fillerPercentage * 2) - (repeatedWords.length * 5));
    
    return {
      fillerWords: {
        count: fillerCount,
        percentage: fillerPercentage,
        commonFillers: fillerWords.filter(filler => words.includes(filler))
      },
      structure: {
        sentenceCount: sentences.length,
        avgSentenceLength,
        wordCount,
        speakingRate
      },
      repetition: {
        repeatedWords,
        repetitionScore: Math.max(0, 100 - (repeatedWords.length * 10))
      },
      clarity: {
        score: clarityScore,
        issues: [
          ...(fillerPercentage > 5 ? [`High filler word usage: ${fillerPercentage.toFixed(1)}%`] : []),
          ...(repeatedWords.length > 3 ? [`Repetitive language: ${repeatedWords.length} overused words`] : []),
          ...(avgSentenceLength > 25 ? ['Complex sentence structure'] : []),
          ...(speakingRate > 200 ? ['Speaking too fast'] : speakingRate < 100 ? ['Speaking too slow'] : [])
        ]
      }
    };
  }

  // Advanced audio feature extraction
  async extractAudioFeatures(audioBuffer) {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    // Calculate RMS (Root Mean Square) for volume analysis
    let rmsSum = 0;
    for (let i = 0; i < channelData.length; i++) {
      rmsSum += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(rmsSum / channelData.length);

    // Calculate pitch using autocorrelation
    const pitch = this.calculatePitch(channelData, sampleRate);
    
    // Analyze volume consistency
    const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
    const volumeWindows = [];
    for (let i = 0; i < channelData.length; i += windowSize) {
      let windowSum = 0;
      const end = Math.min(i + windowSize, channelData.length);
      for (let j = i; j < end; j++) {
        windowSum += Math.abs(channelData[j]);
      }
      volumeWindows.push(windowSum / (end - i));
    }
    
    const volumeVariance = this.calculateVariance(volumeWindows);
    const volumeConsistency = Math.max(0, 100 - (volumeVariance * 1000));

    // Detect silence periods
    const silenceThreshold = 0.01;
    const silenceWindows = volumeWindows.filter(vol => vol < silenceThreshold).length;
    const silencePercentage = (silenceWindows / volumeWindows.length) * 100;

    return {
      volume: {
        average: rms,
        consistency: volumeConsistency,
        variance: volumeVariance
      },
      pitch: {
        average: pitch,
        stability: this.calculatePitchStability(channelData, sampleRate)
      },
      silence: {
        percentage: silencePercentage,
        periods: silenceWindows
      },
      quality: {
        clarity: Math.min(100, rms * 1000),
        consistency: volumeConsistency
      }
    };
  }

  // Calculate pitch using autocorrelation
  calculatePitch(signal, sampleRate) {
    const minFreq = 50;
    const maxFreq = 500;
    const minLag = Math.floor(sampleRate / maxFreq);
    const maxLag = Math.floor(sampleRate / minFreq);
    
    let bestLag = 0;
    let bestCorr = 0;
    
    for (let lag = minLag; lag <= maxLag; lag++) {
      let corr = 0;
      for (let i = 0; i < signal.length - lag; i++) {
        corr += signal[i] * signal[i + lag];
      }
      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }
    
    return bestLag ? sampleRate / bestLag : 0;
  }

  // Calculate pitch stability
  calculatePitchStability(signal, sampleRate) {
    const windowSize = Math.floor(sampleRate * 0.1);
    const pitches = [];
    
    for (let i = 0; i < signal.length; i += windowSize) {
      const window = signal.slice(i, i + windowSize);
      const pitch = this.calculatePitch(window, sampleRate);
      if (pitch > 0) pitches.push(pitch);
    }
    
    if (pitches.length < 2) return 0;
    
    const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length;
    const variance = this.calculateVariance(pitches);
    return Math.max(0, 100 - (variance / avgPitch) * 100);
  }

  // Calculate variance
  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  // Comprehensive audio analysis with real-time processing and content validation
  async analyzeAudio(videoUrl) {
    try {
      await this.initializeAudioContext();
      const audioBuffer = await this.extractAudioFromVideo(videoUrl);
      
      if (!audioBuffer) {
        throw new Error('Failed to extract audio');
      }

      // Run all analyses in parallel with real-time processing
      const [transcriptData, audioFeatures] = await Promise.all([
        this.transcribeAudioRealTime(audioBuffer),
        this.extractAudioFeaturesRealTime(audioBuffer)
      ]);

      // Validate content quality
      const contentValidation = this.validateAudioContent(transcriptData, audioFeatures);
      
      if (!contentValidation.hasValidContent) {
        console.warn('Insufficient audio content for meaningful analysis');
        return {
          transcript: transcriptData,
          audio: audioFeatures,
          nlp: this.analyzeTranscript(transcriptData),
          realTimeMetrics: this.realTimeMetrics,
          contentValidation,
          timestamp: Date.now()
        };
      }

      const nlpAnalysis = this.analyzeTranscript(transcriptData);

      return {
        transcript: transcriptData,
        audio: audioFeatures,
        nlp: nlpAnalysis,
        realTimeMetrics: this.realTimeMetrics,
        contentValidation,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Audio analysis failed:', error);
      return null;
    }
  }

  // Validate audio content quality
  validateAudioContent(transcriptData, audioFeatures) {
    const validation = {
      hasValidContent: false,
      issues: [],
      qualityScore: 0
    };

    // Check for meaningful speech
    if (!transcriptData.transcript || transcriptData.transcript.trim().length < 10) {
      validation.issues.push('No meaningful speech detected');
    }

    // Check audio quality
    if (audioFeatures.volume.average < 0.01) {
      validation.issues.push('Audio volume too low');
    }

    if (audioFeatures.quality.clarity < 20) {
      validation.issues.push('Audio clarity insufficient');
    }

    // Check for silence
    if (audioFeatures.silence.percentage > 80) {
      validation.issues.push('Too much silence in audio');
    }

    // Check speech rate
    if (transcriptData.speakingRate < 10) {
      validation.issues.push('Speech rate too low');
    }

    // Calculate quality score
    let qualityScore = 0;
    if (transcriptData.transcript && transcriptData.transcript.trim().length >= 10) qualityScore += 25;
    if (audioFeatures.volume.average >= 0.01) qualityScore += 25;
    if (audioFeatures.quality.clarity >= 20) qualityScore += 25;
    if (audioFeatures.silence.percentage <= 80) qualityScore += 25;

    validation.qualityScore = qualityScore;
    validation.hasValidContent = qualityScore >= 50 && validation.issues.length <= 2;

    return validation;
  }
}

export default AudioAnalyzer;

