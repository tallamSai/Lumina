// Voice Interaction Enhancer
// Improves voice interaction quality and natural conversation flow

export class VoiceInteractionEnhancer {
  constructor() {
    this.voiceSettings = {
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8,
      voice: 'default'
    };
    this.conversationContext = {
      lastTopic: null,
      conversationFlow: 'natural',
      userPreferences: {},
      emotionalState: 'neutral'
    };
    this.voiceQueue = [];
    this.isSpeaking = false;
    this.speechSynthesis = window.speechSynthesis;
    this.availableVoices = [];
    this.selectedVoice = null;
    
    this.initializeVoices();
  }

  // Initialize available voices
  initializeVoices() {
    if (this.speechSynthesis) {
      this.availableVoices = this.speechSynthesis.getVoices();
      
      // Select the best available voice
      this.selectedVoice = this.selectBestVoice();
      
      // Listen for voice changes
      this.speechSynthesis.addEventListener('voiceschanged', () => {
        this.availableVoices = this.speechSynthesis.getVoices();
        this.selectedVoice = this.selectBestVoice();
      });
    }
  }

  // Select the best available voice
  selectBestVoice() {
    if (!this.availableVoices.length) return null;
    
    // Prefer natural-sounding voices
    const preferredVoices = [
      'Google US English',
      'Microsoft Zira Desktop',
      'Microsoft David Desktop',
      'Alex',
      'Samantha',
      'Victoria'
    ];
    
    for (const preferred of preferredVoices) {
      const voice = this.availableVoices.find(v => 
        v.name.includes(preferred) || v.name.includes('Google') || v.name.includes('Microsoft')
      );
      if (voice) return voice;
    }
    
    // Fallback to first available voice
    return this.availableVoices[0];
  }

  // Enhanced speech synthesis with natural voice
  async speak(text, options = {}) {
    if (!text || this.isSpeaking) {
      if (this.isSpeaking) {
        this.voiceQueue.push({ text, options });
        return;
      }
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.isSpeaking = true;
        
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply voice settings
        utterance.rate = options.rate || this.voiceSettings.rate;
        utterance.pitch = options.pitch || this.voiceSettings.pitch;
        utterance.volume = options.volume || this.voiceSettings.volume;
        
        // Use selected voice
        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }
        
        // Add natural pauses and emphasis
        this.enhanceSpeechWithPauses(utterance, text);
        
        // Event handlers
        utterance.onstart = () => {
          console.log('Speaking:', text);
        };
        
        utterance.onend = () => {
          this.isSpeaking = false;
          this.processVoiceQueue();
          resolve();
        };
        
        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          this.isSpeaking = false;
          this.processVoiceQueue();
          reject(error);
        };
        
