// AI Avatar Animation System
// Creates dynamic, responsive avatar animations based on real-time analysis

export class AIAvatarAnimationSystem {
  constructor() {
    this.isActive = false;
    this.currentExpression = 'neutral';
    this.isTalking = false;
    this.isListening = false;
    this.animationQueue = [];
    this.animationSpeed = 1.0;
    this.callbacks = {
      onExpressionChange: null,
      onAnimationStart: null,
      onAnimationEnd: null
    };
    
    // Animation states
    this.animations = {
      idle: this.createIdleAnimation(),
      talking: this.createTalkingAnimation(),
      listening: this.createListeningAnimation(),
      happy: this.createHappyAnimation(),
      encouraging: this.createEncouragingAnimation(),
      supportive: this.createSupportiveAnimation(),
      thinking: this.createThinkingAnimation()
    };
  }

  // Initialize the animation system
  async initialize() {
    this.isActive = true;
    this.startIdleAnimation();
    console.log('AI Avatar Animation System initialized');
  }

  // Create idle animation
  createIdleAnimation() {
    return {
      name: 'idle',
      duration: 3000,
      keyframes: [
        { time: 0, scale: 1.0, rotation: 0, opacity: 1.0 },
        { time: 1500, scale: 1.02, rotation: 1, opacity: 1.0 },
        { time: 3000, scale: 1.0, rotation: 0, opacity: 1.0 }
      ],
      loop: true
    };
  }

  // Create talking animation
  createTalkingAnimation() {
    return {
      name: 'talking',
      duration: 500,
      keyframes: [
        { time: 0, scale: 1.0, rotation: 0, opacity: 1.0 },
        { time: 250, scale: 1.05, rotation: 2, opacity: 1.0 },
        { time: 500, scale: 1.0, rotation: 0, opacity: 1.0 }
      ],
      loop: true
    };
  }

  // Create listening animation
  createListeningAnimation() {
    return {
      name: 'listening',
      duration: 1000,
      keyframes: [
        { time: 0, scale: 1.0, rotation: 0, opacity: 1.0 },
        { time: 500, scale: 1.03, rotation: -1, opacity: 1.0 },
        { time: 1000, scale: 1.0, rotation: 0, opacity: 1.0 }
      ],
      loop: true
    };
  }

  // Create happy animation
  createHappyAnimation() {
    return {
      name: 'happy',
      duration: 2000,
      keyframes: [
        { time: 0, scale: 1.0, rotation: 0, opacity: 1.0 },
        { time: 500, scale: 1.1, rotation: 5, opacity: 1.0 },
        { time: 1000, scale: 1.05, rotation: -3, opacity: 1.0 },
        { time: 1500, scale: 1.08, rotation: 2, opacity: 1.0 },
        { time: 2000, scale: 1.0, rotation: 0, opacity: 1.0 }
      ],
      loop: false
    };
  }

  // Create encouraging animation
  createEncouragingAnimation() {
    return {
      name: 'encouraging',
      duration: 1500,
      keyframes: [
        { time: 0, scale: 1.0, rotation: 0, opacity: 1.0 },
        { time: 750, scale: 1.06, rotation: 3, opacity: 1.0 },
        { time: 1500, scale: 1.0, rotation: 0, opacity: 1.0 }
      ],
      loop: false
    };
  }

  // Create supportive animation
  createSupportiveAnimation() {
    return {
      name: 'supportive',
      duration: 1200,
      keyframes: [
        { time: 0, scale: 1.0, rotation: 0, opacity: 1.0 },
        { time: 600, scale: 1.04, rotation: -2, opacity: 1.0 },
        { time: 1200, scale: 1.0, rotation: 0, opacity: 1.0 }
      ],
      loop: false
    };
  }

  // Create thinking animation
  createThinkingAnimation() {
    return {
      name: 'thinking',
      duration: 800,
      keyframes: [
        { time: 0, scale: 1.0, rotation: 0, opacity: 1.0 },
        { time: 400, scale: 1.02, rotation: 1, opacity: 0.9 },
        { time: 800, scale: 1.0, rotation: 0, opacity: 1.0 }
      ],
      loop: true
    };
  }

  // Start animation
  startAnimation(animationName, callback = null) {
    if (!this.isActive || !this.animations[animationName]) return;

    const animation = this.animations[animationName];
    this.currentExpression = animationName;

    if (this.callbacks.onAnimationStart) {
      this.callbacks.onAnimationStart(animationName);
    }

    if (this.callbacks.onExpressionChange) {
      this.callbacks.onExpressionChange(animationName);
    }

    // Execute animation
    this.executeAnimation(animation, callback);
  }

