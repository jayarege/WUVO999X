// WUVO Theme System - Production Grade
// Tank's Bulletproof Theme Implementation

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

export const BRAND_COLORS = {
  PRIMARY: '#FFD700',      // Gold - Main brand color
  SECONDARY: '#4B0082',    // Purple - Secondary brand
  ACCENT: '#1E3A8A',       // Blue - Accent color
  SUCCESS: '#10B981',      // Green - Success states
  WARNING: '#F59E0B',      // Amber - Warning states
  ERROR: '#EF4444',        // Red - Error states
  INFO: '#3B82F6',         // Blue - Info states
};

export const SEMANTIC_COLORS = {
  MOVIE: {
    PRIMARY: '#4B0082',
    SECONDARY: '#8A2BE2',
    BACKGROUND: 'rgba(75, 0, 130, 0.1)',
    GRADIENT: ['#4B0082', '#6A0DAD']
  },
  TV: {
    PRIMARY: '#1E3A8A',
    SECONDARY: '#3B82F6', 
    BACKGROUND: 'rgba(30, 58, 138, 0.1)',
    GRADIENT: ['#1E3A8A', '#2563EB']
  }
};

export const LIGHT_THEME = {
  // Background colors
  BACKGROUND: {
    PRIMARY: '#FFFFFF',
    SECONDARY: '#F8F9FA',
    TERTIARY: '#E9ECEF',
    OVERLAY: 'rgba(0, 0, 0, 0.5)',
    MODAL: '#FFFFFF'
  },
  
  // Text colors
  TEXT: {
    PRIMARY: '#1C2526',
    SECONDARY: '#495057',
    TERTIARY: '#6C757D',
    INVERSE: '#FFFFFF',
    DISABLED: '#ADB5BD'
  },
  
  // Interactive elements
  INTERACTIVE: {
    PRIMARY: BRAND_COLORS.PRIMARY,
    SECONDARY: '#E9ECEF',
    HOVER: '#FFC107',
    PRESSED: '#FFB300',
    DISABLED: '#DEE2E6'
  },
  
  // Border colors
  BORDER: {
    PRIMARY: '#DEE2E6',
    SECONDARY: '#E9ECEF',
    FOCUS: BRAND_COLORS.PRIMARY,
    ERROR: BRAND_COLORS.ERROR
  },
  
  // Status colors
  STATUS: {
    SUCCESS: BRAND_COLORS.SUCCESS,
    WARNING: BRAND_COLORS.WARNING,
    ERROR: BRAND_COLORS.ERROR,
    INFO: BRAND_COLORS.INFO
  }
};

export const DARK_THEME = {
  // Background colors
  BACKGROUND: {
    PRIMARY: '#1C2526',
    SECONDARY: '#2D3748',
    TERTIARY: '#4A5568',
    OVERLAY: 'rgba(0, 0, 0, 0.7)',
    MODAL: '#2D3748'
  },
  
  // Text colors
  TEXT: {
    PRIMARY: '#F5F5F5',
    SECONDARY: '#D3D3D3',
    TERTIARY: '#A0AEC0',
    INVERSE: '#1C2526',
    DISABLED: '#718096'
  },
  
  // Interactive elements
  INTERACTIVE: {
    PRIMARY: BRAND_COLORS.PRIMARY,
    SECONDARY: '#4A5568',
    HOVER: '#FFC107',
    PRESSED: '#FFB300',
    DISABLED: '#2D3748'
  },
  
  // Border colors
  BORDER: {
    PRIMARY: '#4A5568',
    SECONDARY: '#2D3748',
    FOCUS: BRAND_COLORS.PRIMARY,
    ERROR: BRAND_COLORS.ERROR
  },
  
  // Status colors
  STATUS: {
    SUCCESS: BRAND_COLORS.SUCCESS,
    WARNING: BRAND_COLORS.WARNING,
    ERROR: BRAND_COLORS.ERROR,
    INFO: BRAND_COLORS.INFO
  }
};

// Typography scale
export const TYPOGRAPHY = {
  FONTS: {
    PRIMARY: 'System',
    SECONDARY: 'System'
  },
  
  SIZES: {
    XS: 12,
    SM: 14,
    BASE: 16,
    LG: 18,
    XL: 20,
    '2XL': 24,
    '3XL': 28,
    '4XL': 32,
    '5XL': 36
  },
  
  WEIGHTS: {
    LIGHT: '300',
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
    EXTRABOLD: '800'
  },
  
  LINE_HEIGHTS: {
    TIGHT: 1.2,
    NORMAL: 1.5,
    RELAXED: 1.75
  }
};

// Spacing scale
export const SPACING = {
  XS: 4,
  SM: 8,
  BASE: 16,
  LG: 24,
  XL: 32,
  '2XL': 48,
  '3XL': 64,
  '4XL': 96
};

// Border radius scale
export const RADIUS = {
  NONE: 0,
  SM: 4,
  BASE: 8,
  LG: 12,
  XL: 16,
  '2XL': 24,
  FULL: 9999
};

// Shadow definitions
export const SHADOWS = {
  SM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  BASE: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4
  },
  LG: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8
  },
  XL: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16
  }
};

// Animation durations
export const ANIMATIONS = {
  FAST: 150,
  BASE: 250,
  SLOW: 350,
  SLOWER: 500
};

// Accessibility helpers
export const ACCESSIBILITY = {
  MIN_TOUCH_TARGET: 44,
  CONTRAST_RATIOS: {
    AA_NORMAL: 4.5,
    AA_LARGE: 3,
    AAA_NORMAL: 7,
    AAA_LARGE: 4.5
  }
};

// Theme utility functions
export const getTheme = (mode = THEME_MODES.DARK) => {
  return mode === THEME_MODES.LIGHT ? LIGHT_THEME : DARK_THEME;
};

export const getMediaTypeTheme = (mediaType, baseTheme) => {
  const mediaColors = SEMANTIC_COLORS[mediaType?.toUpperCase()] || SEMANTIC_COLORS.MOVIE;
  
  return {
    ...baseTheme,
    MEDIA: mediaColors
  };
};

export const createThemedStyles = (styleGenerator, theme) => {
  return styleGenerator(theme, TYPOGRAPHY, SPACING, RADIUS, SHADOWS);
};

// High contrast mode support
export const HIGH_CONTRAST_THEME = {
  ...DARK_THEME,
  BACKGROUND: {
    ...DARK_THEME.BACKGROUND,
    PRIMARY: '#000000',
    SECONDARY: '#1A1A1A'
  },
  TEXT: {
    ...DARK_THEME.TEXT,
    PRIMARY: '#FFFFFF',
    SECONDARY: '#FFFFFF'
  },
  BORDER: {
    ...DARK_THEME.BORDER,
    PRIMARY: '#FFFFFF',
    SECONDARY: '#CCCCCC'
  }
};

export default {
  THEME_MODES,
  BRAND_COLORS,
  SEMANTIC_COLORS,
  LIGHT_THEME,
  DARK_THEME,
  HIGH_CONTRAST_THEME,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  ANIMATIONS,
  ACCESSIBILITY,
  getTheme,
  getMediaTypeTheme,
  createThemedStyles
};