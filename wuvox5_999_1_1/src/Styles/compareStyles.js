// src/Styles/compareStyles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const POSTER_WIDTH = (width - 60) / 2 - 20; // Account for margins and VS section
const POSTER_HEIGHT = POSTER_WIDTH * 1.5;

// Function to get themed compare styles
const getCompareStyles = (mediaType = 'movie', mode = 'light', theme) => {
  const colors = theme[mediaType][mode];

  return StyleSheet.create({
    compareContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    compareContent: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    compareTitle: {
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 20,
      color: colors.text,
      fontFamily: colors.font.header,
    },
    compareMovies: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 30,
      minHeight: POSTER_HEIGHT + 120, // Increased for consistent overlay height
    },
    posterContainer: {
      flex: 1,
      marginHorizontal: 8,
      borderRadius: colors.border.radius,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      backgroundColor: colors.card,
      borderWidth: colors.border.width,
      borderColor: colors.border.color,
      borderStyle: colors.border.style,
    },
    poster: {
      width: '100%',
      height: POSTER_HEIGHT,
      borderTopLeftRadius: colors.border.radius - colors.border.width,
      borderTopRightRadius: colors.border.radius - colors.border.width,
    },
    posterOverlay: {
      padding: 10, // Reduced padding for more compact layout
      backgroundColor: colors.card,
      borderBottomLeftRadius: colors.border.radius - colors.border.width,
      borderBottomRightRadius: colors.border.radius - colors.border.width,
      height: 120, // Fixed height for consistent layout
      justifyContent: 'space-between', // Distribute content evenly
    },
    movieTitle: {
      fontSize: 14, // Smaller font to fit on one line
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: colors.font.header,
      textAlign: 'center',
      height: 20, // Fixed height for single line
      numberOfLines: 1,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    streamingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 24, // Fixed height for streaming logos
      marginVertical: 2,
    },
    streamingIcon: {
      width: 16, // Slightly smaller for better fit
      height: 16,
      borderRadius: 2,
      marginHorizontal: 1, // Tighter spacing
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    ratingTag: {
      fontSize: 12, // Smaller font to ensure single line
      fontWeight: '600',
      textAlign: 'center',
      color: colors.accent,
      fontFamily: colors.font.body,
      height: 18, // Fixed height for single line
      numberOfLines: 1,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    genreText: {
      fontSize: 10, // Smaller font for genres
      textAlign: 'center',
      color: colors.subText,
      fontFamily: colors.font.body,
      height: 16, // Fixed height for single line
      numberOfLines: 1,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    vsContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: POSTER_HEIGHT,
      marginHorizontal: 8,
    },
    vsText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.accent,
      fontFamily: colors.font.header,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    actionButtons: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    toughButton: {
      backgroundColor: colors.card,
      borderWidth: colors.border.width,
      borderColor: colors.border.color,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: colors.border.radius,
      marginBottom: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    toughButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.subText,
      fontFamily: colors.font.body,
    },
    unseenButton: {
      backgroundColor: colors.primary,
      borderWidth: colors.border.width,
      borderColor: colors.border.color,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: colors.border.radius,
      marginBottom: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    unseenButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      fontFamily: colors.font.body,
    },
    skipButton: {
      backgroundColor: 'transparent',
      borderWidth: colors.border.width,
      borderColor: colors.border.color,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: colors.border.radius,
      alignItems: 'center',
    },
    skipButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.subText,
      fontFamily: colors.font.body,
    },
  });
};

// Keep original static styles for backward compatibility
const compareStyles = StyleSheet.create({
  compareContainer: {
    flex: 1,
  },
  compareContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  compareTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  compareMovies: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 30,
    minHeight: POSTER_HEIGHT + 120,
  },
  posterContainer: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#6C2BD9',
  },
  poster: {
    width: '100%',
    height: POSTER_HEIGHT,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  posterOverlay: {
    padding: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    height: 120,
    justifyContent: 'space-between',
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    height: 20,
  },
  ratingTag: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    height: 18,
  },
  genreText: {
    fontSize: 10,
    textAlign: 'center',
    height: 16,
  },
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: POSTER_HEIGHT,
    marginHorizontal: 8,
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  toughButton: {
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  toughButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  unseenButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  unseenButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export { getCompareStyles };
export default compareStyles;