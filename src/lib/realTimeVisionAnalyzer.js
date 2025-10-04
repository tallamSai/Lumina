// Real-time Vision Analysis Service
// Uses MediaPipe Pose and face-api.js for comprehensive visual analysis

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

export class RealTimeVisionAnalyzer {
  constructor() {
    this.isAnalyzing = false;
    this.poseDetector = null;
    this.faceDetector = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.analysisData = {
      posture: { score: 0, confidence: 0 },
      gestures: { score: 0, confidence: 0 },
      eyeContact: { score: 0, confidence: 0 },
      emotion: { score: 0, confidence: 0, dominant: 'neutral' },
      engagement: { score: 0, confidence: 0 },
      bodyPresence: { score: 0, confidence: 0 }
    };
    this.frameCount = 0;
    this.lastAnalysisTime = 0;
    this.analysisInterval = 100; // Analyze every 100ms instead of every frame
    this.callbacks = {
      onAnalysisUpdate: null,
      onError: null
    };
  }

  // Initialize the vision analyzer
  async initialize() {
    try {
      console.log('Initializing TensorFlow.js backend...');
      await tf.ready();
      console.log('TensorFlow.js backend ready');

      // Initialize pose detection
      console.log('Loading pose detection model...');
      this.poseDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        }
      );
      console.log('Pose detection model loaded');

