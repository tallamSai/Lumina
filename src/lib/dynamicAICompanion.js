// Dynamic AI Companion Service
// Uses Gemini API for intelligent, contextual responses based on real-time analysis

import { GoogleGenerativeAI } from '@google/generative-ai';
import { DynamicInterviewCoach } from './dynamicInterviewCoach';
import { EnhancedInterviewCoach } from './enhancedInterviewCoach';
import { VoiceInteractionEnhancer } from './voiceInteractionEnhancer';
import { AdvancedFeatures } from './advancedFeatures';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class DynamicAICompanion {
  constructor() {
    this.isActive = false;
    this.currentExpression = 'neutral';
    this.isTalking = false;
    this.isListening = false;
    this.conversationHistory = [];
    this.personality = 'coach'; // coach, friend, mentor, professional
    this.interviewCoach = new DynamicInterviewCoach();
    this.enhancedInterviewCoach = new EnhancedInterviewCoach();
    this.voiceEnhancer = new VoiceInteractionEnhancer();
    this.advancedFeatures = new AdvancedFeatures();
    this.currentMode = 'presentation'; // presentation, interview, general
    this.voiceSettings = {
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8,
      voice: 'default'
    };
    this.callbacks = {
      onExpressionChange: null,
      onTalkingStart: null,
      onTalkingEnd: null,
      onListeningStart: null,
      onListeningEnd: null,
      onMessage: null
    };
    
    // Performance and caching
    this.responseCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.lastApiCall = 0;
    this.rateLimitDelay = 1000; // 1 second between calls
    this.lastRequestKey = null;
    this.lastRequestTime = 0;
    
    // Initialize Gemini AI
    this.genAI = null;
    this.workingModelName = 'gemini-2.5-flash-lite';
    console.log('Gemini API Key available:', !!GEMINI_API_KEY);
    if (GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      console.log('Gemini AI client initialized with gemini-2.5-flash-lite');
    } else {
      console.error('Gemini API key not found in environment variables');
    }
  }

  // Initialize the AI companion
  async initialize() {
    this.isActive = true;
    this.setExpression('neutral');
    
    if (!this.genAI) {
      throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your environment variables.');
    }
    
    // Test API connection first
    try {
      await this.testConnection();
      console.log('Gemini API connection successful');
    } catch (error) {
      throw new Error(`Gemini API connection failed: ${error.message}`);
    }
    
    // No initial greeting - start with 1-to-1 conversation
    console.log('AI companion ready for conversation');
  }

  // Test Gemini API connection with smart fallback
  async testConnection() {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized');
    }

    // Try models in order of preference
    const modelCandidates = [
      'gemini-2.5-flash-lite',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ];

    for (const modelName of modelCandidates) {
      try {
        console.log(`Testing Gemini API connection with ${modelName}...`);
        
        const model = this.genAI.getGenerativeModel({ model: modelName });
        
        const prompt = "Say 'Hello, I am working correctly!' in exactly those words.";
        console.log('Sending test prompt to Gemini API...');
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ API Test Successful with ${modelName}`);
        console.log('Response:', text);
        
        // Store the working model name for future use
        this.workingModelName = modelName;
        return text;
        
      } catch (error) {
        console.log(`❌ Model ${modelName} failed:`, error.message);
        
        // If this is the last model, throw a comprehensive error
        if (modelName === modelCandidates[modelCandidates.length - 1]) {
          console.error('All model attempts failed');
          
          if (error.message.includes('404')) {
            throw new Error(`No working models found. Tried: ${modelCandidates.join(', ')}. Please check available models in your region.`);
          } else if (error.message.includes('403')) {
            throw new Error(`Permission denied. Please check your API key permissions for Gemini API.`);
          } else if (error.message.includes('401')) {
            throw new Error(`Unauthorized. Please check your API key.`);
          } else {
            throw new Error(`API test failed with all models. Last error: ${error.message}`);
          }
        }
        
        // Continue to next model
        continue;
      }
    }
  }

  // Generate dynamic greeting using Gemini
  async generateDynamicGreeting() {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized');
    }

    try {
      const modelName = this.workingModelName || 'gemini-2.5-flash-lite';
      const model = this.genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `You are an AI presentation coach meeting a new student for the first time. Generate a warm, encouraging, and personalized greeting that:
      1. Introduces yourself as their AI coach
      2. Shows enthusiasm about helping them improve
      3. Sets a positive, supportive tone
      4. Mentions that you'll be analyzing their presentation skills in real-time
      5. Keeps it conversational and friendly (2-3 sentences max)
      
      Respond with just the greeting text, no additional formatting.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return text || "Hello! I'm your AI presentation coach. I'm excited to help you improve your speaking skills today!";
    } catch (error) {
      console.error('Error generating greeting:', error);
      throw new Error(`Failed to generate greeting: ${error.message}`);
    }
  }

  // Start interview session with enhanced coach
  async startInterviewSession(type = 'mixed', difficulty = 'medium', userContext = {}) {
    try {
      if (!this.enhancedInterviewCoach) {
        throw new Error('Enhanced interview coach not available');
      }
      
      const session = await this.enhancedInterviewCoach.startInterviewSession(type, difficulty, userContext);
      console.log('Enhanced interview session started:', session);
      
      return session;
    } catch (error) {
      console.error('Error starting interview session:', error);
      throw error;
    }
  }

  // Get current interview question
  getCurrentInterviewQuestion() {
    if (!this.enhancedInterviewCoach) {
      return null;
    }
    
    return this.enhancedInterviewCoach.getCurrentQuestion();
  }

  // Submit interview answer and get feedback
  async submitInterviewAnswer(answer, analysis = {}) {
    try {
      if (!this.enhancedInterviewCoach) {
        throw new Error('Enhanced interview coach not available');
      }
      
      const result = await this.enhancedInterviewCoach.submitAnswer(answer, analysis);
      console.log('Interview answer submitted, feedback received:', result);
      
      return result;
    } catch (error) {
      console.error('Error submitting interview answer:', error);
      throw error;
    }
  }

  // Generate intelligent response based on real-time analysis
  async generateResponse(analysis, userMessage = null) {
    const timestamp = new Date();
    
    if (!this.genAI) {
      throw new Error('Gemini API not initialized');
    }

    const response = await this.generateGeminiResponse(analysis, userMessage);

    // Add to conversation history
    this.conversationHistory.push({
      timestamp,
      type: 'ai_response',
      message: response,
      analysis: analysis,
      userMessage
    });

    // Update advanced features with conversation data
    this.advancedFeatures.trackProgress({
      overallScore: analysis?.overallScore || 0,
      improvements: analysis?.areasForImprovement || [],
      strengths: analysis?.strengths || [],
      topics: this.advancedFeatures.extractTopics(userMessage || ''),
      duration: 0
    });

    return {
      message: response,
      expression: this.determineExpression(analysis),
      timestamp,
      analysis,
      userMessage
    };
  }

  // Generate response using Gemini AI with caching and rate limiting
  async generateGeminiResponse(analysis, userMessage = null) {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized');
    }

    try {
      // Check for duplicate requests
      const requestKey = `${JSON.stringify(analysis)}_${userMessage || 'no_message'}`;
      if (this.lastRequestKey === requestKey && Date.now() - this.lastRequestTime < 2000) {
        console.log('Skipping duplicate request');
        return "I'm already processing that. Let me give you a moment to continue.";
      }
      this.lastRequestKey = requestKey;
      this.lastRequestTime = Date.now();

      // Create cache key based on analysis data
      const cacheKey = this.createCacheKey(analysis, userMessage);
      
      // Check cache first
      if (this.responseCache.has(cacheKey)) {
        const cached = this.responseCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log('Using cached response');
          return cached.response;
        } else {
          this.responseCache.delete(cacheKey);
        }
      }

      // Rate limiting
      const now = Date.now();
      const timeSinceLastCall = now - this.lastApiCall;
      if (timeSinceLastCall < this.rateLimitDelay) {
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastCall));
      }
      this.lastApiCall = Date.now();

      const modelName = this.workingModelName || 'gemini-2.5-flash-lite';
      const model = this.genAI.getGenerativeModel({ model: modelName });
      
      let prompt = `You are an expert AI presentation coach providing real-time feedback. `;
      
      // Check if user is asking for interview preparation
      const isInterviewRequest = userMessage && (
        userMessage.toLowerCase().includes('interview') ||
        userMessage.toLowerCase().includes('prepare') ||
        userMessage.toLowerCase().includes('practice') ||
        userMessage.toLowerCase().includes('question') ||
        userMessage.toLowerCase().includes('job')
      );
      
      if (isInterviewRequest) {
        this.currentMode = 'interview';
        prompt += `The user is asking about interview preparation. `;
      }
      
      if (userMessage) {
        prompt += `The user just said: "${userMessage}". `;
      }
      
      // Add conversation context to prevent repetitive responses
      const recentMessages = this.conversationHistory.slice(-3).map(msg => msg.message).join(' | ');
      const recentTopics = this.conversationHistory.slice(-5).map(msg => {
        const words = msg.message.toLowerCase().split(' ');
        return words.filter(word => word.length > 4).slice(0, 3);
      }).flat();
      
      // Check if this is a greeting to handle differently
      const isGreeting = userMessage && /^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(userMessage.trim());
      const greetingCount = this.conversationHistory.filter(msg => 
        msg.userMessage && /^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(msg.userMessage.trim())
      ).length;
      
      // Get conversation phase
      const conversationPhase = this.getConversationPhase();
      
      prompt += `Based on the following real-time analysis data, provide a helpful, encouraging, and specific response:

ANALYSIS DATA:
- Overall Score: ${analysis?.overallScore || 0}%
- Voice Clarity: ${analysis?.voiceClarity || 0}%
- Body Language: ${analysis?.bodyLanguage || 0}%
- Pacing: ${analysis?.pacing || 0}%
- Confidence: ${analysis?.confidence || 0}%
- Engagement: ${analysis?.engagement || 0}%

Strengths: ${analysis?.strengths?.join(', ') || 'None identified'}
Areas for Improvement: ${analysis?.areasForImprovement?.join(', ') || 'None identified'}

Recent conversation context: ${recentMessages || 'No previous context'}
Recent topics discussed: ${[...new Set(recentTopics)].join(', ') || 'None'}
Is greeting: ${isGreeting}
Greeting count: ${greetingCount}
Conversation phase: ${conversationPhase}

Guidelines:
1. Be encouraging and supportive
2. Provide specific, actionable feedback
3. Focus on 1-2 key points maximum
4. Use conversational, friendly tone
5. Keep response under 60 words
6. If user asked a question, answer it directly
7. If no specific data, provide general encouragement
8. NEVER use generic responses - always be specific to the analysis
9. AVOID repetitive responses - vary your feedback based on context
10. If user says "thank you" or similar, give a brief acknowledgment and move to constructive feedback
11. NEVER repeat the same feedback twice in a row
12. Focus on different aspects each time (voice, body language, confidence, etc.)
13. Use varied vocabulary and sentence structures
14. If this is a greeting (hi/hello), acknowledge it briefly and move to constructive feedback about their presentation skills
15. If multiple greetings, be more direct and focus on actual presentation practice
16. NEVER keep repeating greeting advice - move on to other aspects after first greeting
17. Based on conversation phase, adjust your approach:
   - Early: Focus on basic skills and encouragement
   - Middle: Provide specific technical feedback
   - Advanced: Challenge with complex presentation scenarios
18. NEVER use phrases like "let's focus on building momentum" or "since we're just getting started"
19. Be direct and actionable - tell them exactly what to do next
20. Vary your response style - sometimes ask questions, sometimes give direct advice
21. WAIT for the user to actually speak before responding - don't respond to silence or background noise
22. Only respond to meaningful speech with at least 2 meaningful words
23. Be patient - give users time to think and speak
24. If user asks about interview preparation, offer to start an interview practice session
25. For interview mode, focus on communication skills, confidence, and answering techniques

Respond with just the feedback text, no additional formatting.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini API');
      }
      
      const trimmedText = text.trim();
      
      // Post-process response to make it more sensible
      const processedText = this.postProcessResponse(trimmedText, userMessage, analysis);
      
      // Cache the response
      this.responseCache.set(cacheKey, {
        response: processedText,
        timestamp: Date.now()
      });
      
      // Clean old cache entries
      this.cleanCache();
      
      return processedText;
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  // Create cache key for response caching
  createCacheKey(analysis, userMessage) {
    const analysisKey = JSON.stringify({
      overallScore: Math.round(analysis?.overallScore || 0),
      voiceClarity: Math.round(analysis?.voiceClarity || 0),
      bodyLanguage: Math.round(analysis?.bodyLanguage || 0),
      pacing: Math.round(analysis?.pacing || 0),
      confidence: Math.round(analysis?.confidence || 0),
      engagement: Math.round(analysis?.engagement || 0)
    });
    return `${analysisKey}_${userMessage || 'no_message'}`;
  }

  // Clean expired cache entries
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.responseCache.delete(key);
      }
    }
  }

  // Get conversation phase based on history
  getConversationPhase() {
    const historyLength = this.conversationHistory.length;
    if (historyLength < 3) return 'early';
    if (historyLength < 8) return 'middle';
    return 'advanced';
  }

  // Post-process response to make it more sensible and less repetitive
  postProcessResponse(response, userMessage, analysis) {
    let processed = response;
    
    // Handle greetings more intelligently
    if (userMessage && /^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(userMessage.trim())) {
      const greetingCount = this.conversationHistory.filter(msg => 
        msg.userMessage && /^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(msg.userMessage.trim())
      ).length;
      
      if (greetingCount > 1) {
        // After first greeting, be more direct
        processed = processed.replace(/great.*ready.*start.*momentum.*voice.*projecting/gi, 
          'Good! Now let\'s work on your presentation skills. Try speaking about a topic you know well.');
      }
    }
    
    // Remove repetitive phrases
    const repetitivePhrases = [
      /let's focus on building some momentum/gi,
      /since we're just getting going/gi,
      /for our first step/gi,
      /how about we practice projecting/gi,
      /welcome.*great.*here/gi,
      /since we're just getting started/gi,
      /let's focus on making sure/gi
    ];
    
    repetitivePhrases.forEach(phrase => {
      if (processed.match(phrase) && this.conversationHistory.length > 2) {
        processed = processed.replace(phrase, 'Let\'s work on');
      }
    });
    
    // Ensure response is not too long
    if (processed.length > 120) {
      const sentences = processed.split(/[.!?]+/);
      if (sentences.length > 2) {
        processed = sentences.slice(0, 2).join('.') + '.';
      }
    }
    
    return processed;
  }

  // Determine facial expression based on analysis
  determineExpression(analysis) {
    const overallScore = analysis?.overallScore || 0;
    if (overallScore >= 85) return 'happy';
    if (overallScore >= 70) return 'smile';
    if (overallScore >= 55) return 'encouraging';
    return 'supportive';
  }

  // Set expression
  setExpression(expression) {
    this.currentExpression = expression;
    if (this.callbacks.onExpressionChange) {
      this.callbacks.onExpressionChange(expression);
    }
  }

  // Enhanced speak method with voice interaction enhancer
  async speak(text, context = {}) {
    if (!text) return;

    this.isTalking = true;
    this.setExpression('talking');
    
    if (this.callbacks.onTalkingStart) {
      this.callbacks.onTalkingStart(text);
    }

    try {
      // Use voice enhancer for natural speech
      await this.voiceEnhancer.speakNaturally(text, {
        isGreeting: context.isGreeting || false,
        isQuestion: context.isQuestion || false,
        isFeedback: context.isFeedback || false,
        isInstruction: context.isInstruction || false
      });
      
      this.isTalking = false;
      this.setExpression('neutral');
      
      if (this.callbacks.onTalkingEnd) {
        this.callbacks.onTalkingEnd();
      }
    } catch (error) {
      console.error('Enhanced speech synthesis error:', error);
      this.isTalking = false;
      this.setExpression('neutral');
      
      if (this.callbacks.onTalkingEnd) {
        this.callbacks.onTalkingEnd();
      }
    }
  }

  // Start listening
  startListening() {
    this.isListening = true;
    this.setExpression('listening');
    
    if (this.callbacks.onListeningStart) {
      this.callbacks.onListeningStart();
    }
  }

  // Stop listening
  stopListening() {
    this.isListening = false;
    this.setExpression('neutral');
    
    if (this.callbacks.onListeningEnd) {
      this.callbacks.onListeningEnd();
    }
  }

  // Get conversation history
  getConversationHistory() {
    return this.conversationHistory;
  }

  // Clear conversation history
  clearConversationHistory() {
    this.conversationHistory = [];
  }

  // Clear response cache
  clearCache() {
    this.responseCache.clear();
    console.log('Response cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.responseCache.size,
      maxAge: this.cacheTimeout,
      lastApiCall: this.lastApiCall
    };
  }

  // Update personality and voice settings dynamically
  updatePersonality(newPersonality) {
    this.personality = newPersonality;
    console.log(`Personality updated to: ${newPersonality}`);
  }

  updateVoiceSettings(newSettings) {
    this.voiceSettings = { ...this.voiceSettings, ...newSettings };
    console.log('Voice settings updated:', this.voiceSettings);
  }

  // Set callbacks
  onExpressionChange(callback) {
    this.callbacks.onExpressionChange = callback;
  }

  onTalkingStart(callback) {
    this.callbacks.onTalkingStart = callback;
  }

  onTalkingEnd(callback) {
    this.callbacks.onTalkingEnd = callback;
  }

  onListeningStart(callback) {
    this.callbacks.onListeningStart = callback;
  }

  onListeningEnd(callback) {
    this.callbacks.onListeningEnd = callback;
  }

  onMessage(callback) {
    this.callbacks.onMessage = callback;
  }

  // Dynamic interview coaching methods
  async startInterviewPractice(type = 'mixed', difficulty = 'medium', userContext = {}) {
    return await this.interviewCoach.startInterviewSession(type, difficulty, userContext);
  }

  getCurrentInterviewQuestion() {
    return this.interviewCoach.getCurrentQuestion();
  }

  async submitInterviewAnswer(answer, analysis = {}) {
    return await this.interviewCoach.submitAnswer(answer, analysis);
  }

  async completeInterviewSession() {
    return await this.interviewCoach.completeSession();
  }

  async getInterviewTips(category = 'general', userContext = {}) {
    return await this.interviewCoach.getInterviewTips(category, userContext);
  }

  updateUserProfile(profile) {
    this.interviewCoach.updateUserProfile(profile);
  }

  getCurrentInterviewSession() {
    return this.interviewCoach.getCurrentSession();
  }

  isInterviewSessionActive() {
    return this.interviewCoach.isSessionActive();
  }

  // Switch between presentation and interview modes
  setMode(mode) {
    this.currentMode = mode;
    console.log(`Mode switched to: ${mode}`);
  }

  // Get current mode
  getCurrentMode() {
    return this.currentMode;
  }

  // Advanced features methods
  getSmartSuggestions() {
    return this.advancedFeatures.generateSmartSuggestions(this.conversationHistory, {
      currentMode: this.currentMode,
      userPreferences: this.advancedFeatures.getUserPreferences()
    });
  }

  getLearningAnalytics() {
    return this.advancedFeatures.getLearningAnalytics();
  }

  updateUserPreferences(preferences) {
    this.advancedFeatures.updateUserPreferences(preferences);
  }

  getUserPreferences() {
    return this.advancedFeatures.getUserPreferences();
  }

  generateLearningPath(goals, currentSkills) {
    return this.advancedFeatures.generateLearningPath(goals, currentSkills);
  }

  adaptLearningApproach(performanceData) {
    return this.advancedFeatures.adaptLearningApproach(performanceData);
  }

  getContextualResponse(userMessage) {
    return this.advancedFeatures.generateContextualResponse(userMessage, this.conversationHistory);
  }

  // Stop all activities
  stop() {
    this.isActive = false;
    this.isTalking = false;
    this.isListening = false;
    this.setExpression('neutral');
    
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
  }
}

export default DynamicAICompanion;
