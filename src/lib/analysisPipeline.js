// Real-time Analysis Pipeline
// Orchestrates audio, video, and NLP analysis for comprehensive presentation feedback

import AudioAnalyzer from './audioAnalysis.js';
import VideoAnalyzer from './videoAnalysis.js';
import MetricsAggregator from './metricsAggregator.js';
import FirebaseStorageService from './firebaseStorage.js';
import PerformanceTracker from './performanceTracker.js';
import EmotionAnalyzer from './emotionAnalyzer.js';
import AICoach from './aiCoach.js';
import { generatePresentationSummary } from './gemini.js';

export class AnalysisPipeline {
  constructor() {
    this.audioAnalyzer = new AudioAnalyzer();
    this.videoAnalyzer = new VideoAnalyzer();
    this.metricsAggregator = new MetricsAggregator();
    this.firebaseStorage = new FirebaseStorageService();
    this.performanceTracker = new PerformanceTracker();
    this.emotionAnalyzer = new EmotionAnalyzer();
    this.aiCoach = new AICoach();
    this.isAnalyzing = false;
  }

  // Main analysis pipeline
  async analyzePresentation(videoUrl, onProgress = null) {
    if (this.isAnalyzing) {
      throw new Error('Analysis already in progress');
    }

    this.isAnalyzing = true;
    const startTime = Date.now();

    try {
      // Update progress
      if (onProgress) onProgress({ stage: 'initializing', progress: 0 });

      // Run all analyses in parallel for efficiency
      const [audioAnalysis, videoAnalysis] = await Promise.all([
        this.runAudioAnalysis(videoUrl, onProgress),
        this.runVideoAnalysis(videoUrl, onProgress)
      ]);

      // Update progress
      if (onProgress) onProgress({ stage: 'processing', progress: 60 });

      // Extract NLP analysis from audio results
      const nlpAnalysis = audioAnalysis?.nlp || null;

      // Aggregate all metrics
      const aggregatedMetrics = this.metricsAggregator.aggregateAnalysis(
        audioAnalysis,
        videoAnalysis,
        nlpAnalysis
      );

      // Update progress
      if (onProgress) onProgress({ stage: 'ai_analysis', progress: 80 });

      // Create comprehensive results first
      const comprehensiveResults = {
        id: Date.now(),
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        raw: {
          audio: audioAnalysis,
          video: videoAnalysis,
          nlp: nlpAnalysis
        },
        aggregated: aggregatedMetrics,
        realTimeMetrics: {
          audio: audioAnalysis?.realTimeMetrics || {},
          video: videoAnalysis?.realTimeMetrics || {}
        }
      };

      // Generate AI-powered insights with comprehensive data
      const aiInsights = await this.generateAIInsights(comprehensiveResults);

      // Update progress
      if (onProgress) onProgress({ stage: 'finalizing', progress: 90 });

      // Generate advanced analytics
      const advancedAnalytics = await this.generateAdvancedAnalytics(comprehensiveResults, aiInsights);

      // Create final results
      const results = {
        ...comprehensiveResults,
        ai: aiInsights,
        advancedAnalytics,
        personalized: aiInsights ? {
          summary: aiInsights.summary,
          strengths: aiInsights.strengths,
          improvements: aiInsights.areasForImprovement,
          nextSteps: aiInsights.nextSteps
        } : null,
        hasValidContent: aiInsights?.overallScore > 0
      };

      // Update progress
      if (onProgress) onProgress({ stage: 'complete', progress: 100 });

      return results;

    } catch (error) {
      console.error('Analysis pipeline failed:', error);
      throw error;
    } finally {
      this.isAnalyzing = false;
    }
  }

  // Run audio analysis with progress updates
  async runAudioAnalysis(videoUrl, onProgress) {
    try {
      if (onProgress) onProgress({ stage: 'audio_analysis', progress: 10 });
      
      const audioAnalysis = await this.audioAnalyzer.analyzeAudio(videoUrl);
      
      if (onProgress) onProgress({ stage: 'audio_analysis', progress: 30 });
      
      return audioAnalysis;
    } catch (error) {
      console.error('Audio analysis failed:', error);
      return null;
    }
  }

