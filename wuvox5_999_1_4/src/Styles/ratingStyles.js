import { StyleSheet } from 'react-native';

// Function to get themed rating styles
const getRatingStyles = (mediaType = 'movie', mode = 'light', theme) => {
  const colors = theme[mediaType][mode];

  return StyleSheet.create({
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
      fontFamily: colors.font.body, // Bookman Old Style for movies, Helvetica Neue for TV
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    ratingInput: {
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
    ratingLabel: {
      fontSize: 16,
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
  ratingContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  ratingQuestion: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    width: 100,
    marginRight: 10,
    textAlign: 'center',
  },
});

export { getRatingStyles };
export default ratingStyles;