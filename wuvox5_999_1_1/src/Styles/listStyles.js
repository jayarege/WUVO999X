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
      padding: 16,
      justifyContent: 'center',
      backgroundColor: colors.card,
    },
    resultTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: colors.text,
      fontFamily: colors.font.header, // Cooper Black for movies, American Typewriter Bold for TV
    },
    resultYear: {
      fontSize: 14,
      marginBottom: 4,
      color: colors.subText,
      fontFamily: colors.font.body, // Bookman Old Style for movies, Helvetica Neue for TV
    },
    resultOverview: {
      fontSize: 14,
      lineHeight: 18,
      color: colors.text,
      fontFamily: colors.font.body,
    },
    resultRating: {
      fontSize: 14,
      marginTop: 8,
      color: colors.accent,
      fontFamily: colors.font.body,
      fontWeight: '600',
    },
    rankBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
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
      fontSize: 16,
      color: colors.text,
      fontFamily: colors.font.body,
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
    padding: 16,
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
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
    fontSize: 16,
  },
});

export { getListStyles };
export default listStyles;