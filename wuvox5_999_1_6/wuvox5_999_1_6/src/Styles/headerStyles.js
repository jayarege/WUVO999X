// src/Styles/headerStyles.js
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Function to get themed header styles
const getHeaderStyles = (mediaType = 'movie', mode = 'light', theme) => {
 const colors = theme[mediaType][mode];

 return StyleSheet.create({
   screenHeader: {
     paddingHorizontal: 16,
     paddingVertical: 12,
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     borderBottomWidth: 0,
   },
   screenTitle: {
     fontSize: 22,
     fontWeight: 'bold',
     color: '#FFFFFF',
     fontFamily: colors.font.header,
   },
   themeToggle: {
     padding: 8,
   },
 });
};

// Themed Header Component
const ThemedHeader = ({ mediaType, isDarkMode, theme, title, onThemeToggle, children }) => {
 const colors = theme[mediaType][isDarkMode ? 'dark' : 'light'];
 const styles = getHeaderStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
 
 return (
   <LinearGradient
  colors={colors.primaryGradient}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.screenHeader}
>
     {children}
   </LinearGradient>
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