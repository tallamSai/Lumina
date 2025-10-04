// Enhanced Speech-to-Text Service using OpenAI Whisper
// Provides high-accuracy speech recognition with fallback to Web Speech API

export class WhisperSpeechToText {
  constructor() {
    this.isListening = false;
    this.isProcessing = false;
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recognition = null;
    this.fallbackRecognition = null;
    this.whisperApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.whisperEndpoint = 'https://api.openai.com/v1/audio/transcriptions';
    this.maxAudioDuration = 30; // seconds
    this.silenceTimeout = null;
    this.silenceThreshold = 2000; // 2 seconds
    this.callbacks = {
      onTranscript: null,
      onError: null,
      onListeningStart: null,
      onListeningEnd: null
    };
  }

  // Initialize the speech-to-text service
  async initialize() {
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Initialize fallback Web Speech API
      this.initializeFallbackRecognition();
      
      // Check if Whisper API key is available
      if (this.whisperApiKey) {
        console.log('🎤 WHISPER STT: API key found - Whisper will be used for speech recognition');
        console.log('🎤 WHISPER STT: Endpoint configured:', this.whisperEndpoint);
      } else {
        console.warn('🎤 WHISPER STT: No API key found - Will fallback to Web Speech API');
        console.warn('🎤 WHISPER STT: To use Whisper, set VITE_OPENAI_API_KEY in your environment');
      }
      
      console.log('🎤 WHISPER STT: Service initialized successfully');
      return true;
    } catch (error) {
      console.error('🎤 WHISPER STT: Error initializing service:', error);
      throw error;
    }
  }

  // Initialize fallback Web Speech API
  initializeFallbackRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.fallbackRecognition = new SpeechRecognition();
      
      this.fallbackRecognition.continuous = true;
      this.fallbackRecognition.interimResults = true;
      this.fallbackRecognition.lang = 'en-US';
      this.fallbackRecognition.maxAlternatives = 3;
      
      this.fallbackRecognition.onresult = (event) => {
        this.handleFallbackResult(event);
      };
      
      this.fallbackRecognition.onerror = (event) => {
        console.error('Fallback recognition error:', event.error);
        if (this.callbacks.onError) {
          this.callbacks.onError(event.error);
        }
      };
    }
  }

  // Start listening with Whisper API
  async startListening() {
    if (this.isListening) {
      console.log('🎤 WHISPER STT: Already listening');
      return;
    }

    try {
      console.log('🎤 WHISPER STT: Starting Whisper speech recognition...');
      this.isListening = true;
      this.audioChunks = [];
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Optimal for Whisper
        }
      });

      console.log('🎤 WHISPER STT: Microphone access granted, setting up audio recording...');

      // Set up MediaRecorder for audio capture
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log('🎤 WHISPER STT: Audio chunk received, size:', event.data.size, 'bytes');
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('🎤 WHISPER STT: Recording stopped, processing audio chunks...');
        this.processAudioChunks();
      };

      // Start recording
      this.mediaRecorder.start(1000); // Record in 1-second chunks
      console.log('🎤 WHISPER STT: MediaRecorder started, recording in 1-second chunks');
      
      // Set up silence detection
      this.setupSilenceDetection(stream);
      
      if (this.callbacks.onListeningStart) {
        this.callbacks.onListeningStart();
      }
      
      console.log('🎤 WHISPER STT: Whisper listening started successfully');
    } catch (error) {
      console.error('🎤 WHISPER STT: Error starting Whisper listening:', error);
      this.isListening = false;
      
      // Fallback to Web Speech API
      if (this.fallbackRecognition) {
        console.log('🎤 WHISPER STT: Falling back to Web Speech API');
        this.startFallbackListening();
      } else {
        if (this.callbacks.onError) {
          this.callbacks.onError('No speech recognition available');
        }
      }
    }
  }

  // Start fallback Web Speech API listening
  startFallbackListening() {
    if (this.fallbackRecognition) {
      try {
        this.fallbackRecognition.start();
        this.isListening = true;
        if (this.callbacks.onListeningStart) {
          this.callbacks.onListeningStart();
        }
        console.log('Fallback Web Speech API listening started');
      } catch (error) {
        console.error('Error starting fallback recognition:', error);
        if (this.callbacks.onError) {
          this.callbacks.onError('Speech recognition failed');
        }
      }
    }
  }

  // Set up silence detection
  setupSilenceDetection(stream) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkSilence = () => {
      if (!this.isListening) return;
      
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      
      if (average < 10) { // Silence detected
        if (!this.silenceTimeout) {
          this.silenceTimeout = setTimeout(() => {
            this.stopListening();
          }, this.silenceThreshold);
        }
      } else {
        if (this.silenceTimeout) {
          clearTimeout(this.silenceTimeout);
          this.silenceTimeout = null;
        }
      }
      
      requestAnimationFrame(checkSilence);
    };
    
    checkSilence();
  }

  // Stop listening
  stopListening() {
    if (!this.isListening) return;
    
    this.isListening = false;
    
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    if (this.fallbackRecognition) {
      this.fallbackRecognition.stop();
    }
    
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    if (this.callbacks.onListeningEnd) {
      this.callbacks.onListeningEnd();
    }
    
    console.log('Stopped listening');
  }

  // Process audio chunks with Whisper API
  async processAudioChunks() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      // Check if we have Whisper API key
      if (this.whisperApiKey) {
        const transcript = await this.transcribeWithWhisper(audioBlob);
        if (transcript) {
          this.handleTranscript(transcript);
          return;
        }
      }
      
      // Fallback to Web Speech API if Whisper fails
      console.log('Whisper API not available or failed, using fallback');
      this.startFallbackListening();
      
    } catch (error) {
      console.error('Error processing audio:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError('Audio processing failed');
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Transcribe audio using Whisper API
  async transcribeWithWhisper(audioBlob) {
    try {
      console.log('🎤 WHISPER STT: Sending audio to Whisper API...');
      console.log('🎤 WHISPER STT: Audio blob size:', audioBlob.size, 'bytes');
      
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('response_format', 'json');
      
      console.log('🎤 WHISPER STT: Making API request to:', this.whisperEndpoint);
      
      const response = await fetch(this.whisperEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.whisperApiKey}`
        },
        body: formData
      });
      
      if (!response.ok) {
        console.error('🎤 WHISPER STT: API request failed:', response.status, response.statusText);
        throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('🎤 WHISPER STT: API response received:', result);
      console.log('🎤 WHISPER STT: Transcribed text:', result.text);
      
      return result.text;
      
    } catch (error) {
      console.error('🎤 WHISPER STT: API error:', error);
      return null;
    }
  }

  // Handle fallback recognition results
  handleFallbackResult(event) {
    let finalTranscript = '';
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      
      if (result.isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    if (finalTranscript.trim()) {
      this.handleTranscript(finalTranscript.trim());
    }
  }

  // Handle transcript result
  handleTranscript(transcript) {
    console.log('🎤 WHISPER STT: Final transcript received:', transcript);
    console.log('🎤 WHISPER STT: Transcript length:', transcript.length, 'characters');
    
    if (this.callbacks.onTranscript) {
      this.callbacks.onTranscript({
        transcript,
        confidence: 0.95, // High confidence for Whisper
        isFinal: true,
        timestamp: Date.now()
      });
    }
  }

  // Set callbacks
  onTranscript(callback) {
    this.callbacks.onTranscript = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }

  onListeningStart(callback) {
    this.callbacks.onListeningStart = callback;
  }

  onListeningEnd(callback) {
    this.callbacks.onListeningEnd = callback;
  }

  // Cleanup
  cleanup() {
    this.stopListening();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
