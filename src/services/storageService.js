import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageService = {
  async getItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      return false;
    }
  },

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      return false;
    }
  },

  async multiRemove(keys) {
    try {
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error(`Failed to remove multiple items:`, error);
      return false;
    }
  },

  async clear() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  },

  async getAllKeys() {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  }
};