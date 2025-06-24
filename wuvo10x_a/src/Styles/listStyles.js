import { StyleSheet } from 'react-native';

// Function to get themed list styles
const getListStyles = (mediaType = 'movie', mode = 'light', theme) => {
  const colors = theme[mediaType][mode];

  return StyleSheet.create({
    rankingsList: {
      flex: 1,
      backgroundColor: colors.background,
    },
    rankingItem: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.card,
      overflow: 'hidden',
      borderWidth: .5,
      borderColor: colors.primaryGradient[1],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    resultPoster: {
      width: 100,
      height: 150,
    },
    movieDetails: {
      flex: 1,
      padding: 12, // Reduced for more content space
      height: 150, // Match poster height exactly
      justifyContent: 'space-between', // Distribute content evenly
      backgroundColor: colors.card,
      overflow: 'hidden', // Prevent content overflow
    },
    resultTitle: {
      fontSize: 16, // Reduced from 18 for better fit
      fontWeight: 'bold',
      marginBottom: 4, // Reduced from 8
      color: colors.text,
      fontFamily: colors.font.header, // Cooper Black for movies, American Typewriter Bold for TV
      height: 38, // Fixed height for up to 2 lines
      textAlignVertical: 'top',
    },
    resultYear: {
      fontSize: 13, // Slightly reduced
      marginBottom: 3, // Reduced margin
      color: colors.subText,
      fontFamily: colors.font.body, // Bookman Old Style for movies, Helvetica Neue for TV
    },
    resultOverview: {
      fontSize: 13, // Slightly reduced
      lineHeight: 16, // Tighter line height
      color: colors.text,
      fontFamily: colors.font.body,
      numberOfLines: 2, // Limit to 2 lines
      ellipsizeMode: 'tail',
    },
    resultRating: {
      fontSize: 13, // Slightly reduced
      marginTop: 4, // Reduced margin
      color: colors.accent,
      fontFamily: colors.font.body,
      fontWeight: '600',
    },
    rankBadge: {
      width: 36, // Slightly larger to fit bigger number
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: 10,
      left: 10,
      zIndex: 1,
    },
    rankNumber: {
      fontWeight: 'bold',
      fontSize: 32, // 2x larger (16 * 2 = 32)
      color: colors.text,
      fontFamily: colors.font.body,
    },
    
    // Additional optimized styles for content fitting
    scoreContainer: {
      marginTop: 2, // Minimal margin
      flexGrow: 1, // Take available space
      justifyContent: 'center',
    },
    finalScore: {
      fontSize: 18, // Reduced from 24
      fontWeight: 'bold',
      marginBottom: 4, // Reduced margin
      color: colors.accent,
    },
    genresText: {
      fontSize: 11, // Smaller for better fit
      color: colors.subText,
      numberOfLines: 1, // Single line only
      ellipsizeMode: 'tail',
      marginBottom: 4,
    },
    editButton: {
      paddingVertical: 6, // Smaller button
      paddingHorizontal: 12,
      borderRadius: 6,
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
    },
    editButtonText: {
      fontSize: 13, // Slightly smaller
      fontWeight: '600',
      color: colors.accent,
    },
  });
};

// Keep original static styles for backward compatibility
const listStyles = StyleSheet.create({
  rankingsList: {
    flex: 1,
  },
  rankingItem: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: .5,
    borderColor: '#6C2BD9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultPoster: {
    width: 100,
    height: 150,
  },
  movieDetails: {
    flex: 1,
    padding: 12, // Reduced for more content space
    height: 150, // Match poster height exactly
    justifyContent: 'space-between', // Distribute content evenly
    overflow: 'hidden', // Prevent content overflow
  },
  resultTitle: {
    fontSize: 16, // Reduced from 18
    fontWeight: 'bold',
    marginBottom: 4, // Reduced from 8
    height: 38, // Fixed height for up to 2 lines
    textAlignVertical: 'top',
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  rankNumber: {
    fontWeight: 'bold',
    fontSize: 32, // 2x larger (16 * 2 = 32)
  },
  
  // Additional static styles for content fitting
  scoreContainer: {
    marginTop: 2,
    flexGrow: 1,
    justifyContent: 'center',
  },
  finalScore: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  genresText: {
    fontSize: 11,
    numberOfLines: 1,
    ellipsizeMode: 'tail',
    marginBottom: 4,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export { getListStyles };
export default listStyles;