        // Speak the text
        this.speechSynthesis.speak(utterance);
        
      } catch (error) {
        this.isSpeaking = false;
        reject(error);
      }
    });
  }

  // Add natural pauses and emphasis to speech
  enhanceSpeechWithPauses(utterance, text) {
    // Add pauses after punctuation
    let enhancedText = text
      .replace(/\./g, '. ')
      .replace(/\?/g, '? ')
      .replace(/!/g, '! ')
      .replace(/,/g, ', ')
      .replace(/;/g, '; ');
    
    // Add emphasis to important words
    const emphasisWords = ['important', 'key', 'main', 'primary', 'crucial', 'essential'];
    emphasisWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      enhancedText = enhancedText.replace(regex, ` ${word} `);
    });
    
    utterance.text = enhancedText;
  }

  // Process voice queue
  processVoiceQueue() {
    if (this.voiceQueue.length > 0 && !this.isSpeaking) {
      const next = this.voiceQueue.shift();
      this.speak(next.text, next.options);
    }
  }

  // Speak with emotional tone
  async speakWithEmotion(text, emotion = 'neutral') {
    const emotionSettings = {
      happy: { rate: 1.1, pitch: 1.1, volume: 0.9 },
      excited: { rate: 1.2, pitch: 1.2, volume: 0.95 },
      encouraging: { rate: 0.95, pitch: 1.05, volume: 0.85 },
      supportive: { rate: 0.9, pitch: 0.95, volume: 0.8 },
      serious: { rate: 0.85, pitch: 0.9, volume: 0.85 },
      neutral: { rate: 0.9, pitch: 1.0, volume: 0.8 }
    };
    
    const settings = emotionSettings[emotion] || emotionSettings.neutral;
    return await this.speak(text, settings);
  }

  // Speak with conversation context
  async speakWithContext(text, context = {}) {
    const { isGreeting, isQuestion, isFeedback, isInstruction } = context;
    
    let emotion = 'neutral';
    let rate = this.voiceSettings.rate;
    let pitch = this.voiceSettings.pitch;
    
    if (isGreeting) {
      emotion = 'happy';
      rate = 1.05;
      pitch = 1.1;
    } else if (isQuestion) {
      emotion = 'encouraging';
      rate = 0.95;
      pitch = 1.05;
    } else if (isFeedback) {
      emotion = 'supportive';
      rate = 0.9;
      pitch = 1.0;
    } else if (isInstruction) {
      emotion = 'serious';
      rate = 0.85;
      pitch = 0.95;
    }
    
    return await this.speakWithEmotion(text, emotion);
  }

  // Stop all speech
  stopSpeaking() {
    this.speechSynthesis.cancel();
    this.isSpeaking = false;
    this.voiceQueue = [];
  }

  // Update voice settings
  updateVoiceSettings(settings) {
    this.voiceSettings = { ...this.voiceSettings, ...settings };
    console.log('Voice settings updated:', this.voiceSettings);
  }

  // Update conversation context
  updateConversationContext(context) {
    this.conversationContext = { ...this.conversationContext, ...context };
  }

  // Get available voices
  getAvailableVoices() {
    return this.availableVoices.map(voice => ({
      name: voice.name,
      lang: voice.lang,
      default: voice.default
    }));
  }

  // Set specific voice
  setVoice(voiceName) {
    const voice = this.availableVoices.find(v => v.name === voiceName);
    if (voice) {
      this.selectedVoice = voice;
      console.log('Voice set to:', voice.name);
    }
  }

  // Check if speech is supported
  isSpeechSupported() {
    return 'speechSynthesis' in window;
  }

  // Get current voice info
  getCurrentVoice() {
    return this.selectedVoice ? {
      name: this.selectedVoice.name,
      lang: this.selectedVoice.lang
    } : null;
  }

  // Enhanced text preprocessing for better speech
  preprocessTextForSpeech(text) {
    // Replace abbreviations
    const abbreviations = {
      'AI': 'A I',
      'API': 'A P I',
      'CEO': 'C E O',
      'CTO': 'C T O',
      'HR': 'H R',
      'IT': 'I T',
      'UI': 'U I',
      'UX': 'U X',
      'SQL': 'S Q L',
      'HTML': 'H T M L',
      'CSS': 'C S S',
      'JS': 'JavaScript',
      'JSX': 'J S X',
      'JSON': 'J S O N',
      'XML': 'X M L',
      'HTTP': 'H T T P',
      'HTTPS': 'H T T P S',
      'URL': 'U R L',
      'REST': 'R E S T',
      'SOAP': 'S O A P'
    };
    
    let processedText = text;
    Object.entries(abbreviations).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      processedText = processedText.replace(regex, full);
    });
    
    // Add natural pauses
    processedText = processedText
      .replace(/\./g, '. ')
      .replace(/\?/g, '? ')
      .replace(/!/g, '! ')
      .replace(/,/g, ', ')
      .replace(/;/g, '; ')
      .replace(/:/g, ': ');
    
    return processedText;
  }

  // Speak with natural conversation flow
  async speakNaturally(text, context = {}) {
    const processedText = this.preprocessTextForSpeech(text);
    return await this.speakWithContext(processedText, context);
  }

  // Cleanup
  cleanup() {
    this.stopSpeaking();
    this.voiceQueue = [];
  }
}

export default VoiceInteractionEnhancer;
