import AsyncStorage from '@react-native-async-storage/async-storage';

import { RATE_LIMIT_KEY } from '../Constants';
const MAX_CALLS_PER_TYPE = 1000;
const TOTAL_MAX_CALLS = 2000;

class APIRateLimitManager {
  constructor() {
    this.cache = null;
    this.lastCacheTime = 0;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
  }

  async getRateLimitData() {
    // Use cache if still valid
    const now = Date.now();
    if (this.cache && (now - this.lastCacheTime) < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const data = await AsyncStorage.getItem(RATE_LIMIT_KEY);
      const parsed = data ? JSON.parse(data) : null;
      
      if (!parsed || !this.isToday(parsed.date)) {
        // Reset for new day
        const newData = {
          date: this.getTodayDateString(),
          movieCalls: 0,
          tvCalls: 0,
          lastResetTime: now
        };
        await this.saveRateLimitData(newData);
        this.cache = newData;
        this.lastCacheTime = now;
        return newData;
      }

      this.cache = parsed;
      this.lastCacheTime = now;
      return parsed;
    } catch (error) {
      console.error('Error getting rate limit data:', error);
      return {
        date: this.getTodayDateString(),
        movieCalls: 0,
        tvCalls: 0,
        lastResetTime: now
      };
    }
  }

  async saveRateLimitData(data) {
    try {
      await AsyncStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
      this.cache = data;
      this.lastCacheTime = Date.now();
    } catch (error) {
      console.error('Error saving rate limit data:', error);
    }
  }

  getTodayDateString() {
    return new Date().toDateString();
  }

  isToday(dateString) {
    return dateString === this.getTodayDateString();
  }

  async canMakeCall(mediaType) {
    const data = await this.getRateLimitData();
    const currentCalls = mediaType === 'movie' ? data.movieCalls : data.tvCalls;
    const totalCalls = data.movieCalls + data.tvCalls;
    
    return currentCalls < MAX_CALLS_PER_TYPE && totalCalls < TOTAL_MAX_CALLS;
  }

  async getRemainingCalls(mediaType) {
    const data = await this.getRateLimitData();
    const currentCalls = mediaType === 'movie' ? data.movieCalls : data.tvCalls;
    const totalCalls = data.movieCalls + data.tvCalls;
    
    const typeLimit = Math.max(0, MAX_CALLS_PER_TYPE - currentCalls);
    const totalLimit = Math.max(0, TOTAL_MAX_CALLS - totalCalls);
    
    return Math.min(typeLimit, totalLimit);
  }

  async getTotalRemainingCalls() {
    const data = await this.getRateLimitData();
    const totalCalls = data.movieCalls + data.tvCalls;
    return Math.max(0, TOTAL_MAX_CALLS - totalCalls);
  }

  async getAllRemainingCalls() {
    const data = await this.getRateLimitData();
    return {
      movie: Math.max(0, MAX_CALLS_PER_TYPE - data.movieCalls),
      tv: Math.max(0, MAX_CALLS_PER_TYPE - data.tvCalls),
      total: Math.max(0, TOTAL_MAX_CALLS - (data.movieCalls + data.tvCalls))
    };
  }

  async incrementCallCount(mediaType) {
    const data = await this.getRateLimitData();
    
    if (mediaType === 'movie') {
      data.movieCalls += 1;
    } else {
      data.tvCalls += 1;
    }
    
    await this.saveRateLimitData(data);
    return data;
  }

  async getTimeUntilReset() {
    const data = await this.getRateLimitData();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const now = new Date();
    const msUntilReset = tomorrow.getTime() - now.getTime();
    
    const hours = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minutes = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, totalMs: msUntilReset };
  }

  // Method to force reset (for testing)
  async forceReset() {
    const newData = {
      date: this.getTodayDateString(),
      movieCalls: 0,
      tvCalls: 0,
      lastResetTime: Date.now()
    };
    await this.saveRateLimitData(newData);
    return newData;
  }
}

// Export singleton instance
export const apiRateLimitManager = new APIRateLimitManager();
export default apiRateLimitManager;