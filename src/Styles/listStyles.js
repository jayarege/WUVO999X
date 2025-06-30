import { StyleSheet } from 'react-native';

// Function to get themed list styles with right-side ranking
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
      // New: Ensure consistent height for alignment
      minHeight: 150,
    },
    resultPoster: {
      width: 100,
      height: 150,
      // Remove any overlay positioning since ranking badge is moved
    },
    movieDetails: {
      flex: 1,
      padding: 12,
      height: 150,
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      overflow: 'hidden',
      // New: Add spacing from right ranking area
      paddingRight: 8,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.text,
      fontFamily: colors.font.header,
      minHeight: 20,
      maxHeight: 38,
      textAlignVertical: 'top',
      // New: Ensure title doesn't overlap with ranking
      paddingRight: 4,
    },
    resultYear: {
      fontSize: 13,
      marginBottom: 3,
      color: colors.subText,
      fontFamily: colors.font.body,
    },
    resultOverview: {
      fontSize: 13,
      lineHeight: 16,
      color: colors.text,
      fontFamily: colors.font.body,
      numberOfLines: 2,
      ellipsizeMode: 'tail',
    },
    resultRating: {
      fontSize: 13,
      marginTop: 4,
      color: colors.accent,
      fontFamily: colors.font.body,
      fontWeight: '600',
    },
    
    // UPDATED: Right-side ranking container
    rankingContainer: {
      width: 60, // Fixed width for consistency
      height: 150,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primary,
      // Optional: Add subtle gradient or pattern
    },
    
    // UPDATED: Larger, more prominent ranking badge
    rankBadge: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255, 255, 255, 0.15)', // Subtle overlay
      alignItems: 'center',
      justifyContent: 'center',
      // Remove absolute positioning
      borderWidth: 2,
      borderColor: colors.accent,
    },
    
    // UPDATED: Much larger ranking number
    rankNumber: {
      fontWeight: 'bold',
      fontSize: 24, // Increased from 16 for prominence
      color: colors.accent,
      fontFamily: colors.font.header,
      textAlign: 'center',
    },
    
    // Additional optimized styles for content fitting
    scoreContainer: {
      marginTop: 2,
      flexGrow: 1,
      justifyContent: 'center',
    },
    finalScore: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.accent,
    },
    genresText: {
      fontSize: 11,
      color: colors.subText,
      numberOfLines: 1,
      ellipsizeMode: 'tail',
      marginBottom: 4,
    },
    editButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
    },
    editButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.accent,
    },
  });
};

// Updated static styles for backward compatibility
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
    minHeight: 150,
  },
  resultPoster: {
    width: 100,
    height: 150,
  },
  movieDetails: {
    flex: 1,
    padding: 12,
    height: 150,
    justifyContent: 'space-between',
    overflow: 'hidden',
    paddingRight: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    height: 38,
    textAlignVertical: 'top',
    paddingRight: 4,
  },
  
  // Updated ranking styles
  rankingContainer: {
    width: 60,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
  },
  rankBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  rankNumber: {
    fontWeight: 'bold',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  
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