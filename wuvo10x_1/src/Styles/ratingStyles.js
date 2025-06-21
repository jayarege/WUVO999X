import { StyleSheet } from 'react-native';

// Function to get themed rating styles
const getRatingStyles = (mediaType = 'movie', mode = 'light', theme) => {
  const colors = theme[mediaType][mode];

  return StyleSheet.create({
    // STANDARD RATING MODAL LAYOUT (TopRated-style)
    modalContentContainer: {
      padding: 20,
    },
    modalMovieInfo: {
      flexDirection: 'row',
      marginBottom: 8,
      alignItems: 'center',
    },
    modalPoster: {
      width: 110,
      height: 165,
      borderRadius: 8,
      marginRight: 12,
    },
    modalMovieDetails: {
      flex: 1,
    },
    modalMovieTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.text,
      fontFamily: colors.font.header,
    },
    modalGenres: {
      fontSize: 16,
      color: colors.subText,
      fontFamily: colors.font.body,
    },
    genreTextContainer: {
      marginVertical: 8,
    },
    ratingDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    ratingLabel: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
      textAlign: 'center',
      color: colors.text,
      fontFamily: colors.font.body,
    },
    ratingInput: {
      height: 56,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 24,
      fontWeight: 'normal',
      textAlign: 'center',
      width: '100%',
      alignSelf: 'center',
      backgroundColor: colors.card,
      borderColor: colors.border?.color || colors.secondary,
      color: colors.text,
      fontFamily: colors.font.body,
    },
    fixedButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.1)',
      backgroundColor: 'transparent',
      marginTop: 'auto',
    },

    // LEGACY COMPACT RATING STYLES (for backwards compatibility)
    ratingContainer: {
      width: '100%',
      alignItems: 'center',
      marginVertical: 20,
      backgroundColor: colors.background,
    },
    ratingQuestion: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 16,
      textAlign: 'center',
      color: colors.text,
      fontFamily: colors.font.body,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    compactRatingInput: {
      borderWidth: 1,
      borderColor: colors.secondary,
      backgroundColor: colors.card,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 18,
      width: 100,
      marginRight: 10,
      textAlign: 'center',
      color: colors.text,
      fontFamily: colors.font.body,
    },
    ratingScale: {
      fontSize: 14,
      color: colors.subText,
      fontFamily: colors.font.body,
      textAlign: 'center',
      marginTop: 8,
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginTop: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      fontFamily: colors.font.body,
      textAlign: 'center',
    },
  });
};

// Keep original static styles for backward compatibility
const ratingStyles = StyleSheet.create({
  modalContentContainer: {
    padding: 20,
  },
  modalMovieInfo: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  modalPoster: {
    width: 110,
    height: 165,
    borderRadius: 8,
    marginRight: 12,
  },
  modalMovieDetails: {
    flex: 1,
  },
  modalMovieTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalGenres: {
    fontSize: 16,
  },
  genreTextContainer: {
    marginVertical: 8,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: 'normal',
    textAlign: 'center',
    width: '100%',
    alignSelf: 'center',
  },
  fixedButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
  },
});

export { getRatingStyles };
export default ratingStyles;