  // Run video analysis with progress updates
  async runVideoAnalysis(videoUrl, onProgress) {
    try {
      if (onProgress) onProgress({ stage: 'video_analysis', progress: 40 });
      
      const videoAnalysis = await this.videoAnalyzer.analyzeVideo(videoUrl);
      
      if (onProgress) onProgress({ stage: 'video_analysis', progress: 50 });
      
      return videoAnalysis;
    } catch (error) {
      console.error('Video analysis failed:', error);
      return null;
    }
  }

  // Generate AI-powered insights using Gemini with comprehensive data
  async generateAIInsights(comprehensiveResults) {
    try {
      // Pass all comprehensive data directly to Gemini
      const aiAnalysis = await generatePresentationSummary(comprehensiveResults);
      
      if (aiAnalysis) {
        return {
          summary: aiAnalysis.summary,
          strengths: aiAnalysis.strengths,
          areasForImprovement: aiAnalysis.areasForImprovement,
          speakingTips: aiAnalysis.speakingTips,
          practiceDrills: aiAnalysis.practiceDrills,
          scoreExplanation: aiAnalysis.scoreExplanation,
          nextSteps: aiAnalysis.nextSteps,
          technicalNotes: aiAnalysis.technicalNotes,
          advancedInsights: aiAnalysis.advancedInsights,
          performanceBreakdown: aiAnalysis.performanceBreakdown,
          recommendations: aiAnalysis.recommendations,
          dynamicScores: {
            overallScore: aiAnalysis.overallScore,
            voiceClarity: aiAnalysis.voiceClarity,
            bodyLanguage: aiAnalysis.bodyLanguage,
            pacing: aiAnalysis.pacing,
            confidence: aiAnalysis.confidence,
            engagement: aiAnalysis.engagement,
            contentQuality: aiAnalysis.contentQuality,
            professionalism: aiAnalysis.professionalism
          }
        };
      } else {
        // If Gemini fails, return null to indicate no AI analysis available
        console.warn('Gemini AI analysis failed - no fallback data will be used');
        return null;
      }
    } catch (error) {
      console.error('AI insights generation failed:', error);
      return null;
    }
  }

  // Generate advanced analytics using new services
  async generateAdvancedAnalytics(comprehensiveResults, aiInsights) {
    try {
      const analytics = {
        emotionAnalysis: null,
        performanceTracking: null,
        coachingPlan: null,
        insights: null
      };

      // Emotion analysis
      if (comprehensiveResults.raw?.video?.frames) {
        analytics.emotionAnalysis = this.emotionAnalyzer.analyzeEmotions(
          comprehensiveResults.raw.video.frames
        );
      }

      // Performance tracking
      if (aiInsights) {
        const analysisData = {
          id: comprehensiveResults.id,
          timestamp: comprehensiveResults.timestamp,
          overallScore: aiInsights.dynamicScores?.overallScore || 0,
          voiceClarity: aiInsights.dynamicScores?.voiceClarity || 0,
          bodyLanguage: aiInsights.dynamicScores?.bodyLanguage || 0,
          pacing: aiInsights.dynamicScores?.pacing || 0,
          confidence: aiInsights.dynamicScores?.confidence || 0,
          engagement: aiInsights.dynamicScores?.engagement || 0,
          contentQuality: aiInsights.dynamicScores?.contentQuality || 0,
          professionalism: aiInsights.dynamicScores?.professionalism || 0,
          strengths: aiInsights.strengths || [],
          areasForImprovement: aiInsights.areasForImprovement || [],
          duration: comprehensiveResults.duration || 0
        };

        analytics.performanceTracking = this.performanceTracker.addAnalysis(analysisData);
      }

      // AI Coaching plan
      if (aiInsights) {
        analytics.coachingPlan = this.aiCoach.generateCoachingPlan(aiInsights);
        analytics.insights = this.aiCoach.getCoachingInsights(aiInsights);
      }

      return analytics;
    } catch (error) {
      console.error('Advanced analytics generation failed:', error);
      return null;
    }
  }

