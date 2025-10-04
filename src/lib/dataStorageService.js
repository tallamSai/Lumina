// Data Storage Service using IndexedDB
// Stores feedback history, session data, and user progress

export class DataStorageService {
  constructor() {
    this.dbName = 'LuminaAICompanion';
    this.dbVersion = 1;
    this.db = null;
    this.isInitialized = false;
  }

  // Initialize IndexedDB
  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB initialized successfully');
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create feedback store
        if (!db.objectStoreNames.contains('feedback')) {
          const feedbackStore = db.createObjectStore('feedback', { keyPath: 'id', autoIncrement: true });
          feedbackStore.createIndex('timestamp', 'timestamp', { unique: false });
          feedbackStore.createIndex('sessionId', 'sessionId', { unique: false });
          feedbackStore.createIndex('performanceLevel', 'performanceLevel', { unique: false });
        }

        // Create sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
          sessionsStore.createIndex('startTime', 'startTime', { unique: false });
          sessionsStore.createIndex('endTime', 'endTime', { unique: false });
          sessionsStore.createIndex('duration', 'duration', { unique: false });
        }

        // Create user progress store
        if (!db.objectStoreNames.contains('userProgress')) {
          const progressStore = db.createObjectStore('userProgress', { keyPath: 'id', autoIncrement: true });
          progressStore.createIndex('date', 'date', { unique: false });
          progressStore.createIndex('overallScore', 'overallScore', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        console.log('IndexedDB schema created');
      };
    });
  }

  // Save feedback entry
  async saveFeedback(feedbackData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['feedback'], 'readwrite');
      const store = transaction.objectStore('feedback');
      
      const feedback = {
        ...feedbackData,
        timestamp: Date.now(),
        id: feedbackData.id || Date.now()
      };

      const request = store.add(feedback);

      request.onsuccess = () => {
        console.log('Feedback saved successfully');
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error saving feedback:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all feedback entries
  async getAllFeedback() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['feedback'], 'readonly');
      const store = transaction.objectStore('feedback');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error getting feedback:', request.error);
        reject(request.error);
      };
    });
  }

  // Get feedback by session ID
  async getFeedbackBySession(sessionId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['feedback'], 'readonly');
      const store = transaction.objectStore('feedback');
      const index = store.index('sessionId');
      const request = index.getAll(sessionId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error getting feedback by session:', request.error);
        reject(request.error);
      };
    });
  }

  // Get recent feedback (last N entries)
  async getRecentFeedback(limit = 50) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['feedback'], 'readonly');
      const store = transaction.objectStore('feedback');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');

      const results = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => {
        console.error('Error getting recent feedback:', request.error);
        reject(request.error);
      };
    });
  }

  // Save session data
  async saveSession(sessionData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      
      const session = {
        ...sessionData,
        startTime: sessionData.startTime || Date.now(),
        endTime: sessionData.endTime || Date.now(),
        duration: sessionData.duration || 0,
        id: sessionData.id || Date.now()
      };

      const request = store.add(session);

      request.onsuccess = () => {
        console.log('Session saved successfully');
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error saving session:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all sessions
  async getAllSessions() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error getting sessions:', request.error);
        reject(request.error);
      };
    });
  }

  // Save user progress
  async saveUserProgress(progressData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['userProgress'], 'readwrite');
      const store = transaction.objectStore('userProgress');
      
      const progress = {
        ...progressData,
        date: progressData.date || new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        id: progressData.id || Date.now()
      };

      const request = store.add(progress);

      request.onsuccess = () => {
        console.log('User progress saved successfully');
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error saving user progress:', request.error);
        reject(request.error);
      };
    });
  }

  // Get user progress
  async getUserProgress() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['userProgress'], 'readonly');
      const store = transaction.objectStore('userProgress');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error getting user progress:', request.error);
        reject(request.error);
      };
    });
  }

  // Get progress by date range
  async getProgressByDateRange(startDate, endDate) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['userProgress'], 'readonly');
      const store = transaction.objectStore('userProgress');
      const index = store.index('date');
      const request = index.getAll();

      request.onsuccess = () => {
        const allProgress = request.result;
        const filteredProgress = allProgress.filter(progress => {
          const progressDate = new Date(progress.date);
          return progressDate >= startDate && progressDate <= endDate;
        });
        resolve(filteredProgress);
      };

      request.onerror = () => {
        console.error('Error getting progress by date range:', request.error);
        reject(request.error);
      };
    });
  }

  // Save settings
  async saveSetting(key, value) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      
      const setting = {
        key: key,
        value: value,
        timestamp: Date.now()
      };

      const request = store.put(setting);

      request.onsuccess = () => {
        console.log('Setting saved successfully');
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error saving setting:', request.error);
        reject(request.error);
      };
    });
  }

  // Get setting
  async getSetting(key) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };

      request.onerror = () => {
        console.error('Error getting setting:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all settings
  async getAllSettings() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.getAll();

      request.onsuccess = () => {
        const settings = {};
        request.result.forEach(setting => {
          settings[setting.key] = setting.value;
        });
        resolve(settings);
      };

      request.onerror = () => {
        console.error('Error getting all settings:', request.error);
        reject(request.error);
      };
    });
  }

  // Delete feedback entry
  async deleteFeedback(id) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['feedback'], 'readwrite');
      const store = transaction.objectStore('feedback');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('Feedback deleted successfully');
        resolve(true);
      };

      request.onerror = () => {
        console.error('Error deleting feedback:', request.error);
        reject(request.error);
      };
    });
  }

  // Delete session
  async deleteSession(id) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('Session deleted successfully');
        resolve(true);
      };

      request.onerror = () => {
        console.error('Error deleting session:', request.error);
        reject(request.error);
      };
    });
  }

  // Clear all data
  async clearAllData() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['feedback', 'sessions', 'userProgress', 'settings'], 'readwrite');
      
      const feedbackStore = transaction.objectStore('feedback');
      const sessionsStore = transaction.objectStore('sessions');
      const progressStore = transaction.objectStore('userProgress');
      const settingsStore = transaction.objectStore('settings');

      const feedbackRequest = feedbackStore.clear();
      const sessionsRequest = sessionsStore.clear();
      const progressRequest = progressStore.clear();
      const settingsRequest = settingsStore.clear();

      let completed = 0;
      const total = 4;

      const checkComplete = () => {
        completed++;
        if (completed === total) {
          console.log('All data cleared successfully');
          resolve(true);
        }
      };

      feedbackRequest.onsuccess = checkComplete;
      sessionsRequest.onsuccess = checkComplete;
      progressRequest.onsuccess = checkComplete;
      settingsRequest.onsuccess = checkComplete;

      feedbackRequest.onerror = () => reject(feedbackRequest.error);
      sessionsRequest.onerror = () => reject(sessionsRequest.error);
      progressRequest.onerror = () => reject(progressRequest.error);
      settingsRequest.onerror = () => reject(settingsRequest.error);
    });
  }

  // Export all data
  async exportAllData() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const [feedback, sessions, progress, settings] = await Promise.all([
        this.getAllFeedback(),
        this.getAllSessions(),
        this.getUserProgress(),
        this.getAllSettings()
      ]);

      const exportData = {
        feedback,
        sessions,
        progress,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      return exportData;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Import data
  async importData(importData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Clear existing data
      await this.clearAllData();

      // Import new data
      if (importData.feedback) {
        for (const feedback of importData.feedback) {
          await this.saveFeedback(feedback);
        }
      }

      if (importData.sessions) {
        for (const session of importData.sessions) {
          await this.saveSession(session);
        }
      }

      if (importData.progress) {
        for (const progress of importData.progress) {
          await this.saveUserProgress(progress);
        }
      }

      if (importData.settings) {
        for (const [key, value] of Object.entries(importData.settings)) {
          await this.saveSetting(key, value);
        }
      }

      console.log('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  // Get storage statistics
  async getStorageStats() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const [feedback, sessions, progress] = await Promise.all([
        this.getAllFeedback(),
        this.getAllSessions(),
        this.getUserProgress()
      ]);

      const stats = {
        totalFeedback: feedback.length,
        totalSessions: sessions.length,
        totalProgressEntries: progress.length,
        lastActivity: feedback.length > 0 ? Math.max(...feedback.map(f => f.timestamp)) : null,
        averageScore: feedback.length > 0 ? 
          feedback.reduce((sum, f) => sum + (f.analysis?.overallScore || 0), 0) / feedback.length : 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw error;
    }
  }
}

export default DataStorageService;
