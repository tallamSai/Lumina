import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Mic, MicOff, Video, VideoOff, MessageCircle, Phone, PhoneOff, Settings, Volume2, VolumeX, TrendingUp, Award, Clock, Save, Play, Pause, Loader2, Users, Briefcase, BookOpen, Star, CheckCircle } from 'lucide-react';
import { RealTimeSpeechAnalyzer } from '../lib/realTimeSpeechAnalyzer';
import { RealTimeVisionAnalyzer } from '../lib/realTimeVisionAnalyzer';
import { RealTimeVoiceAnalyzer } from '../lib/realTimeVoiceAnalyzer';
import { DynamicAICompanion } from '../lib/dynamicAICompanion';
import { DataStorageService } from '../lib/dataStorageService';
import AICharacter from '../components/AICharacter';
import FeedbackPanel from '../components/FeedbackPanel';
import Navbar from '../components/Navbar';
import VoiceRecorder from '../components/VoiceRecorder';

const AIInteraction = () => {
  // State management
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognitionService, setSpeechRecognitionService] = useState('Unknown');
  
  // Conversation flow states
  const [conversationState, setConversationState] = useState('waiting'); // waiting, listening, analyzing, responding
  const [currentUserInput, setCurrentUserInput] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [currentAIResponse, setCurrentAIResponse] = useState('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [lastResponseTime, setLastResponseTime] = useState(0);
  const [feedbackDebounceTimer, setFeedbackDebounceTimer] = useState(null);
  const [lastFeedbackContent, setLastFeedbackContent] = useState('');
  const [lastUserInput, setLastUserInput] = useState('');
  const [responseCount, setResponseCount] = useState(0);
  
  // Interview preparation states
  const [currentMode, setCurrentMode] = useState('interview'); // interview, general
  const [interviewSession, setInterviewSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [interviewProgress, setInterviewProgress] = useState({ completed: 0, total: 0 });
  const [showInterviewMode, setShowInterviewMode] = useState(false);
  
  // AI Companion states
  const [aiCompanionState, setAiCompanionState] = useState({
    isTalking: false,
    currentExpression: 'neutral',
    isListening: false,
    currentMessage: '',
    avatar: 'default'
  });
  
  // Feedback history with timestamps
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Refs
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const chatEndRef = useRef(null);
  const mediaStreamRef = useRef(null); // Store the media stream for proper management

  // AI Services
  const speechAnalyzer = useRef(new RealTimeSpeechAnalyzer());
  const visionAnalyzer = useRef(new RealTimeVisionAnalyzer());
  const voiceAnalyzer = useRef(new RealTimeVoiceAnalyzer());
  const aiCompanion = useRef(new DynamicAICompanion());
  const dataStorage = useRef(new DataStorageService());

  // Initialize services
  useEffect(() => {
    initializeServices();
    return () => {
      cleanupServices();
    };
  }, []);

  // Handle video state changes - ensure video element is properly updated
  useEffect(() => {
    if (isSessionActive && mediaStreamRef.current && videoRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      
      if (isVideoOn && videoTracks.length > 0) {
        // Ensure video track is enabled and video element has stream
        videoTracks.forEach(track => {
          track.enabled = true;
        });
        
        if (videoRef.current.srcObject !== mediaStreamRef.current) {
          videoRef.current.srcObject = mediaStreamRef.current;
          videoRef.current.play().catch(err => console.log('Video play error:', err));
        }
        
        // Lock video dimensions to prevent zooming
        if (videoRef.current) {
          videoRef.current.style.width = '100%';
          videoRef.current.style.height = '100%';
          videoRef.current.style.objectFit = 'cover';
          videoRef.current.style.objectPosition = 'center';
          videoRef.current.style.transform = 'scale(1)';
          videoRef.current.style.transformOrigin = 'center';
          videoRef.current.style.minWidth = '100%';
          videoRef.current.style.minHeight = '100%';
          videoRef.current.style.maxWidth = '100%';
          videoRef.current.style.maxHeight = '100%';
        }
        
        // Restart vision analysis when video is turned on
        if (videoRef.current) {
          visionAnalyzer.current.startAnalysis(videoRef.current, canvasRef.current);
        }
      } else if (!isVideoOn && videoTracks.length > 0) {
        // Disable video tracks
        videoTracks.forEach(track => {
          track.enabled = false;
        });
        
        // Stop vision analysis when video is off
        visionAnalyzer.current.stopAnalysis();
      }
    }
  }, [isVideoOn, isSessionActive]);

  // Handle audio state changes
  useEffect(() => {
    if (isSessionActive && mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      
      if (isAudioOn && audioTracks.length > 0) {
        // Enable audio tracks
        audioTracks.forEach(track => {
          track.enabled = true;
        });
        
        // Restart analysis when audio is turned on
        if (mediaStreamRef.current) {
          voiceAnalyzer.current.startAnalysis(mediaStreamRef.current);
          speechAnalyzer.current.startListening(mediaStreamRef.current);
        }
      } else if (!isAudioOn && audioTracks.length > 0) {
        // Disable audio tracks
        audioTracks.forEach(track => {
          track.enabled = false;
        });
        
        // Stop analysis when audio is off
        speechAnalyzer.current.stopListening();
        voiceAnalyzer.current.stopAnalysis();
      }
    }
  }, [isAudioOn, isSessionActive]);

  // Initialize all services
  const initializeServices = async () => {
    try {
      // Initialize data storage
      await dataStorage.current.initialize();
      
      // Initialize speech analyzer
      await speechAnalyzer.current.initialize();
      
      // Initialize vision analyzer
      await visionAnalyzer.current.initialize();
      
      // Initialize voice analyzer
      await voiceAnalyzer.current.initialize();
      
      // Set up AI companion callbacks
      setupAICompanionCallbacks();
      
      // Set up analysis callbacks
      setupAnalysisCallbacks();
      
      console.log('All services initialized successfully');
    } catch (error) {
      console.error('Error initializing services:', error);
    }
  };

  // Setup analysis callbacks
  const setupAnalysisCallbacks = () => {
    // Speech analysis callbacks
    speechAnalyzer.current.onSpeechAnalysis((data) => {
      console.log('Speech analysis received:', data);
      console.log('Transcript:', data.transcript);
      console.log('Analysis:', data.analysis);
      // Only react to final transcripts to enforce 1-to-1 turns
      if (data.isFinal === false) {
        return;
      }
      
      // Update speech recognition service status
      setSpeechRecognitionService('🎤 Voice.py Backend (Google Speech Recognition)');
      
      // Only process if we have meaningful speech
      if (!data.transcript || data.transcript.length < 3) {
        console.log('Skipping - no meaningful speech');
        return;
      }
      
      setCurrentUserInput(data.transcript);
      
      // Check for meaningful content
      const meaningfulWords = data.transcript.split(' ').filter(word => 
        word.length > 2 && !['um', 'uh', 'ah', 'er', 'mm', 'hmm', 'thanks', 'thank'].includes(word.toLowerCase())
      );
      
      if (meaningfulWords.length < 2) {
        console.log('Skipping response - not enough meaningful words');
        return;
      }
      
      // Check if user is asking to start interview
      const transcriptLower = data.transcript.toLowerCase();
      const isStartingInterview = transcriptLower.includes('start interview') ||
        transcriptLower.includes('begin interview') ||
        transcriptLower.includes('interview practice') ||
        (transcriptLower.includes('interview') && (transcriptLower.includes('start') || transcriptLower.includes('begin')));
      
      const isInterviewRequest = transcriptLower.includes('interview') ||
        transcriptLower.includes('prepare') ||
        transcriptLower.includes('practice') ||
        transcriptLower.includes('question') ||
        transcriptLower.includes('job');
      
      // If user explicitly wants to start interview, initialize it
      if (isStartingInterview) {
        setCurrentMode('interview');
        setShowInterviewMode(true);
        aiCompanion.current.setMode('interview');
        // The AI will automatically start asking questions based on context
        console.log('Starting interview mode - AI will ask first question');
      } else if (isInterviewRequest && currentMode !== 'interview') {
        setCurrentMode('interview');
        setShowInterviewMode(true);
        aiCompanion.current.setMode('interview');
        console.log('Switching to interview mode');
      }
      
      // Only generate response if conversation state is 'waiting' and not already generating
      if (conversationState === 'waiting' && !isGeneratingResponse) {
        console.log('Generating AI response for meaningful speech:', data.transcript);
        generateAIResponse(data.transcript, data.analysis);
      } else {
        console.log('Skipping response generation - not in waiting state or already generating');
        console.log('Conversation state:', conversationState, 'Is generating:', isGeneratingResponse);
      }
    });

    speechAnalyzer.current.onSpeechStart(() => {
      console.log('Speech started');
      setAiCompanionState(prev => ({ ...prev, isListening: true }));
      aiCompanion.current.startListening();
    });

    speechAnalyzer.current.onSpeechEnd(() => {
      console.log('Speech ended');
      setAiCompanionState(prev => ({ ...prev, isListening: false }));
      aiCompanion.current.stopListening();
    });

    // Vision analysis callbacks
    visionAnalyzer.current.onAnalysisUpdate((analysis) => {
      console.log('Vision analysis:', analysis);
      setCurrentAnalysis(prev => ({
        ...prev,
        vision: analysis
      }));
    });

    // Voice analysis callbacks
    voiceAnalyzer.current.onVoiceAnalysis((voiceData) => {
      console.log('Voice analysis:', voiceData);
      setCurrentAnalysis(prev => ({
        ...prev,
        voice: voiceData
      }));
    });

    // Error callbacks
    speechAnalyzer.current.onError((error) => {
      console.error('Speech analysis error:', error);
      
      // Show user-friendly error messages
      if (error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permissions and refresh the page.');
      } else if (error === 'no-speech') {
        console.log('No speech detected - this is normal');
      } else if (error === 'audio-capture') {
        alert('No microphone found. Please check your microphone connection.');
      } else if (error === 'network') {
        alert('Network error. Please check your internet connection.');
      } else {
        console.error('Speech recognition error:', error);
      }
    });

    visionAnalyzer.current.onError((error) => {
      console.error('Vision analysis error:', error);
    });

    voiceAnalyzer.current.onError((error) => {
      console.error('Voice analysis error:', error);
    });
  };

  // Setup AI companion callbacks
  const setupAICompanionCallbacks = () => {
    aiCompanion.current.onExpressionChange((expression) => {
      setAiCompanionState(prev => ({ ...prev, currentExpression: expression }));
    });

    aiCompanion.current.onTalkingStart((message) => {
      setAiCompanionState(prev => ({ ...prev, isTalking: true, currentMessage: message }));
    });

    aiCompanion.current.onTalkingEnd(() => {
      setAiCompanionState(prev => ({ ...prev, isTalking: false, currentMessage: '' }));
    });

    aiCompanion.current.onListeningStart(() => {
      setAiCompanionState(prev => ({ ...prev, isListening: true }));
    });

    aiCompanion.current.onListeningEnd(() => {
      setAiCompanionState(prev => ({ ...prev, isListening: false }));
    });
  };

  // Generate AI response based on analysis
  const generateAIResponse = async (userInput, analysis) => {
    // Prevent duplicate responses
    if (isGeneratingResponse) {
      console.log('Already generating response, skipping...');
      return;
    }

    // Check for duplicate input within last 5 seconds
    const now = Date.now();
    if (userInput === lastUserInput && now - lastResponseTime < 5000) {
      console.log('Duplicate input detected, skipping...');
      return;
    }
    
    // Check for too many responses in short time
    if (responseCount > 3 && now - lastResponseTime < 10000) {
      console.log('Too many responses in short time, skipping...');
      return;
    }

    try {
      setIsGeneratingResponse(true);
      setConversationState('analyzing');
      setLastResponseTime(Date.now());
      
      // Combine all analysis data
      const comprehensiveAnalysis = {
        overallScore: calculateOverallScore(),
        voiceClarity: currentAnalysis?.voice?.clarity?.score || 0,
        bodyLanguage: currentAnalysis?.vision?.posture?.score || 0,
        pacing: currentAnalysis?.voice?.pace?.rhythm || 0,
        confidence: calculateConfidenceScore(),
        engagement: currentAnalysis?.vision?.engagement?.score || 0,
        strengths: identifyStrengths(),
        areasForImprovement: identifyImprovements()
      };

      console.log('Generating AI response with analysis:', comprehensiveAnalysis);

      // Generate AI response using Gemini
      const response = await aiCompanion.current.generateResponse(comprehensiveAnalysis, userInput);
      
      console.log('AI response generated:', response.message);
      
      setCurrentAIResponse(response.message);
      setConversationState('responding');
      setLastUserInput(userInput);
      setResponseCount(prev => prev + 1);
      
      // Add to feedback history
      addToFeedbackHistory(response);
      
      // Speak the response
      if (!isMuted) {
        await aiCompanion.current.speak(response.message);
      }
      
      // Save to storage
      await saveFeedbackToStorage(response);
      
      // Reset for next interaction
      setTimeout(() => {
        setConversationState('waiting');
        setCurrentUserInput('');
        setCurrentAIResponse('');
        setIsGeneratingResponse(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      setConversationState('waiting');
      setIsGeneratingResponse(false);
      
      // Show error to user
      const errorMessage = `Error: ${error.message}. Please check your Gemini API key configuration.`;
      setCurrentAIResponse(errorMessage);
      
      // Reset after showing error
      setTimeout(() => {
        setCurrentAIResponse('');
        setConversationState('waiting');
      }, 3000);
    }
  };

  // Calculate overall score
  const calculateOverallScore = () => {
    const voiceScore = currentAnalysis?.voice?.quality?.overall || 0;
    const visionScore = currentAnalysis?.vision?.bodyPresence?.score || 0;
    const speechScore = currentAnalysis?.speech?.overall || 0;
    
    return Math.round((voiceScore + visionScore + speechScore) / 3);
  };

  // Calculate confidence score
  const calculateConfidenceScore = () => {
    const voiceStability = currentAnalysis?.voice?.pitch?.stability || 0;
    const bodyPresence = currentAnalysis?.vision?.bodyPresence?.score || 0;
    const posture = currentAnalysis?.vision?.posture?.score || 0;
    
    return Math.round((voiceStability + bodyPresence + posture) / 3);
  };

  // Identify strengths
  const identifyStrengths = () => {
    const strengths = [];
    
    if (currentAnalysis?.voice?.clarity?.score > 80) {
      strengths.push('Clear voice delivery');
    }
    if (currentAnalysis?.vision?.posture?.score > 80) {
      strengths.push('Good posture');
    }
    if (currentAnalysis?.vision?.gestures?.score > 80) {
      strengths.push('Engaging gestures');
    }
    if (currentAnalysis?.vision?.eyeContact?.score > 80) {
      strengths.push('Good eye contact');
    }
    
    return strengths;
  };

  // Identify improvements
  const identifyImprovements = () => {
    const improvements = [];
    
    if (currentAnalysis?.voice?.clarity?.score < 70) {
      improvements.push('Voice clarity needs improvement');
    }
    if (currentAnalysis?.vision?.posture?.score < 70) {
      improvements.push('Work on posture');
    }
    if (currentAnalysis?.vision?.gestures?.score < 70) {
      improvements.push('Use more gestures');
    }
    if (currentAnalysis?.vision?.eyeContact?.score < 70) {
      improvements.push('Improve eye contact');
    }
    
    return improvements;
  };

  // Add to feedback history with improved duplicate prevention
  const addToFeedbackHistory = (response) => {
    // Immediate duplicate check
    if (response.message === lastFeedbackContent) {
      console.log('Skipping duplicate feedback immediately');
      return;
    }
    
    // Check for similar content in recent history
    const isSimilarToRecent = feedbackHistory.slice(-3).some(entry => 
      entry.message && calculateSimilarity(response.message, entry.message) > 0.8
    );
    
    if (isSimilarToRecent) {
      console.log('Skipping similar feedback');
      return;
    }
    
    const feedbackEntry = {
      id: Date.now(),
      timestamp: Date.now(),
      message: response.message,
      analysis: response.analysis,
      userInput: currentUserInput,
      conversationState: conversationState,
      performanceLevel: response.analysis?.overallScore >= 85 ? 'excellent' :
                     response.analysis?.overallScore >= 70 ? 'good' :
                     response.analysis?.overallScore >= 55 ? 'fair' : 'needs_improvement'
    };
    
    setLastFeedbackContent(response.message);
    setFeedbackHistory(prev => [...prev, feedbackEntry]);
  };

  // Calculate similarity between two strings
  const calculateSimilarity = (str1, str2) => {
    const words1 = str1.toLowerCase().split(' ');
    const words2 = str2.toLowerCase().split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    return intersection.length / Math.max(words1.length, words2.length);
  };

  // Save feedback to storage
  const saveFeedbackToStorage = async (response) => {
    try {
      await dataStorage.current.saveFeedback({
        message: response.message,
        analysis: response.analysis,
        userInput: currentUserInput,
        timestamp: Date.now(),
        sessionId: sessionStartTime
      });
    } catch (error) {
      console.error('Error saving feedback to storage:', error);
    }
  };

  // Cleanup services
  const cleanupServices = () => {
    speechAnalyzer.current.cleanup();
    visionAnalyzer.current.cleanup();
    voiceAnalyzer.current.cleanup();
    aiCompanion.current.stop();
    
    // Clear any pending timers
    if (feedbackDebounceTimer) {
      clearTimeout(feedbackDebounceTimer);
    }
  };

  const startVideoCapture = async (videoEnabled = null, audioEnabled = null) => {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = 'Your browser does not support camera/microphone access. Please use a modern browser like Chrome, Firefox, or Edge.';
      console.error(errorMsg);
      alert(errorMsg);
      return;
    }

    // Use provided parameters or fall back to state, default to true if starting session
    const wantVideo = videoEnabled !== null ? videoEnabled : isVideoOn;
    const wantAudio = audioEnabled !== null ? audioEnabled : isAudioOn;

    // Ensure at least one is requested
    if (!wantVideo && !wantAudio) {
      console.error('At least one of video or audio must be requested');
      alert('Error: At least one of camera or microphone must be enabled.');
      return;
    }

    try {
      // Stop existing stream if any
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      // Try to get both video and audio together first
      let stream = null;
      const constraints = {
        video: wantVideo ? { 
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user',
          aspectRatio: 16/9
        } : false,
        audio: wantAudio ? { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } : false
      };

      try {
        // First attempt with ideal constraints
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstError) {
        console.warn('First attempt failed, trying with simpler constraints:', firstError);
        
        // Fallback: Try with simpler constraints
        const fallbackConstraints = {
          video: isVideoOn ? { facingMode: 'user' } : false,
          audio: isAudioOn ? true : false
        };
        
        try {
          stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        } catch (secondError) {
          console.warn('Fallback attempt failed, trying video and audio separately:', secondError);
          
          // Last resort: Try to get video and audio separately
          const videoStream = wantVideo ? await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }).catch(() => null) : null;
          const audioStream = wantAudio ? await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null) : null;
          
          if (videoStream || audioStream) {
            // Combine streams if we got at least one
            if (videoStream && audioStream) {
              // Add audio tracks to video stream
              audioStream.getAudioTracks().forEach(track => {
                videoStream.addTrack(track);
              });
              stream = videoStream;
            } else {
              stream = videoStream || audioStream;
            }
          } else {
            throw secondError; // Throw the last error if everything failed
          }
        }
      }
      
      if (!stream) {
        throw new Error('Failed to get media stream');
      }
      
      // Store stream reference
      mediaStreamRef.current = stream;
      
      if (videoRef.current && wantVideo) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => {
          console.warn('Video play error (non-critical):', err);
        });
        
        // Lock video dimensions to prevent zooming
        videoRef.current.style.width = '100%';
        videoRef.current.style.height = '100%';
        videoRef.current.style.objectFit = 'cover';
        videoRef.current.style.objectPosition = 'center';
        videoRef.current.style.transform = 'scale(1)';
        videoRef.current.style.transformOrigin = 'center';
        videoRef.current.style.minWidth = '100%';
        videoRef.current.style.minHeight = '100%';
        videoRef.current.style.maxWidth = '100%';
        videoRef.current.style.maxHeight = '100%';
      }
      
      // Start real-time analysis
      startRealTimeAnalysis(stream, wantVideo, wantAudio);
      
    } catch (error) {
      console.error('Error accessing camera/microphone:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Error accessing camera and microphone. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera/microphone access was denied. Please:\n';
        errorMessage += '1. Click the lock icon in your browser\'s address bar\n';
        errorMessage += '2. Allow camera and microphone permissions\n';
        errorMessage += '3. Refresh the page and try again';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found. Please:\n';
        errorMessage += '1. Connect a camera and/or microphone\n';
        errorMessage += '2. Make sure they are not being used by another application\n';
        errorMessage += '3. Try again';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera/microphone is already in use. Please:\n';
        errorMessage += '1. Close other applications using the camera/microphone\n';
        errorMessage += '2. Refresh the page and try again';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Camera/microphone settings not supported. Trying with basic settings...';
        console.log('Retrying with basic constraints...');
        // Retry with minimal constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({
            video: wantVideo,
            audio: wantAudio
          });
          mediaStreamRef.current = basicStream;
          if (videoRef.current && wantVideo) {
            videoRef.current.srcObject = basicStream;
            videoRef.current.play();
          }
          startRealTimeAnalysis(basicStream, wantVideo, wantAudio);
          return; // Success with basic constraints
        } catch (retryError) {
          errorMessage = 'Unable to access camera/microphone with any settings. Please check your device permissions.';
        }
      } else {
        errorMessage += `Error: ${error.message || error.name || 'Unknown error'}`;
      }
      
      alert(errorMessage);
      
      // Reset states on error
      if (isSessionActive) {
        setIsVideoOn(false);
        setIsAudioOn(false);
      }
    }
  };

  const stopVideoCapture = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Stop all analysis
    speechAnalyzer.current.stopListening();
    visionAnalyzer.current.stopAnalysis();
    voiceAnalyzer.current.stopAnalysis();
  };

  const startRealTimeAnalysis = (stream, videoEnabled = null, audioEnabled = null) => {
    // Use provided parameters or fall back to state
    const useVideo = videoEnabled !== null ? videoEnabled : isVideoOn;
    const useAudio = audioEnabled !== null ? audioEnabled : isAudioOn;
    
    // Start vision analysis only if video is on
    if (useVideo && videoRef.current) {
      visionAnalyzer.current.startAnalysis(videoRef.current, canvasRef.current);
    }
    
    // Start voice analysis only if audio is on
    if (useAudio && stream) {
      voiceAnalyzer.current.startAnalysis(stream);
    }
    
    // Start speech analysis only if audio is on
    if (useAudio && stream) {
      speechAnalyzer.current.startListening(stream);
    }
  };

  // Check media device permissions
  const checkMediaPermissions = async () => {
    if (!navigator.permissions || !navigator.permissions.query) {
      // Permissions API not supported, will rely on getUserMedia error handling
      return { video: 'unknown', audio: 'unknown' };
    }

    try {
      // Use string literals directly (no TypeScript type assertion in JSX)
      const videoPermission = await navigator.permissions.query({ name: 'camera' }).catch(() => null);
      const audioPermission = await navigator.permissions.query({ name: 'microphone' }).catch(() => null);
      
      return {
        video: videoPermission?.state || 'unknown',
        audio: audioPermission?.state || 'unknown'
      };
    } catch (error) {
      console.warn('Could not check permissions:', error);
      return { video: 'unknown', audio: 'unknown' };
    }
  };

  const startSession = async () => {
    try {
      // Check permissions first
      const permissions = await checkMediaPermissions();
      console.log('Media permissions:', permissions);
      
      setIsSessionActive(true);
      setIsVideoOn(true);
      setIsAudioOn(true);
      setIsMuted(false); // Unmuted by default
      setIsRecording(true);
      setSessionStartTime(Date.now());
      
      // Initialize AI companion with error handling
      try {
        await aiCompanion.current.initialize();
        console.log('AI companion initialized successfully');
      } catch (error) {
        console.error('Error initializing AI companion:', error);
        alert(`Error initializing AI companion: ${error.message}. Please check your Gemini API key configuration.`);
        // Reset session state
        setIsSessionActive(false);
        setIsVideoOn(false);
        setIsAudioOn(false);
        setIsRecording(false);
        return;
      }
      
      // Start video capture with explicit true values to ensure they're enabled
      await startVideoCapture(true, true);
      
      // Verify stream was created successfully
      if (!mediaStreamRef.current) {
        throw new Error('Failed to start camera/microphone. Please check permissions and try again.');
      }
      
      console.log('Session started successfully');
    } catch (error) {
      console.error('Error starting session:', error);
      
      // Reset session state on error
      setIsSessionActive(false);
      setIsVideoOn(false);
      setIsAudioOn(false);
      setIsRecording(false);
      
      // Error message already shown in startVideoCapture
      if (!error.message.includes('Error accessing')) {
        alert(`Error starting session: ${error.message}`);
      }
    }
  };

  const endSession = () => {
    setIsSessionActive(false);
    setIsVideoOn(false);
    setIsAudioOn(false);
    setIsRecording(false);
    
    // Stop all analysis
    stopVideoCapture();
    
    // Stop AI companion
    aiCompanion.current.stop();
    
    // Save session data
    saveSessionData();
    
    console.log('Session ended');
  };


  // Save session data
  const saveSessionData = async () => {
    try {
      const sessionData = {
        startTime: sessionStartTime,
        endTime: Date.now(),
        duration: sessionStartTime ? Date.now() - sessionStartTime : 0,
        feedbackCount: feedbackHistory.length,
        averageScore: feedbackHistory.length > 0 ? 
          Math.round(feedbackHistory.reduce((acc, f) => acc + (f.analysis?.overallScore || 0), 0) / feedbackHistory.length) : 0
      };
      
      await dataStorage.current.saveSession(sessionData);
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted) {
      speechSynthesis.cancel();
    }
  };

  // Toggle video on/off
  const toggleVideo = async () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    
    if (isSessionActive) {
      if (!mediaStreamRef.current) {
        // No stream exists, need to create one with current states
        await startVideoCapture(newVideoState, isAudioOn);
        return;
      }
      
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      
      if (newVideoState) {
        // Turn video on
        if (videoTracks.length === 0 || videoTracks.every(track => track.readyState === 'ended')) {
          // Need to get new video track
          try {
            const newStream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                frameRate: { ideal: 30, max: 60 },
                facingMode: 'user',
                aspectRatio: 16/9
              }
            });
            
            // Add new video track to existing stream
            newStream.getVideoTracks().forEach(track => {
              if (mediaStreamRef.current) {
                mediaStreamRef.current.addTrack(track);
              }
            });
            
            // Update video element
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStreamRef.current;
              videoRef.current.play().catch(err => console.log('Video play error:', err));
            }
            
            // Restart vision analysis
            if (videoRef.current) {
              visionAnalyzer.current.startAnalysis(videoRef.current, canvasRef.current);
            }
          } catch (error) {
            console.error('Error getting video stream:', error);
            alert('Error accessing camera. Please check permissions.');
            setIsVideoOn(false);
          }
        } else {
          // Just enable existing video tracks
          videoTracks.forEach(track => {
            track.enabled = true;
          });
          
          // Restart vision analysis
          if (videoRef.current) {
            visionAnalyzer.current.startAnalysis(videoRef.current, canvasRef.current);
          }
        }
      } else {
        // Turn video off - disable video tracks but keep stream
        videoTracks.forEach(track => {
          track.enabled = false;
        });
        
        // Stop vision analysis
        visionAnalyzer.current.stopAnalysis();
      }
    }
  };

  // Toggle audio on/off
  const toggleAudio = async () => {
    const newAudioState = !isAudioOn;
    setIsAudioOn(newAudioState);
    
    if (isSessionActive) {
      if (!mediaStreamRef.current) {
        // No stream exists, need to create one with current states
        await startVideoCapture(isVideoOn, newAudioState);
        return;
      }
      
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      
      if (newAudioState) {
        // Turn audio on
        if (audioTracks.length === 0 || audioTracks.every(track => track.readyState === 'ended')) {
          // Need to get new audio track
          try {
            const newStream = await navigator.mediaDevices.getUserMedia({ 
              audio: { 
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100
              }
            });
            
            // Add new audio track to existing stream
            newStream.getAudioTracks().forEach(track => {
              if (mediaStreamRef.current) {
                mediaStreamRef.current.addTrack(track);
              }
            });
            
            // Restart audio analysis
            if (mediaStreamRef.current) {
              voiceAnalyzer.current.startAnalysis(mediaStreamRef.current);
              speechAnalyzer.current.startListening(mediaStreamRef.current);
            }
          } catch (error) {
            console.error('Error getting audio stream:', error);
            alert('Error accessing microphone. Please check permissions.');
            setIsAudioOn(false);
          }
        } else {
          // Just enable existing audio tracks
          audioTracks.forEach(track => {
            track.enabled = true;
          });
          
          // Restart audio analysis
          if (mediaStreamRef.current) {
            voiceAnalyzer.current.startAnalysis(mediaStreamRef.current);
            speechAnalyzer.current.startListening(mediaStreamRef.current);
          }
        }
      } else {
        // Turn audio off - disable audio tracks but keep stream
        audioTracks.forEach(track => {
          track.enabled = false;
        });
        
        // Stop audio analysis
        speechAnalyzer.current.stopListening();
        voiceAnalyzer.current.stopAnalysis();
      }
    }
  };

  const handleSaveFeedback = async () => {
    try {
      // Save all feedback to IndexedDB
      for (const feedback of feedbackHistory) {
        await dataStorage.current.saveFeedback(feedback);
      }
      
      alert('Feedback saved successfully!');
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Error saving feedback. Please try again.');
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all feedback history?')) {
      setFeedbackHistory([]);
      setCurrentUserInput('');
      setCurrentAIResponse('');
      setCurrentAnalysis(null);
      setConversationState('waiting');
    }
  };

  // Enhanced interview preparation functions
  const startInterviewPractice = async (type = 'mixed', difficulty = 'medium') => {
    try {
      const userContext = {
        experience: 'intermediate', // This could be gathered from user profile
        industry: 'technology',
        role: 'software developer',
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        strengths: ['Problem-solving', 'Team collaboration'],
        weaknesses: ['Public speaking', 'Time management']
      };
      
      const session = await aiCompanion.current.startInterviewSession(type, difficulty, userContext);
      setInterviewSession(session);
      setCurrentQuestion(aiCompanion.current.getCurrentInterviewQuestion());
      setInterviewProgress({ completed: 0, total: session.totalQuestions });
      setCurrentMode('interview');
      aiCompanion.current.setMode('interview');
      console.log('Enhanced interview practice started:', session);
    } catch (error) {
      console.error('Error starting interview practice:', error);
      alert('Error starting interview practice. Please try again.');
    }
  };

  const submitInterviewAnswer = async (answer) => {
    if (!interviewSession) return;

    try {
      const result = await aiCompanion.current.submitInterviewAnswer(answer, currentAnalysis);
      
      console.log('Interview answer result:', result);
      
      if (result.isComplete) {
        console.log('Interview session completed with summary:', result);
        setInterviewSession(null);
        setCurrentQuestion(null);
        setCurrentMode('interview');
        aiCompanion.current.setMode('interview');
        
        // Show completion message with overall score
        if (result.overallScore) {
          alert(`Interview completed! Your overall score: ${result.overallScore}/100`);
        }
      } else {
        setCurrentQuestion(result.nextQuestion);
        setInterviewProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
        
        // Show feedback for the current answer
        if (result.feedback) {
          console.log('Answer feedback:', result.feedback);
          // You can display this feedback in the UI
        }
      }

      return result;
    } catch (error) {
      console.error('Error submitting interview answer:', error);
      alert('Error processing your answer. Please try again.');
    }
  };

  const getInterviewTips = async (category = 'general') => {
    try {
      const userContext = {
        experience: 'intermediate',
        industry: 'technology',
        role: 'software developer'
      };
      return await aiCompanion.current.getInterviewTips(category, userContext);
    } catch (error) {
      console.error('Error getting interview tips:', error);
      return ['Research the company thoroughly', 'Practice your answers out loud', 'Prepare thoughtful questions'];
    }
  };


  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      <div className="fixed inset-x-0 top-0 z-40">
        <Navbar />
      </div>
      <div className="pt-24 w-full flex h-screen overflow-hidden">
        {/* Left Panel - User Video */}
        <div className="w-1/3 bg-black relative flex-shrink-0" style={{ 
          minWidth: '33.333%', 
          maxWidth: '33.333%', 
          width: '33.333%',
          height: 'calc(100vh - 6rem)',
          minHeight: 'calc(100vh - 6rem)',
          maxHeight: 'calc(100vh - 6rem)'
        }}>
          {isVideoOn ? (
            <div className="relative w-full h-full bg-black" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  transform: 'scale(1)',
                  transformOrigin: 'center',
                  backgroundColor: '#000',
                  minWidth: '100%',
                  minHeight: '100%',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
                onLoadedMetadata={() => {
                  // Ensure video plays when metadata is loaded
                  if (videoRef.current) {
                    videoRef.current.play().catch(err => console.log('Video play error:', err));
                    // Lock video dimensions after metadata loads
                    if (videoRef.current) {
                      videoRef.current.style.width = '100%';
                      videoRef.current.style.height = '100%';
                      videoRef.current.style.transform = 'scale(1)';
                    }
                  }
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ display: 'none' }}
              />
              
              {/* User Info Overlay */}
              <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3">
                <h3 className="font-semibold text-gray-800">You</h3>
                <p className="text-sm text-gray-600">
                  Interview Practice
                </p>
                {currentMode === 'interview' && (
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-blue-600">Interview Mode</span>
                  </div>
                )}
              </div>

              {/* Conversation State Overlay */}
              <div className="absolute top-4 right-4 bg-white bg-opacity-95 rounded-lg p-3 max-w-xs">
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      conversationState === 'waiting' ? 'bg-yellow-500' :
                      conversationState === 'listening' ? 'bg-green-500 animate-pulse' :
                      conversationState === 'analyzing' ? 'bg-blue-500 animate-pulse' :
                      conversationState === 'responding' ? 'bg-purple-500 animate-pulse' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-xs text-gray-600 capitalize">
                      {conversationState === 'waiting' ? 'Waiting for you to speak...' :
                       conversationState === 'listening' ? 'Listening to you...' :
                       conversationState === 'analyzing' ? 'Analyzing your speech...' :
                       conversationState === 'responding' ? 'Preparing response...' :
                       'Inactive'}
                    </span>
                  </div>
                  
                  {currentUserInput && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <span className="text-gray-500">You said: </span>
                      <span className="text-gray-800">"{currentUserInput}"</span>
                    </div>
                  )}

                  {currentMode === 'interview' && currentQuestion && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                      <div className="flex items-center space-x-1 mb-1">
                        <Briefcase className="w-3 h-3 text-blue-600" />
                        <span className="text-blue-600 font-medium">Interview Question</span>
                      </div>
                      <p className="text-gray-800 text-xs">{currentQuestion.question}</p>
                      <div className="mt-1 text-xs text-gray-500">
                        Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}
                      </div>
                    </div>
                  )}
                  
                  {currentAnalysis && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Overall Score:</span>
                        <div className="flex items-center">
                          <div className="w-12 h-1.5 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-1.5 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-300"
                              style={{ width: `${currentAnalysis.overallScore || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{currentAnalysis.overallScore || 0}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 to-gray-800">
              <div className="text-center text-white">
                <VideoOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-semibold mb-2">Camera is off</p>
                <p className="text-sm opacity-75">
                  {isSessionActive ? 'Click the video button to turn on camera' : 'Click "Start Session" to begin'}
                </p>
              </div>
            </div>
          )}

          {/* Conversation State Indicator */}
          {isSessionActive && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-black bg-opacity-70 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                {conversationState === 'waiting' && 'Ready to listen...'}
                {conversationState === 'listening' && '🎤 Listening...'}
                {conversationState === 'analyzing' && '⚡ Analyzing...'}
                {conversationState === 'responding' && '💬 AI is responding...'}
                {isGeneratingResponse && '🤔 Generating response...'}
              </div>
              <div className="mt-2 bg-blue-900 bg-opacity-70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isAudioOn ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  <span>Speech: {speechRecognitionService}</span>
                </div>
              </div>
            </div>
          )}

          {/* Manual Response Trigger */}
          {isSessionActive && currentUserInput && (
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={() => {
                  console.log('Testing speech recognition...');
                  speechAnalyzer.current.testSpeechRecognition();
                  console.log('Current user input:', currentUserInput);
                  console.log('Is generating response:', isGeneratingResponse);
                  console.log('Conversation state:', conversationState);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
              >
                Test Speech
              </button>
              <button
                onClick={() => {
                  if (currentUserInput && !isGeneratingResponse) {
                    console.log('Manual response trigger for:', currentUserInput);
                    generateAIResponse(currentUserInput, currentAnalysis);
                  }
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
              >
                Get Response
              </button>
            </div>
          )}

          {/* Control Buttons */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {!isSessionActive ? (
              <button
                onClick={startSession}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Phone className="w-5 h-5" />
                <span className="font-semibold">Start Session</span>
              </button>
            ) : (
              <>
                {/* Interview Mode Button */}
                <button
                  onClick={() => startInterviewPractice()}
                  className={`px-3 py-2 rounded-md text-sm transition-all shadow-md ${
                    currentMode === 'interview' 
                      ? 'bg-white text-gray-800 font-semibold' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                  title="Interview Practice Mode"
                >
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Interview
                </button>

                <button
                  onClick={toggleVideo}
                  className={`${isVideoOn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white px-3 py-2 rounded-lg flex items-center space-x-1 transition-colors shadow-md`}
                  title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={toggleAudio}
                  className={`${isAudioOn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white px-3 py-2 rounded-lg flex items-center space-x-1 transition-colors shadow-md`}
                  title={isAudioOn ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={endSession}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center space-x-1 transition-colors shadow-md"
                  title="End session"
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Middle Panel - AI Companion */}
        <div className="w-1/3 bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col flex-shrink-0" style={{ 
          minWidth: '33.333%', 
          maxWidth: '33.333%', 
          width: '33.333%',
          height: 'calc(100vh - 6rem)',
          minHeight: 'calc(100vh - 6rem)',
          maxHeight: 'calc(100vh - 6rem)'
        }}>
          <AICharacter
            isTalking={aiCompanionState.isTalking}
            isListening={aiCompanionState.isListening}
            expression={aiCompanionState.currentExpression}
            currentMessage={currentAIResponse || aiCompanionState.currentMessage}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            analysis={currentAnalysis}
            currentMode={currentMode}
            currentQuestion={currentQuestion}
            interviewProgress={interviewProgress}
          />
          
          {/* Voice Recorder for AI Tutor */}
          {isSessionActive && (
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="text-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Voice Input</h3>
                <p className="text-xs text-gray-500">Use voice recording for speech-to-text</p>
              </div>
              <VoiceRecorder
                onTranscription={(text) => {
                  console.log('Voice transcription received:', text);
                  setCurrentUserInput(text);
                  if (text && !isGeneratingResponse && conversationState === 'waiting') {
                    generateAIResponse(text, currentAnalysis);
                  }
                }}
                onError={(error) => {
                  console.error('Voice recorder error:', error);
                  // Show error in UI if needed
                }}
                disabled={isGeneratingResponse || conversationState !== 'waiting'}
                className="flex justify-center"
                showStatus={true}
              />
            </div>
          )}
        </div>

        {/* Right Panel - Feedback History */}
        <div className="w-1/3 bg-white flex-shrink-0" style={{ 
          minWidth: '33.333%', 
          maxWidth: '33.333%', 
          width: '33.333%',
          height: 'calc(100vh - 6rem)',
          minHeight: 'calc(100vh - 6rem)',
          maxHeight: 'calc(100vh - 6rem)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <FeedbackPanel
            feedbackHistory={feedbackHistory}
            isRecording={isRecording}
            onStartRecording={() => setIsRecording(true)}
            onStopRecording={() => setIsRecording(false)}
            onSaveFeedback={handleSaveFeedback}
            onClearHistory={handleClearHistory}
          />
        </div>
      </div>
    </div>
  );
};

export default AIInteraction;
