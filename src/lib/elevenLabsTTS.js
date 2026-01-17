// ElevenLabs Text-to-Speech Service
// Provides high-quality TTS with English-Indian accent female voice

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID; // Optional: manually set voice ID
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export class ElevenLabsTTS {
  constructor() {
    this.apiKey = ELEVENLABS_API_KEY;
    this.isEnabled = !!this.apiKey;
    this.voiceId = ELEVENLABS_VOICE_ID || null; // Use manual voice ID if provided, otherwise auto-detect
    this.audioCache = new Map();
    
    // Usage tracking
    this.usageStats = {
      charactersUsed: 0,
      requestsMade: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      lastResetDate: new Date().toDateString()
    };
    
    // Load usage stats from localStorage
    this.loadUsageStats();
    
    // Free tier limits (approximate)
    // Free tier: ~10,000 credits/month ≈ ~10 minutes of high-quality TTS
    // Rough estimate: 1 credit ≈ 1 character for TTS
    this.monthlyCharacterLimit = 10000; // Adjust based on your tier
    this.warnAtPercent = 0.8; // Warn at 80% usage
    
    if (!this.isEnabled) {
      console.warn('ElevenLabs API key not found. Set VITE_ELEVENLABS_API_KEY in your .env file');
    } else {
      console.log('ElevenLabs TTS initialized');
      console.log(`Usage this month: ${this.usageStats.charactersUsed}/${this.monthlyCharacterLimit} characters`);
      if (this.voiceId) {
        console.log(`Using manually configured voice ID: ${this.voiceId}`);
      } else {
        // Initialize voice asynchronously (don't block constructor)
        this.initializeVoice().catch(err => {
          console.warn('Failed to auto-detect voice, will use fallback:', err);
        });
      }
    }
  }

  // Load usage stats from localStorage
  loadUsageStats() {
    try {
      const stored = localStorage.getItem('elevenlabs_usage_stats');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Reset if it's a new month
        if (parsed.lastResetDate !== new Date().toDateString()) {
          this.usageStats = {
            charactersUsed: 0,
            requestsMade: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0,
            lastResetDate: new Date().toDateString()
          };
        } else {
          this.usageStats = parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load usage stats:', error);
    }
  }

  // Save usage stats to localStorage
  saveUsageStats() {
    try {
      localStorage.setItem('elevenlabs_usage_stats', JSON.stringify(this.usageStats));
    } catch (error) {
      console.warn('Failed to save usage stats:', error);
    }
  }

  // Check if usage limit is reached
  isUsageLimitReached() {
    return this.usageStats.charactersUsed >= this.monthlyCharacterLimit;
  }

  // Get usage percentage
  getUsagePercentage() {
    return (this.usageStats.charactersUsed / this.monthlyCharacterLimit) * 100;
  }

  // Check usage and warn if needed
  checkUsage() {
    const percentage = this.getUsagePercentage();
    if (percentage >= 100) {
      console.warn('⚠️ ElevenLabs monthly limit reached! Falling back to browser TTS.');
      return false;
    } else if (percentage >= this.warnAtPercent * 100) {
      console.warn(`⚠️ ElevenLabs usage at ${percentage.toFixed(1)}% (${this.usageStats.charactersUsed}/${this.monthlyCharacterLimit} characters)`);
    }
    return true;
  }

  // Initialize and find the best English-Indian accent female voice
  async initializeVoice() {
    if (!this.isEnabled) return;

    try {
      // First, try to get available voices
      const voices = await this.getVoices();
      
      // Look for English-Indian accent female voice
      // Common voice names that might indicate Indian accent: "Priya", "Anjali", "Shreya", etc.
      const preferredVoices = [
        'Priya', 'Anjali', 'Shreya', 'Kavya', 'Riya',
        'Indian', 'India', 'Hindi', 'English Indian'
      ];
      
      // Find a female voice with Indian accent
      let selectedVoice = voices.find(voice => {
        const name = voice.name.toLowerCase();
        const labels = voice.labels || {};
        const accent = (labels.accent || '').toLowerCase();
        const gender = (labels.gender || '').toLowerCase();
        const description = (voice.description || '').toLowerCase();
        
        return (
          voice.category === 'premade' &&
          (gender === 'female' || gender === 'f') &&
          (preferredVoices.some(pref => name.includes(pref.toLowerCase())) ||
           accent.includes('indian') ||
           accent.includes('india') ||
           description.includes('indian') ||
           description.includes('india'))
        );
      });
      
      console.log('Searching for English-Indian accent female voice...');
      console.log('Available voices:', voices.length);

      // If not found, look for any English female voice as fallback
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => {
          const labels = voice.labels || {};
          return (
            voice.category === 'premade' &&
            (labels.gender === 'female' || labels.gender === 'F') &&
            (labels.accent?.toLowerCase().includes('english') || 
             labels.language?.toLowerCase().includes('english'))
          );
        });
      }

      // If still not found, use a default high-quality female voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.category === 'premade' && 
          (voice.name.includes('Rachel') || voice.name.includes('Bella') || voice.name.includes('Domi'))
        );
      }

      if (selectedVoice) {
        this.voiceId = selectedVoice.voice_id;
        console.log(`✅ ElevenLabs voice selected: ${selectedVoice.name} (${selectedVoice.voice_id})`);
        console.log(`   Labels:`, selectedVoice.labels);
      } else {
        console.warn('⚠️ Could not find English-Indian accent female voice');
        console.log('💡 Tip: You can manually set a voice ID using VITE_ELEVENLABS_VOICE_ID in .env');
        console.log('💡 Visit https://elevenlabs.io/voice-library to find voices');
        // Use a known good English female voice ID as fallback
        // You can replace this with a specific voice ID from ElevenLabs
        this.voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Bella - English female (fallback)
        console.log(`   Using fallback voice ID: ${this.voiceId}`);
      }
    } catch (error) {
      console.error('Error initializing ElevenLabs voice:', error);
      // Use fallback voice ID
      this.voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Bella - English female
    }
  }

  // Get available voices from ElevenLabs
  async getVoices() {
    if (!this.isEnabled) return [];

    try {
      const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error);
      return [];
    }
  }

  // Convert text to speech using ElevenLabs
  async textToSpeech(text, options = {}) {
    if (!this.isEnabled) {
      throw new Error('ElevenLabs API key not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text is empty');
    }

    // Check usage limits
    if (!this.checkUsage()) {
      throw new Error('ElevenLabs monthly usage limit reached. Please upgrade your plan or wait for next month.');
    }

    // Check cache first
    const cacheKey = `${text}_${this.voiceId}_${JSON.stringify(options)}`;
    if (this.audioCache.has(cacheKey)) {
      this.usageStats.cacheHits++;
      this.saveUsageStats();
      return this.audioCache.get(cacheKey);
    }
    
    this.usageStats.cacheMisses++;

    try {
      // Use the selected voice ID or fallback
      const voiceId = options.voiceId || this.voiceId || 'EXAVITQu4vr4xnSDxMaL';
      
      // Prepare request body
      const requestBody = {
        text: text,
        model_id: options.modelId || 'eleven_multilingual_v2', // Supports multiple languages
        voice_settings: {
          stability: options.stability !== undefined ? options.stability : 0.5,
          similarity_boost: options.similarityBoost !== undefined ? options.similarityBoost : 0.75,
          style: options.style !== undefined ? options.style : 0.0,
          use_speaker_boost: options.useSpeakerBoost !== undefined ? options.useSpeakerBoost : true
        }
      };

      const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      // Get audio blob
      const audioBlob = await response.blob();
      
      // Track usage (approximate: 1 character ≈ 1 credit for TTS)
      const textLength = text.length;
      this.usageStats.charactersUsed += textLength;
      this.usageStats.requestsMade++;
      this.saveUsageStats();
      
      // Cache the result
      this.audioCache.set(cacheKey, audioBlob);
      
      // Limit cache size
      if (this.audioCache.size > 50) {
        const firstKey = this.audioCache.keys().next().value;
        this.audioCache.delete(firstKey);
      }

      // Log usage
      const percentage = this.getUsagePercentage();
      if (percentage > 0) {
        console.log(`ElevenLabs usage: ${this.usageStats.charactersUsed}/${this.monthlyCharacterLimit} characters (${percentage.toFixed(1)}%)`);
      }

      return audioBlob;
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      this.usageStats.errors++;
      this.saveUsageStats();
      
      // Check if it's a quota/limit error
      if (error.message && (error.message.includes('quota') || error.message.includes('limit') || error.message.includes('429'))) {
        throw new Error('ElevenLabs API limit reached. Please upgrade your plan or wait for next month.');
      }
      
      throw error;
    }
  }

  // Play audio from blob
  async playAudio(audioBlob) {
    return new Promise((resolve, reject) => {
      try {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          reject(error);
        };
        
        audio.play().catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Speak text with ElevenLabs
  async speak(text, options = {}) {
    if (!this.isEnabled) {
      throw new Error('ElevenLabs is not enabled. Please set VITE_ELEVENLABS_API_KEY');
    }

    try {
      // Ensure voice is initialized before speaking
      const voiceReady = await this.ensureVoiceInitialized();
      if (!voiceReady) {
        throw new Error('Failed to initialize ElevenLabs voice');
      }

      // Preprocess text for better speech
      const processedText = this.preprocessText(text);
      
      // Get audio from ElevenLabs
      const audioBlob = await this.textToSpeech(processedText, options);
      
      // Play the audio
      await this.playAudio(audioBlob);
    } catch (error) {
      console.error('Error in ElevenLabs speak:', error);
      throw error;
    }
  }

  // Preprocess text for better TTS
  preprocessText(text) {
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
    };
    
    let processed = text;
    Object.entries(abbreviations).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      processed = processed.replace(regex, full);
    });
    
    return processed;
  }

  // Set a specific voice ID
  setVoiceId(voiceId) {
    this.voiceId = voiceId;
    console.log('ElevenLabs voice ID set to:', voiceId);
  }

  // Check if ElevenLabs is available
  isAvailable() {
    // If we have an API key, we're available (voice ID will be set during first use if not already set)
    return this.isEnabled;
  }

  // Ensure voice is initialized before use
  async ensureVoiceInitialized() {
    if (!this.isEnabled) return false;
    
    // If voice ID is already set, we're good
    if (this.voiceId) return true;
    
    // Otherwise, initialize it now
    try {
      await this.initializeVoice();
      return this.voiceId !== null;
    } catch (error) {
      console.error('Failed to initialize ElevenLabs voice:', error);
      return false;
    }
  }

  // Clear audio cache
  clearCache() {
    this.audioCache.clear();
  }

  // Get usage statistics
  getUsageStats() {
    return {
      ...this.usageStats,
      usagePercentage: this.getUsagePercentage(),
      remainingCharacters: Math.max(0, this.monthlyCharacterLimit - this.usageStats.charactersUsed),
      isLimitReached: this.isUsageLimitReached()
    };
  }

  // Set monthly character limit (for different subscription tiers)
  setMonthlyLimit(limit) {
    this.monthlyCharacterLimit = limit;
    console.log(`ElevenLabs monthly limit set to: ${limit} characters`);
  }
}

export default ElevenLabsTTS;
