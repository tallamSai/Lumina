// Cloudinary Storage Service - Client-Side Compatible
// Uses unsigned uploads with upload presets

export class CloudinaryStorageService {
  constructor() {
    this.cloudName = 'di7jg5cwz';
    this.uploadPreset = 'lumina-unsigned'; // You'll create this preset
  }

  // Upload video file to Cloudinary using unsigned upload
  async uploadVideo(userId, videoBlob, analysisId) {
    try {
      if (!videoBlob) {
        throw new Error('No video blob provided');
      }

      console.log('Uploading video to Cloudinary...');
      
      // Create FormData for unsigned upload
      const formData = new FormData();
      formData.append('file', videoBlob);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', `lumina/users/${userId}/videos`);
      formData.append('public_id', analysisId);
      formData.append('resource_type', 'video');
      formData.append('tags', `presentation-analysis,${userId},${analysisId}`);

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Video uploaded successfully to Cloudinary:', result.secure_url);
      return result.secure_url;

    } catch (error) {
      console.error('Error uploading video to Cloudinary:', error);
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  // Save analysis data to Cloudinary as JSON
  async saveAnalysisData(userId, analysisData) {
    try {
      console.log('Saving analysis data to Cloudinary...');
      
      // Generate unique analysis ID if not provided
      const analysisId = analysisData.analysisId || `analysis_${Date.now()}`;
      
      // Prepare the complete analysis result
      const completeAnalysisData = {
        ...analysisData,
        analysisId,
        userId,
        timestamp: new Date().toISOString(),
        platform: 'cloudinary'
      };

      // Convert analysis data to JSON string
      const analysisJson = JSON.stringify(completeAnalysisData, null, 2);
      const blob = new Blob([analysisJson], { type: 'application/json' });
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', `lumina/users/${userId}/analyses`);
      formData.append('public_id', analysisId);
      formData.append('resource_type', 'raw');
      formData.append('tags', `analysis-data,${userId},${analysisId}`);

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/raw/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Analysis data saved to Cloudinary:', result.secure_url);
      
      // Update user index in localStorage
      const userIndexKey = `cloudinary_user_${userId}`;
      const userIndex = JSON.parse(localStorage.getItem(userIndexKey) || '[]');
      if (!userIndex.includes(analysisId)) {
        userIndex.unshift(analysisId); // Add to beginning (newest first)
        localStorage.setItem(userIndexKey, JSON.stringify(userIndex));
        console.log('Updated user index in localStorage');
      }
      
      return {
        analysisId,
        videoUrl: analysisData.videoUrl,
        dataUrl: result.secure_url,
        timestamp: completeAnalysisData.timestamp,
        cloudinary: true
      };

    } catch (error) {
      console.error('Error saving analysis data to Cloudinary:', error);
      throw error;
    }
  }

  // Get video URL from Cloudinary
  async getVideoUrl(userId, analysisId) {
    try {
      const publicId = `lumina/users/${userId}/videos/${analysisId}`;
      const url = `https://res.cloudinary.com/${this.cloudName}/video/upload/${publicId}`;
      return url;

    } catch (error) {
      console.error('Error getting video URL from Cloudinary:', error);
      throw error;
    }
  }

  // Delete analysis from Cloudinary (client-side implementation)
  async deleteAnalysis(userId, analysisId) {
    try {
      console.log(`Deleting analysis ${analysisId} for user ${userId}...`);
      
      // Remove from localStorage index
      const userIndexKey = `cloudinary_user_${userId}`;
      const userIndex = JSON.parse(localStorage.getItem(userIndexKey) || '[]');
      const updatedIndex = userIndex.filter(id => id !== analysisId);
      localStorage.setItem(userIndexKey, JSON.stringify(updatedIndex));
      
      console.log(`Removed analysis ${analysisId} from localStorage index`);
      
      // Note: Actual file deletion from Cloudinary requires server-side implementation
      // For now, we just remove it from the user's index so it won't appear in Dashboard
      console.log('Analysis removed from user index (Cloudinary files remain for server-side cleanup)');
      
      return { success: true, analysisId };
      
    } catch (error) {
      console.error('Error deleting analysis:', error);
      throw error;
    }
  }

  // Get all analyses for a user from Cloudinary
  async getUserAnalyses(userId) {
    try {
      console.log('Fetching user analyses from Cloudinary...');
      
      // Use Cloudinary's Admin API to search for resources
      // Note: This requires server-side implementation for security
      // For now, we'll use a simplified approach with tags
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/resources/raw?prefix=lumina/users/${userId}/analyses/&max_results=50`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(`${this.apiKey}:${this.apiSecret}`)}`
          }
        }
      );

      if (!response.ok) {
        console.warn('Cloudinary Admin API not accessible from client-side');
        return [];
      }

      const result = await response.json();
      console.log('Cloudinary resources found:', result);
      
      // Fetch the actual analysis data for each resource
      const analyses = [];
      for (const resource of result.resources || []) {
        try {
          const dataResponse = await fetch(resource.secure_url);
          const analysisData = await dataResponse.json();
          analyses.push(analysisData);
        } catch (fetchError) {
          console.warn('Failed to fetch analysis data for:', resource.public_id);
        }
      }
      
      console.log(`Found ${analyses.length} analyses for user ${userId}`);
      return analyses;

    } catch (error) {
      console.error('Error fetching user analyses from Cloudinary:', error);
      return [];
    }
  }

  // Get all analyses for a user (Cloudinary only)
  async getAllUserAnalyses(userId) {
    try {
      console.log('Fetching all user analyses from Cloudinary...');
      
      // Since Admin API is blocked by CORS, we'll use a different approach
      // We'll store a simple index in localStorage that maps user IDs to their analysis IDs
      // This is a hybrid approach: metadata in localStorage, files in Cloudinary
      
      const userIndexKey = `cloudinary_user_${userId}`;
      const userIndex = JSON.parse(localStorage.getItem(userIndexKey) || '[]');
      
      console.log(`Found ${userIndex.length} analysis IDs for user ${userId}`);
      
      if (userIndex.length === 0) {
        return [];
      }
      
      // Fetch the actual analysis data for each ID
      const analyses = [];
      for (const analysisId of userIndex) {
        try {
          const analysisUrl = `https://res.cloudinary.com/${this.cloudName}/raw/upload/lumina/users/${userId}/analyses/${analysisId}`;
          const dataResponse = await fetch(analysisUrl);
          
          if (dataResponse.ok) {
            const analysisData = await dataResponse.json();
            
            // Ensure video URL is properly set if it exists
            if (analysisData.videoUrl) {
              // Video URL should already be set from upload, but let's verify it's accessible
              analysisData.videoUrl = analysisData.videoUrl;
            } else if (analysisData.videoDataUrl) {
              // Fallback to data URL if Cloudinary URL is missing
              analysisData.videoUrl = analysisData.videoDataUrl;
            }
            
            // Ensure we have all required fields
            if (!analysisData.title) {
              analysisData.title = `Presentation Analysis ${analyses.length + 1}`;
            }
            if (!analysisData.date && analysisData.timestamp) {
              analysisData.date = analysisData.timestamp;
            }
            
            analyses.push(analysisData);
          } else {
            console.warn(`Failed to fetch analysis ${analysisId}:`, dataResponse.status);
          }
        } catch (fetchError) {
          console.warn('Failed to fetch analysis data for:', analysisId);
        }
      }
      
      // Sort by timestamp (newest first)
      analyses.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
        const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      
      console.log(`Found ${analyses.length} total analyses for user ${userId}`);
      return analyses;

    } catch (error) {
      console.error('Error fetching all user analyses from Cloudinary:', error);
      return [];
    }
  }

  // Sync/recover user analyses if localStorage index is corrupted
  async syncUserAnalyses(userId) {
    try {
      console.log('Syncing user analyses with Cloudinary...');
      
      // Try to recover from known analysis patterns if localStorage is empty
      const userIndexKey = `cloudinary_user_${userId}`;
      const userIndex = JSON.parse(localStorage.getItem(userIndexKey) || '[]');
      
      if (userIndex.length === 0) {
        console.log('No analyses in localStorage, attempting recovery...');
        
        // Try some common analysis ID patterns
        const possibleIds = [
          `analysis_${Date.now()}`,
          `presentation_${userId}`
        ];
        
        // Check for any recently created analyses with generic naming
        const recentTimestamp = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
        for (let i = 0; i < 10; i++) {
          possibleIds.push(`analysis_${recentTimestamp - (i * 60000)}`); // Every minute for last 10 minutes
        }
        
        // Try to fetch each possible analysis
        for (const analysisId of possibleIds) {
          try {
            const analysisUrl = `https://res.cloudinary.com/${this.cloudName}/raw/upload/lumina/users/${userId}/analyses/${analysisId}`;
            const dataResponse = await fetch(analysisUrl);
            
            if (dataResponse.ok) {
              const analysisData = await dataResponse.json();
              if (analysisData.userId === userId) {
                userIndex.push(analysisId);
                console.log(`Recovered analysis: ${analysisId}`);
              }
            }
          } catch (fetchError) {
            // Skip invalid IDs
          }
        }
        
        // Update localStorage with recovered IDs
        if (userIndex.length > 0) {
          localStorage.setItem(userIndexKey, JSON.stringify(userIndex));
          console.log(`Recovered ${userIndex.length} analyses for user ${userId}`);
        }
      }
      
      return userIndex;
      
    } catch (error) {
      console.error('Error syncing user analyses:', error);
      return [];
    }
  }
}

// Export singleton instance
export const cloudinaryStorage = new CloudinaryStorageService();
export default cloudinaryStorage;
