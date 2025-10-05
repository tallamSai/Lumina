// Enhanced Speech-to-Text Service using OpenAI Whisper
// Provides high-accuracy speech recognition with fallback to Web Speech API

export class WhisperSpeechToText {
  constructor() {
    this.isListening = false;
    this.isProcessing = false;
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.whisperApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    // Route through Vite dev proxy to avoid exposing the API key in the browser
    this.whisperEndpoint = '/api/openai/audio/transcriptions';
    this.maxAudioDuration = 30; // seconds
    this.silenceTimeout = null;
    this.silenceThreshold = 2000; // 2 seconds
    this.minChunkBytes = 2000; // ignore tiny chunks
    this.selectedMimeType = null;
    this.fallbackRecognition = null;
    this.fallbackActive = false;
    this.whisperFailureCount = 0;
    this.whisperFailureThreshold = 3;
    this.callbacks = {
      onTranscript: null,
      onError: null,
      onListeningStart: null,
      onListeningEnd: null
    };
  }

  // Select a supported MediaRecorder mimeType
  getSupportedMimeType() {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/mpeg'
    ];
    for (const type of candidates) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return null;
  }

  // Initialize the speech-to-text service
  async initialize() {
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      // Prepare Web Speech API fallback if available
      this.initializeFallbackRecognition();
      // Check if Whisper API key is available
      if (this.whisperApiKey) {
        console.log('🎤 WHISPER STT: API key found - Whisper will be used for speech recognition');
        console.log('🎤 WHISPER STT: Endpoint configured:', this.whisperEndpoint);
      } else {
        throw new Error('OpenAI API key not found. Set VITE_OPENAI_API_KEY to use Whisper.');
      }
      
      console.log('🎤 WHISPER STT: Service initialized successfully');
      return true;
    } catch (error) {
      console.error('🎤 WHISPER STT: Error initializing service:', error);
      throw error;
    }
  }

  // Initialize fallback Web Speech API if supported
  initializeFallbackRecognition() {
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return;
      this.fallbackRecognition = new SR();
      this.fallbackRecognition.continuous = true;
      this.fallbackRecognition.interimResults = true;
      this.fallbackRecognition.lang = 'en-US';
      this.fallbackRecognition.onresult = (event) => {
        // Stream interim and final results
        let interim = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          const t = r[0]?.transcript || '';
          if (r.isFinal) finalText += t;
          else interim += t;
        }
        const textToEmit = finalText || interim;
        if (textToEmit && this.callbacks.onTranscript) {
          this.callbacks.onTranscript({
            transcript: textToEmit,
            isFinal: !!finalText,
            timestamp: Date.now()
          });
        }
      };
      this.fallbackRecognition.onerror = (e) => {
        if (this.callbacks.onError) this.callbacks.onError(e.error || 'fallback-error');
      };
    } catch (e) {
      console.warn('Fallback initialization failed:', e);
    }
  }

  startFallbackListening() {
    if (!this.fallbackRecognition || this.fallbackActive) return;
    try {
      this.fallbackActive = true;
      this.fallbackRecognition.start();
      if (this.callbacks.onListeningStart) this.callbacks.onListeningStart();
      console.log('🔄 Fallback Web Speech API started');
    } catch (e) {
      console.error('Fallback start error:', e);
      if (this.callbacks.onError) this.callbacks.onError('fallback-start-failed');
    }
  }

  stopFallbackListening() {
    if (!this.fallbackRecognition || !this.fallbackActive) return;
    try {
      this.fallbackRecognition.stop();
    } catch {}
    this.fallbackActive = false;
  }

  // Start listening with Whisper API
  async startListening(stream) {
    if (this.isListening) {
      console.log('🎤 WHISPER STT: Already listening');
      return;
    }

    try {
      console.log('🎤 WHISPER STT: Starting Whisper speech recognition...');
      this.isListening = true;
      this.audioChunks = [];

      if (!stream) {
        throw new Error('No media stream provided to Whisper startListening');
      }

      // Ensure there's at least one enabled audio track
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) {
        throw new Error('Provided media stream has no audio tracks');
      }
      if (!audioTracks[0].enabled) {
        console.warn('🎤 WHISPER STT: Audio track is disabled; enabling it');
        audioTracks[0].enabled = true;
      }

      // Resume AudioContext (required by some browsers until user gesture)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      console.log('🎤 WHISPER STT: Microphone stream ready, setting up audio recording...');

      // Set up MediaRecorder for audio capture
      const mimeType = this.getSupportedMimeType();
      this.selectedMimeType = mimeType || '';
      this.mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      console.log('🎤 WHISPER STT: Using mimeType for recording:', this.selectedMimeType || '(browser default)');

      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log('🎤 WHISPER STT: Audio chunk received, size:', event.data.size, 'bytes');
          // Push rolling chunks to Whisper for near-real-time transcripts
          if (event.data.size >= this.minChunkBytes) {
            try {
              const transcript = await this.transcribeWithWhisper(event.data);
              if (transcript && this.callbacks.onTranscript) {
                this.callbacks.onTranscript({
                  transcript,
                  isFinal: false,
                  timestamp: Date.now()
                });
              }
            } catch (e) {
              console.error('🎤 WHISPER STT: Chunk transcription error:', e);
              if (this.callbacks.onError) {
                this.callbacks.onError('chunk-transcription-failed');
              }
            }
          } else {
            console.log('🎤 WHISPER STT: Skipping tiny chunk');
          }
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('🎤 WHISPER STT: Recording stopped, creating final transcript...');
        // Produce a final transcript from the accumulated chunks
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
      if (this.callbacks.onError) {
        this.callbacks.onError(error?.message || 'whisper-start-failed');
      }
      // Auto-enable fallback if available
      this.startFallbackListening();
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
    
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    if (this.callbacks.onListeningEnd) {
      this.callbacks.onListeningEnd();
    }
    
    console.log('Stopped listening');
  }

  // Process concatenated audio chunks with Whisper API (manual flush)
  async processAudioChunks() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const transcript = await this.transcribeWithWhisper(audioBlob);
      if (transcript) {
        this.handleTranscript(transcript);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError('audio-processing-failed');
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
      // Intentionally omitting language and response_format to avoid hardcoding; Whisper will auto-detect
      
      console.log('🎤 WHISPER STT: Making API request to:', this.whisperEndpoint);
      
      const response = await fetch(this.whisperEndpoint, {
        method: 'POST',
        // Authorization header is injected by the dev proxy
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
      this.whisperFailureCount += 1;
      if (this.whisperFailureCount >= this.whisperFailureThreshold) {
        console.warn('🎤 WHISPER STT: Multiple failures detected, switching to fallback');
        this.startFallbackListening();
      }
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
    this.stopFallbackListening();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
