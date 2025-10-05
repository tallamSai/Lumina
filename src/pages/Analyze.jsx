import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Upload, Play, Square, Loader, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { generatePresentationSummary } from '../lib/gemini';
import AnalysisPipeline from '../lib/analysisPipeline.js';
import { cloudinaryStorage } from '../lib/cloudinaryStorage.js';

export default function Analyze() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [analysisDetails, setAnalysisDetails] = useState(null);
  const [analysisPipeline, setAnalysisPipeline] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(null);
  const [comprehensiveResults, setComprehensiveResults] = useState(null);
  const [realTimeFeedback, setRealTimeFeedback] = useState(null);
  const [isRealTimeAnalyzing, setIsRealTimeAnalyzing] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // track auth for gated uploads
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Initialize analysis pipeline
  useEffect(() => {
    const pipeline = new AnalysisPipeline();
    setAnalysisPipeline(pipeline);
    return () => {
      if (pipeline) {
        pipeline.cancelAnalysis();
      }
    };
  }, []);

  const ENABLE_CLOUD = true; // Force Firebase storage

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      videoRef.current.srcObject = stream;
      videoRef.current.play();

      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideo(url);

        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
        
        // Stop real-time analysis
        setIsRealTimeAnalyzing(false);
        setRealTimeFeedback(null);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError('');
      
      // Start real-time analysis
      startRealTimeAnalysis(stream);
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

  // Real-time analysis during recording
  const startRealTimeAnalysis = async (stream) => {
    setIsRealTimeAnalyzing(true);
    
    try {
      // Initialize video analysis for real-time feedback
      const videoAnalyzer = new (await import('../lib/videoAnalysis.js')).VideoAnalyzer();
      await videoAnalyzer.initializeModels();
      
      // Create canvas for real-time analysis
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 640;
      canvas.height = 480;
      
      const analyzeFrame = async () => {
        if (!isRecording || !videoRef.current) return;
        
        try {
          // Draw current frame to canvas
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Analyze pose in real-time
          const poseAnalysis = await videoAnalyzer.analyzePoseRealTime(imageData);
          
          // Generate real-time feedback
          const feedback = generateRealTimeFeedback(poseAnalysis);
          setRealTimeFeedback(feedback);
          
        } catch (error) {
          console.error('Real-time analysis error:', error);
        }
        
        // Continue analysis
        if (isRecording) {
          setTimeout(analyzeFrame, 1000); // Analyze every second
        }
      };
      
      // Start analysis loop
      analyzeFrame();
      
    } catch (error) {
      console.error('Failed to start real-time analysis:', error);
      setIsRealTimeAnalyzing(false);
    }
  };

  // Generate advanced real-time feedback based on pose analysis
  const generateRealTimeFeedback = (poseAnalysis) => {
    const { posture, gestures, bodyLanguage } = poseAnalysis;
    
    const feedback = {
      posture: {
        score: posture.score,
        status: posture.score > 80 ? 'Excellent' : posture.score > 70 ? 'Good' : posture.score > 50 ? 'Fair' : 'Needs improvement',
        message: posture.score > 80 ? 'Outstanding posture!' : 
                posture.score > 70 ? 'Great posture!' : 
                posture.score > 50 ? 'Good posture, minor adjustments needed' : 
                'Try to stand straighter with shoulders back'
      },
      gestures: {
        score: gestures.score,
        status: gestures.score > 80 ? 'Excellent' : gestures.score > 70 ? 'Engaging' : gestures.score > 50 ? 'Moderate' : 'Limited',
        message: gestures.score > 80 ? 'Excellent use of gestures!' : 
                gestures.score > 70 ? 'Good use of gestures!' : 
                gestures.score > 50 ? 'Add more expressive gestures' : 
                'Use hand movements to emphasize points'
      },
      eyeContact: {
        score: bodyLanguage.eyeContact || 0,
        status: bodyLanguage.eyeContact > 80 ? 'Excellent' : bodyLanguage.eyeContact > 70 ? 'Good' : bodyLanguage.eyeContact > 50 ? 'Fair' : 'Needs work',
        message: bodyLanguage.eyeContact > 80 ? 'Perfect eye contact!' : 
                bodyLanguage.eyeContact > 70 ? 'Good eye contact!' : 
                bodyLanguage.eyeContact > 50 ? 'Look at camera more often' : 
                'Maintain eye contact with the camera'
      },
      overall: {
        score: Math.round((posture.score + gestures.score + bodyLanguage.overall) / 3),
        status: 'Analyzing...',
        tips: [],
        coaching: []
      }
    };
    
    // Generate advanced tips based on performance
    if (posture.score < 60) {
      feedback.overall.tips.push('Stand with feet shoulder-width apart');
      feedback.overall.coaching.push('Posture exercise: Practice standing against a wall');
    }
    if (gestures.score < 50) {
      feedback.overall.tips.push('Use hand gestures to emphasize points');
      feedback.overall.coaching.push('Gesture practice: Record yourself and focus on hand movements');
    }
    if (bodyLanguage.overall < 60) {
      feedback.overall.tips.push('Maintain confident body language');
      feedback.overall.coaching.push('Confidence building: Practice power poses before recording');
    }
    if (bodyLanguage.eyeContact < 50) {
      feedback.overall.tips.push('Look directly at the camera lens');
      feedback.overall.coaching.push('Eye contact drill: Practice looking at camera for 3 seconds at a time');
    }
    
    // Add performance level assessment
    if (feedback.overall.score > 80) {
      feedback.overall.status = 'Excellent Performance!';
      feedback.overall.tips.push('Keep up the great work!');
    } else if (feedback.overall.score > 70) {
      feedback.overall.status = 'Good Performance';
      feedback.overall.tips.push('Minor improvements will make it excellent');
    } else if (feedback.overall.score > 50) {
      feedback.overall.status = 'Fair Performance';
      feedback.overall.tips.push('Focus on the coaching tips below');
    } else {
      feedback.overall.status = 'Needs Improvement';
      feedback.overall.tips.push('Practice the fundamentals first');
    }
    
    return feedback;
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setUploadedVideo(url);
      setRecordedVideo(null);
      setError('');
    } else {
      setError('Please upload a valid video file.');
    }
  };

  const runComprehensiveAnalysis = async () => {
    if (!analysisPipeline || !currentVideo) {
      setError('Analysis pipeline not available');
      return;
    }

    if (!currentUser) {
      setError('You must be signed in to save analysis data');
      return;
    }

    setAnalyzing(true);
    setError('');
    setAnalysisProgress({ stage: 'initializing', progress: 0 });

    try {
      const results = await analysisPipeline.analyzePresentation(
        currentVideo,
        (progress) => {
          setAnalysisProgress(progress);
        }
      );

      console.log('Comprehensive analysis results:', results);
      setComprehensiveResults(results);

      // Generate unique analysis ID first
      const analysisId = `analysis_${Date.now()}`;
      
      // Create analysis result for storage - PURELY DYNAMIC
      const analysisResult = {
        id: Date.now(),
        analysisId: analysisId,
        title: `Advanced Presentation Analysis ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString(),
        overallScore: results.ai?.dynamicScores?.overallScore || 0,
        voiceClarity: results.ai?.dynamicScores?.voiceClarity || 0,
        bodyLanguage: results.ai?.dynamicScores?.bodyLanguage || 0,
        pace: results.ai?.dynamicScores?.pacing || 0,
        confidence: results.ai?.dynamicScores?.confidence || 0,
        strengths: results.ai?.strengths || [],
        improvements: results.ai?.areasForImprovement || [],
        feedback: results.ai?.summary || 'Analysis based on real-time metrics',
        recommendations: results.ai?.practiceDrills || [],
        speakingTips: results.ai?.speakingTips || [],
        scoreExplanation: results.ai?.scoreExplanation || 'Scores calculated from actual performance metrics',
        comprehensiveData: results
      };

      // Set analysis details for display - PURELY DYNAMIC
      setAnalysisDetails({
        summary: results.ai?.summary || 'Analysis based on real-time performance metrics',
        strengths: results.ai?.strengths || [],
        areasForImprovement: results.ai?.areasForImprovement || [],
        speakingTips: results.ai?.speakingTips || [],
        practiceDrills: results.ai?.practiceDrills || [],
        overallScore: results.ai?.dynamicScores?.overallScore || 0,
        voiceClarity: results.ai?.dynamicScores?.voiceClarity || 0,
        bodyLanguage: results.ai?.dynamicScores?.bodyLanguage || 0,
        pacing: results.ai?.dynamicScores?.pacing || 0,
        confidence: results.ai?.dynamicScores?.confidence || 0,
        scoreExplanation: results.ai?.scoreExplanation || 'Scores calculated from actual video and audio analysis',
        contentIssues: results.aggregated?.contentIssues || null,
        hasValidContent: results.ai?.overallScore > 0
      });

      // Force Firebase storage - no fallback
      if (!currentUser) {
        throw new Error('User must be authenticated to save analysis data');
      }

      try {
        console.log('Saving to Cloudinary...');
        const response = await fetch(currentVideo);
        const videoBlob = await response.blob();
        
        // Upload video to Cloudinary
        const videoUrl = await cloudinaryStorage.uploadVideo(
          currentUser.uid,
          videoBlob,
          analysisResult.analysisId
        );
        
        // Save analysis data to Cloudinary
        const cloudinaryResult = await cloudinaryStorage.saveAnalysisData(
          currentUser.uid,
          {
            ...analysisResult,
            videoUrl: videoUrl
          }
        );
        
        console.log('Analysis saved to Cloudinary:', cloudinaryResult);
        analysisResult.cloudinaryId = cloudinaryResult.analysisId;
        analysisResult.videoUrl = videoUrl;
        analysisResult.cloudinary = true;
        
        // Store data URL for preview (not for storage)
        try {
          const dataUrl = await blobToDataURL(videoBlob);
          analysisResult.videoDataUrl = dataUrl;
        } catch (_) {}

        // Analysis data is now stored in Cloudinary only
        console.log('Analysis data stored in Cloudinary - Dashboard will fetch from there');

      } catch (cloudinaryError) {
        console.error('Cloudinary storage failed:', cloudinaryError);
        setError(`Failed to save analysis to Cloudinary: ${cloudinaryError.message}. Please check your upload preset configuration.`);
        setAnalyzing(false);
        return;
      }

      setAnalyzing(false);
      setAnalysisComplete(true);

      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (error) {
      console.error('Comprehensive analysis failed:', error);
      setError('Analysis failed. Please try again.');
      setAnalyzing(false);
      setAnalysisProgress(null);
    }
  };

  const currentVideo = recordedVideo || uploadedVideo;

  async function extractHeuristicMetrics(videoUrl) {
    try {
      // fetch video as blob and decode audio
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
cl
      // compute RMS per 20ms window and estimate pitch via autocorrelation
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const windowSize = Math.floor(sampleRate * 0.02);
      const rmsValues = [];
      const pitchValues = [];
      for (let i = 0; i < channelData.length; i += windowSize) {
        let sumSquares = 0;
        const end = Math.min(i + windowSize, channelData.length);
        for (let j = i; j < end; j++) sumSquares += channelData[j] * channelData[j];
        rmsValues.push(Math.sqrt(sumSquares / (end - i)));
        const slice = channelData.slice(i, end);
        pitchValues.push(estimatePitch(slice, sampleRate));
      }

      const avg = rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length;
      const variance = rmsValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / rmsValues.length;
      const stddev = Math.sqrt(variance);

      const voiceClarity = Math.min(1, (avg * 3 + stddev * 2));
      const stabilityScore = Math.min(1, 1 - Math.abs(stddev - 0.02) * 8);
      const silenceWindows = rmsValues.filter(v => v < 0.008).length;
      const paceScore = Math.min(1, 1 - (silenceWindows / rmsValues.length));

      // speech rate estimate from energy envelope zero-crossings
      let transitions = 0;
      for (let i = 1; i < rmsValues.length; i++) {
        if ((rmsValues[i - 1] < 0.015) !== (rmsValues[i] < 0.015)) transitions++;
      }
      const durationSec = channelData.length / sampleRate;
      const speechRate = Math.round((transitions / 2) / (durationSec / 60)); // phrases per minute

      // pitch variance for expressiveness
      const validPitches = pitchValues.filter(f => f > 50 && f < 500);
      const pitchAvg = validPitches.length ? validPitches.reduce((a,b)=>a+b,0)/validPitches.length : 0;
      const pitchVar = validPitches.length ? validPitches.reduce((a,b)=>a+Math.pow(b-pitchAvg,2),0)/validPitches.length : 0;
      const pitchVarScore = Math.min(1, Math.sqrt(pitchVar)/80);

      // motion estimate: sample frames using a hidden video element into canvas and compute diff
      const motionScore = await estimateMotion(videoUrl);

      return { voiceClarity, stabilityScore, paceScore, motionScore, pitchAvg, pitchVarScore, speechRate };
    } catch (e) {
      return { voiceClarity: 0.6, stabilityScore: 0.6, paceScore: 0.6, motionScore: 0.5, pitchAvg: 0, pitchVarScore: 0.4, speechRate: 120 };
    }
  }

  async function estimateMotion(videoUrl) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      let lastFrame;
      let changes = 0;
      let frames = 0;

      const HARD_TIMEOUT_MS = 3000;
      const timeoutId = setTimeout(() => {
        resolve(0.5); // fallback mid motion
      }, HARD_TIMEOUT_MS);

      const sample = () => {
        if (video.readyState < 2) {
          requestAnimationFrame(sample);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        if (lastFrame) {
          let diff = 0;
          for (let i = 0; i < frame.length; i += 4) {
            const d = Math.abs(frame[i] - lastFrame[i]) + Math.abs(frame[i + 1] - lastFrame[i + 1]) + Math.abs(frame[i + 2] - lastFrame[i + 2]);
            if (d > 60) diff++;
          }
          changes += diff / (frame.length / 4);
          frames++;
        }
        lastFrame = frame;
        if (frames >= 30) { // ~30 samples max
          clearTimeout(timeoutId);
          video.pause();
          const score = Math.min(1, (changes / Math.max(1, frames)) * 4);
          resolve(score);
          return;
        }
        requestAnimationFrame(sample);
      };

      video.onloadedmetadata = () => {
        canvas.width = 160;
        canvas.height = Math.floor((video.videoHeight / video.videoWidth) * 160) || 90;
        video.currentTime = 0;
        video.play().finally(() => {
          requestAnimationFrame(sample);
        });
      };
    });
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  // Basic autocorrelation pitch estimate (monophonic voice)
  function estimatePitch(signal, sampleRate) {
    let maxLag = Math.floor(sampleRate / 50); // 50 Hz
    let minLag = Math.floor(sampleRate / 500); // 500 Hz
    let bestLag = 0;
    let bestCorr = 0;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let corr = 0;
      for (let i = 0; i < signal.length - lag; i++) {
        corr += signal[i] * signal[i + lag];
      }
      if (corr > bestCorr) { bestCorr = corr; bestLag = lag; }
    }
    return bestLag ? (sampleRate / bestLag) : 0;
  }

  function buildHeuristicReport(m) {
    const strengths = [];
    if (m.voiceClarity > 0.7) strengths.push('Clear articulation with good loudness');
    if (m.pitchVarScore > 0.5) strengths.push('Good vocal variety across key points');
    if (m.motionScore > 0.5) strengths.push('Engaging gestures and presence');
    if (m.stabilityScore > 0.7) strengths.push('Stable delivery with minimal distractions');

    const improvements = [];
    if (m.voiceClarity < 0.6) improvements.push('Increase volume consistency and reduce breathiness');
    if (m.pitchVarScore < 0.4) improvements.push('Add pitch changes at transitions to emphasize structure');
    if (m.paceScore < 0.6) improvements.push('Insert short pauses after key statements');
    if (m.motionScore < 0.5) improvements.push('Use open-hand gestures within the frame');

    // Generate dynamic recommendations based on actual performance
    const recommendations = [];
    if (m.paceScore < 0.7) recommendations.push(`Practice with metronome for consistent pacing (current: ${m.speechRate} phrases/min)`);
    if (m.voiceClarity < 0.7) recommendations.push(`Record practice sessions to improve voice clarity (current: ${Math.round(m.voiceClarity*100)}%)`);
    if (m.motionScore < 0.6) recommendations.push(`Practice gestures in front of mirror for better body language (current: ${Math.round(m.motionScore*100)}%)`);
    if (m.pitchVarScore < 0.5) recommendations.push(`Work on vocal variety and pitch changes (current: ${Math.round(m.pitchVarScore*100)}%)`);
    
    // Add general recommendations if none specific
    if (recommendations.length === 0) {
      recommendations.push('Continue practicing to maintain your strong performance');
    }

    // Generate dynamic tips based on performance
    const tips = [];
    if (m.voiceClarity > 0.7) tips.push('Maintain your strong voice clarity');
    if (m.motionScore > 0.6) tips.push('Keep using engaging gestures');
    if (m.stabilityScore > 0.7) tips.push('Continue your stable delivery approach');
    if (m.pitchVarScore < 0.5) tips.push('Try varying your pitch on key points');
    if (m.paceScore < 0.7) tips.push('Consider adding strategic pauses between sections');
    
    // Add general tips if none specific
    if (tips.length === 0) {
      tips.push('Focus on maintaining eye contact with your audience');
      tips.push('Practice your opening and closing statements');
    }

    const feedback = `You delivered with ${Math.round(m.voiceClarity*100)}% vocal clarity and ${Math.round(m.motionScore*100)}% motion engagement. ` +
      `Pacing suggests ${m.speechRate} phrases/min; aim for clear pauses between sections. ` +
      `Vocal variety score indicates ${m.pitchVarScore > 0.5 ? 'good expressiveness' : 'opportunity to add pitch range'}.`;

    return { strengths, improvements, recommendations, feedback, tips };
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="absolute inset-0 bg-transparent"></div>

      <Navbar />

      <main className="relative max-w-6xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-black mb-3">Analyze Your Presentation</h2>
          <p className="text-black text-lg">Record a new video or upload an existing one for AI analysis</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="group relative bg-transparent border border-black/10 rounded-2xl p-8 hover:border-blue-500/50 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg">
                  <Video className="text-blue-600" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-black">Record Video</h3>
              </div>
              <p className="text-black mb-6">Use your webcam to record a presentation</p>

              <div className="bg-transparent rounded-xl overflow-hidden mb-4 border border-black/10" style={{ height: '240px' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                />
              </div>

              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  <Play size={20} />
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 animate-pulse"
                >
                  <Square size={20} />
                  Stop Recording
                </button>
              )}

              {/* Enhanced real-time feedback display */}
              {isRealTimeAnalyzing && realTimeFeedback && (
                <div className="mt-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/50 rounded-xl p-4">
                  <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Coaching Analysis
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-3 text-xs mb-4">
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <div className="text-slate-300 mb-1">Posture</div>
                      <div className="text-white font-semibold">{realTimeFeedback.posture.score}%</div>
                      <div className="text-green-400 text-xs">{realTimeFeedback.posture.message}</div>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <div className="text-slate-300 mb-1">Gestures</div>
                      <div className="text-white font-semibold">{realTimeFeedback.gestures.score}%</div>
                      <div className="text-blue-400 text-xs">{realTimeFeedback.gestures.message}</div>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <div className="text-slate-300 mb-1">Eye Contact</div>
                      <div className="text-white font-semibold">{realTimeFeedback.eyeContact.score}%</div>
                      <div className="text-purple-400 text-xs">{realTimeFeedback.eyeContact.message}</div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                    <div className="text-slate-300 text-xs mb-2 font-semibold">Overall Performance: {realTimeFeedback.overall.status}</div>
                    <div className="text-white text-sm font-bold">{realTimeFeedback.overall.score}%</div>
                  </div>
                  
                  {realTimeFeedback.overall.tips.length > 0 && (
                    <div className="mb-3">
                      <div className="text-slate-300 text-xs mb-2 font-semibold">Live Tips:</div>
                      {realTimeFeedback.overall.tips.map((tip, index) => (
                        <div key={index} className="text-yellow-400 text-xs mb-1">• {tip}</div>
                      ))}
                    </div>
                  )}
                  
                  {realTimeFeedback.overall.coaching.length > 0 && (
                    <div>
                      <div className="text-slate-300 text-xs mb-2 font-semibold">Coaching Exercises:</div>
                      {realTimeFeedback.overall.coaching.map((exercise, index) => (
                        <div key={index} className="text-cyan-400 text-xs mb-1">💡 {exercise}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="group relative bg-transparent border border-black/10 rounded-2xl p-8 hover:border-cyan-500/50 transition-all">
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg">
                  <Upload className="text-blue-600" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-black">Upload Video</h3>
              </div>
              <p className="text-black mb-6">Upload a pre-recorded presentation video</p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-transparent rounded-xl border-2 border-dashed border-black/10 hover:border-cyan-500/50 transition-all cursor-pointer mb-4 flex items-center justify-center"
                style={{ height: '240px' }}
              >
                {uploadedVideo ? (
                  <video src={uploadedVideo} className="w-full h-full object-cover rounded-xl bg-transparent" controls />
                ) : (
                  <div className="text-center">
                    <Upload className="text-black mx-auto mb-3" size={48} />
                    <p className="text-black font-medium">Click to upload video</p>
                    <p className="text-black text-sm mt-1">MP4, WebM, or MOV</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
              >
                <Upload size={20} />
                Choose File
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-8 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={24} />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {currentVideo && (
          <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-50"></div>
            <div className="relative">
              <h3 className="text-3xl font-bold text-white mb-6">Preview & Analyze</h3>

              <div className="bg-slate-950 rounded-xl overflow-hidden mb-6 border border-slate-800">
                <video src={currentVideo} controls className="w-full max-h-96 object-contain" />
              </div>

              {!analyzing && !analysisComplete && (
                <div className="space-y-4">
                  {!currentUser && (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 flex items-center gap-3">
                      <AlertCircle className="text-yellow-400" size={20} />
                      <p className="text-yellow-400 text-sm">
                        You must be signed in to save analysis data to Firebase
                      </p>
                    </div>
                  )}
                  
                <button
                    onClick={runComprehensiveAnalysis}
                    disabled={!currentUser}
                    className={`w-full font-bold py-5 rounded-xl transition-all transform shadow-xl flex items-center justify-center gap-2 ${
                      currentUser 
                        ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 hover:scale-105 shadow-blue-500/25 text-white' 
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  <Sparkles size={24} />
                    <span className="text-lg">
                      {currentUser ? 'Advanced AI Analysis' : 'Sign In Required'}
                    </span>
                </button>
                </div>
              )}

              {analyzing && (
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/50 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                  <Loader className="text-blue-400 animate-spin" size={32} />
                  <div>
                      <h4 className="text-white font-bold text-lg">Advanced AI Analysis in Progress...</h4>
                      <p className="text-slate-300">
                        {analysisProgress?.stage === 'audio_analysis' && 'Processing audio and speech patterns...'}
                        {analysisProgress?.stage === 'video_analysis' && 'Analyzing body language and gestures...'}
                        {analysisProgress?.stage === 'processing' && 'Aggregating comprehensive metrics...'}
                        {analysisProgress?.stage === 'ai_analysis' && 'Generating AI-powered insights...'}
                        {analysisProgress?.stage === 'finalizing' && 'Finalizing analysis results...'}
                        {!analysisProgress?.stage && 'Initializing advanced analysis pipeline...'}
                      </p>
                    </div>
                  </div>
                  
                  {analysisProgress && (
                    <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${analysisProgress.progress}%` }}
                      ></div>
                    </div>
                  )}
                  
                  <div className="text-sm text-slate-400">
                    <div className="grid grid-cols-2 gap-4">
                      <div>✓ Audio Processing</div>
                      <div>✓ Video Analysis</div>
                      <div>✓ NLP Processing</div>
                      <div>✓ AI Integration</div>
                    </div>
                  </div>
                </div>
              )}

              {analysisComplete && (
                <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/50 rounded-xl p-6 flex items-center gap-4">
                  <CheckCircle className="text-green-400" size={32} />
                  <div>
                    <h4 className="text-white font-bold text-lg">Analysis Complete!</h4>
                    <p className="text-slate-300">Redirecting to dashboard...</p>
                    </div>
                  </div>

                  {/* Content Validation Issues */}
                  {analysisDetails?.contentIssues && (
                    <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="text-red-400" size={24} />
                        <h5 className="text-white font-bold text-lg">Content Issues Detected</h5>
                      </div>
                      
                      <div className="space-y-3">
                        {analysisDetails.contentIssues.audio?.length > 0 && (
                          <div>
                            <h6 className="text-red-400 font-semibold mb-2">Audio Issues:</h6>
                            <ul className="text-slate-300 space-y-1">
                              {analysisDetails.contentIssues.audio.map((issue, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-red-400 mt-1">•</span>
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {analysisDetails.contentIssues.video?.length > 0 && (
                          <div>
                            <h6 className="text-red-400 font-semibold mb-2">Video Issues:</h6>
                            <ul className="text-slate-300 space-y-1">
                              {analysisDetails.contentIssues.video.map((issue, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-red-400 mt-1">•</span>
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-300 text-sm">
                          <strong>Recommendation:</strong> Please record a new video with clear speech and ensure you are clearly visible in the frame.
                        </p>
                      </div>
                    </div>
                  )}

                  {analysisDetails && (
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                      <h5 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="text-blue-400" size={20} />
                        AI Analysis Results
                      </h5>

                      {/* Enhanced Dynamic Scores Display */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className={`rounded-xl p-4 text-center ${
                          analysisDetails.hasValidContent 
                            ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30' 
                            : 'bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30'
                        }`}>
                          <div className={`text-2xl font-bold mb-1 ${
                            analysisDetails.hasValidContent ? 'text-blue-400' : 'text-red-400'
                          }`}>
                            {analysisDetails.overallScore || 0}
                          </div>
                          <div className="text-sm text-slate-300">Overall Score</div>
                        </div>
                        
                        <div className={`rounded-xl p-4 text-center ${
                          analysisDetails.hasValidContent 
                            ? 'bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30' 
                            : 'bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30'
                        }`}>
                          <div className={`text-2xl font-bold mb-1 ${
                            analysisDetails.hasValidContent ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {analysisDetails.voiceClarity || 0}
                          </div>
                          <div className="text-sm text-slate-300">Voice Clarity</div>
                        </div>
                        
                        <div className={`rounded-xl p-4 text-center ${
                          analysisDetails.hasValidContent 
                            ? 'bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30' 
                            : 'bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30'
                        }`}>
                          <div className={`text-2xl font-bold mb-1 ${
                            analysisDetails.hasValidContent ? 'text-purple-400' : 'text-red-400'
                          }`}>
                            {analysisDetails.bodyLanguage || 0}
                          </div>
                          <div className="text-sm text-slate-300">Body Language</div>
                        </div>
                        
                        <div className={`rounded-xl p-4 text-center ${
                          analysisDetails.hasValidContent 
                            ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30' 
                            : 'bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30'
                        }`}>
                          <div className={`text-2xl font-bold mb-1 ${
                            analysisDetails.hasValidContent ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {analysisDetails.pacing || 0}
                          </div>
                          <div className="text-sm text-slate-300">Pacing</div>
                        </div>
                      </div>
                      
                      {/* Additional Advanced Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className={`rounded-xl p-4 text-center ${
                          analysisDetails.hasValidContent 
                            ? 'bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border border-cyan-500/30' 
                            : 'bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30'
                        }`}>
                          <div className={`text-2xl font-bold mb-1 ${
                            analysisDetails.hasValidContent ? 'text-cyan-400' : 'text-red-400'
                          }`}>
                            {analysisDetails.confidence || 0}
                          </div>
                          <div className="text-sm text-slate-300">Confidence</div>
                        </div>
                        
                        <div className={`rounded-xl p-4 text-center ${
                          analysisDetails.hasValidContent 
                            ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30' 
                            : 'bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30'
                        }`}>
                          <div className={`text-2xl font-bold mb-1 ${
                            analysisDetails.hasValidContent ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {analysisDetails.engagement || 0}
                          </div>
                          <div className="text-sm text-slate-300">Engagement</div>
                        </div>
                        
                        <div className={`rounded-xl p-4 text-center ${
                          analysisDetails.hasValidContent 
                            ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30' 
                            : 'bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30'
                        }`}>
                          <div className={`text-2xl font-bold mb-1 ${
                            analysisDetails.hasValidContent ? 'text-orange-400' : 'text-red-400'
                          }`}>
                            {analysisDetails.contentQuality || 0}
                          </div>
                          <div className="text-sm text-slate-300">Content Quality</div>
                        </div>
                        
                        <div className={`rounded-xl p-4 text-center ${
                          analysisDetails.hasValidContent 
                            ? 'bg-gradient-to-br from-rose-500/10 to-rose-600/10 border border-rose-500/30' 
                            : 'bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30'
                        }`}>
                          <div className={`text-2xl font-bold mb-1 ${
                            analysisDetails.hasValidContent ? 'text-rose-400' : 'text-red-400'
                          }`}>
                            {analysisDetails.professionalism || 0}
                          </div>
                          <div className="text-sm text-slate-300">Professionalism</div>
                        </div>
                      </div>
                      
                      {analysisDetails.summary && (
                        <div className="mb-6">
                          <h6 className="text-lg font-semibold text-blue-400 mb-2">Summary</h6>
                          <p className="text-slate-300 whitespace-pre-wrap">{analysisDetails.summary}</p>
                        </div>
                      )}

                      {analysisDetails.strengths && analysisDetails.strengths.length > 0 && (
                        <div className="mb-6">
                          <h6 className="text-lg font-semibold text-green-400 mb-2">Strengths</h6>
                          <ul className="text-slate-300 space-y-1">
                            {analysisDetails.strengths.map((strength, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-400 mt-1">✓</span>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysisDetails.areasForImprovement && analysisDetails.areasForImprovement.length > 0 && (
                        <div className="mb-6">
                          <h6 className="text-lg font-semibold text-yellow-400 mb-2">Areas for Improvement</h6>
                          <ul className="text-slate-300 space-y-1">
                            {analysisDetails.areasForImprovement.map((area, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-yellow-400 mt-1">•</span>
                                {area}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysisDetails.speakingTips && analysisDetails.speakingTips.length > 0 && (
                        <div className="mb-6">
                          <h6 className="text-lg font-semibold text-purple-400 mb-2">Speaking Tips</h6>
                          <ul className="text-slate-300 space-y-1">
                            {analysisDetails.speakingTips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">💡</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                      </div>
                    )}

                      {analysisDetails.practiceDrills && analysisDetails.practiceDrills.length > 0 && (
                        <div className="mb-6">
                          <h6 className="text-lg font-semibold text-blue-400 mb-2">Practice Exercises</h6>
                          <ul className="text-slate-300 space-y-1">
                            {analysisDetails.practiceDrills.map((drill, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">🏃</span>
                                {drill}
                              </li>
                        ))}
                      </ul>
                        </div>
                      )}

                      {analysisDetails.scoreExplanation && (
                        <div className="mb-6">
                          <h6 className="text-lg font-semibold text-cyan-400 mb-2">Score Explanation</h6>
                          <p className="text-slate-300">{analysisDetails.scoreExplanation}</p>
                        </div>
                      )}

                      {/* Advanced Insights Section */}
                      {analysisDetails.advancedInsights && (
                        <div className="mb-6">
                          <h6 className="text-lg font-semibold text-purple-400 mb-4">Advanced Insights</h6>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 rounded-lg p-4">
                              <h7 className="text-white font-semibold mb-2">Presentation Style</h7>
                              <p className="text-slate-300 text-sm">{analysisDetails.advancedInsights.presentationStyle}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4">
                              <h7 className="text-white font-semibold mb-2">Audience Engagement</h7>
                              <p className="text-slate-300 text-sm">{analysisDetails.advancedInsights.audienceEngagement}</p>
                            </div>
                          </div>
                          
                          {analysisDetails.advancedInsights.improvementPriority && analysisDetails.advancedInsights.improvementPriority.length > 0 && (
                            <div className="mt-4 bg-slate-800/50 rounded-lg p-4">
                              <h7 className="text-white font-semibold mb-2">Priority Improvements</h7>
                              <div className="flex flex-wrap gap-2">
                                {analysisDetails.advancedInsights.improvementPriority.map((priority, index) => (
                                  <span key={index} className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                                    {priority}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Performance Breakdown Section */}
                      {analysisDetails.performanceBreakdown && (
                        <div className="mb-6">
                          <h6 className="text-lg font-semibold text-indigo-400 mb-4">Performance Breakdown</h6>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 rounded-lg p-4">
                              <h7 className="text-white font-semibold mb-2">Opening</h7>
                              <p className="text-slate-300 text-sm">{analysisDetails.performanceBreakdown.opening}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4">
                              <h7 className="text-white font-semibold mb-2">Body</h7>
                              <p className="text-slate-300 text-sm">{analysisDetails.performanceBreakdown.body}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4">
                              <h7 className="text-white font-semibold mb-2">Closing</h7>
                              <p className="text-slate-300 text-sm">{analysisDetails.performanceBreakdown.closing}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4">
                              <h7 className="text-white font-semibold mb-2">Transitions</h7>
                              <p className="text-slate-300 text-sm">{analysisDetails.performanceBreakdown.transitions}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Recommendations Section */}
                      {analysisDetails.recommendations && (
                        <div className="mb-6">
                          <h6 className="text-lg font-semibold text-emerald-400 mb-4">Recommendations</h6>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-slate-800/50 rounded-lg p-4">
                              <h7 className="text-white font-semibold mb-2 text-red-400">Immediate</h7>
                              <ul className="text-slate-300 text-sm space-y-1">
                                {analysisDetails.recommendations.immediate?.map((rec, index) => (
                                  <li key={index}>• {rec}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4">
                              <h7 className="text-white font-semibold mb-2 text-yellow-400">Short-term</h7>
                              <ul className="text-slate-300 text-sm space-y-1">
                                {analysisDetails.recommendations.shortTerm?.map((rec, index) => (
                                  <li key={index}>• {rec}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4">
                              <h7 className="text-white font-semibold mb-2 text-green-400">Long-term</h7>
                              <ul className="text-slate-300 text-sm space-y-1">
                                {analysisDetails.recommendations.longTerm?.map((rec, index) => (
                                  <li key={index}>• {rec}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