  // Get real-time analysis status
  getAnalysisStatus() {
    return {
      isAnalyzing: this.isAnalyzing,
      timestamp: Date.now()
    };
  }

  // Cancel ongoing analysis
  cancelAnalysis() {
    this.isAnalyzing = false;
    return { cancelled: true, timestamp: Date.now() };
  }

  // Save analysis data to Firebase
  async saveToFirebase(userId, videoBlob, analysisResults) {
    try {
      if (!userId) {
        throw new Error('User ID required for Firebase storage');
      }

      const analysisData = {
        id: analysisResults.id,
        title: `Advanced Presentation Analysis ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString(),
        duration: analysisResults.raw?.audio?.transcript?.duration || 0,
        processingTime: analysisResults.duration,
        
        // Scores
        overallScore: analysisResults.ai?.dynamicScores?.overallScore || analysisResults.aggregated.overall,
        voiceClarity: analysisResults.ai?.dynamicScores?.voiceClarity || analysisResults.aggregated.categories.voice.clarity,
        bodyLanguage: analysisResults.ai?.dynamicScores?.bodyLanguage || analysisResults.aggregated.categories.bodyLanguage.posture,
        pace: analysisResults.ai?.dynamicScores?.pacing || analysisResults.aggregated.categories.voice.pace,
        confidence: analysisResults.ai?.dynamicScores?.confidence || analysisResults.aggregated.categories.engagement.overall,
        
        // Results
        summary: analysisResults.ai?.summary || analysisResults.aggregated.personalized.summary,
        strengths: analysisResults.ai?.strengths || analysisResults.aggregated.personalized.strengths,
        improvements: analysisResults.ai?.areasForImprovement || analysisResults.aggregated.personalized.improvements,
        recommendations: analysisResults.ai?.practiceDrills || analysisResults.aggregated.recommendations,
        speakingTips: analysisResults.ai?.speakingTips || [],
        scoreExplanation: analysisResults.ai?.scoreExplanation || 'Comprehensive analysis using advanced AI pipeline',
        
        // Comprehensive data
        comprehensiveData: analysisResults
      };

      const result = await this.firebaseStorage.saveAnalysisData(userId, {
        ...analysisData,
        videoBlob: videoBlob
      });

      console.log('Analysis data saved to Firebase:', result);
      return result;

    } catch (error) {
      console.error('Failed to save to Firebase:', error);
      throw error;
    }
  }

  // Get user's analysis history from Firebase
  async getUserAnalyses(userId, limitCount = 10) {
    try {
      return await this.firebaseStorage.getUserAnalyses(userId, limitCount);
    } catch (error) {
      console.error('Failed to get user analyses:', error);
      return [];
    }
  }

  // Get specific analysis from Firebase
  async getAnalysisById(analysisId) {
    try {
      return await this.firebaseStorage.getAnalysisById(analysisId);
    } catch (error) {
      console.error('Failed to get analysis by ID:', error);
      return null;
    }
  }

  // Delete analysis from Firebase
  async deleteAnalysis(userId, analysisId) {
    try {
      return await this.firebaseStorage.deleteAnalysis(userId, analysisId);
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      throw error;
    }
  }

  // Get analysis capabilities
  getCapabilities() {
    return {
      audio: {
        speechToText: true,
        nlpAnalysis: true,
        audioFeatures: true,
        fillerWordDetection: true
      },
      video: {
        poseDetection: true,
        emotionRecognition: true,
        gestureAnalysis: true,
        eyeContactTracking: true
      },
      ai: {
        geminiIntegration: true,
        dynamicScoring: true,
        personalizedFeedback: true,
        realTimeAnalysis: true
      },
      storage: {
        firebaseIntegration: true,
        cloudStorage: true,
        dataPersistence: true,
        userHistory: true
      }
    };
  }
}

export default AnalysisPipeline;
