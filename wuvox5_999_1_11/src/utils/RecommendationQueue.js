import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'recommendation_queue';
const DISPLAY_COUNT = 10;
const QUEUE_SIZE = 20;

class RecommendationQueueManager {
  constructor() {
    this.cache = new Map();
    this.lastCacheTime = 0;
    this.cacheExpiry = 2 * 60 * 1000; // 2 minutes cache
  }

  async getQueueData(mediaType) {
    const cacheKey = `queue_${mediaType}`;
    const now = Date.now();
    
    // Use cache if still valid
    if (this.cache.has(cacheKey) && (now - this.lastCacheTime) < this.cacheExpiry) {
      return this.cache.get(cacheKey);
    }

    try {
      const data = await AsyncStorage.getItem(`${QUEUE_KEY}_${mediaType}`);
      const parsed = data ? JSON.parse(data) : null;
      
      if (!parsed || !this.isToday(parsed.date)) {
        // Reset for new day or if no data
        const newData = {
          date: this.getTodayDateString(),
          queue: [],
          displayedItems: [],
          lastUpdated: now
        };
        await this.saveQueueData(mediaType, newData);
        this.cache.set(cacheKey, newData);
        this.lastCacheTime = now;
        return newData;
      }

      this.cache.set(cacheKey, parsed);
      this.lastCacheTime = now;
      return parsed;
    } catch (error) {
      console.error('Error getting queue data:', error);
      return {
        date: this.getTodayDateString(),
        queue: [],
        displayedItems: [],
        lastUpdated: now
      };
    }
  }

  async saveQueueData(mediaType, data) {
    try {
      await AsyncStorage.setItem(`${QUEUE_KEY}_${mediaType}`, JSON.stringify(data));
      this.cache.set(`queue_${mediaType}`, data);
      this.lastCacheTime = Date.now();
    } catch (error) {
      console.error('Error saving queue data:', error);
    }
  }

  getTodayDateString() {
    return new Date().toDateString();
  }

  isToday(dateString) {
    return dateString === this.getTodayDateString();
  }

  async addRecommendationsToQueue(mediaType, recommendations, seenList, unseenList) {
    try {
      // Filter out items user has already seen or added to watchlist
      const filteredRecommendations = recommendations.filter(rec => 
        !seenList.some(seen => seen.id === rec.id) &&
        !unseenList.some(unseen => unseen.id === rec.id)
      );

      const queueData = await this.getQueueData(mediaType);
      
      // Combine existing queue with new recommendations, removing duplicates
      const existingIds = new Set([
        ...queueData.queue.map(item => item.id),
        ...queueData.displayedItems.map(item => item.id)
      ]);
      
      const newItems = filteredRecommendations.filter(item => !existingIds.has(item.id));
      const updatedQueue = [...queueData.queue, ...newItems];
      
      // Take first 10 for display, rest go to queue
      const displayedItems = updatedQueue.slice(0, DISPLAY_COUNT);
      const remainingQueue = updatedQueue.slice(DISPLAY_COUNT);
      
      const updatedData = {
        ...queueData,
        queue: remainingQueue,
        displayedItems: displayedItems,
        lastUpdated: Date.now()
      };
      
      await this.saveQueueData(mediaType, updatedData);
      
      console.log(`📚 Queue updated for ${mediaType}: ${displayedItems.length} displayed, ${remainingQueue.length} queued`);
      
      return {
        displayed: displayedItems,
        queueCount: remainingQueue.length,
        totalCount: displayedItems.length + remainingQueue.length
      };
      
    } catch (error) {
      console.error('Error adding recommendations to queue:', error);
      return { displayed: [], queueCount: 0, totalCount: 0 };
    }
  }

  async getDisplayedRecommendations(mediaType) {
    try {
      const queueData = await this.getQueueData(mediaType);
      return {
        displayed: queueData.displayedItems || [],
        queueCount: queueData.queue ? queueData.queue.length : 0,
        totalCount: (queueData.displayedItems?.length || 0) + (queueData.queue?.length || 0)
      };
    } catch (error) {
      console.error('Error getting displayed recommendations:', error);
      return { displayed: [], queueCount: 0, totalCount: 0 };
    }
  }

