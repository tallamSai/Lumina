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
    this.currentMode = 'interview'; // interview, general
    
    // Interview mode state
    this.interviewSession = null;
    this.interviewContext = null; // Stores job role, industry, etc.
    this.interviewAnswers = []; // Stores all user answers with questions
    this.currentInterviewQuestion = null;
    this.interviewQuestionIndex = 0;
    this.interviewPhase = 'introduction'; // introduction, generic, technical, conclusion, feedback
    this.isGeneralConversation = false; // Track if user is making general conversation
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
      
      const prompt = `You are an AI interview coach meeting a new student for the first time. Generate a warm, encouraging, and personalized greeting that:
      1. Introduces yourself as their AI interview coach
      2. Shows enthusiasm about helping them improve their interview skills
      3. Sets a positive, supportive tone
      4. Mentions that you'll be analyzing their communication skills in real-time
      5. Keeps it conversational and friendly (2-3 sentences max)
      
      Respond with just the greeting text, no additional formatting.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return text || "Hello! I'm your AI interview coach. I'm excited to help you improve your interview skills today!";
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
    
    // Store user message in history if provided
    if (userMessage) {
      this.conversationHistory.push({
        timestamp,
        type: 'user_message',
        message: userMessage,
        userMessage: userMessage
      });
    }

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
      
      // If in interview mode and starting, generate first question
      if (this.currentMode === 'interview' && !this.currentInterviewQuestion && userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        if (lowerMessage.includes('start interview') || lowerMessage.includes('begin interview') || lowerMessage.includes('interview')) {
          const context = this.extractInterviewContext(userMessage);
          this.interviewContext = context;
          await this.generateNextInterviewQuestion(context);
          if (this.currentInterviewQuestion) {
            return `Thanks for coming in today. ${this.currentInterviewQuestion.question}`;
          }
        }
      }

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
      
      // Determine mode and build context-aware prompt
      const modeContext = await this.buildModeContext(userMessage, analysis);
      let prompt = modeContext.prompt;
      
      // Update mode if detected
      if (modeContext.mode) {
        this.currentMode = modeContext.mode;
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
      
      // For interview mode, use the simpler prompt from buildInterviewContext
      if (this.currentMode === 'interview') {
        // The prompt from buildInterviewContext is already complete and interviewer-focused
        // Just add a final instruction
        prompt += `\n\nRespond naturally as an interviewer. Keep it brief and conversational.`;
      } else {
        // For non-interview modes, add the full analysis and guidelines
        prompt += `\n\nBased on the following real-time analysis data, provide a helpful, encouraging, and specific response:

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
14. If this is a greeting (hi/hello), acknowledge it briefly and move to constructive feedback about their interview skills
15. If multiple greetings, be more direct and focus on actual interview practice
16. NEVER keep repeating greeting advice - move on to other aspects after first greeting
17. Based on conversation phase, adjust your approach:
   - Early: Focus on basic skills and encouragement
   - Middle: Provide specific technical feedback
   - Advanced: Challenge with complex interview scenarios
18. NEVER use phrases like "let's focus on building momentum" or "since we're just getting started"
19. Be direct and actionable - tell them exactly what to do next
20. Vary your response style - sometimes ask questions, sometimes give direct advice
21. WAIT for the user to actually speak before responding - don't respond to silence or background noise
22. Only respond to meaningful speech with at least 2 meaningful words
23. Be patient - give users time to think and speak
24. If user asks about interview preparation, offer to start an interview practice session
25. For interview mode, focus on communication skills, confidence, and answering techniques

