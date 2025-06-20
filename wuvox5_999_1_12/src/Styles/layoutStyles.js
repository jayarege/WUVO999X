// src/Styles/layoutStyles.js
import { StyleSheet } from 'react-native';

// Function to get themed layout styles
const getLayoutStyles = (mediaType = 'movie', mode = 'light', theme) => {
 const colors = theme[mediaType][mode];

 return StyleSheet.create({
   safeArea: {
     flex: 1,
     backgroundColor: colors.background,
   },
   container: {
     flex: 1,
     backgroundColor: colors.background,
   },
   gradientContainer: {
     flex: 1,
     padding: 16,
     backgroundColor: colors.background,
   },
   content: {
     flex: 1,
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: colors.background,
   },
 });
};

// Keep original static styles for backward compatibility
const layoutStyles = StyleSheet.create({
 safeArea: { flex: 1 },
 container: { flex: 1 },
 gradientContainer: { flex: 1, padding: 16 },
 content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export { getLayoutStyles };
export default layoutStyles;