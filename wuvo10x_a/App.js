import React, { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import LoadingScreen from './src/Screens/LoadingScreen';
import AuthScreen from './src/Screens/AuthScreen';
import OnboardingScreen from './src/Screens/OnboardingScreen';
import TabNavigator from './src/Navigation/TabNavigator';
import MovieDetailScreen from './src/Screens/MovieDetailScreen';

// Import development configuration
import { isDevModeEnabled, getDevMovies, getDevTVShows, getDevUser } from './src/utils/DevConfig';

const Stack = createStackNavigator();

// Import hooks and config
import { useAuth } from './src/hooks/useAuth';
import { useMovieData } from './src/hooks/useMovieData';
import { useAsyncStorage } from './src/hooks/useAsyncStorage';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [appReady, setAppReady] = useState(false);

  // Custom hooks
  const { 
    isAuthenticated, 
    userInfo, 
    handleAuthentication, 
    handleLogout 
  } = useAuth();
  
  const {
    seen,
    unseen,
    seenTVShows,
    unseenTVShows,
    genres,
    dataLoaded,
    handleUpdateRating,
    handleAddToSeen,
    handleAddToUnseen,
    handleRemoveFromWatchlist,
    saveUserData,
    loadUserData,
    resetAllData,
    setSeen,
    setUnseen,
    setSeenTVShows,
    setUnseenTVShows
  } = useMovieData(isAuthenticated, appReady);
  
  const {
    isDarkMode,
    onboardingComplete,
    checkingOnboarding,
    toggleTheme,
    handleOnboardingComplete,
    resetWildcardState,
    resetAllUserData,
    savePreferences
  } = useAsyncStorage();

  // Combined reset function that uses both hooks
  const resetAllAppData = useCallback(async () => {
    await resetAllUserData();
    resetAllData();
    await handleLogout();
  }, [resetAllUserData, resetAllData, handleLogout]);

  // Initial app setup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (isDevModeEnabled()) {
          console.log('🔧 DEV MODE: Skipping normal initialization');
          setTimeout(() => {
            setIsLoading(false);
            setAppReady(true);
          }, 500);
          return;
        }

        setIsLoading(false);
        setAppReady(true);
      } catch (e) {
        console.error('Initialization error:', e);
        setIsLoading(false);
        setAppReady(true);
      }
    };
    
    initializeApp();
  }, []);

  // Save preferences when they change
  useEffect(() => {
    if (appReady && isAuthenticated && dataLoaded && !isDevModeEnabled()) {
      const timer = setTimeout(() => {
        saveUserData();
        savePreferences();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [seen, unseen, isDarkMode, onboardingComplete, appReady, isAuthenticated, dataLoaded, saveUserData, savePreferences]);

  // Loading screen
  if (isLoading) {
    return <LoadingScreen onFinishLoading={() => setIsLoading(false)} isDarkMode={isDarkMode} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            // Auth flow
            <Stack.Screen name="Auth">
              {props => (
                <AuthScreen
                  {...props}
                  isDarkMode={isDarkMode}
                  onAuthenticate={handleAuthentication}
                />
              )}
            </Stack.Screen>
          ) : checkingOnboarding ? (
            // Checking onboarding
            <Stack.Screen name="CheckingOnboarding">
              {props => (
                <LoadingScreen
                  {...props}
                  onFinishLoading={() => {} }
                  isDarkMode={isDarkMode}
                />
              )}
            </Stack.Screen>
          ) : !onboardingComplete ? (
            // Onboarding flow
            <Stack.Screen name="Onboarding">
              {props => (
                <OnboardingScreen
                  {...props}
                  isDarkMode={isDarkMode}
                  onComplete={handleOnboardingComplete}
                  onAddToSeen={handleAddToSeen}
                />
              )}
            </Stack.Screen>
          ) : (
            // Main & Detail
            <>
              <Stack.Screen name="Main" options={{ headerShown: false }}>
                {props => (
                 <TabNavigator
  seen={seen}
  unseen={unseen}
  seenTVShows={seenTVShows}
  unseenTVShows={unseenTVShows}
  setSeen={setSeen}
  setUnseen={setUnseen}
  setSeenTVShows={setSeenTVShows}
  setUnseenTVShows={setUnseenTVShows}
  genres={genres}
  isDarkMode={isDarkMode}
  toggleTheme={toggleTheme}
  newReleases={
    seen.length > 5
      ? seen.slice(0, 10).map(m => ({ ...m }))
      : unseen.slice(0, 10).map(m => ({ ...m }))
  }
  onAddToSeen={handleAddToSeen}
  onAddToUnseen={handleAddToUnseen}
  onRemoveFromWatchlist={handleRemoveFromWatchlist}
  onUpdateRating={handleUpdateRating}
  resetWildcardState={resetWildcardState}
  resetAllUserData={resetAllAppData}
  saveUserData={saveUserData}
  loadUserData={loadUserData}
/>
                )}
              </Stack.Screen>
              <Stack.Screen
                name="MovieDetail"
                component={MovieDetailScreen}
                options={({ route }) => ({ title: route.params.movieTitle })}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}