// src/Styles/buttonStyles.js
import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Function to get themed button styles
const getButtonStyles = (mediaType = 'movie', mode = 'light', theme) => {
 const colors = theme[mediaType][mode];

 return StyleSheet.create({
   rateButton: {
     paddingVertical: 12,
     paddingHorizontal: 24,
     borderRadius: 8,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   rateButtonText: {
     fontSize: 16,
     fontWeight: '600',
     color: colors.accent,
     fontFamily: colors.font.body,
     textAlign: 'center',
   },
   skipButton: {
     backgroundColor: 'transparent',
     borderWidth: 1,
     borderColor: colors.secondary,
     paddingVertical: 12,
     paddingHorizontal: 24,
     borderRadius: 8,
   },
   skipButtonText: {
     fontSize: 16,
     color: colors.text,
     fontFamily: colors.font.body,
     textAlign: 'center',
   },
   primaryButton: {
     paddingVertical: 12,
     paddingHorizontal: 24,
     borderRadius: 8,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   secondaryButton: {
     backgroundColor: colors.secondary,
     paddingVertical: 12,
     paddingHorizontal: 24,
     borderRadius: 8,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   outlineButton: {
     backgroundColor: 'transparent',
     borderWidth: 2,
     borderColor: colors.primary,
     paddingVertical: 12,
     paddingHorizontal: 24,
     borderRadius: 8,
   },
   primaryButtonText: {
     fontSize: 16,
     fontWeight: '600',
     color: colors.accent,
     fontFamily: colors.font.body,
     textAlign: 'center',
   },
   secondaryButtonText: {
     fontSize: 16,
     fontWeight: '600',
     color: colors.accent,
     fontFamily: colors.font.body,
     textAlign: 'center',
   },
   outlineButtonText: {
     fontSize: 16,
     fontWeight: '600',
     color: colors.primary,
     fontFamily: colors.font.body,
     textAlign: 'center',
   },
 });
};

// Themed Button Component
const ThemedButton = ({ mediaType, isDarkMode, theme, onPress, children, style, textStyle }) => {
 const colors = theme[mediaType][isDarkMode ? 'dark' : 'light'];
 const styles = getButtonStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
 
 return (
   <TouchableOpacity onPress={onPress}>
     <LinearGradient
       colors={colors.primaryGradient}
       start={{ x: 0, y: 0 }}
       end={{ x: 1, y: 1 }}
       style={[styles.primaryButton, style]}
     >
       {typeof children === 'string' ? (
         <Text style={[styles.primaryButtonText, textStyle]}>{children}</Text>
       ) : (
         children
       )}
     </LinearGradient>
   </TouchableOpacity>
 );
};

// Keep original static styles for backward compatibility
const buttonStyles = StyleSheet.create({
 rateButton: {
   paddingVertical: 12,
   paddingHorizontal: 24,
   borderRadius: 8,
 },
 rateButtonText: {
   fontSize: 16,
   fontWeight: '600',
 },
 skipButton: {
   backgroundColor: 'transparent',
   borderWidth: 1,
   paddingVertical: 12,
   paddingHorizontal: 24,
   borderRadius: 8,
 },
 skipButtonText: {
   fontSize: 16,
 },
});

export { getButtonStyles, ThemedButton };
export default buttonStyles;