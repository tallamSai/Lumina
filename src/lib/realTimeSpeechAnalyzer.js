// Real-time Speech Analysis Service
// Analyzes user speech in real-time for presentation skills
// Now with enhanced Whisper integration for better accuracy

import { WhisperSpeechToText } from './whisperSpeechToText';

export class RealTimeSpeechAnalyzer {
  constructor() {
    this.isListening = false;
    this.isAnalyzing = false;
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.dataArray = null;
    this.speechBuffer = [];
    this.currentSpeech = '';
    this.accumulatedSpeech = ''; // For longer sentences
    this.silenceTimeout = null;
    this.silenceThreshold = 1800; // faster turn completion
    this.minSpeechLength = 500; // respond sooner
    this.volumeThreshold =8; // more sensitive
    this.noiseFloor = 0; // adaptive baseline
    this.noiseFloorReady = false; // set after calibration
    this.calibrationSamples = [];
    this.maxCalibrationSamples = 60; // ~1s at rAF ~60Hz
    this.calibrationTimeoutId = null;
    this.speechHistory = []; // Track recent speech for better accuracy
    this.maxHistoryLength = 5;
    this.recognitionRestartDelay = 100; // Slower restart for stability
    this.hasDetectedSpeech = false; // Track if we've detected actual speech
    this.speechStartTime = 0; // Track when speech started
    this.lastSpeechTime = 0; // Track last speech activity
    this.sentenceEndings = ['.', '!', '?', ':', ';']; // Natural sentence endings
    this.adaptiveTimeout = true; // Enable adaptive timeout based on speech length
    this.minWordsForLongSentence = 6; // consider fewer words a sentence
    // VAD debouncing
    this.loudFramesToStart = 6;
    this.quietFramesToStop = 10;
    this.loudFrameCounter = 0;
    this.quietFrameCounter = 0;
    
    // Enhanced speech-to-text with Whisper
    this.whisperSTT = new WhisperSpeechToText();
    this.useWhisper = true; // Whisper is required
    
    this.callbacks = {
      onSpeechStart: null,
      onSpeechEnd: null,
      onSpeechAnalysis: null,
      onError: null
    };
  }

  // Initialize audio context and speech recognition
  async initialize() {
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // Initialize Whisper speech-to-text (required)
      console.log('🎤 SPEECH ANALYZER: Initializing Whisper speech-to-text...');
      await this.whisperSTT.initialize();
      console.log('🎤 SPEECH ANALYZER: ✅ Whisper speech-to-text initialized successfully');
      console.log('🎤 SPEECH ANALYZER: 🚀 Using WHISPER for high-accuracy speech recognition');
      console.log('🎤 SPEECH ANALYZER: 📊 Service Status: WHISPER ACTIVE - High accuracy speech recognition enabled');
      
      // Set up Whisper callbacks
      this.whisperSTT.onTranscript((data) => {
        this.handleWhisperTranscript(data);
      });
      
      this.whisperSTT.onError((error) => {
        console.error('🎤 SPEECH ANALYZER: Whisper error:', error);
        if (this.callbacks.onError) {
          this.callbacks.onError(error);
        }
      });
      
      this.whisperSTT.onListeningStart(() => {
        console.log('🎤 SPEECH ANALYZER: Whisper listening started');
        if (this.callbacks.onSpeechStart) {
          this.callbacks.onSpeechStart();
        }
      });
      
      this.whisperSTT.onListeningEnd(() => {
        console.log('🎤 SPEECH ANALYZER: Whisper listening ended');
        if (this.callbacks.onSpeechEnd) {
          this.callbacks.onSpeechEnd();
        }
      });

      return true;
    } catch (error) {
      console.error('Error initializing speech analyzer:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      return false;
    }
  }

