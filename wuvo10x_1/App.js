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

// Import constants
import { 
  USER_SESSION_KEY, 
  USER_DATA_KEY, 
  USER_SEEN_MOVIES_KEY, 
  USER_UNSEEN_MOVIES_KEY, 
  USER_PREFERENCES_KEY, 
  ONBOARDING_COMPLETE_KEY,
  INITIAL_GENRES
} from './src/Constants';

export default function App() {
  // App states
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Movie data - CENTRAL LOCATION A
const [seen, setSeen] = useState([]);
const [unseen, setUnseen] = useState([]);
const [seenTVShows, setSeenTVShows] = useState([]);
const [unseenTVShows, setUnseenTVShows] = useState([]);
const [genres, setGenres] = useState(INITIAL_GENRES);

  // Reset wildcard comparison state
  const resetWildcardState = useCallback(async () => {
    try {
      const keysToRemove = [
        'wuvo_compared_movies',
        'wuvo_baseline_complete',
        'wuvo_comparison_count',
        'wuvo_comparison_pattern',
        'wuvo_skipped_movies'
      ];
      await AsyncStorage.multiRemove(keysToRemove);
      Alert.alert('Reset Complete', 'Comparison data has been reset successfully.');
    } catch (e) {
      Alert.alert('Reset Failed', 'There was a problem resetting comparison data.');
    }
  }, []);

  // Reset all user data
  const resetAllUserData = useCallback(async () => {
    try {
      await resetWildcardState();
      await AsyncStorage.multiRemove([
        USER_SESSION_KEY,
        USER_SEEN_MOVIES_KEY,
        USER_UNSEEN_MOVIES_KEY,
        USER_PREFERENCES_KEY,
        ONBOARDING_COMPLETE_KEY
      ]);
      setSeen([]);
      setUnseen([]);
      setOnboardingComplete(false);
      Alert.alert('Reset Complete', 'All user data has been reset successfully.');
    } catch (e) {
      Alert.alert('Reset Failed', 'There was a problem resetting user data.');
    }
  }, [resetWildcardState]);

 const saveUserData = useCallback(async () => {
  // Don't save in dev mode to avoid conflicts
  if (isDevModeEnabled()) return;
  
  try {
    await AsyncStorage.setItem(USER_SEEN_MOVIES_KEY, JSON.stringify(seen));
    await AsyncStorage.setItem(USER_UNSEEN_MOVIES_KEY, JSON.stringify(unseen));
    await AsyncStorage.setItem('wuvo_user_seen_tv_shows', JSON.stringify(seenTVShows));
    await AsyncStorage.setItem('wuvo_user_unseen_tv_shows', JSON.stringify(unseenTVShows));
    await AsyncStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify({ isDarkMode }));
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, onboardingComplete.toString());
  } catch (e) {
    console.error('Failed to save user data:', e);
  }
}, [seen, unseen, seenTVShows, unseenTVShows, isDarkMode, onboardingComplete]);

  // Load user data from storage (filter out adult content)
  const loadUserData = useCallback(async () => {
  try {
    // DEV MODE: Use pre-configured movies and TV shows
    if (isDevModeEnabled()) {
      console.log('🔧 DEV MODE: Loading pre-configured content');
      const devMovies = getDevMovies();
      const devTVShows = getDevTVShows();
      setSeen(devMovies);
      setSeenTVShows(devTVShows);
      setUnseen([]); // Start with empty watchlist in dev mode
      setUnseenTVShows([]);
      setDataLoaded(true);
      console.log('🔧 DEV MODE: Loaded movies:', devMovies.map(m => m.title));
      console.log('🔧 DEV MODE: Loaded TV shows:', devTVShows.map(m => m.title));
      return;
    }
// NORMAL MODE: Load from storage
const savedSeen = await AsyncStorage.getItem(USER_SEEN_MOVIES_KEY);
const savedUnseen = await AsyncStorage.getItem(USER_UNSEEN_MOVIES_KEY);
const savedSeenTV = await AsyncStorage.getItem('wuvo_user_seen_tv_shows');
const savedUnseenTV = await AsyncStorage.getItem('wuvo_user_unseen_tv_shows');
const savedPrefs = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
const savedOnboarding = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);

if (savedSeen) {
  const seenMovies = JSON.parse(savedSeen);
  const filteredSeen = seenMovies.filter(movie => movie.adult !== true);
  setSeen(filteredSeen);
}

if (savedUnseen) {
  const unseenMovies = JSON.parse(savedUnseen);
  const filteredUnseen = unseenMovies.filter(movie => movie.adult !== true);
  setUnseen(filteredUnseen);
}

if (savedSeenTV) {
  const seenTVShows = JSON.parse(savedSeenTV);
  const filteredSeenTV = seenTVShows.filter(show => show.adult !== true);
  setSeenTVShows(filteredSeenTV);
}

if (savedUnseenTV) {
  const unseenTVShows = JSON.parse(savedUnseenTV);
  const filteredUnseenTV = unseenTVShows.filter(show => show.adult !== true);
  setUnseenTVShows(filteredUnseenTV);
}
      
      if (savedPrefs) setIsDarkMode(JSON.parse(savedPrefs).isDarkMode);
      if (savedOnboarding === 'true') setOnboardingComplete(true);
    } catch (e) {
      console.error('Failed to load user data:', e);
    } finally {
      setDataLoaded(true);
    }
  }, []);

  // Handle authentication
  const handleAuthentication = useCallback(async (userData) => {
    // Store session
    const session = {
      id: userData.id || 'user_' + Date.now(),
      name: userData.name || 'User',
      email: userData.email || '',
      timestamp: new Date().toISOString()
    };
    
    if (!isDevModeEnabled()) {
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
    }
    
    setUserInfo(session);
    setIsAuthenticated(true);
    setCheckingOnboarding(false);
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    if (!isDevModeEnabled()) {
      await saveUserData();
      await AsyncStorage.removeItem(USER_SESSION_KEY);
    }
    
    setUserInfo(null);
    setIsAuthenticated(false);
    setSeen([]);
    setUnseen([]);
    setDataLoaded(false);
    setCheckingOnboarding(true);
  }, [saveUserData]);

  // Onboarding complete
  const handleOnboardingComplete = useCallback(() => {
    setOnboardingComplete(true);
  }, []);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setIsDarkMode(m => !m);
  }, []);

  // CENTRAL LOCATION A - Update content rating by ID