  async removeItemAndAdvanceQueue(mediaType, itemId) {
    try {
      const queueData = await this.getQueueData(mediaType);
      
      // Remove the item from displayed items
      const updatedDisplayedItems = queueData.displayedItems.filter(item => item.id !== itemId);
      
      // If we have items in queue and space in displayed, move one over
      let updatedQueue = [...queueData.queue];
      if (updatedQueue.length > 0 && updatedDisplayedItems.length < DISPLAY_COUNT) {
        const nextItem = updatedQueue.shift();
        updatedDisplayedItems.push(nextItem);
      }
      
      const updatedData = {
        ...queueData,
        displayedItems: updatedDisplayedItems,
        queue: updatedQueue,
        lastUpdated: Date.now()
      };
      
      await this.saveQueueData(mediaType, updatedData);
      
      console.log(`🔄 Item ${itemId} removed from ${mediaType} queue. ${updatedDisplayedItems.length} displayed, ${updatedQueue.length} queued`);
      
      return {
        displayed: updatedDisplayedItems,
        queueCount: updatedQueue.length,
        totalCount: updatedDisplayedItems.length + updatedQueue.length,
        removedItem: true
      };
      
    } catch (error) {
      console.error('Error removing item and advancing queue:', error);
      return { displayed: [], queueCount: 0, totalCount: 0, removedItem: false };
    }
  }

  async getQueueStats(mediaType) {
    try {
      const queueData = await this.getQueueData(mediaType);
      return {
        displayed: queueData.displayedItems?.length || 0,
        queued: queueData.queue?.length || 0,
        total: (queueData.displayedItems?.length || 0) + (queueData.queue?.length || 0),
        hasQueue: (queueData.queue?.length || 0) > 0
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return { displayed: 0, queued: 0, total: 0, hasQueue: false };
    }
  }

  async clearQueue(mediaType) {
    try {
      const emptyData = {
        date: this.getTodayDateString(),
        queue: [],
        displayedItems: [],
        lastUpdated: Date.now()
      };
      await this.saveQueueData(mediaType, emptyData);
      return true;
    } catch (error) {
      console.error('Error clearing queue:', error);
      return false;
    }
  }

  // Method to manually refresh queue by filtering out seen/unseen items
  async refreshQueue(mediaType, seenList, unseenList) {
    try {
      const queueData = await this.getQueueData(mediaType);
      
      // Filter out items that are now in seen or unseen lists
      const filteredDisplayed = queueData.displayedItems.filter(item =>
        !seenList.some(seen => seen.id === item.id) &&
        !unseenList.some(unseen => unseen.id === item.id)
      );
      
      const filteredQueue = queueData.queue.filter(item =>
        !seenList.some(seen => seen.id === item.id) &&
        !unseenList.some(unseen => unseen.id === item.id)
      );
      
      // Refill displayed items from queue if needed
      let updatedDisplayed = [...filteredDisplayed];
      let updatedQueue = [...filteredQueue];
      
      while (updatedDisplayed.length < DISPLAY_COUNT && updatedQueue.length > 0) {
        updatedDisplayed.push(updatedQueue.shift());
      }
      
      const updatedData = {
        ...queueData,
        displayedItems: updatedDisplayed,
        queue: updatedQueue,
        lastUpdated: Date.now()
      };
      
      await this.saveQueueData(mediaType, updatedData);
      
      return {
        displayed: updatedDisplayed,
        queueCount: updatedQueue.length,
        totalCount: updatedDisplayed.length + updatedQueue.length
      };
      
    } catch (error) {
      console.error('Error refreshing queue:', error);
      return { displayed: [], queueCount: 0, totalCount: 0 };
    }
  }
}

// Export singleton instance
export const recommendationQueueManager = new RecommendationQueueManager();
export default recommendationQueueManager;