      // Initialize face landmarks detection
      console.log('Loading face landmarks model...');
      this.faceDetector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'tfjs',
          refineLandmarks: true,
        }
      );
      console.log('Face landmarks model loaded');

      return true;
    } catch (error) {
      console.error('Error initializing vision analyzer:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      return false;
    }
  }

  // Start analysis on video element
  async startAnalysis(videoElement, canvasElement = null) {
    if (this.isAnalyzing) return;

    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.isAnalyzing = true;
    this.frameCount = 0;

    console.log('Starting vision analysis...');
    this.analyzeFrame();
  }

  // Stop analysis
  stopAnalysis() {
    this.isAnalyzing = false;
    this.videoElement = null;
    this.canvasElement = null;
    console.log('Vision analysis stopped');
  }

  // Analyze current frame with debouncing
  async analyzeFrame() {
    if (!this.isAnalyzing || !this.videoElement) return;

    const now = Date.now();
    if (now - this.lastAnalysisTime < this.analysisInterval) {
      // Skip this frame to maintain analysis interval
      if (this.isAnalyzing) {
        requestAnimationFrame(() => this.analyzeFrame());
      }
      return;
    }

    try {
      this.frameCount++;
      this.lastAnalysisTime = now;
      
      // Analyze pose
      const poseAnalysis = await this.analyzePose();
      
      // Analyze face and emotions
      const faceAnalysis = await this.analyzeFace();
      
      // Combine analysis results
      const combinedAnalysis = this.combineAnalysis(poseAnalysis, faceAnalysis);
      
      // Update analysis data
      this.updateAnalysisData(combinedAnalysis);
      
      // Trigger callback
      if (this.callbacks.onAnalysisUpdate) {
        this.callbacks.onAnalysisUpdate(this.analysisData);
      }
      
      // Draw analysis on canvas if available
      if (this.canvasElement) {
        this.drawAnalysis(poseAnalysis, faceAnalysis);
      }
      
    } catch (error) {
      console.error('Error analyzing frame:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }

    // Continue analysis
    if (this.isAnalyzing) {
      requestAnimationFrame(() => this.analyzeFrame());
    }
  }

  // Analyze pose using MediaPipe
  async analyzePose() {
    if (!this.poseDetector || !this.videoElement) {
      return { posture: 0, gestures: 0, bodyPresence: 0, confidence: 0 };
    }

    try {
      const poses = await this.poseDetector.estimatePoses(this.videoElement);
      
      if (poses.length === 0) {
        return { posture: 0, gestures: 0, bodyPresence: 0, confidence: 0 };
      }

      const pose = poses[0];
      const keypoints = pose.keypoints;
      
      // Analyze posture
      const postureScore = this.analyzePosture(keypoints);
      
      // Analyze gestures
      const gestureScore = this.analyzeGestures(keypoints);
      
      // Analyze body presence
      const bodyPresenceScore = this.analyzeBodyPresence(keypoints);
      
      return {
        posture: postureScore,
        gestures: gestureScore,
        bodyPresence: bodyPresenceScore,
        confidence: pose.score || 0.8
      };
    } catch (error) {
      console.error('Error analyzing pose:', error);
      return { posture: 0, gestures: 0, bodyPresence: 0, confidence: 0 };
    }
  }

  // Analyze face and emotions
  async analyzeFace() {
    if (!this.faceDetector || !this.videoElement) {
      return { eyeContact: 0, emotion: 0, dominant: 'neutral', confidence: 0 };
    }

    try {
      const faces = await this.faceDetector.estimateFaces(this.videoElement);
      
      if (faces.length === 0) {
        return { eyeContact: 0, emotion: 0, dominant: 'neutral', confidence: 0 };
      }

      const face = faces[0];
      const keypoints = face.keypoints;
      
      // Analyze eye contact
      const eyeContactScore = this.analyzeEyeContact(keypoints);
      
      // Analyze emotions
      const emotionAnalysis = this.analyzeEmotions(keypoints);
      
      return {
        eyeContact: eyeContactScore,
        emotion: emotionAnalysis.score,
        dominant: emotionAnalysis.dominant,
        confidence: face.score || 0.8
      };
    } catch (error) {
      console.error('Error analyzing face:', error);
      return { eyeContact: 0, emotion: 0, dominant: 'neutral', confidence: 0 };
    }
  }

  // Analyze posture based on keypoints
  analyzePosture(keypoints) {
    try {
      // Get key body points
      const nose = keypoints.find(kp => kp.name === 'nose');
      const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
      const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
      const leftHip = keypoints.find(kp => kp.name === 'left_hip');
      const rightHip = keypoints.find(kp => kp.name === 'right_hip');

      if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip) {
        return 0;
      }

      // Calculate shoulder alignment
      const shoulderSlope = Math.abs(leftShoulder.y - rightShoulder.y);
      const shoulderAlignment = Math.max(0, 100 - shoulderSlope * 10);

      // Calculate hip alignment
      const hipSlope = Math.abs(leftHip.y - rightHip.y);
      const hipAlignment = Math.max(0, 100 - hipSlope * 10);

      // Calculate spine alignment (nose to hip center)
      const hipCenterY = (leftHip.y + rightHip.y) / 2;
      const spineAlignment = Math.max(0, 100 - Math.abs(nose.x - (leftHip.x + rightHip.x) / 2) * 5);

      // Overall posture score
      const postureScore = (shoulderAlignment + hipAlignment + spineAlignment) / 3;
      
      return Math.min(100, Math.max(0, postureScore));
    } catch (error) {
      console.error('Error analyzing posture:', error);
      return 0;
    }
  }

  // Analyze gestures based on keypoints
  analyzeGestures(keypoints) {
    try {
      // Get hand and arm keypoints
      const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
      const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
      const leftElbow = keypoints.find(kp => kp.name === 'left_elbow');
      const rightElbow = keypoints.find(kp => kp.name === 'right_elbow');
      const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
      const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');

      if (!leftWrist || !rightWrist || !leftElbow || !rightElbow || !leftShoulder || !rightShoulder) {
        return 0;
      }

      // Calculate arm movement
      const leftArmMovement = this.calculateArmMovement(leftWrist, leftElbow, leftShoulder);
      const rightArmMovement = this.calculateArmMovement(rightWrist, rightElbow, rightShoulder);
      
      // Calculate gesture score based on movement
      const gestureScore = (leftArmMovement + rightArmMovement) / 2;
      
      return Math.min(100, Math.max(0, gestureScore));
    } catch (error) {
      console.error('Error analyzing gestures:', error);
      return 0;
    }
  }

  // Calculate arm movement
  calculateArmMovement(wrist, elbow, shoulder) {
    // Calculate arm angles and movement
    const armLength = Math.sqrt(
      Math.pow(elbow.x - shoulder.x, 2) + Math.pow(elbow.y - shoulder.y, 2)
    );
    
    const forearmLength = Math.sqrt(
      Math.pow(wrist.x - elbow.x, 2) + Math.pow(wrist.y - elbow.y, 2)
    );
    
    // Normalize movement based on arm length
    const movement = Math.min(100, (armLength + forearmLength) * 2);
    
    return movement;
  }

  // Analyze body presence
  analyzeBodyPresence(keypoints) {
    try {
      // Count visible keypoints
      const visibleKeypoints = keypoints.filter(kp => kp.score > 0.3);
      const visibilityScore = (visibleKeypoints.length / keypoints.length) * 100;
      
      // Check for good posture indicators
      const postureIndicators = this.checkPostureIndicators(keypoints);
      
      // Combine scores
      const presenceScore = (visibilityScore + postureIndicators) / 2;
      
      return Math.min(100, Math.max(0, presenceScore));
    } catch (error) {
      console.error('Error analyzing body presence:', error);
      return 0;
    }
  }

  // Check posture indicators
  checkPostureIndicators(keypoints) {
    try {
      const nose = keypoints.find(kp => kp.name === 'nose');
      const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
      const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
      
      if (!nose || !leftShoulder || !rightShoulder) {
        return 0;
      }
      
      // Check if shoulders are level
      const shoulderLevel = Math.abs(leftShoulder.y - rightShoulder.y);
      const levelScore = Math.max(0, 100 - shoulderLevel * 20);
      
      // Check if head is centered
      const headCenter = (leftShoulder.x + rightShoulder.x) / 2;
      const headAlignment = Math.max(0, 100 - Math.abs(nose.x - headCenter) * 10);
      
      return (levelScore + headAlignment) / 2;
    } catch (error) {
      console.error('Error checking posture indicators:', error);
      return 0;
    }
  }

  // Analyze eye contact
  analyzeEyeContact(keypoints) {
    try {
      // Find eye keypoints
      const leftEye = keypoints.find(kp => kp.name === 'leftEye');
      const rightEye = keypoints.find(kp => kp.name === 'rightEye');
      const nose = keypoints.find(kp => kp.name === 'nose');
      
      if (!leftEye || !rightEye || !nose) {
        return 0;
      }
      
      // Calculate eye direction (simplified)
      const eyeCenterX = (leftEye.x + rightEye.x) / 2;
      const eyeCenterY = (leftEye.y + rightEye.y) / 2;
      
      // Check if eyes are looking forward (towards camera)
      const eyeDirection = Math.abs(eyeCenterX - nose.x);
      const eyeContactScore = Math.max(0, 100 - eyeDirection * 20);
      
      return Math.min(100, Math.max(0, eyeContactScore));
    } catch (error) {
      console.error('Error analyzing eye contact:', error);
      return 0;
    }
  }

  // Analyze emotions based on facial keypoints
  analyzeEmotions(keypoints) {
    try {
      // Find facial keypoints
      const leftEye = keypoints.find(kp => kp.name === 'leftEye');
      const rightEye = keypoints.find(kp => kp.name === 'rightEye');
      const nose = keypoints.find(kp => kp.name === 'nose');
      const mouthLeft = keypoints.find(kp => kp.name === 'mouthLeft');
      const mouthRight = keypoints.find(kp => kp.name === 'mouthRight');
      
      if (!leftEye || !rightEye || !nose || !mouthLeft || !mouthRight) {
        return { score: 0, dominant: 'neutral' };
      }
      
      // Calculate mouth curvature (smile indicator)
      const mouthCenterY = (mouthLeft.y + mouthRight.y) / 2;
      const mouthCurvature = Math.abs(mouthLeft.y - mouthRight.y);
      
      // Calculate eye openness
      const eyeOpenness = Math.abs(leftEye.y - rightEye.y);
      
      // Determine emotion based on features
      let emotion = 'neutral';
      let score = 50;
      
      if (mouthCurvature > 5 && mouthCenterY < nose.y) {
        emotion = 'happy';
        score = 80;
      } else if (mouthCurvature < 2 && mouthCenterY > nose.y) {
        emotion = 'sad';
        score = 30;
      } else if (eyeOpenness < 3) {
        emotion = 'focused';
        score = 70;
      }
      
      return { score, dominant: emotion };
    } catch (error) {
      console.error('Error analyzing emotions:', error);
      return { score: 0, dominant: 'neutral' };
    }
  }

  // Combine pose and face analysis
  combineAnalysis(poseAnalysis, faceAnalysis) {
    return {
      posture: {
        score: poseAnalysis.posture,
        confidence: poseAnalysis.confidence
      },
      gestures: {
        score: poseAnalysis.gestures,
        confidence: poseAnalysis.confidence
      },
      eyeContact: {
        score: faceAnalysis.eyeContact,
        confidence: faceAnalysis.confidence
      },
      emotion: {
        score: faceAnalysis.emotion,
        confidence: faceAnalysis.confidence,
        dominant: faceAnalysis.dominant
      },
      engagement: {
        score: (poseAnalysis.gestures + faceAnalysis.eyeContact) / 2,
        confidence: Math.min(poseAnalysis.confidence, faceAnalysis.confidence)
      },
      bodyPresence: {
        score: poseAnalysis.bodyPresence,
        confidence: poseAnalysis.confidence
      }
    };
  }

  // Update analysis data with smoothing
  updateAnalysisData(newAnalysis) {
    const smoothingFactor = 0.3; // Adjust for more/less smoothing
    
    Object.keys(newAnalysis).forEach(key => {
      if (this.analysisData[key]) {
        this.analysisData[key].score = Math.round(
          this.analysisData[key].score * (1 - smoothingFactor) + 
          newAnalysis[key].score * smoothingFactor
        );
        this.analysisData[key].confidence = Math.round(
          this.analysisData[key].confidence * (1 - smoothingFactor) + 
          newAnalysis[key].confidence * smoothingFactor
        );
        
        // Update emotion dominant if available
        if (newAnalysis[key].dominant) {
          this.analysisData[key].dominant = newAnalysis[key].dominant;
        }
      }
    });
  }

  // Draw analysis on canvas
  drawAnalysis(poseAnalysis, faceAnalysis) {
    if (!this.canvasElement || !this.videoElement) return;
    
    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw analysis indicators
    this.drawPostureIndicator(ctx, poseAnalysis.posture);
    this.drawGestureIndicator(ctx, poseAnalysis.gestures);
    this.drawEyeContactIndicator(ctx, faceAnalysis.eyeContact);
    this.drawEmotionIndicator(ctx, faceAnalysis.emotion);
  }

  // Draw posture indicator
  drawPostureIndicator(ctx, score) {
    const x = 20;
    const y = 20;
    const width = 200;
    const height = 20;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, width, height);
    
    // Score bar
    const scoreWidth = (score / 100) * width;
    ctx.fillStyle = score > 70 ? '#10B981' : score > 50 ? '#F59E0B' : '#EF4444';
    ctx.fillRect(x, y, scoreWidth, height);
    
    // Label
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`Posture: ${Math.round(score)}%`, x, y - 5);
  }

  // Draw gesture indicator
  drawGestureIndicator(ctx, score) {
    const x = 20;
    const y = 50;
    const width = 200;
    const height = 20;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, width, height);
    
    // Score bar
    const scoreWidth = (score / 100) * width;
    ctx.fillStyle = score > 70 ? '#10B981' : score > 50 ? '#F59E0B' : '#EF4444';
    ctx.fillRect(x, y, scoreWidth, height);
    
    // Label
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`Gestures: ${Math.round(score)}%`, x, y - 5);
  }

  // Draw eye contact indicator
  drawEyeContactIndicator(ctx, score) {
    const x = 20;
    const y = 80;
    const width = 200;
    const height = 20;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, width, height);
    
    // Score bar
    const scoreWidth = (score / 100) * width;
    ctx.fillStyle = score > 70 ? '#10B981' : score > 50 ? '#F59E0B' : '#EF4444';
    ctx.fillRect(x, y, scoreWidth, height);
    
    // Label
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`Eye Contact: ${Math.round(score)}%`, x, y - 5);
  }

  // Draw emotion indicator
  drawEmotionIndicator(ctx, emotion) {
    const x = 20;
    const y = 110;
    const width = 200;
    const height = 20;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, width, height);
    
    // Emotion bar
    const emotionWidth = (emotion.score / 100) * width;
    ctx.fillStyle = emotion.dominant === 'happy' ? '#10B981' : 
                   emotion.dominant === 'focused' ? '#3B82F6' : '#6B7280';
    ctx.fillRect(x, y, emotionWidth, height);
    
    // Label
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`Emotion: ${emotion.dominant} (${Math.round(emotion.score)}%)`, x, y - 5);
  }

  // Set callbacks
  onAnalysisUpdate(callback) {
    this.callbacks.onAnalysisUpdate = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }

  // Get current analysis data
  getAnalysisData() {
    return this.analysisData;
  }

  // Cleanup
  cleanup() {
    this.stopAnalysis();
    if (this.poseDetector) {
      this.poseDetector.dispose();
    }
    if (this.faceDetector) {
      this.faceDetector.dispose();
    }
  }
}

export default RealTimeVisionAnalyzer;