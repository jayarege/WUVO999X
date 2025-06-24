
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Function to get themed movie card styles
const getMovieCardStyles = (mediaType = 'movie', mode = 'light', theme) => {
  const colors = theme[mediaType][mode];

  return StyleSheet.create({
    // Standard movie card layout
    movieCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      marginVertical: 8,
      marginHorizontal: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 0.5,
      borderColor: colors.border?.color || colors.primary,
    },
    
    movieInfo: {
      padding: 16,
      backgroundColor: colors.card,
    },
    
    movieTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 6,
      color: colors.text,
      fontFamily: colors.font.header,
    },
    
    releaseDate: {
      fontSize: 14,
      marginBottom: 4,
      color: colors.subText,
      fontFamily: colors.font.body,
    },
    
    movieOverview: {
      fontSize: 14,
      lineHeight: 18,
      marginBottom: 8,
      color: colors.text,
      fontFamily: colors.font.body,
    },
    
    // Enhanced genres text for constrained layouts
    genresText: {
      fontSize: 11, // Reduced for better fit in constrained spaces
      color: colors.subText,
      fontFamily: colors.font.body,
      marginBottom: 4,
      numberOfLines: 1, // Single line only in constrained layouts
      ellipsizeMode: 'tail',
    },
    
    // Rating and score styles
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 4,
    },
    
    scoreText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.accent,
      fontFamily: colors.font.body,
    },
    
    // Button styles optimized for constrained layouts
    actionButton: {
      paddingVertical: 6, // Reduced padding
      paddingHorizontal: 12,
      borderRadius: 6,
      marginRight: 8,
      marginTop: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    actionButtonText: {
      fontSize: 13, // Slightly smaller
      fontWeight: '600',
      fontFamily: colors.font.body,
    },
    
    primaryButton: {
      backgroundColor: colors.primary,
    },
    
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    
    // Poster image styles
    posterImage: {
      borderTopLeftRadius: 11,
      borderTopRightRadius: 11,
    },
    
    // Card content container
    cardContent: {
      flexDirection: 'row',
    },
    
    // Metadata styles for constrained layouts
    metadataContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginVertical: 2,
    },
    
    metadataText: {
      fontSize: 12,
      color: colors.subText,
      fontFamily: colors.font.body,
      marginRight: 8,
    },
    
    // Star rating component
    starRating: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 2,
    },
    
    starRatingText: {
      fontSize: 12,
      color: colors.accent,
      fontFamily: colors.font.body,
      marginLeft: 4,
    },
    
    // Badge styles for rankings, AI recommendations, etc.
    badge: {
      position: 'absolute',
      top: 8,
      left: 8,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 12,
      zIndex: 1,
    },
    
    badgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    
    // List item specific styles (for TopRated, Watchlist, etc.)
    listItemContainer: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 12,
      marginHorizontal: 16,
      marginVertical: 8,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 0.5,
      borderColor: colors.primaryGradient?.[1] || colors.primary,
    },
    
    listItemPoster: {
      width: 100,
      height: 150,
    },
    
    listItemContent: {
      flex: 1,
      padding: 12, // Optimized padding
      height: 150, // Match poster height
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      overflow: 'hidden',
    },
    
    listItemTitle: {
      fontSize: 16, // Optimized for constrained height
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.text,
      fontFamily: colors.font.header,
      height: 38, // Fixed height for up to 2 lines
      textAlignVertical: 'top',
    },
    
    listItemScore: {
      fontSize: 18, // Balanced size
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.accent,
    },
    
    listItemGenres: {
      fontSize: 11,
      color: colors.subText,
      numberOfLines: 1,
      ellipsizeMode: 'tail',
      marginBottom: 4,
    },
    
    listItemButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
    },
    
    listItemButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.accent,
    },
  });
};

// Keep original static styles for backward compatibility
const movieCardStyles = StyleSheet.create({
  movieCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  movieInfo: {
    padding: 16,
  },
  
  movieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#FFFFFF',
  },
  
  releaseDate: {
    fontSize: 14,
    marginBottom: 4,
    color: '#CCCCCC',
  },
  
  movieOverview: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
    color: '#FFFFFF',
  },
  
  genresText: {
    fontSize: 11, // Optimized for constrained layouts
    color: '#CCCCCC',
    marginBottom: 4,
  },
  
  // Optimized button styles
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    marginTop: 4,
  },
  
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export { getMovieCardStyles };
export default movieCardStyles;