  // Start listening for speech
  async startListening(stream) {
    if (this.isListening) {
      console.log('Already listening, skipping...');
      return;
    }

    try {
      console.log('Starting speech recognition...');
      this.isListening = true;
      
      // Reset accumulated speech for new session
      this.accumulatedSpeech = '';
      this.currentSpeech = '';
      this.speechStartTime = Date.now();
      this.lastSpeechTime = Date.now();
      
      // Validate stream
      if (!stream) {
        throw new Error('No media stream provided to RealTimeSpeechAnalyzer.startListening');
      }
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) {
        throw new Error('Provided media stream has no audio tracks');
      }

      // Always use Whisper and also connect microphone to analyser for volume/silence
      if (stream && this.audioContext) {
        this.microphone = this.audioContext.createMediaStreamSource(stream);
        this.microphone.connect(this.analyser);
        console.log('Microphone connected');
      }
      // Kick off quick noise calibration before analysis loop
      this.startNoiseCalibration();
      console.log('🎤 SPEECH ANALYZER: 🚀 Starting WHISPER speech recognition...');
      await this.whisperSTT.startListening(stream);
      // Start analyser-driven volume detection UI
      this.startAudioAnalysis();
      
    } catch (error) {
      console.error('Error starting speech analysis:', error);
      this.isListening = false;
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }
  }

  // Stop listening
  stopListening() {
    this.isListening = false;
    this.isAnalyzing = false;
    
    // Process any remaining accumulated speech before stopping
    if (this.accumulatedSpeech.trim()) {
      console.log('Processing final accumulated speech before stopping:', this.accumulatedSpeech.trim());
      const processedTranscript = this.enhanceTranscript(this.accumulatedSpeech.trim());
      this.processSpeech(processedTranscript);
    }
    
    // Clear accumulated speech
    this.accumulatedSpeech = '';
    this.currentSpeech = '';
    
    // Stop Whisper if active
    if (this.useWhisper && this.whisperSTT) {
      this.whisperSTT.stopListening();
    }
    
    
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  // Handle Whisper transcript results
  handleWhisperTranscript(data) {
    console.log('🎤 SPEECH ANALYZER: 🚀 WHISPER transcript received:', data);
    
    const transcript = data.transcript;
    const isFinal = !!data.isFinal;
    const confidence = data.confidence || 0.95; // High confidence for Whisper
    
    console.log('🎤 SPEECH ANALYZER: 📝 WHISPER transcript text:', transcript);
    console.log('🎤 SPEECH ANALYZER: 🎯 WHISPER confidence:', confidence);
    
    // Update current speech
    this.currentSpeech = transcript;
    this.lastSpeechTime = Date.now();
    
    // Only process final transcripts to avoid repetitive responses
    if (isFinal && transcript.trim()) {
      console.log('🎤 SPEECH ANALYZER: 🔄 Processing FINAL WHISPER transcript:', transcript.trim());
      const processedTranscript = this.enhanceTranscript(transcript.trim());
      this.processSpeech(processedTranscript);
    }
  }

  // Handle speech recognition results with improved accuracy for longer sentences
  handleSpeechResult(event) {
    console.log('Speech result received:', event);
    
    let interimTranscript = '';
    let finalTranscript = '';
    let bestTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      
      // Get the best alternative transcript
      let transcript = '';
      let confidence = 0;
      
      if (result.length > 0) {
        // Try to get the highest confidence alternative
        for (let j = 0; j < result.length; j++) {
          const alternative = result[j];
          if (alternative.confidence && alternative.confidence > confidence) {
            transcript = alternative.transcript;
            confidence = alternative.confidence;
          }
        }
        
        // If no confidence scores, use the first alternative
        if (!transcript && result[0]) {
          transcript = result[0].transcript;
        }
      }
      
      if (result.isFinal) {
        finalTranscript += transcript;
        console.log('Final transcript:', transcript, 'Confidence:', confidence);
      } else {
        interimTranscript += transcript;
        console.log('Interim transcript:', transcript);
      }
    }

    // Update current speech with the best transcript
    this.currentSpeech = finalTranscript + interimTranscript;
    
    // Update last speech time for adaptive timeout
    if (finalTranscript.trim() || interimTranscript.trim()) {
      this.lastSpeechTime = Date.now();
    }

    // Accumulate speech for longer sentences
    if (finalTranscript.trim()) {
      this.accumulatedSpeech += finalTranscript + ' ';
      console.log('Accumulated speech so far:', this.accumulatedSpeech.trim());
      
      // Check if this looks like a complete sentence or thought
      const isCompleteSentence = this.isCompleteSentence(this.accumulatedSpeech.trim());
      const isLongSentence = this.isLongSentence(this.accumulatedSpeech.trim());
      
      console.log('Is complete sentence:', isCompleteSentence);
      console.log('Is long sentence:', isLongSentence);
      
      // Process if it's a complete sentence or if it's getting quite long
      if (isCompleteSentence || (isLongSentence && this.shouldProcessLongSentence())) {
        console.log('Processing accumulated speech:', this.accumulatedSpeech.trim());
        const processedTranscript = this.enhanceTranscript(this.accumulatedSpeech.trim());
        this.processSpeech(processedTranscript);
        this.accumulatedSpeech = ''; // Reset after processing
      }
    }

    // Reset silence timeout with adaptive duration
    this.resetSilenceTimeout();
  }

  // Enhance transcript accuracy using speech history
  enhanceTranscript(transcript) {
    // Add to speech history
    this.speechHistory.push(transcript);
    if (this.speechHistory.length > this.maxHistoryLength) {
      this.speechHistory.shift();
    }

    // Advanced text cleaning and enhancement
    let enhanced = transcript
      .replace(/\s+/g, ' ') // Remove extra spaces
      .replace(/[^\w\s.,!?]/g, '') // Remove special characters except basic punctuation
      .replace(/\b(um|uh|ah|er|mm|hmm)\b/gi, '') // Remove filler words
      .replace(/\s+/g, ' ') // Clean up spaces again
      .trim();

    // Apply context-based corrections using speech history
    enhanced = this.applyContextCorrections(enhanced, this.speechHistory);

    // Apply common speech recognition corrections
    enhanced = this.applyCommonCorrections(enhanced);

    console.log('Enhanced transcript:', enhanced);
    return enhanced;
  }

  // Apply common speech recognition corrections
  applyCommonCorrections(transcript) {
    const corrections = {
      // Common misrecognitions
      'can you': 'can you',
      'could you': 'could you',
      'would you': 'would you',
      'tell me': 'tell me',
      'explain': 'explain',
      'what is': 'what is',
      'how do': 'how do',
      'why': 'why',
      'when': 'when',
      'where': 'where',
      'interview': 'interview',
      'prepare': 'prepare',
      'practice': 'practice',
      'question': 'question',
      'answer': 'answer',
      'job': 'job',
      'career': 'career',
      'experience': 'experience',
      'skills': 'skills',
      'strengths': 'strengths',
      'weaknesses': 'weaknesses',
      'presentation': 'presentation',
      'speaking': 'speaking',
      'voice': 'voice',
      'confidence': 'confidence',
      'improve': 'improve',
      'help': 'help',
      'assist': 'assist',
      'coach': 'coach',
      'train': 'train'
    };

    let corrected = transcript;
    Object.entries(corrections).forEach(([wrong, right]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      corrected = corrected.replace(regex, right);
    });

    return corrected;
  }

  // Apply context-based corrections
  applyContextCorrections(transcript, context) {
    // Simple word corrections based on common speech recognition errors
    const corrections = {
      'thank you': 'thank you',
      'thanks': 'thanks',
      'hello': 'hello',
      'hi': 'hi',
      'presentation': 'presentation',
      'practice': 'practice',
      'speaking': 'speaking',
      'voice': 'voice',
      'confidence': 'confidence',
      'improve': 'improve'
    };

    let corrected = transcript;
    Object.entries(corrections).forEach(([wrong, right]) => {
      const regex = new RegExp(wrong, 'gi');
      corrected = corrected.replace(regex, right);
    });

    return corrected;
  }

  // Process completed speech with improved handling for longer sentences
  async processSpeech(transcript) {
    if (!transcript || transcript.length < 3) {
      console.log('Speech too short, skipping:', transcript);
      return;
    }

    // Check if this is actual speech (not just noise or silence)
    const speechDuration = Date.now() - this.speechStartTime;
    if (speechDuration < this.minSpeechLength) {
      console.log('Speech too short in duration, skipping:', transcript);
      return;
    }

    // Enhanced meaningful content detection for longer sentences
    const meaningfulWords = transcript.split(' ').filter(word => 
      word.length > 2 && !['um', 'uh', 'ah', 'er', 'mm', 'hmm', 'okay', 'ok', 'yeah', 'yes', 'no'].includes(word.toLowerCase())
    );
    
    // For longer sentences, be more lenient with meaningful word count
    const minMeaningfulWords = transcript.split(' ').length > 10 ? 3 : 1;
    
    if (meaningfulWords.length < minMeaningfulWords) {
      console.log('Not enough meaningful words, skipping:', transcript);
      return;
    }

    // Check for conversation starters and interview-related content
    const conversationStarters = ['hello', 'hi', 'hey', 'can you', 'could you', 'would you', 'tell me', 'explain', 'what is', 'how do', 'why', 'when', 'where'];
    const interviewKeywords = ['interview', 'question', 'answer', 'prepare', 'practice', 'job', 'career', 'experience', 'skills', 'strengths', 'weaknesses'];
    
    const hasConversationStarter = conversationStarters.some(starter => 
      transcript.toLowerCase().includes(starter)
    );
    const hasInterviewContent = interviewKeywords.some(keyword => 
      transcript.toLowerCase().includes(keyword)
    );

    console.log('Processing meaningful speech:', transcript);
    console.log('Speech length:', transcript.length, 'characters');
    console.log('Word count:', transcript.split(' ').length);
    console.log('Has conversation starter:', hasConversationStarter);
    console.log('Has interview content:', hasInterviewContent);
    
    // Analyze the speech
    const analysis = await this.analyzeSpeech(transcript);
    
    // Trigger callbacks (mark as final to gate UI)
    if (this.callbacks.onSpeechAnalysis) {
      this.callbacks.onSpeechAnalysis({
        transcript,
        analysis,
        timestamp: Date.now(),
        isLongSentence: transcript.split(' ').length > this.minWordsForLongSentence,
        isWhisper: this.useWhisper && this.whisperSTT,
        service: this.useWhisper && this.whisperSTT ? 'Whisper' : 'Web Speech API',
        isFinal: true
      });
    }
  }

  // Analyze speech content and delivery
  async analyzeSpeech(transcript) {
    const analysis = {
      content: this.analyzeContent(transcript),
      delivery: this.analyzeDelivery(transcript),
      confidence: this.analyzeConfidence(transcript),
      engagement: this.analyzeEngagement(transcript),
      clarity: this.analyzeClarity(transcript),
      overall: 0
    };

    // Calculate overall score
    analysis.overall = Math.round(
      (analysis.content + analysis.delivery + analysis.confidence + 
       analysis.engagement + analysis.clarity) / 5
    );

    return analysis;
  }

  // Analyze content quality
  analyzeContent(transcript) {
    const words = transcript.split(' ');
    const wordCount = words.length;
    
    // Check for filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'well', 'actually'];
    const fillerCount = words.filter(word => 
      fillerWords.includes(word.toLowerCase())
    ).length;
    
    // Check for repetition
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const repetitionScore = (uniqueWords.size / wordCount) * 100;
    
    // Check for sentence structure
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
    
    // Calculate content score
    let score = 70; // Base score
    
    // Penalize filler words
    const fillerRatio = fillerCount / wordCount;
    if (fillerRatio > 0.1) score -= 20;
    else if (fillerRatio > 0.05) score -= 10;
    
    // Reward good repetition score
    if (repetitionScore > 80) score += 10;
    else if (repetitionScore < 60) score -= 15;
    
    // Reward good sentence structure
    if (avgSentenceLength >= 8 && avgSentenceLength <= 20) score += 10;
    else if (avgSentenceLength < 5 || avgSentenceLength > 30) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  // Analyze delivery (pace, rhythm, etc.)
  analyzeDelivery(transcript) {
    const words = transcript.split(' ');
    const wordCount = words.length;
    
    // Estimate speaking time (rough calculation)
    const estimatedTime = wordCount * 0.5; // Assume 2 words per second
    const pace = wordCount / estimatedTime;
    
    let score = 70; // Base score
    
    // Check pace
    if (pace >= 1.5 && pace <= 3.0) score += 15; // Good pace
    else if (pace < 1.0 || pace > 4.0) score -= 20; // Too slow or fast
    
    // Check for pauses (rough estimation)
    const pauseIndicators = transcript.match(/[.!?]/g) || [];
    const pauseRatio = pauseIndicators.length / wordCount;
    
    if (pauseRatio >= 0.05 && pauseRatio <= 0.15) score += 10; // Good pause usage
    else if (pauseRatio < 0.02) score -= 10; // Too few pauses
    
    return Math.max(0, Math.min(100, score));
  }

  // Analyze confidence indicators
  analyzeConfidence(transcript) {
    const words = transcript.toLowerCase().split(' ');
    let score = 70; // Base score
    
    // Check for confidence indicators
    const confidenceWords = ['definitely', 'certainly', 'absolutely', 'clearly', 'obviously'];
    const confidenceCount = words.filter(word => 
      confidenceWords.includes(word)
    ).length;
    
    // Check for uncertainty indicators
    const uncertaintyWords = ['maybe', 'perhaps', 'might', 'could', 'possibly', 'i think', 'i guess'];
    const uncertaintyCount = words.filter(word => 
      uncertaintyWords.includes(word)
    ).length;
    
    // Check for hedging
    const hedgingWords = ['kind of', 'sort of', 'a bit', 'somewhat', 'rather'];
    const hedgingCount = words.filter(word => 
      hedgingWords.includes(word)
    ).length;
    
    // Adjust score based on indicators
    score += confidenceCount * 5;
    score -= uncertaintyCount * 3;
    score -= hedgingCount * 2;
    
    // Check for question patterns (can indicate uncertainty)
    const questionCount = (transcript.match(/\?/g) || []).length;
    if (questionCount > 2) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  // Analyze engagement factors
  analyzeEngagement(transcript) {
    const words = transcript.toLowerCase().split(' ');
    let score = 70; // Base score
    
    // Check for engaging words
    const engagingWords = ['you', 'your', 'we', 'us', 'our', 'together', 'let\'s'];
    const engagingCount = words.filter(word => 
      engagingWords.includes(word)
    ).length;
    
    // Check for emotional words
    const emotionalWords = ['exciting', 'amazing', 'incredible', 'important', 'crucial', 'vital'];
    const emotionalCount = words.filter(word => 
      emotionalWords.includes(word)
    ).length;
    
    // Check for storytelling elements
    const storyWords = ['story', 'example', 'imagine', 'picture', 'suppose'];
    const storyCount = words.filter(word => 
      storyWords.includes(word)
    ).length;
    
    // Adjust score
    score += engagingCount * 2;
    score += emotionalCount * 5;
    score += storyCount * 8;
    
    // Check for variety in sentence starters
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const starters = sentences.map(s => s.trim().split(' ')[0].toLowerCase());
    const uniqueStarters = new Set(starters);
    
    if (uniqueStarters.size / sentences.length > 0.7) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  // Analyze clarity
  analyzeClarity(transcript) {
    const words = transcript.split(' ');
    let score = 70; // Base score
    
    // Check for complex words (rough estimation)
    const complexWords = words.filter(word => 
      word.length > 8 || /[A-Z]/.test(word)
    );
    const complexityRatio = complexWords.length / words.length;
    
    if (complexityRatio > 0.3) score -= 15; // Too complex
    else if (complexityRatio < 0.1) score += 10; // Good balance
    
    // Check for repetition of key terms
    const wordFreq = {};
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 3) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });
    
    const maxFreq = Math.max(...Object.values(wordFreq));
    if (maxFreq > words.length * 0.1) score -= 10; // Too much repetition
    
    // Check for sentence length variation
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const lengths = sentences.map(s => s.trim().split(' ').length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / lengths.length;
    
    if (variance > 25) score += 10; // Good variation
    else if (variance < 10) score -= 5; // Too uniform
    
    return Math.max(0, Math.min(100, score));
  }

  // Start audio analysis
  startAudioAnalysis() {
    const analyze = () => {
      if (!this.isListening) return;
      
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Calculate volume level
      const volume = this.calculateVolume();
      // Continuously refine noise floor when user is not speaking
      this.updateNoiseFloor(volume);
      
      // Debounced VAD: require consecutive loud/quiet frames
      const dynamicThreshold = this.getDynamicThreshold();
      if (volume > dynamicThreshold) {
        this.loudFrameCounter += 1;
        this.quietFrameCounter = 0;
      } else if (volume < (dynamicThreshold - 12)) {
        this.quietFrameCounter += 1;
        this.loudFrameCounter = 0;
      } else {
        if (this.loudFrameCounter > 0) this.loudFrameCounter -= 1;
        if (this.quietFrameCounter > 0) this.quietFrameCounter -= 1;
      }

      if (!this.isAnalyzing && this.loudFrameCounter >= this.loudFramesToStart) {
        this.isAnalyzing = true;
        this.hasDetectedSpeech = true;
        this.speechStartTime = Date.now();
        console.log('Speech detected, volume:', volume);
        if (this.callbacks.onSpeechStart) {
          this.callbacks.onSpeechStart();
        }
      }

      if (this.isAnalyzing && this.quietFrameCounter >= this.quietFramesToStop) {
        this.isAnalyzing = false;
        console.log('Speech ended, volume:', volume);
        if (this.callbacks.onSpeechEnd) {
          this.callbacks.onSpeechEnd();
        }
      }
      
      requestAnimationFrame(analyze);
    };
    
    analyze();
  }

  // Quick calibration over ~1s to establish ambient noise floor
  startNoiseCalibration() {
    this.noiseFloorReady = false;
    this.calibrationSamples = [];
    if (this.calibrationTimeoutId) {
      clearTimeout(this.calibrationTimeoutId);
      this.calibrationTimeoutId = null;
    }
    const collect = () => {
      if (!this.isListening || !this.dataArray) return;
      this.analyser.getByteFrequencyData(this.dataArray);
      const v = this.calculateVolume();
      this.calibrationSamples.push(v);
      if (this.calibrationSamples.length < this.maxCalibrationSamples) {
        requestAnimationFrame(collect);
      }
    };
    requestAnimationFrame(collect);
    this.calibrationTimeoutId = setTimeout(() => {
      if (this.calibrationSamples.length > 0) {
        const sorted = [...this.calibrationSamples].sort((a,b)=>a-b);
        // Use 75th percentile as noise floor to be robust to transient spikes
        const idx = Math.floor(sorted.length * 0.75);
        this.noiseFloor = sorted[idx];
        this.noiseFloorReady = true;
        console.log('Calibrated noise floor:', this.noiseFloor);
      }
      this.calibrationTimeoutId = null;
    }, 1100);
  }

  // Update noise floor slowly when quiet frames dominate
  updateNoiseFloor(currentVolume) {
    if (!this.noiseFloorReady) return;
    // If we have consecutive quiet frames, treat as ambient
    if (this.quietFrameCounter > this.loudFrameCounter) {
      const alpha = 0.02; // slow EMA to avoid chasing speech
      this.noiseFloor = (1 - alpha) * this.noiseFloor + alpha * currentVolume;
    }
  }

  // Compute threshold relative to noise floor
  getDynamicThreshold() {
    if (!this.noiseFloorReady) return this.volumeThreshold;
    // Ensure minimum headroom above noise floor
    const headroom = 10; // dB-ish arbitrary units of our scale
    const adaptive = Math.max(this.noiseFloor + headroom, this.volumeThreshold);
    return adaptive;
  }

  // Calculate volume level
  calculateVolume() {
    if (!this.dataArray) return 0;
    
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    
    return (sum / this.dataArray.length) * 2; // Amplify for better detection
  }

  // Check if speech appears to be a complete sentence
  isCompleteSentence(speech) {
    if (!speech.trim()) return false;
    
    const trimmed = speech.trim();
    const lastChar = trimmed[trimmed.length - 1];
    
    // Check for natural sentence endings
    if (this.sentenceEndings.includes(lastChar)) {
      return true;
    }
    
    // Check for common conversation endings
    const conversationEnders = [
      'thank you', 'thanks', 'that\'s all', 'that\'s it', 'done', 'finished',
      'over to you', 'your turn', 'what do you think', 'any questions'
    ];
    
    const lowerSpeech = trimmed.toLowerCase();
    return conversationEnders.some(ender => lowerSpeech.endsWith(ender));
  }

  // Check if speech is getting quite long
  isLongSentence(speech) {
    if (!speech.trim()) return false;
    
    const words = speech.trim().split(/\s+/);
    return words.length >= this.minWordsForLongSentence;
  }

  // Determine if we should process a long sentence
  shouldProcessLongSentence() {
    const timeSinceLastSpeech = Date.now() - this.lastSpeechTime;
    const speechDuration = Date.now() - this.speechStartTime;
    
    // Process if we've been speaking for a while or if there's been a pause
    return speechDuration > 5000 || timeSinceLastSpeech > 2000;
  }

  // Reset silence timeout with adaptive duration
  resetSilenceTimeout() {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }
    
    // Calculate adaptive timeout based on speech length
    let timeout = this.silenceThreshold;
    
    if (this.adaptiveTimeout && this.accumulatedSpeech.trim()) {
      const wordCount = this.accumulatedSpeech.trim().split(/\s+/).length;
      
      // Increase timeout for longer sentences
      if (wordCount > 10) {
        timeout = Math.min(6000, this.silenceThreshold + (wordCount * 200)); // Max 6 seconds
      } else if (wordCount > 5) {
        timeout = Math.min(4500, this.silenceThreshold + 1000); // Max 4.5 seconds
      }
    }
    
    console.log('Setting silence timeout to:', timeout, 'ms');
    
    this.silenceTimeout = setTimeout(() => {
      // Process accumulated speech on silence as a final utterance
      const toProcess = this.accumulatedSpeech.trim() || this.currentSpeech.trim();
      if (toProcess) {
        console.log('Silence timeout reached, processing FINAL utterance:', toProcess);
        const processedTranscript = this.enhanceTranscript(toProcess);
        this.processSpeech(processedTranscript);
        this.accumulatedSpeech = '';
        this.currentSpeech = '';
      }
    }, timeout);
  }

  // Set callbacks
  onSpeechStart(callback) {
    this.callbacks.onSpeechStart = callback;
  }

  onSpeechEnd(callback) {
    this.callbacks.onSpeechEnd = callback;
  }

  onSpeechAnalysis(callback) {
    this.callbacks.onSpeechAnalysis = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }

  // Test speech recognition
  testSpeechRecognition() {
    console.log('Testing speech recognition...');
    console.log('Speech recognition available:', !!(window.SpeechRecognition || window.webkitSpeechRecognition));
    console.log('Current recognition object:', this.recognition);
    console.log('Is listening:', this.isListening);
    console.log('Audio context:', this.audioContext);
    console.log('Microphone:', this.microphone);
  }

  // Cleanup
  cleanup() {
    this.stopListening();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export default RealTimeSpeechAnalyzer;
