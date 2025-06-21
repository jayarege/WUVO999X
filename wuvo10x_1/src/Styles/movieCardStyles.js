import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const POSTER_WIDTH = width * 0.35;
const POSTER_HEIGHT = POSTER_WIDTH * 1.5;

// Function to get themed movie card styles
const getMovieCardStyles = (mediaType = 'movie', mode = 'light', theme) => {
  const colors = theme[mediaType][mode];

  return StyleSheet.create({
    movieCard: {
      flexDirection: 'row',
      borderRadius: 12,
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      overflow: 'hidden',
      marginBottom: 20,
      maxWidth: width - 32,
    },
    moviePoster: {
      width: POSTER_WIDTH,
      height: POSTER_HEIGHT,
    },
    movieInfo: {
  flex: 1,
  padding: 12,
  paddingLeft: 8,
  backgroundColor: colors.card,
},
    movieTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 6,
      color: colors.text,
      fontFamily: colors.font.header, // Cooper Black for movies, American Typewriter Bold for TV
    },
    releaseDate: {
      fontSize: 14,
      marginBottom: 10,
      color: colors.subText,
      fontFamily: colors.font.body, // Bookman Old Style for movies, Helvetica Neue for TV
    },
    movieOverview: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text,
      fontFamily: colors.font.body,
    },
    genresText: {
      fontSize: 14,
      marginTop: 8,
      color: colors.subText,
      fontFamily: colors.font.body,
    },
  });
};

// Keep original static styles for backward compatibility
const movieCardStyles = StyleSheet.create({
  movieCard: {
    flexDirection: 'row',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    marginBottom: 20,
    maxWidth: width - 32,
  },
  moviePoster: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
  },
  movieInfo: {
    flex: 1,
    padding: 16,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  releaseDate: {
    fontSize: 14,
    marginBottom: 10,
  },
  movieOverview: {
    fontSize: 14,
    lineHeight: 20,
  },
  genresText: {
    fontSize: 14,
    marginTop: 8,
  },
});

export { getMovieCardStyles };
export default movieCardStyles;