const handleUpdateRating = useCallback((itemId, newRating) => {
  console.log(`🏪 CENTRAL STORE: Updating item ${itemId} to rating ${newRating}`);
  
  // Check if it's in movies
  const movieExists = seen.some(movie => movie.id === itemId);
  if (movieExists) {
    setSeen(prev => 
      prev.map(movie => 
        movie.id === itemId 
          ? { ...movie, userRating: newRating, eloRating: newRating * 10 }
          : movie
      )
    );
    return;
  }
  
  // Check if it's in TV shows
  const tvExists = seenTVShows.some(show => show.id === itemId);
  if (tvExists) {
    setSeenTVShows(prev => 
      prev.map(show => 
        show.id === itemId 
          ? { ...show, userRating: newRating, eloRating: newRating * 10 }
          : show
      )
    );
  }
}, [seen, seenTVShows]);

  // CENTRAL LOCATION A - Add new content to seen list (block adult content)
const handleAddToSeen = useCallback((item) => {
  if (item.adult === true) {
    console.log(`🚫 REJECTED: ${item.title || item.name} - Adult content`);
    Alert.alert('Content Filtered', 'Adult content is not allowed.');
    return;
  }
  
  const title = item.title || item.name;
  const isMovie = item.title && !item.name && !item.first_air_date;
  
  if (isMovie) {
    console.log(`🏪 CENTRAL STORE: Adding/updating movie ${title}`);
    setSeen(prev => [...prev.filter(m => m.id !== item.id), item]);
    setUnseen(prev => prev.filter(m => m.id !== item.id));
  } else {
    console.log(`🏪 CENTRAL STORE: Adding/updating TV show ${title}`);
    setSeenTVShows(prev => [...prev.filter(m => m.id !== item.id), item]);
    setUnseenTVShows(prev => prev.filter(m => m.id !== item.id));
  }
}, []);

  // CENTRAL LOCATION A - Add to unseen (block adult content)
const handleAddToUnseen = useCallback((item) => {
  if (item.adult === true) {
    console.log(`🚫 REJECTED: ${item.title || item.name} - Adult content`);
    Alert.alert('Content Filtered', 'Adult content is not allowed.');
    return;
  }
  
  const title = item.title || item.name;
  const isMovie = item.title && !item.name && !item.first_air_date;
  
  if (isMovie) {
    console.log(`🏪 CENTRAL STORE: Adding movie ${title} to watchlist`);
    setUnseen(prev => [...prev.filter(m => m.id !== item.id), item]);
  } else {
    console.log(`🏪 CENTRAL STORE: Adding TV show ${title} to watchlist`);
    setUnseenTVShows(prev => [...prev.filter(m => m.id !== item.id), item]);
  }
}, []);
// CENTRAL LOCATION A - Remove from watchlist
const handleRemoveFromWatchlist = useCallback((itemId) => {
  console.log(`🏪 CENTRAL STORE: Removing item ${itemId} from watchlist`);
  setUnseen(prev => prev.filter(movie => movie.id !== itemId));
  setUnseenTVShows(prev => prev.filter(show => show.id !== itemId));
}, []);

  // Initial app setup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // DEV MODE: Skip auth and onboarding completely
        if (isDevModeEnabled()) {
          console.log('🔧 DEV MODE: Skipping auth and onboarding');
          
          // Set dev user as authenticated
          const devUser = getDevUser();
          setUserInfo(devUser);
          setIsAuthenticated(true);
          
          // Mark onboarding as complete
          setOnboardingComplete(true);
          
          // Set other states
          setDataLoaded(false); // Will be set to true in loadUserData
          setCheckingOnboarding(false);
          
          // Quick loading
          setTimeout(() => {
            setIsLoading(false);
            setAppReady(true);
          }, 500);
          
          return;
        }

        // NORMAL MODE: Regular initialization
        const session = await AsyncStorage.getItem(USER_SESSION_KEY);
        if (session) {
          setUserInfo(JSON.parse(session));
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        if (!isDevModeEnabled()) {
          setIsLoading(false);
          setAppReady(true);
        }
      }
    };
    
    initializeApp();
  }, []);

  // Clear storage on launch (only in non-dev mode)
  useEffect(() => {
    if (!isDevModeEnabled()) {
      AsyncStorage.clear();
    }
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (appReady && isAuthenticated && !dataLoaded) {
      loadUserData();
      if (!isDevModeEnabled()) {
        setCheckingOnboarding(false);
      }
    }
  }, [appReady, isAuthenticated, dataLoaded, loadUserData]);

  // Save data when it changes (skip in dev mode)
  useEffect(() => {
    if (appReady && isAuthenticated && dataLoaded && !isDevModeEnabled()) {
      const timer = setTimeout(saveUserData, 500);
      return () => clearTimeout(timer);
    }
  }, [seen, unseen, isDarkMode, onboardingComplete, appReady, isAuthenticated, dataLoaded, saveUserData]);

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
  resetAllUserData={resetAllUserData}
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