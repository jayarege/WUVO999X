import { StyleSheet } from 'react-native';

// Function to get themed search styles
const getSearchStyles = (mediaType = 'movie', mode = 'light', theme) => {
  const colors = theme[mediaType][mode];

  return StyleSheet.create({
    searchContainer: {
      flexDirection: 'row',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondary,
      backgroundColor: colors.background,
    },
    searchInput: {
      flex: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      marginRight: 10,
      borderWidth: 1,
      borderColor: colors.secondary,
      backgroundColor: colors.card,
      color: colors.text,
      fontFamily: colors.font.body, // Bookman Old Style for movies, Helvetica Neue for TV
    },
    searchButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    searchButtonText: {
      fontWeight: '600',
      fontSize: 16,
      color: colors.text,
      fontFamily: colors.font.body,
    },
    suggestionsContainer: {
      position: 'absolute',
      top: 50,
      left: 0,
      right: 0,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.secondary,
      backgroundColor: colors.card,
      zIndex: 10,
      maxHeight: 180,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondary,
    },
    suggestionText: {
      fontSize: 14,
      color: colors.text,
      fontFamily: colors.font.body,
    },
    noResultsText: {
      fontSize: 16,
      color: colors.subText,
      textAlign: 'center',
      marginTop: 20,
      fontFamily: colors.font.body,
    },
    searchResultsContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
};

// Keep original static styles for backward compatibility
const searchStyles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
  },
  searchButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 10,
    maxHeight: 180,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
  }
});

export { getSearchStyles };
export default searchStyles;