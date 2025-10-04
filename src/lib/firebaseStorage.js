// Comprehensive Firebase Storage Service
// Handles all analysis data storage and retrieval

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  getMetadata 
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { storage, db } from './firebase.js';

export class FirebaseStorageService {
  constructor() {
    this.storage = storage;
    this.db = db;
  }

  // Save comprehensive analysis data to Firebase
  async saveAnalysisData(userId, analysisData) {
    try {
      if (!userId) {
      throw new Error('User ID is required for Firebase storage');
      }

      if (!analysisData.videoBlob) {
        throw new Error('Video blob is required for storage');
      }

      const timestamp = Date.now();
      const analysisId = `analysis_${timestamp}`;
      
      console.log('Starting Firebase storage process...');
      
      // 1. Upload video file to Firebase Storage first
      console.log('Uploading video to Firebase Storage...');
      const videoUrl = await this.uploadVideo(userId, analysisData.videoBlob, analysisId);
      console.log('Video uploaded successfully:', videoUrl);
      
      // 2. Prepare comprehensive analysis document
      const analysisDoc = {
        id: analysisId,
        userId: userId,
        timestamp: timestamp,
        createdAt: serverTimestamp(),
        
        // Basic analysis info
        title: analysisData.title || `Presentation Analysis ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString(),
        
        // Video information
        videoUrl: videoUrl,
        videoDuration: analysisData.duration || 0,
        
        // Scores and metrics
        scores: {
          overall: analysisData.overallScore || 0,
          voiceClarity: analysisData.voiceClarity || 0,
          bodyLanguage: analysisData.bodyLanguage || 0,
          pace: analysisData.pace || 0,
          confidence: analysisData.confidence || 0
        },
        
        // Comprehensive analysis data
        comprehensiveData: {
          raw: analysisData.comprehensiveData?.raw || null,
          aggregated: analysisData.comprehensiveData?.aggregated || null,
          ai: analysisData.comprehensiveData?.ai || null,
          personalized: analysisData.comprehensiveData?.personalized || null
        },
        
        // Analysis results
        results: {
          summary: analysisData.summary || '',
          strengths: analysisData.strengths || [],
          improvements: analysisData.improvements || [],
          recommendations: analysisData.recommendations || [],
          speakingTips: analysisData.speakingTips || [],
          practiceDrills: analysisData.practiceDrills || [],
          scoreExplanation: analysisData.scoreExplanation || ''
        },
        
        // Metadata
        metadata: {
          analysisType: 'comprehensive',
          version: '2.0',
          processingTime: analysisData.processingTime || 0,
          features: {
            audioAnalysis: true,
            videoAnalysis: true,
            nlpProcessing: true,
            aiInsights: true
          }
        }
      };

      // 3. Save to Firestore
      console.log('Saving analysis data to Firestore...');
      const docRef = await addDoc(collection(this.db, 'analyses'), analysisDoc);
      console.log('Analysis data saved to Firestore:', docRef.id);
      
      return {
        success: true,
        analysisId: analysisId,
        docId: docRef.id,
        videoUrl: videoUrl
      };

    } catch (error) {
      console.error('Failed to save analysis data to Firebase:', error);
      
      // Provide specific error messages
      if (error.code === 'storage/unauthorized') {
        throw new Error('Storage access denied. Please check your Firebase authentication and rules.');
      } else if (error.code === 'storage/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.message.includes('CORS')) {
        throw new Error('CORS error. Please check your Firebase storage configuration or deploy to production.');
      } else if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check your Firestore rules.');
      }
      
      throw error;
    }
  }

  // Upload video file to Firebase Storage
  async uploadVideo(userId, videoBlob, analysisId) {
    try {
      if (!videoBlob) {
        throw new Error('No video blob provided');
      }

      const fileName = `${analysisId}.webm`;
      const storageRef = ref(this.storage, `users/${userId}/videos/${fileName}`);
      
      // Upload video with metadata
      const metadata = {
        contentType: videoBlob.type || 'video/webm',
        customMetadata: {
          analysisId: analysisId,
          userId: userId,
          uploadedAt: new Date().toISOString()
        }
      };

      console.log('Uploading video to Firebase Storage...');
      console.log('Storage path:', `users/${userId}/videos/${fileName}`);
      
      // Try upload with retry mechanism
      let retries = 3;
      while (retries > 0) {
        try {
          await uploadBytes(storageRef, videoBlob, metadata);
          const downloadURL = await getDownloadURL(storageRef);
          console.log('Video uploaded successfully:', downloadURL);
          return downloadURL;
        } catch (uploadError) {
          retries--;
          console.warn(`Upload attempt failed, retries left: ${retries}`, uploadError);
          
          // Check for CORS error specifically
          if (uploadError.message.includes('CORS') || 
              uploadError.message.includes('ERR_FAILED') ||
              uploadError.code === 'storage/unauthorized' ||
              uploadError.code === 'storage/unknown' ||
              uploadError.code === 'storage/network-request-failed') {
            console.warn('CORS or network error detected, falling back to local storage');
            throw new Error('CORS_ERROR: Firebase Storage blocked by CORS policy. Please deploy to production or use Firebase emulator.');
          }
          
          if (retries === 0) {
            throw uploadError;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

    } catch (error) {
      console.error('Failed to upload video to Firebase:', error);
      
      // Enhanced CORS error detection
      if (error.message.includes('CORS') || 
          error.message.includes('ERR_FAILED') ||
          error.message.includes('CORS_ERROR') ||
          error.code === 'storage/unauthorized' ||
          error.code === 'storage/unknown' ||
          error.code === 'storage/network-request-failed') {
        throw new Error('CORS_ERROR: Cannot upload to Firebase Storage from localhost. Please deploy to production or configure Firebase Storage rules.');
      }
      
      // Check for specific error types
      if (error.code === 'storage/unauthorized') {
        throw new Error('Storage access denied. Please check your Firebase rules.');
      } else if (error.code === 'storage/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.message.includes('CORS') || error.message.includes('ERR_FAILED')) {
        throw new Error('CORS error detected. This is a common issue with localhost development. Please deploy to production or use Firebase emulator.');
      }
      
      throw error;
    }
  }

  // Save analysis metadata separately (for faster queries)
  async saveAnalysisMetadata(userId, analysisData) {
    try {
      const metadata = {
        userId: userId,
        analysisId: analysisData.id,
        title: analysisData.title,
        overallScore: analysisData.overallScore,
        createdAt: serverTimestamp(),
        videoUrl: analysisData.videoUrl,
        duration: analysisData.duration || 0,
        analysisType: 'comprehensive'
      };

      const docRef = await addDoc(collection(this.db, 'analysis_metadata'), metadata);
      return docRef.id;

    } catch (error) {
      console.error('Failed to save analysis metadata:', error);
      throw error;
    }
  }

  // Get user's analysis history
  async getUserAnalyses(userId, limitCount = 10) {
    try {
      const q = query(
        collection(this.db, 'analyses'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const analyses = [];

      querySnapshot.forEach((doc) => {
        analyses.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return analyses;

    } catch (error) {
      console.error('Failed to get user analyses:', error);
      return [];
    }
  }

  // Get specific analysis by ID
  async getAnalysisById(analysisId) {
    try {
      const q = query(
        collection(this.db, 'analyses'),
        where('id', '==', analysisId)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };

    } catch (error) {
      console.error('Failed to get analysis by ID:', error);
      return null;
    }
  }

  // Update analysis data
  async updateAnalysis(analysisId, updateData) {
    try {
      const q = query(
        collection(this.db, 'analyses'),
        where('id', '==', analysisId)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Analysis not found');
      }

      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });

      return { success: true };

    } catch (error) {
      console.error('Failed to update analysis:', error);
      throw error;
    }
  }

  // Delete analysis and associated files
  async deleteAnalysis(userId, analysisId) {
    try {
      // Get analysis data first
      const analysis = await this.getAnalysisById(analysisId);
      if (!analysis) {
        throw new Error('Analysis not found');
      }

      // Delete video file from storage
      if (analysis.videoUrl) {
        try {
          const videoRef = ref(this.storage, `users/${userId}/videos/${analysisId}.webm`);
          await deleteObject(videoRef);
        } catch (storageError) {
          console.warn('Failed to delete video file:', storageError);
        }
      }

      // Delete analysis document
      const q = query(
        collection(this.db, 'analyses'),
        where('id', '==', analysisId)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await deleteDoc(docRef);
      }

      return { success: true };

    } catch (error) {
      console.error('Failed to delete analysis:', error);
      throw error;
    }
  }

  // Get analysis statistics for user
  async getUserAnalysisStats(userId) {
    try {
      const analyses = await this.getUserAnalyses(userId, 100);
      
      if (analyses.length === 0) {
        return {
          totalAnalyses: 0,
          averageScore: 0,
          bestScore: 0,
          improvementTrend: []
        };
      }

      const scores = analyses.map(a => a.scores?.overall || 0).filter(s => s > 0);
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const bestScore = Math.max(...scores, 0);

      // Calculate improvement trend (last 5 analyses)
      const recentAnalyses = analyses.slice(0, 5);
      const improvementTrend = recentAnalyses.map(a => ({
        date: a.date,
        score: a.scores?.overall || 0
      }));

      return {
        totalAnalyses: analyses.length,
        averageScore: Math.round(averageScore),
        bestScore: Math.round(bestScore),
        improvementTrend: improvementTrend
      };

    } catch (error) {
      console.error('Failed to get analysis stats:', error);
      return {
        totalAnalyses: 0,
        averageScore: 0,
        bestScore: 0,
        improvementTrend: []
      };
    }
  }

  // Export analysis data as JSON
  async exportAnalysisData(analysisId) {
    try {
      const analysis = await this.getAnalysisById(analysisId);
      if (!analysis) {
        throw new Error('Analysis not found');
      }

      // Create exportable data structure
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          analysisId: analysis.id,
          userId: analysis.userId,
          version: '2.0'
        },
        analysis: {
          scores: analysis.scores,
          results: analysis.results,
          comprehensiveData: analysis.comprehensiveData
        }
      };

      return exportData;

    } catch (error) {
      console.error('Failed to export analysis data:', error);
      throw error;
    }
  }

  // Get storage usage for user
  async getUserStorageUsage(userId) {
    try {
      const listRef = ref(this.storage, `users/${userId}/videos/`);
      const result = await listAll(listRef);
      
      let totalSize = 0;
      const files = [];

      for (const itemRef of result.items) {
        const metadata = await getMetadata(itemRef);
        totalSize += metadata.size;
        files.push({
          name: itemRef.name,
          size: metadata.size,
          created: metadata.timeCreated
        });
      }

      return {
        totalSize: totalSize,
        fileCount: files.length,
        files: files
      };

    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return {
        totalSize: 0,
        fileCount: 0,
        files: []
      };
    }
  }
}

export default FirebaseStorageService;
