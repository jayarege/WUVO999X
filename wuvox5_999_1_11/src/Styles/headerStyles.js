// src/Styles/headerStyles.js
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMediaType } from '../Navigation/TabNavigator';

// Function to get themed header styles
const getHeaderStyles = (mediaType = 'movie', mode = 'light', theme) => {
  const colors = theme[mediaType][mode];

  return StyleSheet.create({
    headerContainer: {
      // Remove absolute positioning so content flows naturally below
    },
    headerGradient: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingTop: 0,
    },
    statusBarSpacer: {
      height: 44, // Space for status bar
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 1,
    },
    screenTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      fontFamily: colors.font.header,
    },
    themeToggle: {
      padding: 8,
    },
    mediaToggleContainer: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 20,
      padding: 2,
      minHeight: 36,
    },
    mediaToggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 6,
      minHeight: 32,
    },
    leftToggle: {
      borderTopLeftRadius: 18,
      borderBottomLeftRadius: 18,
    },
    rightToggle: {
      borderTopRightRadius: 18,
      borderBottomRightRadius: 18,
    },
    mediaToggleText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
  });
};

// Themed Header Component that includes SafeAreaView and media toggle
const ThemedHeader = ({ isDarkMode, theme, showMediaToggle = true, children }) => {
  // Get media type and setter from context
  const { mediaType, setMediaType } = useMediaType();
  const colors = theme[mediaType][isDarkMode ? 'dark' : 'light'];
  const headerStyles = getHeaderStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  return (
    <View style={headerStyles.headerContainer}>
      <LinearGradient
        colors={colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={headerStyles.headerGradient}
      >
        <SafeAreaView>
          <View style={headerStyles.headerContent}>
            {children}
            {showMediaToggle && (
              <View style={headerStyles.mediaToggleContainer}>
                <TouchableOpacity 
                  style={[
                    headerStyles.mediaToggleButton, 
                    headerStyles.leftToggle,
                    { backgroundColor: mediaType === 'movie' ? '#FFFFFF' : 'transparent' }
                  ]}
                  onPress={() => setMediaType('movie')}
                >
                  <Ionicons 
                    name="film-outline" 
                    size={10} 
                    color={mediaType === 'movie' ? '#000000' : '#FFFFFF'}
                  />
                  <Text style={[
                    headerStyles.mediaToggleText,
                    { color: mediaType === 'movie' ? '#000000' : '#FFFFFF' }
                  ]}>
                    Movies
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    headerStyles.mediaToggleButton,
                    headerStyles.rightToggle,
                    { backgroundColor: mediaType === 'tv' ? '#FFFFFF' : 'transparent' }
                  ]}
                  onPress={() => setMediaType('tv')}
                >
                  <Ionicons 
                    name="tv-outline" 
                    size={10} 
                    color={mediaType === 'tv' ? '#000000' : '#FFFFFF'}
                  />
                  <Text style={[
                    headerStyles.mediaToggleText,
                    { color: mediaType === 'tv' ? '#000000' : '#FFFFFF' }
                  ]}>
                    TV Shows
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

// Keep original static styles for backward compatibility
const headerStyles = StyleSheet.create({
  screenHeader: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  themeToggle: {
    padding: 8,
  },
});

export { getHeaderStyles, ThemedHeader };
export default headerStyles;