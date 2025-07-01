import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { STORAGE_KEYS } from '../config';
import { isDevModeEnabled } from '../utils/DevConfig';

export const useAsyncStorage = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  const loadPreferences = useCallback(async () => {
    if (isDevModeEnabled()) {
      setOnboardingComplete(true);
      setCheckingOnboarding(false);
      return;
    }

    try {
      const [savedPrefs, savedOnboarding] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER.PREFERENCES),
        AsyncStorage.getItem(STORAGE_KEYS.USER.ONBOARDING_COMPLETE)
      ]);

      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        setIsDarkMode(prefs.isDarkMode);
      }
      if (savedOnboarding === 'true') {
        setOnboardingComplete(true);
      }
    } catch (e) {
      console.error('Failed to load preferences:', e);
    } finally {
      setCheckingOnboarding(false);
    }
  }, []);

  const savePreferences = useCallback(async () => {
    if (isDevModeEnabled()) return;
    
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER.PREFERENCES, JSON.stringify({ isDarkMode })),
        AsyncStorage.setItem(STORAGE_KEYS.USER.ONBOARDING_COMPLETE, onboardingComplete.toString())
      ]);
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }
  }, [isDarkMode, onboardingComplete]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode(mode => !mode);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setOnboardingComplete(true);
  }, []);

  const resetWildcardState = useCallback(async () => {
    try {
      const keysToRemove = [
        STORAGE_KEYS.WILDCARD.COMPARED_MOVIES,
        STORAGE_KEYS.WILDCARD.BASELINE_COMPLETE,
        STORAGE_KEYS.WILDCARD.COMPARISON_COUNT,
        STORAGE_KEYS.WILDCARD.COMPARISON_PATTERN,
        STORAGE_KEYS.WILDCARD.SKIPPED_MOVIES
      ];
      await AsyncStorage.multiRemove(keysToRemove);
      Alert.alert('Reset Complete', 'Comparison data has been reset successfully.');
    } catch (e) {
      Alert.alert('Reset Failed', 'There was a problem resetting comparison data.');
    }
  }, []);

  const resetAllUserData = useCallback(async () => {
    try {
      await resetWildcardState();
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER.PREFERENCES,
        STORAGE_KEYS.USER.ONBOARDING_COMPLETE
      ]);
      setOnboardingComplete(false);
      Alert.alert('Reset Complete', 'All user data has been reset successfully.');
    } catch (e) {
      Alert.alert('Reset Failed', 'There was a problem resetting user data.');
    }
  }, [resetWildcardState]);

  const clearStorage = useCallback(async () => {
    if (!isDevModeEnabled()) {
      await AsyncStorage.clear();
    }
  }, []);

  // Initialize preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    isDarkMode,
    onboardingComplete,
    checkingOnboarding,
    loadPreferences,
    savePreferences,
    toggleTheme,
    handleOnboardingComplete,
    resetWildcardState,
    resetAllUserData,
    clearStorage
  };
};