  // Execute animation keyframes
  executeAnimation(animation, callback = null) {
    const startTime = Date.now();
    const duration = animation.duration * this.animationSpeed;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Find current keyframe
      const currentKeyframe = this.getCurrentKeyframe(animation.keyframes, progress);
      
      // Apply animation
      this.applyKeyframe(currentKeyframe);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete
        if (animation.loop) {
          // Restart animation
          setTimeout(() => {
            this.executeAnimation(animation, callback);
          }, 100);
        } else {
          // Return to idle
          if (this.isActive) {
            this.startIdleAnimation();
          }
          
          if (this.callbacks.onAnimationEnd) {
            this.callbacks.onAnimationEnd(animation.name);
          }
          
          if (callback) {
            callback();
          }
        }
      }
    };
    
    animate();
  }

  // Get current keyframe based on progress
  getCurrentKeyframe(keyframes, progress) {
    const time = progress * keyframes[keyframes.length - 1].time;
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      const current = keyframes[i];
      const next = keyframes[i + 1];
      
      if (time >= current.time && time <= next.time) {
        const localProgress = (time - current.time) / (next.time - current.time);
        
        return {
          scale: this.lerp(current.scale, next.scale, localProgress),
          rotation: this.lerp(current.rotation, next.rotation, localProgress),
          opacity: this.lerp(current.opacity, next.opacity, localProgress)
        };
      }
    }
    
    return keyframes[keyframes.length - 1];
  }

  // Linear interpolation
  lerp(start, end, progress) {
    return start + (end - start) * progress;
  }

  // Apply keyframe to avatar
  applyKeyframe(keyframe) {
    // This would be implemented in the UI component
    // For now, we'll just store the current state
    this.currentKeyframe = keyframe;
  }

  // Start idle animation
  startIdleAnimation() {
    if (this.isActive && !this.isTalking && !this.isListening) {
      this.startAnimation('idle');
    }
  }

  // Set talking state
  setTalking(isTalking) {
    this.isTalking = isTalking;
    
    if (isTalking) {
      this.startAnimation('talking');
    } else {
      this.startIdleAnimation();
    }
  }

  // Set listening state
  setListening(isListening) {
    this.isListening = isListening;
    
    if (isListening) {
      this.startAnimation('listening');
    } else {
      this.startIdleAnimation();
    }
  }

  // Set expression based on analysis
  setExpressionFromAnalysis(analysis) {
    if (!analysis) return;

    const overallScore = analysis.overallScore || 0;
    const performanceLevel = analysis.performanceLevel || 'unknown';

    let expression = 'neutral';

    if (performanceLevel === 'excellent' || overallScore >= 85) {
      expression = 'happy';
    } else if (performanceLevel === 'good' || overallScore >= 70) {
      expression = 'encouraging';
    } else if (performanceLevel === 'fair' || overallScore >= 55) {
      expression = 'supportive';
    } else if (performanceLevel === 'needs_improvement' || overallScore < 55) {
      expression = 'supportive';
    }

    this.startAnimation(expression);
  }

  // Set expression directly
  setExpression(expression) {
    if (this.animations[expression]) {
      this.startAnimation(expression);
    }
  }

  // Queue animation
  queueAnimation(animationName, delay = 0) {
    this.animationQueue.push({ animationName, delay });
    this.processAnimationQueue();
  }

  // Process animation queue
  processAnimationQueue() {
    if (this.animationQueue.length === 0) return;

    const { animationName, delay } = this.animationQueue.shift();
    
    setTimeout(() => {
      this.startAnimation(animationName, () => {
        this.processAnimationQueue();
      });
    }, delay);
  }

  // Set animation speed
  setAnimationSpeed(speed) {
    this.animationSpeed = Math.max(0.1, Math.min(3.0, speed));
  }

  // Get current animation state
  getCurrentState() {
    return {
      expression: this.currentExpression,
      isTalking: this.isTalking,
      isListening: this.isListening,
      currentKeyframe: this.currentKeyframe,
      animationSpeed: this.animationSpeed
    };
  }

  // Set callbacks
  onExpressionChange(callback) {
    this.callbacks.onExpressionChange = callback;
  }

  onAnimationStart(callback) {
    this.callbacks.onAnimationStart = callback;
  }

  onAnimationEnd(callback) {
    this.callbacks.onAnimationEnd = callback;
  }

  // Stop all animations
  stop() {
    this.isActive = false;
    this.isTalking = false;
    this.isListening = false;
    this.animationQueue = [];
    this.currentExpression = 'neutral';
  }

  // Cleanup
  cleanup() {
    this.stop();
  }
}

export default AIAvatarAnimationSystem;