Respond with just the feedback text, no additional formatting.`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini API');
      }
      
      const trimmedText = text.trim();
      
      // Post-process response to make it more sensible
      let processedText = this.postProcessResponse(trimmedText, userMessage, analysis);
      
      // In interview mode, ensure we ask questions properly
      if (this.currentMode === 'interview') {
        // If starting interview and we have a question ready, use it
        if (this.currentInterviewQuestion && this.interviewAnswers.length === 0) {
          // First question - return it directly with a brief greeting
          return `Thanks for coming in today. ${this.currentInterviewQuestion.question}`;
        }
        
        // Check if we're in feedback phase
        const currentPhase = this.getInterviewPhase();
        
        // If we've asked enough questions (7+), wrap up professionally with feedback
        if (currentPhase === 'feedback' || (this.interviewQuestionIndex >= 7 && this.interviewAnswers.length >= 6)) {
          // Ensure feedback is provided if in feedback phase
          if (currentPhase === 'feedback' && !processedText.toLowerCase().includes('strength') && !processedText.toLowerCase().includes('improve')) {
            const strengths = this.identifyInterviewStrengths();
            const improvements = this.identifyInterviewImprovements();
            
            // Build comprehensive feedback
            let feedbackParts = [];
            feedbackParts.push(`Thank you for your time today.`);
            
            if (strengths.length > 0) {
              feedbackParts.push(`I was impressed with your ${strengths[0]}${strengths.length > 1 ? ` and ${strengths[1]}` : ''}.`);
            }
            
            if (improvements.length > 0) {
              feedbackParts.push(`One suggestion would be to focus on ${improvements[0]}.`);
            }
            
            feedbackParts.push(`We'll be in touch soon about next steps.`);
            
            processedText = feedbackParts.join(' ');
          } else if (!processedText.toLowerCase().includes('thank') && !processedText.toLowerCase().includes('next step')) {
            processedText = `Thank you for your time today. We'll be in touch soon about next steps.`;
          }
          
          // Reset for next session after a delay (let user see feedback)
          setTimeout(() => {
            this.interviewSession = null;
            this.interviewQuestionIndex = 0;
            this.interviewAnswers = [];
            this.currentInterviewQuestion = null;
            this.interviewPhase = 'introduction';
          }, 5000);
        } else if (this.interviewQuestionIndex < 7) {
          // Ensure response ends with a question if we're continuing
          if (!processedText.includes('?') && this.interviewAnswers.length > 0) {
            // Generate and append next question naturally
            const nextQuestion = await this.generateNextInterviewQuestion();
            if (nextQuestion) {
              // Add natural transition
              processedText = processedText.trim();
              if (!processedText.endsWith('.') && !processedText.endsWith('!')) {
                processedText += '.';
              }
              processedText += ` ${nextQuestion.question}`;
            }
          }
        }
        
        // Remove any coaching language from interview mode responses
        processedText = processedText.replace(/great job|well done|keep practicing|you did well|good answer/gi, '');
        processedText = processedText.replace(/let's|let me give you|here's some feedback|i'd like to|i think you/gi, '');
      }
      
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

  // Build context-aware prompt based on mode
  async buildModeContext(userMessage, analysis) {
    const lowerMessage = userMessage?.toLowerCase() || '';
    
    // Check for interview mode triggers
    const interviewTriggers = ['start interview', 'begin interview', 'interview practice', 'practice interview', 'interview prep', 'prepare for interview', 'interview'];
    const isStartingInterview = interviewTriggers.some(trigger => lowerMessage.includes(trigger));
    
    // Check if already in interview mode
    const isInterviewMode = this.currentMode === 'interview' || this.interviewSession !== null;
    
    // Detect if user is making general conversation
    const conversationType = this.detectConversationType(userMessage);
    
    // If user is making general conversation and not in interview mode, respond naturally
    if (conversationType === 'general' && !isInterviewMode && !isStartingInterview) {
      return {
        prompt: `The user is making general conversation. Respond naturally, friendly, and human-like. After a brief, warm exchange, gently guide the conversation toward interview practice by asking what position they're interested in or if they'd like to start an interview. Keep it conversational (1-2 sentences max).`,
        mode: 'interview'
      };
    }
    
    // Extract interview context from user message
    if (isStartingInterview || (isInterviewMode && userMessage)) {
      return await this.buildInterviewContext(userMessage, analysis, isStartingInterview);
    }
    
    // Default to interview mode context
    return await this.buildInterviewContext(userMessage, analysis, false);
  }

  // Detect if message is general conversation or interview-related
  detectConversationType(message) {
    const lower = message.toLowerCase();
    
    // Interview triggers
    const interviewTriggers = ['interview', 'job', 'position', 'role', 'career', 'apply', 'hiring', 'candidate'];
    const hasInterviewTrigger = interviewTriggers.some(trigger => lower.includes(trigger));
    
    // General conversation indicators
    const generalIndicators = ['hello', 'hi', 'hey', 'how are you', 'what\'s up', 'thanks', 'thank you', 'nice to meet'];
    const hasGeneralIndicator = generalIndicators.some(indicator => lower.includes(indicator));
    
    // Technical terms (suggests interview context)
    const technicalTerms = ['developer', 'engineer', 'programming', 'coding', 'project', 'experience', 'skills'];
    const hasTechnicalTerms = technicalTerms.some(term => lower.includes(term));
    
    if (hasInterviewTrigger || hasTechnicalTerms) {
      return 'interview';
    } else if (hasGeneralIndicator && !hasInterviewTrigger) {
      return 'general';
    }
    
    return 'interview'; // Default to interview mode
  }

  // Determine current interview phase dynamically
  getInterviewPhase() {
    const answerCount = this.interviewAnswers.length;
    const totalQuestions = 7;
    
    if (answerCount === 0) {
      return 'introduction';
    } else if (answerCount >= 1 && answerCount <= 2) {
      return 'generic';
    } else if (answerCount >= 3 && answerCount <= 5) {
      return 'technical';
    } else if (answerCount >= 6 && answerCount < totalQuestions) {
      return 'conclusion';
    } else {
      return 'feedback';
    }
  }

  // Build interview mode context
  async buildInterviewContext(userMessage, analysis, isStarting = false) {
    // Detect conversation type
    const conversationType = this.detectConversationType(userMessage);
    
    // If user is making general conversation and we're not in interview mode, respond naturally
    if (conversationType === 'general' && !isStarting && this.interviewQuestionIndex === 0) {
      this.isGeneralConversation = true;
      return {
        prompt: `The user is making general conversation. Respond naturally and friendly. After a brief exchange, gently guide the conversation toward the interview by asking what position they're interested in or if they'd like to start an interview practice. Keep it conversational (1-2 sentences max).`,
        mode: 'interview'
      };
    }
    
    let prompt = `You are a professional, human-like interviewer conducting a real job interview. `;
    
    if (isStarting) {
      // Extract job role/context from user message
      const extractedContext = this.extractInterviewContext(userMessage);
      // Also extract technologies from the initial message
      const initialTech = this.extractTechnologies(userMessage);
      if (initialTech.length > 0) {
        extractedContext.skills = [...new Set([...extractedContext.skills || [], ...initialTech])];
      }
      // Ensure topic is extracted
      if (!extractedContext.topic) {
        const topicFromMsg = this.extractTopicFromMessage(userMessage);
        if (topicFromMsg) {
          extractedContext.topic = topicFromMsg;
        }
      }
      this.interviewContext = extractedContext;
      this.interviewAnswers = [];
      this.interviewQuestionIndex = 0;
      this.interviewPhase = 'introduction';
      this.isGeneralConversation = false;
      
      const roleInfo = extractedContext.role || 'a position';
      const topicInfo = extractedContext.topic || extractedContext.industry || null;
      const skillsList = extractedContext.skills?.length > 0 ? extractedContext.skills.join(', ') : null;
      
      prompt += `You're interviewing someone`;
      if (roleInfo !== 'a position') {
        prompt += ` for ${roleInfo}`;
      }
      if (topicInfo) {
        prompt += ` about ${topicInfo}`;
      }
      prompt += `.\n\n`;
      prompt += `Start with a brief greeting and ask your first question. `;
      if (topicInfo) {
        prompt += `Ask about ${topicInfo} - keep it introductory and friendly. `;
      } else {
        prompt += `Ask an introductory question to get to know them. `;
      }
      prompt += `Be natural and conversational (1-2 sentences).`;
      
      // Generate first question (will be used in response)
      await this.generateNextInterviewQuestion(extractedContext);
    } else if (this.interviewSession || this.currentMode === 'interview') {
      // User is answering a question
      const lastAnswer = {
        question: this.currentInterviewQuestion?.question || 'Previous question',
        answer: userMessage,
        timestamp: Date.now()
      };
      this.interviewAnswers.push(lastAnswer);
      
      // Update interview phase dynamically
      this.interviewPhase = this.getInterviewPhase();
      
      // Extract technologies/skills mentioned in the answer
      const mentionedTech = this.extractTechnologies(userMessage);
      if (mentionedTech.length > 0) {
        this.interviewContext.skills = [...new Set([...this.interviewContext.skills || [], ...mentionedTech])];
      }
      
      // Extract topic from answer if not already set
      const topicFromAnswer = this.extractInterviewContext(userMessage);
      if (topicFromAnswer.topic && !this.interviewContext.topic) {
        this.interviewContext.topic = topicFromAnswer.topic;
      }
      
      const previousQAs = this.interviewAnswers.slice(-3).map((qa, idx) => 
        `Q: ${qa.question}\nA: ${qa.answer.substring(0, 200)}`
      ).join('\n\n');
      
      // Extract topic from all conversation
      const topicFromConversation = this.extractTopicFromConversation();
      const topicInfo = this.interviewContext?.topic || topicFromConversation || this.interviewContext?.industry || null;
      const roleInfo = this.interviewContext?.role || 'a position';
      const skillsList = this.interviewContext?.skills?.length > 0 ? this.interviewContext.skills.join(', ') : null;
      const answerCount = this.interviewAnswers.length;
      
      prompt += `You're interviewing for ${roleInfo}`;
      if (topicInfo) {
        prompt += ` about ${topicInfo}`;
      }
      prompt += `.\n\n`;
      prompt += `Previous Q&A:\n${previousQAs}\n\n`;
      prompt += `They just answered: "${userMessage.substring(0, 200)}"\n\n`;
      prompt += `Question ${answerCount + 1} of ~7.\n\n`;
      
      // Simple phase-based guidance
      if (this.interviewPhase === 'introduction') {
        prompt += `Acknowledge their answer briefly, then ask a friendly introductory question about ${topicInfo || roleInfo}. `;
      } else if (this.interviewPhase === 'generic') {
        prompt += `Ask a behavioral or general question about ${topicInfo || roleInfo}. `;
        prompt += `Reference what they said. `;
      } else if (this.interviewPhase === 'technical') {
        if (topicInfo) {
          prompt += `Ask a specific question about ${topicInfo}. `;
          prompt += `Mix both technical and non-technical aspects. `;
          if (skillsList) {
            prompt += `You can ask about ${skillsList} if relevant, but also ask about concepts, applications, challenges, or real-world scenarios in ${topicInfo}. `;
          } else {
            prompt += `Ask about key concepts, practical applications, challenges, or real-world scenarios in ${topicInfo}. `;
          }
        } else if (skillsList) {
          prompt += `Ask a technical question about ${skillsList}. `;
        } else {
          prompt += `Ask a specific question about ${roleInfo}. `;
        }
        prompt += `Reference their previous answers. `;
      } else if (this.interviewPhase === 'conclusion') {
        prompt += `Ask a wrap-up question like "Do you have any questions for me?" or "What are you looking for?" `;
      } else if (this.interviewPhase === 'feedback') {
        prompt += `Thank them. Give brief feedback: 1-2 strengths, 1-2 areas to improve. Mention next steps. `;
      }
      
      prompt += `Keep it natural and conversational (1-2 sentences).`;
    } else {
      // User mentioned interview but we're not in interview mode yet
      prompt += `The candidate wants to start an interview. Ask them what position they're applying for. `;
    }
    
    return { prompt, mode: 'interview' };
  }


  // Extract topic/field from conversation - dynamic extraction
  extractTopicFromConversation() {
    if (!this.interviewContext) return null;
    
    // Combine all conversation text
    const allText = [
      ...this.interviewAnswers.map(qa => qa.answer),
      this.interviewContext.role || '',
      this.interviewContext.industry || ''
    ].join(' ').toLowerCase();
    
    // Comprehensive topic/field extraction
    const topics = [
      // Technical fields
      'machine learning', 'ml', 'deep learning', 'neural networks', 'ai', 'artificial intelligence',
      'data science', 'data analytics', 'big data', 'data engineering',
      'web development', 'web dev', 'frontend', 'backend', 'full stack', 'fullstack',
      'mobile development', 'ios development', 'android development',
      'devops', 'cloud computing', 'cybersecurity', 'security',
      'blockchain', 'cryptocurrency', 'web3',
      // Business fields
      'marketing', 'digital marketing', 'content marketing', 'social media marketing',
      'sales', 'business development', 'account management',
      'product management', 'project management',
      'consulting', 'management consulting', 'strategy',
      'finance', 'banking', 'investment', 'accounting',
      'human resources', 'hr', 'recruiting', 'talent acquisition',
      // Healthcare
      'healthcare', 'medical', 'nursing', 'pharmacy', 'public health',
      // Education
      'education', 'teaching', 'curriculum', 'academic',
      // Other
      'operations', 'supply chain', 'logistics',
      'legal', 'law', 'compliance',
      'real estate', 'property',
      'hospitality', 'tourism'
    ];
    
    // Find topics mentioned (longer matches first)
    const sortedTopics = topics.sort((a, b) => b.length - a.length);
    for (const topic of sortedTopics) {
      if (allText.includes(topic)) {
        return topic;
      }
    }
    
    return null;
  }

  // Extract interview context from user message - dynamic, no hardcoding
  extractInterviewContext(message) {
    const lower = message.toLowerCase();
    const context = {
      role: null,
      industry: null,
      topic: null, // Main topic/field they're discussing
      experience: 'intermediate',
      skills: []
    };
    
    // Extract role - more flexible patterns
    const rolePatterns = [
      /(?:for|as|applying for|position|role|job|role of|interested in|want|practice|questions about)\s+(?:a|an|the)?\s*([a-z\s]+?)(?:\s+(?:position|role|job|interview|developer|engineer|manager|analyst|specialist|consultant|director|executive|coordinator|assistant|associate|lead|senior|junior))?$/i,
      /(?:ask me|questions|interview me|practice)\s+(?:about|on|for|related to)\s+([a-z\s]+?)(?:\s+(?:position|role|job|interview|developer|engineer|manager))?$/i,
      /([a-z\s]+?)\s+(?:developer|engineer|programmer|manager|analyst|specialist|consultant|director|executive|coordinator|assistant|associate|lead|scientist|researcher)/i
    ];
    
    for (const pattern of rolePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const extracted = match[1].trim();
        if (extracted.length > 2 && !['a', 'an', 'the', 'for', 'as', 'about', 'on'].includes(extracted.toLowerCase())) {
          context.role = extracted;
          break;
        }
      }
    }
    
    // Extract topic/field dynamically from what they mention
    const topicKeywords = [
      'machine learning', 'ml', 'deep learning', 'neural networks', 'ai', 'artificial intelligence',
      'data science', 'data analytics', 'big data', 'data engineering',
      'web development', 'web dev', 'frontend', 'backend', 'full stack', 'fullstack',
      'mobile development', 'ios', 'android',
      'devops', 'cloud', 'cybersecurity', 'security',
      'blockchain', 'crypto', 'web3',
      'marketing', 'digital marketing', 'sales', 'business development',
      'product management', 'project management',
      'consulting', 'finance', 'banking', 'accounting',
      'human resources', 'hr', 'recruiting',
      'healthcare', 'medical', 'nursing', 'pharmacy',
      'education', 'teaching',
      'operations', 'supply chain', 'logistics',
      'legal', 'law', 'real estate', 'hospitality'
    ];
    
    // Check for topics (longer matches first)
    const sortedTopics = topicKeywords.sort((a, b) => b.length - a.length);
    for (const topic of sortedTopics) {
      if (lower.includes(topic)) {
        context.topic = topic;
        break;
      }
    }
    
    // Extract industry
    const industries = ['technology', 'tech', 'finance', 'healthcare', 'education', 'retail', 'consulting', 'startup', 'enterprise'];
    for (const industry of industries) {
      if (lower.includes(industry) && !context.topic) {
        context.industry = industry;
        break;
      }
    }
    
    // Extract experience level
    if (lower.includes('senior') || lower.includes('lead') || lower.includes('principal')) {
      context.experience = 'senior';
    } else if (lower.includes('junior') || lower.includes('entry') || lower.includes('graduate')) {
      context.experience = 'junior';
    }
    
    // Skills extracted via extractTechnologies - don't hardcode here
    
    return context;
  }

  // Extract topic from a single message
  extractTopicFromMessage(message) {
    const lower = message.toLowerCase();
    const topicKeywords = [
      'machine learning', 'ml', 'deep learning', 'neural networks', 'ai', 'artificial intelligence',
      'data science', 'data analytics', 'big data', 'data engineering',
      'web development', 'web dev', 'frontend', 'backend', 'full stack', 'fullstack',
      'mobile development', 'ios', 'android',
      'devops', 'cloud', 'cybersecurity', 'security',
      'blockchain', 'crypto', 'web3',
      'marketing', 'digital marketing', 'sales', 'business development',
      'product management', 'project management',
      'consulting', 'finance', 'banking', 'accounting',
      'human resources', 'hr', 'recruiting',
      'healthcare', 'medical', 'nursing', 'pharmacy',
      'education', 'teaching',
      'operations', 'supply chain', 'logistics',
      'legal', 'law', 'real estate', 'hospitality'
    ];
    
    const sortedTopics = topicKeywords.sort((a, b) => b.length - a.length);
    for (const topic of sortedTopics) {
      if (lower.includes(topic)) {
        return topic;
      }
    }
    return null;
  }

  // Extract technologies and skills from user message
  extractTechnologies(message) {
    const lower = message.toLowerCase();
    const technologies = [];
    
    // Comprehensive list of technologies
    const techList = [
      // Frontend
      'react', 'vue', 'angular', 'svelte', 'next.js', 'nextjs', 'nuxt', 'gatsby',
      'javascript', 'typescript', 'jsx', 'tsx', 'html', 'css', 'sass', 'scss',
      'redux', 'mobx', 'zustand', 'context api', 'webpack', 'vite', 'parcel',
      // Backend
      'node.js', 'nodejs', 'express', 'nestjs', 'fastify', 'koa',
      'python', 'django', 'flask', 'fastapi', 'tornado',
      'java', 'spring', 'spring boot', 'hibernate',
      'c#', 'asp.net', '.net', 'dotnet',
      'php', 'laravel', 'symfony', 'codeigniter',
      'ruby', 'rails', 'sinatra',
      'go', 'golang', 'rust',
      // Databases
      'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'cassandra',
      'sqlite', 'oracle', 'sql server', 'dynamodb', 'firebase',
      // Cloud & DevOps
      'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
      'terraform', 'ansible', 'jenkins', 'ci/cd', 'github actions',
      // Full Stack
      'full stack', 'fullstack', 'mern', 'mean', 'mevn', 'lamp', 'lemp',
      // Other
      'graphql', 'rest api', 'restful', 'microservices', 'serverless',
      'websocket', 'socket.io', 'grpc', 'rabbitmq', 'kafka'
    ];
    
    for (const tech of techList) {
      if (lower.includes(tech)) {
        technologies.push(tech);
      }
    }
    
    return [...new Set(technologies)]; // Remove duplicates
  }

  // Identify interview strengths from answers
  identifyInterviewStrengths() {
    if (!this.interviewAnswers || this.interviewAnswers.length === 0) {
      return [];
    }
    
    const strengths = [];
    const allAnswers = this.interviewAnswers.map(qa => qa.answer.toLowerCase()).join(' ');
    
    // Check for technical depth
    const technicalTerms = ['implement', 'optimize', 'architecture', 'design', 'algorithm', 'scalability', 'performance'];
    const hasTechnicalDepth = technicalTerms.some(term => allAnswers.includes(term));
    if (hasTechnicalDepth) {
      strengths.push('technical depth');
    }
    
    // Check for experience examples
    if (allAnswers.includes('project') || allAnswers.includes('experience') || allAnswers.includes('worked on')) {
      strengths.push('relevant experience');
    }
    
    // Check for problem-solving
    if (allAnswers.includes('solve') || allAnswers.includes('challenge') || allAnswers.includes('problem')) {
      strengths.push('problem-solving approach');
    }
    
    return strengths;
  }

  // Identify interview areas for improvement
  identifyInterviewImprovements() {
    if (!this.interviewAnswers || this.interviewAnswers.length === 0) {
      return [];
    }
    
    const improvements = [];
    const allAnswers = this.interviewAnswers.map(qa => qa.answer.toLowerCase()).join(' ');
    
    // Check answer length (too short might indicate need for more detail)
    const avgAnswerLength = this.interviewAnswers.reduce((sum, qa) => sum + qa.answer.length, 0) / this.interviewAnswers.length;
    if (avgAnswerLength < 50) {
      improvements.push('providing more detailed answers');
    }
    
    // Check for specific examples
    if (!allAnswers.includes('example') && !allAnswers.includes('instance') && !allAnswers.includes('project')) {
      improvements.push('using specific examples');
    }
    
    return improvements;
  }

  // Generate next interview question
  async generateNextInterviewQuestion(context = null) {
    if (!this.genAI) return null;
    
    try {
      const model = this.genAI.getGenerativeModel({ model: this.workingModelName || 'gemini-2.5-flash-lite' });
      
      const usedQuestions = this.interviewAnswers.map(qa => qa.question);
      const contextToUse = context || this.interviewContext || {};
      
      const recentAnswers = this.interviewAnswers.slice(-3).map((qa, i) => 
        `Q: ${qa.question}\nA: ${qa.answer.substring(0, 150)}`
      ).join('\n\n');
      
      const roleInfo = contextToUse.role || 'position';
      const topicInfo = contextToUse.topic || contextToUse.industry || this.extractTopicFromConversation() || null;
      const skillsList = contextToUse.skills?.length > 0 ? contextToUse.skills.join(', ') : null;
      const currentPhase = this.getInterviewPhase();
      
      const prompt = `Generate ONE interview question.

Role: ${roleInfo}
${topicInfo ? `Topic: ${topicInfo}` : ''}
${skillsList ? `Technologies: ${skillsList}` : ''}
Phase: ${currentPhase}
Question ${this.interviewQuestionIndex + 1} of 7

${recentAnswers ? `Recent:\n${recentAnswers}\n\n` : ''}

${currentPhase === 'introduction' ? `Ask a friendly introductory question about ${topicInfo || roleInfo}.` : ''}
${currentPhase === 'generic' ? `Ask a behavioral question about ${topicInfo || roleInfo}. Reference their answers.` : ''}
${currentPhase === 'technical' ? topicInfo ? `Ask a question about ${topicInfo}. Mix technical and non-technical aspects - concepts, applications, challenges, real-world scenarios. ${skillsList ? `Can mention ${skillsList} if relevant.` : ''}` : skillsList ? `Ask a technical question about ${skillsList}.` : `Ask a specific question about ${roleInfo}.` : ''}
${currentPhase === 'conclusion' ? `Ask a wrap-up question.` : ''}
${currentPhase === 'feedback' ? `Provide feedback and wrap up.` : ''}

Don't repeat: ${usedQuestions.slice(-3).join(', ')}
Be natural. Return ONLY the question.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const questionText = response.text().trim();
      
      this.currentInterviewQuestion = {
        question: questionText,
        index: this.interviewQuestionIndex,
        timestamp: Date.now()
      };
      
      this.interviewQuestionIndex++;
      
      return this.currentInterviewQuestion;
    } catch (error) {
      console.error('Error generating interview question:', error);
      return null;
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
        // In interview mode, don't add coaching language
        if (this.currentMode !== 'interview') {
          processed = processed.replace(/great.*ready.*start.*momentum.*voice.*projecting/gi, 
            'Good! Now let\'s work on your interview skills. Try answering some interview questions.');
        }
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

  // Switch between modes
  setMode(mode) {
    this.currentMode = mode;
    console.log(`Mode switched to: ${mode}`);
    
    // Reset interview state when switching away from interview mode
    if (mode !== 'interview') {
      this.interviewSession = null;
      this.interviewQuestionIndex = 0;
      this.currentInterviewQuestion = null;
      // Keep interviewAnswers for reference but mark session as ended
    }
  }
  
  // Get current interview question (for UI display)
  getCurrentInterviewQuestionForUI() {
    return this.currentInterviewQuestion;
  }
  
  // Get interview progress
  getInterviewProgress() {
    return {
      questionNumber: this.interviewQuestionIndex,
      totalQuestions: 7,
      answersGiven: this.interviewAnswers.length,
      context: this.interviewContext
    };
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
