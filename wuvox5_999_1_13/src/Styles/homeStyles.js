import { StyleSheet } from 'react-native';

export const getHomeStyles = (mediaType, mode, theme) => {
  const colors = theme[mediaType][mode];

  return StyleSheet.create({
    // Main Container
    homeContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Section Layouts
    section: {
      marginVertical: 16,
      paddingHorizontal: 16,
    },
    sectionWithBorder: {
      borderWidth: colors.border.width,
      borderColor: colors.border.color,
      borderRadius: colors.border.radius,
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 16,
      backgroundColor: colors.card,
      shadowColor: colors.shadow.color,
      shadowOffset: colors.shadow.offset,
      shadowOpacity: colors.shadow.opacity,
      shadowRadius: colors.shadow.radius,
      elevation: colors.shadow.elevation,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
      color: colors.text,
      fontFamily: colors.font.header,
    },

    // Movie Card Containers - FIXED GAPS
    movieCardBorder: {
      borderWidth: 0,
      borderRadius: 0,
      marginHorizontal: 0,
      marginVertical: 0,
      padding: 0,
      backgroundColor: 'transparent',
    },
    enhancedCard: {
      borderWidth: 1.5,
      borderColor: colors.primaryGradient[1],
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.card,
    },
    movieInfoBox: {
      padding: 6,
      width: '100%',
      backgroundColor: colors.card,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
    },

    // Rating Layouts - NEW
    ratingRow: {
      flexDirection: 'column',
      marginTop: 4,
    },
    ratingLine: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    tmdbRating: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tmdbText: {
      fontSize: 12,
      color: colors.subText,
      fontFamily: colors.font.body,
      marginLeft: 4,
    },
    friendsRating: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    friendsText: {
      fontSize: 12,
      color: '#4CAF50',
      fontFamily: colors.font.body,
      fontWeight: '600',
      marginLeft: 4,
    },

    // Toggle/Content Type
    toggleBorder: {
      borderWidth: colors.border.width,
      borderColor: colors.border.color,
      borderRadius: 27,
      padding: 2,
      marginHorizontal: 16,
      alignSelf: 'center',
      backgroundColor: 'transparent',
      shadowColor: colors.shadow.color,
      shadowOffset: colors.shadow.offset,
      shadowOpacity: colors.shadow.opacity,
      shadowRadius: colors.shadow.radius,
      elevation: colors.shadow.elevation,
    },

    // Text Styles
  genreName: {
  fontSize: 20,
  fontWeight: '600',
  color: colors.text,
  fontFamily: colors.font.body,
  lineHeight: 24,
  marginBottom: 4,
},
    genreScore: {
      fontSize: 16,
      color: colors.accent,
      fontFamily: colors.font.body,
    },
    movieYear: {
      fontSize: 12,
      marginTop: 2,
      color: colors.subText,
      fontFamily: colors.font.body,
    },
    genreTag: {
      fontSize: 11,
      marginTop: 2,
      fontStyle: 'italic',
      color: colors.subText,
      fontFamily: colors.font.body,
    },
    swipeInstructions: {
      textAlign: 'center',
      fontSize: 12,
      fontStyle: 'italic',
      marginTop: 8,
      marginBottom: 16,
      color: colors.subText,
      fontFamily: colors.font.body,
    },

    // Genre Items
    genreItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: colors.border.radius,
      marginVertical: 4,
      backgroundColor: colors.card,
      shadowColor: colors.shadow.color,
      shadowOffset: colors.shadow.offset,
      shadowOpacity: colors.shadow.opacity,
      shadowRadius: colors.shadow.radius,
      elevation: colors.shadow.elevation,
    },

    // Carousel Layouts
    carouselContainer: {
      marginVertical: 12,
      height: 280,
    },
    carouselContent: {
      paddingLeft: 16,
    },
    carouselItem: {
      marginRight: 16,
      borderRadius: colors.border.radius,
      overflow: 'hidden',
      shadowColor: colors.shadow.color,
      shadowOffset: colors.shadow.offset,
      shadowOpacity: colors.shadow.opacity,
      shadowRadius: colors.shadow.radius,
      elevation: colors.shadow.elevation,
    },

    // Interactive Elements
    quickRateButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      position: 'absolute',
      bottom: 8,
      right: 8,
      zIndex: 5,
      shadowColor: colors.shadow.color,
      shadowOffset: colors.shadow.offset,
      shadowOpacity: colors.shadow.opacity,
      shadowRadius: 2,
      elevation: 2,
    },
    rateButtonText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.textOnPrimary || colors.background,
      fontFamily: colors.font.body,
    },

    // Container Layouts
    diagonalContainer: {
      overflow: 'hidden',
      height: 320,
      marginVertical: 10,
    },

    // Utility Classes
    centerContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLayout: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    spaceBetween: {
      justifyContent: 'space-between',
    },
  });
};