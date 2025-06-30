// Theme Hook - Production Grade Implementation
// Tank's Bulletproof Theme Management

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  THEME_MODES, 
  getTheme, 
  getMediaTypeTheme, 
  createThemedStyles,
  HIGH_CONTRAST_THEME 
} from '../config/theme';

const THEME_STORAGE_KEY = 'wuvo_theme_preference';
const HIGH_CONTRAST_STORAGE_KEY = 'wuvo_high_contrast';

export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(THEME_MODES.DARK);
  const [highContrast, setHighContrast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme from storage
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const [savedTheme, savedHighContrast] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(HIGH_CONTRAST_STORAGE_KEY)
        ]);

        if (savedTheme && Object.values(THEME_MODES).includes(savedTheme)) {
          setThemeMode(savedTheme);
        }

        if (savedHighContrast === 'true') {
          setHighContrast(true);
        }
      } catch (error) {
        console.error('Failed to load theme preferences:', error);
        // Fallback to dark theme on error
        setThemeMode(THEME_MODES.DARK);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTheme();
  }, []);

  // Listen to system theme changes for auto mode
  useEffect(() => {
    if (themeMode === THEME_MODES.AUTO) {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        console.log('System theme changed to:', colorScheme);
      });

      return () => subscription?.remove();
    }
  }, [themeMode]);

  // Determine active theme
  const activeTheme = useMemo(() => {
    let resolvedMode = themeMode;
    
    if (themeMode === THEME_MODES.AUTO) {
      resolvedMode = systemColorScheme === 'light' ? THEME_MODES.LIGHT : THEME_MODES.DARK;
    }

    const baseTheme = getTheme(resolvedMode);
    
    // Apply high contrast modifications if enabled
    return highContrast ? HIGH_CONTRAST_THEME : baseTheme;
  }, [themeMode, systemColorScheme, highContrast]);

  // Change theme mode
  const changeTheme = useCallback(async (newMode) => {
    if (!Object.values(THEME_MODES).includes(newMode)) {
      console.error('Invalid theme mode:', newMode);
      return;
    }

    try {
      setThemeMode(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
      console.log('Theme changed to:', newMode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      // Revert on error
      setThemeMode(themeMode);
    }
  }, [themeMode]);

  // Toggle high contrast
  const toggleHighContrast = useCallback(async () => {
    const newHighContrast = !highContrast;
    
    try {
      setHighContrast(newHighContrast);
      await AsyncStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, newHighContrast.toString());
      console.log('High contrast toggled:', newHighContrast);
    } catch (error) {
      console.error('Failed to save high contrast preference:', error);
      // Revert on error
      setHighContrast(highContrast);
    }
  }, [highContrast]);

  // Get themed styles
  const getThemedStyles = useCallback((styleGenerator) => {
    return createThemedStyles(styleGenerator, activeTheme);
  }, [activeTheme]);

  // Get media-specific theme
  const getMediaTheme = useCallback((mediaType) => {
    return getMediaTypeTheme(mediaType, activeTheme);
  }, [activeTheme]);

  // Theme utilities
  const isDark = useMemo(() => {
    const resolvedMode = themeMode === THEME_MODES.AUTO ? systemColorScheme : themeMode;
    return resolvedMode === THEME_MODES.DARK;
  }, [themeMode, systemColorScheme]);

  const isLight = useMemo(() => !isDark, [isDark]);

  // Accessibility helpers
  const getContrastColor = useCallback((backgroundColor) => {
    // Simple contrast calculation - in production, use a proper contrast library
    return isDark ? activeTheme.TEXT.PRIMARY : activeTheme.TEXT.INVERSE;
  }, [isDark, activeTheme]);

  return {
    // Theme state
    theme: activeTheme,
    themeMode,
    highContrast,
    isDark,
    isLight,
    isLoading,
    
    // Theme actions
    changeTheme,
    toggleHighContrast,
    
    // Utilities
    getThemedStyles,
    getMediaTheme,
    getContrastColor,
    
    // Theme constants for easy access
    colors: activeTheme,
    spacing: activeTheme.SPACING,
    typography: activeTheme.TYPOGRAPHY
  };
};

// Theme context hook (for React Context if needed later)
export const withTheme = (Component) => {
  return (props) => {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

export default useTheme;