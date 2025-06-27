// Animated lava lamp background using expo-linear-gradient
import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export const LavaLampBackground = ({ mediaType, isDarkMode, theme }) => {
  const colors = theme[mediaType][isDarkMode ? 'dark' : 'light'];
  
  // Animated values for gradient rotation and blob movement
  const rotateValue = useRef(new Animated.Value(0)).current;
  const blob1X = useRef(new Animated.Value(0)).current;
  const blob1Y = useRef(new Animated.Value(0)).current;
  const blob2X = useRef(new Animated.Value(width * 0.6)).current;
  const blob2Y = useRef(new Animated.Value(height * 0.4)).current;

  useEffect(() => {
    // Continuous rotation animation
    const rotationAnimation = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    );

    // Blob floating animations
    const blob1Animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(blob1X, {
            toValue: width * 0.7,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(blob1Y, {
            toValue: height * 0.8,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(blob1X, {
            toValue: width * 0.1,
            duration: 6000,
            useNativeDriver: true,
          }),
          Animated.timing(blob1Y, {
            toValue: height * 0.2,
            duration: 6000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const blob2Animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(blob2X, {
            toValue: width * 0.2,
            duration: 10000,
            useNativeDriver: true,
          }),
          Animated.timing(blob2Y, {
            toValue: height * 0.7,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(blob2X, {
            toValue: width * 0.8,
            duration: 7000,
            useNativeDriver: true,
          }),
          Animated.timing(blob2Y, {
            toValue: height * 0.3,
            duration: 7000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    rotationAnimation.start();
    blob1Animation.start();
    blob2Animation.start();

    return () => {
      rotationAnimation.stop();
      blob1Animation.stop();
      blob2Animation.stop();
    };
  }, [mediaType, isDarkMode]);

  const spin = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0,
      }}
      pointerEvents="none"
    >
      {/* Rotating background gradient */}
      <Animated.View style={{
        position: 'absolute',
        width: width * 1.5,
        height: height * 1.5,
        left: -width * 0.25,
        top: -height * 0.25,
        transform: [{ rotate: spin }],
      }}>
        <LinearGradient
          colors={[...colors.primaryGradient, colors.primaryGradient[0]]}
          style={{ flex: 1, opacity: 0.1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Floating blob 1 */}
      <Animated.View style={{
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        transform: [
          { translateX: blob1X },
          { translateY: blob1Y },
        ],
      }}>
        <LinearGradient
          colors={[colors.primaryGradient[1], 'transparent']}
          style={{ 
            flex: 1, 
            borderRadius: 150,
            opacity: 0.04,
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Floating blob 2 */}
      <Animated.View style={{
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
        transform: [
          { translateX: blob2X },
          { translateY: blob2Y },
        ],
      }}>
        <LinearGradient
          colors={[colors.primaryGradient[2] || colors.primaryGradient[0], 'transparent']}
          style={{ 
            flex: 1, 
            borderRadius: 125,
            opacity: 0.03,
          }}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>
    </View>
  );
};

const theme = {
  movie: {
    light: {
      primary: '#6C2BD9',          // Deep Purple for header
      primaryGradient: ['#612EF0','#6C2BD9', '#321680'], // Light purple to deep purple
      background: '#FFFFFF',
      card: '#F5F5F5',
      text: '#333333',
      subText: '#666666',
      accent: '#FFD700',          // Gold for highlights
      secondary: '#FFA000',       // Orange for ratings
      textOnPrimary: '#FFFFFF',   // White text on primary buttons
      
      // Border settings
      border: {
        width: 2,                 // 2px border width
        color: '#6C2BD9',        // Primary color borders
        radius: 12,              // Border radius
        style: 'solid'           // Border style
      },
      
      // Shadow settings
      shadow: {
        color: '#000000',         // Black shadows
        offset: { width: 0, height: 2 },
        opacity: 0.15,           // Light shadow opacity
        radius: 4,               // Shadow blur radius
        elevation: 3,            // Android elevation
      },
      
      font: {
        header: 'CooperBlack',
        body: 'BookmanOldStyle',
      },
    },
    dark: {
      primary: '#6C2BD9',         // BlueViolet
      primaryGradient: ['#612EF0','#6C2BD9', '#321680'], // Lighter purple to blue violet
      background: '#1C2526',
      card: '#2A3132',
      text: '#F5F5F5',
      subText: '#D3D3D3',
      accent: '#FFD700',
      secondary: '#FFA000',
      textOnPrimary: '#FFFFFF',   // White text on primary buttons
      
      // Border settings
      border: {
        width: 2,                 // 2px border width
        color: '#8A2BE2',        // Brighter purple for dark mode
        radius: 12,              // Border radius
        style: 'solid'           // Border style
      },
      
      // Shadow settings
      shadow: {
        color: '#000000',         // Black shadows
        offset: { width: 0, height: 2 },
        opacity: 0.25,           // Stronger shadow for dark mode
        radius: 4,               // Shadow blur radius
        elevation: 5,            // Higher Android elevation for dark mode
      },
      
      font: {
        header: 'CooperBlack',
        body: 'BookmanOldStyle',
      },
    },
  },
  
  tv: {
    light: {
      primary: '#59ADE8',         // UCLA Blue
      primaryGradient: ['#95C4EF', '#59ADE8'], // Light blue to UCLA blue
      background: '#FFFFFF',
      card: '#F5F5F5',
      text: '#333333',
      subText: '#666666',
      accent: '#FFD700',
      secondary: '#FFA000',
      textOnPrimary: '#FFFFFF',   // White text on primary buttons
      
      // Border settings
      border: {
        width: 2,                 // 2px border width
        color: '#59ADE8',        // Primary blue borders
        radius: 12,              // Border radius
        style: 'solid'           // Border style
      },
      
      // Shadow settings
      shadow: {
        color: '#000000',         // Black shadows
        offset: { width: 0, height: 2 },
        opacity: 0.15,           // Light shadow opacity
        radius: 4,               // Shadow blur radius
        elevation: 3,            // Android elevation
      },
      
      font: {
        header: 'CooperBlack',
        body: 'BookmanOldStyle',
      },
    },
    dark: {
      primary: '#59ADE8',         // Sapphire Blue
      primaryGradient: ['#95C4EF', '#59ADE8'], // Brighter blue to sapphire blue
      background: '#121212',
      card: '#1C1C1C',
      text: '#EEEEEE',
      subText: '#AAAAAA',
      accent: '#FFD700',
      secondary: '#FFA000',
      textOnPrimary: '#FFFFFF',   // White text on primary buttons
      
      // Border settings
      border: {
        width: 2,                 // 2px border width
        color: '#7BC3F0',        // Lighter blue for dark mode
        radius: 12,              // Border radius
        style: 'solid'           // Border style
      },
      
      // Shadow settings
      shadow: {
        color: '#000000',         // Black shadows
        offset: { width: 0, height: 2 },
        opacity: 0.25,           // Stronger shadow for dark mode
        radius: 4,               // Shadow blur radius
        elevation: 5,            // Higher Android elevation for dark mode
      },
      
      font: {
        header: 'CooperBlack',
        body: 'BookmanOldStyle',
      },
    },
  },
};

export default theme;