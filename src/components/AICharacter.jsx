import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Eye, EyeOff, Smile, Frown, Meh, Briefcase, Target, CheckCircle, Clock } from 'lucide-react';
import { AIAvatarAnimationSystem } from '../lib/aiAvatarAnimationSystem';

const AICharacter = ({ 
  isTalking, 
  isListening, 
  expression, 
  currentMessage, 
  isMuted,
  onToggleMute,
  analysis = null,
  currentMode = 'presentation',
  currentQuestion = null,
  interviewProgress = { completed: 0, total: 0 }
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [animationState, setAnimationState] = useState({
    scale: 1.0,
    rotation: 0,
    opacity: 1.0
  });
  
  const animationSystem = useRef(new AIAvatarAnimationSystem());
  const avatarRef = useRef(null);

  // Initialize animation system
  useEffect(() => {
    const initAnimationSystem = async () => {
      await animationSystem.current.initialize();
      
      // Set up callbacks
      animationSystem.current.onExpressionChange((newExpression) => {
        setCurrentAnimation(newExpression);
      });
      
      animationSystem.current.onAnimationStart((animationName) => {
        setIsAnimating(true);
      });
      
      animationSystem.current.onAnimationEnd((animationName) => {
        setIsAnimating(false);
      });
    };
    
    initAnimationSystem();
    
    return () => {
      animationSystem.current.cleanup();
    };
  }, []);

  // Update animation based on props
  useEffect(() => {
    if (isTalking) {
      animationSystem.current.setTalking(true);
    } else {
      animationSystem.current.setTalking(false);
    }
  }, [isTalking]);

  useEffect(() => {
    if (isListening) {
      animationSystem.current.setListening(true);
    } else {
      animationSystem.current.setListening(false);
    }
  }, [isListening]);

  useEffect(() => {
    if (expression) {
      animationSystem.current.setExpression(expression);
    }
  }, [expression]);

  useEffect(() => {
    if (analysis) {
      animationSystem.current.setExpressionFromAnalysis(analysis);
    }
  }, [analysis]);

  // Get expression icon
  const getExpressionIcon = () => {
    switch (expression) {
      case 'happy':
      case 'smile':
        return <Smile className="w-8 h-8 text-yellow-500" />;
      case 'talking':
        return <Volume2 className="w-8 h-8 text-blue-500" />;
      case 'listening':
        return <Mic className="w-8 h-8 text-green-500" />;
      case 'encouraging':
        return <Eye className="w-8 h-8 text-purple-500" />;
      case 'supportive':
        return <Meh className="w-8 h-8 text-orange-500" />;
      default:
        return <Smile className="w-8 h-8 text-gray-500" />;
    }
  };

  // Get expression color
  const getExpressionColor = () => {
    switch (expression) {
      case 'happy':
      case 'smile':
        return 'from-yellow-400 to-orange-400';
      case 'talking':
        return 'from-blue-400 to-cyan-400';
      case 'listening':
        return 'from-green-400 to-emerald-400';
      case 'encouraging':
        return 'from-purple-400 to-pink-400';
      case 'supportive':
        return 'from-orange-400 to-red-400';
      default:
        return 'from-gray-400 to-slate-400';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-full"></div>
        <div className="absolute top-32 right-16 w-16 h-16 bg-purple-500 rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-pink-500 rounded-full"></div>
        <div className="absolute bottom-32 right-10 w-24 h-24 bg-green-500 rounded-full"></div>
      </div>

      {/* AI Character Avatar */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Character Face */}
        <div 
          ref={avatarRef}
          className={`relative w-48 h-48 rounded-full bg-gradient-to-br ${getExpressionColor()} shadow-2xl mb-6 transition-all duration-500 ${
            isAnimating ? 'scale-105' : 'scale-100'
          } ${isTalking ? 'animate-pulse' : ''}`}
          style={{
            transform: `scale(${animationState.scale}) rotate(${animationState.rotation}deg)`,
            opacity: animationState.opacity
          }}
        >
          {/* Eyes */}
          <div className="absolute top-16 left-12 w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
              isListening ? 'bg-green-500 animate-pulse' : 
              isTalking ? 'bg-blue-500' : 'bg-gray-700'
            }`}></div>
          </div>
          <div className="absolute top-16 right-12 w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
              isListening ? 'bg-green-500 animate-pulse' : 
              isTalking ? 'bg-blue-500' : 'bg-gray-700'
            }`}></div>
          </div>

          {/* Mouth */}
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
            {expression === 'talking' ? (
              <div className="w-8 h-4 bg-white rounded-full animate-pulse"></div>
            ) : expression === 'smile' || expression === 'happy' ? (
              <div className="w-12 h-6 border-4 border-white rounded-full border-b-0"></div>
            ) : expression === 'listening' ? (
              <div className="w-6 h-3 bg-white rounded-full"></div>
            ) : (
              <div className="w-8 h-2 bg-white rounded-full"></div>
            )}
          </div>

          {/* Expression Icon Overlay */}
          <div className="absolute top-4 right-4">
            {getExpressionIcon()}
          </div>

          {/* Talking Animation */}
          {isTalking && (
            <div className="absolute inset-0 rounded-full border-4 border-white animate-ping opacity-30"></div>
          )}

          {/* Listening Animation */}
          {isListening && (
            <div className="absolute -inset-4 rounded-full border-2 border-green-400 animate-pulse opacity-50"></div>
          )}
        </div>

        {/* Character Name */}
        <h3 className="text-2xl font-bold text-gray-800 mb-2">AI Coach</h3>
        <p className="text-sm text-gray-600 mb-2">
          {currentMode === 'interview' ? 'Your Interview Coach' : 'Your Presentation Companion'}
        </p>
        
        {/* Interview Progress */}
        {currentMode === 'interview' && interviewProgress.total > 0 && (
          <div className="mb-4 w-full max-w-xs">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Interview Progress</span>
              <span>{interviewProgress.completed}/{interviewProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(interviewProgress.completed / interviewProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Current Message */}
        {currentMessage && (
          <div className="bg-white rounded-lg p-4 shadow-lg max-w-sm mx-4 mb-6">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
              <p className="text-sm text-gray-700 leading-relaxed">{currentMessage}</p>
            </div>
          </div>
        )}

        {/* Interview Question Display */}
        {currentMode === 'interview' && currentQuestion && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm mx-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Interview Question</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{currentQuestion.question}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Take your time</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex items-center space-x-4">
          {/* Mute Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-3 rounded-full transition-all duration-200 ${
              isMuted 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
            title={isMuted ? 'Unmute AI' : 'Mute AI'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isTalking ? 'bg-blue-500 animate-pulse' :
              isListening ? 'bg-green-500 animate-pulse' :
              'bg-gray-400'
            }`}></div>
            <span className="text-sm text-gray-600">
              {isTalking ? 'Speaking...' : 
               isListening ? 'Listening...' : 
               'Ready'}
            </span>
          </div>
        </div>

        {/* Expression Display */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {expression === 'talking' ? 'Speaking' :
             expression === 'listening' ? 'Listening' :
             expression === 'happy' ? 'Happy' :
             expression === 'smile' ? 'Smiling' :
             expression === 'encouraging' ? 'Encouraging' :
             expression === 'supportive' ? 'Supportive' :
             'Neutral'}
          </p>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-8 w-2 h-2 bg-blue-300 rounded-full animate-bounce"></div>
      <div className="absolute top-40 right-12 w-1 h-1 bg-purple-300 rounded-full animate-bounce delay-100"></div>
      <div className="absolute bottom-32 left-16 w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce delay-200"></div>
    </div>
  );
};

export default AICharacter;
