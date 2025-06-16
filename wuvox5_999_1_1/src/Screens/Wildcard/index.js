import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  Modal,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// Import theme system and styling modules
import { useMediaType } from '../../Navigation/TabNavigator';
import { getLayoutStyles } from '../../Styles/layoutStyles';
import { getHeaderStyles, ThemedHeader } from '../../Styles/headerStyles';
import { getButtonStyles } from '../../Styles/buttonStyles';
import { getModalStyles } from '../../Styles/modalStyles';
import { getMovieCardStyles } from '../../Styles/movieCardStyles';
import theme from '../../utils/Theme';

// Import existing styles that don't need theming
import { getCompareStyles } from '../../Styles/compareStyles';
// Import existing styles that don't need theming
import stateStyles from '../../Styles/StateStyles';

// Constants for API and filtering
const API_KEY = 'b401be0ea16515055d8d0bde16f80069';
const MIN_VOTE_COUNT = 500;
const MIN_SCORE = 7.0;
const STORAGE_KEY = 'wuvo_compared_movies';
const BASELINE_COMPLETE_KEY = 'wuvo_baseline_complete';
const COMPARISON_COUNT_KEY = 'wuvo_comparison_count';
const COMPARISON_PATTERN_KEY = 'wuvo_comparison_pattern';
const SKIPPED_MOVIES_KEY = 'wuvo_skipped_movies';
const STREAMING_CACHE_KEY = 'wuvo_streaming_cache';

// API timeout constant
const API_TIMEOUT = 10000; // 10 seconds

// Streaming services with their TMDB provider IDs (logos will be fetched from API)
const STREAMING_SERVICES = [
  { id: 8, name: 'Netflix' },
  { id: 350, name: 'Apple TV+' },
  { id: 15, name: 'Hulu' },
  { id: 384, name: 'HBO Max' },
  { id: 337, name: 'Disney+' },
  { id: 387, name: 'Peacock' },
  { id: 9, name: 'Prime Video' },
  { id: 192, name: 'YouTube' },
  { id: 2, name: 'Apple TV' }
];

// Provider consolidation mapping - maps multiple provider IDs to a single display service
const PROVIDER_CONSOLIDATION = {
  // Amazon/Prime Video consolidation - all map to Prime Video (ID 9)
  9: { displayId: 9, displayName: 'Prime Video' },           // Amazon Prime Video
  10: { displayId: 9, displayName: 'Prime Video' },          // Amazon Video (rentals/purchases)
  2100: { displayId: 9, displayName: 'Prime Video' },        // Amazon Prime Video with Ads
  
  // Apple consolidation - all map to Apple TV+ (ID 350)  
  350: { displayId: 350, displayName: 'Apple TV+' },         // Apple TV+
  2: { displayId: 350, displayName: 'Apple TV+' },           // Apple TV (rentals)
  
  // Keep others as-is
  8: { displayId: 8, displayName: 'Netflix' },
  15: { displayId: 15, displayName: 'Hulu' },
  384: { displayId: 384, displayName: 'HBO Max' },
  337: { displayId: 337, displayName: 'Disney+' },
  387: { displayId: 387, displayName: 'Peacock' },
  192: { displayId: 192, displayName: 'YouTube' },
};

// Decades for filtering
const DECADES = [
  { value: '1960s', label: 'Pre-70s', startYear: 1900, endYear: 1969 },
  { value: '1970s', label: '1970s', startYear: 1970, endYear: 1979 },
  { value: '1980s', label: '1980s', startYear: 1980, endYear: 1989 },
  { value: '1990s', label: '1990s', startYear: 1990, endYear: 1999 },
  { value: '2000s', label: '2000s', startYear: 2000, endYear: 2009 },
  { value: '2010s', label: '2010s', startYear: 2010, endYear: 2019 },
  { value: '2020s', label: '2020s', startYear: 2020, endYear: 2029 }
];

// List of high-quality movie IDs for initial baseline comparisons
const baselineMovieIds = [
  238, 155, 120, 121, 122, 27205, 157336, 98, 37165, 244786,
  1124, 68718, 438631, 10681, 77, 299536, 324857, 569094, 16869, 49026,
  354912, 299534, 475557, 641, 10193, 301528, 38, 14160, 872585, 107,
  530915, 106646, 556574, 490132, 272, 11324, 601434, 7491, 361743, 359724,
  6977, 453, 24, 146233, 12, 508439, 752, 150540, 359940, 640,
  59440, 12444, 2649, 70, 76341, 634649, 76203, 120467, 324786, 210577,
  2062, 585, 10191, 263115, 227306, 22, 264644, 4800, 80, 9806,
  28178, 96721, 5915, 50014, 9522, 289, 872, 496243, 637, 603,
  550, 769, 680, 278, 13, 857, 597, 497, 14, 745,
  807, 4995, 627, 629, 500, 621, 197, 105, 78, 679,
  562, 9377, 2108, 218, 694, 85, 1891, 601, 620, 744,
  111, 106, 9340, 235, 600, 793, 1578, 2493
];

const uniqueBaselineMovieIds = [...new Set(baselineMovieIds)];

// Helper function to add timeout to fetch requests
const fetchWithTimeout = async (url, options = {}, timeout = API_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
};

function WildcardScreen({
  seen = [],
  setSeen,
  unseen = [],
  onAddToSeen,
  onAddToUnseen,
  genres = {},
  isDarkMode,
  skippedMovies = [],
  addToSkippedMovies = () => {},
  removeFromSkippedMovies = () => {}
}) {

  // Use media type context for theming
  const { mediaType } = useMediaType();
  
  // Get all themed styles
// Get all themed styles
  const layoutStyles = getLayoutStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const headerStyles = getHeaderStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const buttonStyles = getButtonStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const modalStyles = getModalStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const movieCardStyles = getMovieCardStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const compareStyles = getCompareStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  
  // Get theme colors for this media type and mode
  const colors = theme[mediaType][isDarkMode ? 'dark' : 'light'];

  // State variables for component functionality
  const [seenMovie, setSeenMovie] = useState(null);
  const [newMovie, setNewMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const [comparedMovies, setComparedMovies] = useState([]);
  const [baselineComplete, setBaselineComplete] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedDecades, setSelectedDecades] = useState([]);
  const [selectedStreamingServices, setSelectedStreamingServices] = useState([]);
  const [tempGenres, setTempGenres] = useState([]);
  const [tempDecades, setTempDecades] = useState([]);
  const [tempStreamingServices, setTempStreamingServices] = useState([]);
  const [comparisonCount, setComparisonCount] = useState(0);
  const [comparisonPattern, setComparisonPattern] = useState(0);
  const [streamingProviders, setStreamingProviders] = useState([]);
  
  // NEW: Smart filtering state
  const [streamingCache, setStreamingCache] = useState(new Map()); // Cache of movieId -> streaming services
  const [filteredMoviePool, setFilteredMoviePool] = useState([]); // Movies that match current filters
  const [isLoadingFilteredPool, setIsLoadingFilteredPool] = useState(false);
  
  // Refs to prevent race conditions and track component state
  const isLoadingRef = useRef(false);
  const appReady = useRef(false);
  const isMountedRef = useRef(true);

  // Set mounted ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Helper function to safely set state only if component is mounted
  const safeSetState = useCallback((setter, value) => {
    if (isMountedRef.current) {
      setter(value);
    }
  }, []);

  // Helper function to reset loading state
  const resetLoadingState = useCallback(() => {
    if (isMountedRef.current) {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Helper function to set error state
  const setErrorState = useCallback((errorMessage) => {
    if (isMountedRef.current) {
      console.error('Setting error state:', errorMessage);
      setError(errorMessage);
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  /**
   * Load streaming cache from storage
   */
  const loadStreamingCache = useCallback(async () => {
    try {
      const cacheData = await AsyncStorage.getItem(STREAMING_CACHE_KEY);
      if (cacheData) {
        const parsedCache = JSON.parse(cacheData);
        // Convert object back to Map
        const cacheMap = new Map(Object.entries(parsedCache));
        setStreamingCache(cacheMap);
        console.log(`📦 Loaded streaming cache with ${cacheMap.size} entries`);
      }
    } catch (error) {
      console.error('Failed to load streaming cache:', error);
    }
  }, []);

  /**
   * Save streaming cache to storage
   */
  const saveStreamingCache = useCallback(async (cache) => {
    try {
      // Convert Map to object for storage
      const cacheObject = Object.fromEntries(cache);
      await AsyncStorage.setItem(STREAMING_CACHE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Failed to save streaming cache:', error);
    }
  }, []);

  /**
   * Get streaming data for a movie (with caching)
   */
  const getMovieStreamingData = useCallback(async (movieId) => {
    // Check cache first
    if (streamingCache.has(movieId.toString())) {
      return streamingCache.get(movieId.toString());
    }

    try {
      const streamingResponse = await fetchWithTimeout(
        `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}`
      );

      if (!streamingResponse.ok) {
        return [];
      }

      const streamingData = await streamingResponse.json();
      const usData = streamingData.results?.US || {};

      const flatrateProviders = usData.flatrate || [];
      const rentProviders = usData.rent || [];
      const buyProviders = usData.buy || [];

      // Create payment type map
      const providerTypeMap = new Map();
      flatrateProviders.forEach(provider => {
        providerTypeMap.set(provider.provider_id, 'free');
      });
      [...rentProviders, ...buyProviders].forEach(provider => {
        if (!providerTypeMap.has(provider.provider_id)) {
          providerTypeMap.set(provider.provider_id, 'paid');
        }
      });

      // Combine and deduplicate
      const allProviders = [...flatrateProviders, ...rentProviders, ...buyProviders];
      const uniqueProviders = allProviders
        .filter((provider, index, self) => 
          index === self.findIndex(p => p.provider_id === provider.provider_id)
        )
        .map(provider => ({
          ...provider,
          paymentType: providerTypeMap.get(provider.provider_id)
        }));

      // Consolidate providers
      const consolidatedServices = new Map();
      uniqueProviders.forEach(provider => {
        const consolidation = PROVIDER_CONSOLIDATION[provider.provider_id];
        if (consolidation) {
          const key = consolidation.displayId;
          
          if (consolidatedServices.has(key)) {
            const existing = consolidatedServices.get(key);
            if (existing.paymentType === 'free' || provider.paymentType === 'free') {
              existing.paymentType = 'free';
            }
          } else {
            consolidatedServices.set(key, {
              provider_id: consolidation.displayId,
              provider_name: consolidation.displayName,
              logo_path: provider.logo_path,
              paymentType: provider.paymentType
            });
          }
        }
      });

      const streamingServices = Array.from(consolidatedServices.values());

      // Cache the result
      const newCache = new Map(streamingCache);
      newCache.set(movieId.toString(), streamingServices);
      setStreamingCache(newCache);
      saveStreamingCache(newCache);

      return streamingServices;
    } catch (error) {
      console.error(`Error fetching streaming for movie ${movieId}:`, error);
      return [];
    }
  }, [streamingCache, saveStreamingCache]);

  /**
   * Build filtered movie pool based on current filters
   */
  const buildFilteredMoviePool = useCallback(async () => {
    if (isLoadingFilteredPool) return;

    console.log('Building simple filtered movie pool...');
    setIsLoadingFilteredPool(true);

    try {
      let apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&vote_count.gte=${MIN_VOTE_COUNT}`;

      // Apply decade filters
      if (selectedDecades.length > 0) {
        const dateRanges = selectedDecades.map(decade => {
          const decadeInfo = DECADES.find(d => d.value === decade);
          return decadeInfo ? { start: decadeInfo.startYear, end: decadeInfo.endYear } : null;
        }).filter(Boolean);

        if (dateRanges.length > 0) {
          const startYear = Math.min(...dateRanges.map(r => r.start));
          const endYear = Math.max(...dateRanges.map(r => r.end));
          apiUrl += `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31`;
          console.log(`Date filter: ${startYear}-${endYear}`);
        }
      }

      // Apply genre filters
      if (selectedGenres.length > 0) {
        apiUrl += `&with_genres=${selectedGenres.join(',')}`;
        console.log(`Genre filter: ${selectedGenres.join(',')}`);
      }

      // Create exclusion set
      const excludedIds = new Set();
      seen.forEach(movie => excludedIds.add(movie.id));
      unseen.forEach(movie => excludedIds.add(movie.id));
      comparedMovies.forEach(id => excludedIds.add(id));
      skippedMovies.forEach(id => excludedIds.add(id));

      // Get popular movies matching decade/genre filters
      const response = await fetchWithTimeout(`${apiUrl}&page=1`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const eligibleMovies = data.results.filter(m =>
        m.poster_path &&
        m.vote_average >= MIN_SCORE &&
        !excludedIds.has(m.id)
      );

      console.log(`Found ${eligibleMovies.length} popular movies matching filters`);

      // If no streaming filter, we're done
      if (selectedStreamingServices.length === 0) {
        setFilteredMoviePool(eligibleMovies);
        setIsLoadingFilteredPool(false);
        return;
      }

      // For streaming filters, just take the first few popular movies and check them
      console.log(`Checking streaming for top movies...`);
      const streamingFilteredMovies = [];
      
      for (let i = 0; i < Math.min(eligibleMovies.length, 10); i++) {
        const movie = eligibleMovies[i];
        try {
          const streamingServices = await getMovieStreamingData(movie.id);
          
          const hasSelectedService = streamingServices.some(service => 
            selectedStreamingServices.includes(service.provider_id.toString())
          );

          if (hasSelectedService) {
            streamingFilteredMovies.push({
              ...movie,
              streamingServices: streamingServices
            });
            console.log(`✅ ${movie.title} available on selected service`);
          }
          
          // Stop after finding 5 matches
          if (streamingFilteredMovies.length >= 5) break;
        } catch (error) {
          console.log(`Error checking ${movie.title}:`, error);
          continue;
        }
      }

      setFilteredMoviePool(streamingFilteredMovies);
      console.log(`Pool ready: ${streamingFilteredMovies.length} movies`);
      
    } catch (error) {
      console.error('Error building filtered movie pool:', error);
      setFilteredMoviePool([]);
    } finally {
      setIsLoadingFilteredPool(false);
    }
  }, [selectedDecades, selectedGenres, selectedStreamingServices, seen, unseen, comparedMovies, skippedMovies, getMovieStreamingData]);

  /**
   * Get movie details with streaming data
   */
  const getMovieDetails = useCallback(async (movieId) => {
    try {
      const response = await fetchWithTimeout(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=en-US`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const streamingServices = await getMovieStreamingData(movieId);
      
      return {
        id: data.id,
        title: data.title,
        score: data.vote_average,
        voteCount: data.vote_count,
        poster: data.poster_path,
        overview: data.overview,
        release_date: data.release_date || 'Unknown',
        genre_ids: data.genres.map(g => g.id).slice(0, 3),
        release_year: new Date(data.release_date).getFullYear(),
        eloRating: data.vote_average * 10,
        userRating: data.vote_average,
        streamingServices: streamingServices
      };
    } catch (error) {
      console.error(`Error fetching details for movie ${movieId}:`, error);
      throw error;
    }
  }, [getMovieStreamingData]);

  const getFilteredMovie = useCallback(async () => {
    let apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&vote_count.gte=${MIN_VOTE_COUNT}`;
    if (selectedDecades.length > 0) {
      const dateRanges = selectedDecades.map(decade => {
        const decadeInfo = DECADES.find(d => d.value === decade);
        return decadeInfo ? { start: decadeInfo.startYear, end: decadeInfo.endYear } : null;
      }).filter(Boolean);
      if (dateRanges.length > 0) {
        const startYear = Math.min(...dateRanges.map(r => r.start));
        const endYear = Math.max(...dateRanges.map(r => r.end));
        apiUrl += `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31`;
      }
    }
    if (selectedGenres.length > 0) {
      apiUrl += `&with_genres=${selectedGenres.join(',')}`;
    }
    const randomPage = Math.floor(Math.random() * 5) + 1;
    apiUrl += `&page=${randomPage}`;
    const response = await fetchWithTimeout(apiUrl);
    const data = await response.json();
    
    const excludedIds = new Set([...seen.map(m => m.id), ...unseen.map(m => m.id), ...comparedMovies, ...skippedMovies]);
    
    const eligibleMovies = data.results.filter(m =>
      m.poster_path && m.vote_average >= MIN_SCORE && !excludedIds.has(m.id)
    );
    if (eligibleMovies.length === 0) {
      throw new Error('No movies found matching your filters');
    }
    const randomMovie = eligibleMovies[Math.floor(Math.random() * eligibleMovies.length)];
    return await getMovieDetails(randomMovie.id);
  }, [selectedDecades, selectedGenres, seen, unseen, comparedMovies, skippedMovies, getMovieDetails]);

  /**
   * Reset function - clears all comparison data but keeps user ratings
   */
  const handleReset = useCallback(async () => {
    Alert.alert(
      "Reset Wildcard",
      "Are you sure you want to reset the wildcard screen? This will clear all comparison data but keep your movie ratings.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive",
          onPress: async () => {
            try {
              safeSetState(setLoading, true);
              
              await AsyncStorage.removeItem(STORAGE_KEY);
              await AsyncStorage.removeItem(BASELINE_COMPLETE_KEY);
              await AsyncStorage.removeItem(COMPARISON_COUNT_KEY);
              await AsyncStorage.removeItem(COMPARISON_PATTERN_KEY);
              await AsyncStorage.removeItem(SKIPPED_MOVIES_KEY);
              
              safeSetState(setComparedMovies, []);
              safeSetState(setBaselineComplete, false);
              safeSetState(setComparisonCount, 0);
              safeSetState(setComparisonPattern, 0);
              safeSetState(setLastAction, null);
              safeSetState(setSeenMovie, null);
              safeSetState(setNewMovie, null);
              safeSetState(setError, null);
              safeSetState(setFilteredMoviePool, []); // Clear the pool
              
              isLoadingRef.current = false;
              
              setTimeout(() => {
                if (isMountedRef.current) {
                  fetchRandomMovie();
                }
              }, 300);
              
              console.log("Wildcard state reset successfully");
            } catch (e) {
              console.error('Failed to reset wildcard state', e);
              setErrorState('Failed to reset. Please try again.');
            }
          }
        }
      ]
    );
  }, [safeSetState, setErrorState]);

  /**
   * Fetch streaming providers with logos from TMDB API
   */
  const fetchStreamingProviders = useCallback(async () => {
    try {
      const response = await fetchWithTimeout(
        `https://api.themoviedb.org/3/watch/providers/movie?api_key=${API_KEY}&watch_region=US`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const availableProviders = data.results
        .filter(provider => STREAMING_SERVICES.some(service => service.id === provider.provider_id))
        .map(provider => {
          const serviceInfo = STREAMING_SERVICES.find(service => service.id === provider.provider_id);
          return {
            id: provider.provider_id,
            name: serviceInfo?.name || provider.provider_name,
            logo_path: provider.logo_path,
            logo_url: `https://image.tmdb.org/t/p/w92${provider.logo_path}`
          };
        });
      
      setStreamingProviders(availableProviders);
    } catch (err) {
      console.error('Error fetching streaming providers:', err);
      setStreamingProviders(STREAMING_SERVICES.map(service => ({
        ...service,
        logo_url: null
      })));
    }
  }, []);

  const updateMovieRating = useCallback((movieToUpdate, newRating) => {
    const updatedMovie = {
      ...movieToUpdate,
      userRating: newRating,
      eloRating: newRating * 10,
      gamesPlayed: (movieToUpdate.gamesPlayed || 0) + 1
    };
    
    console.log(`Updating movie: ${updatedMovie.title} from ${movieToUpdate.userRating || 'unrated'} to ${newRating}`);
    
    setSeen(currentSeen => {
      const movieExists = currentSeen.some(m => m.id === movieToUpdate.id);
      
      if (movieExists) {
        const updatedSeen = currentSeen.map(m => 
          m.id === movieToUpdate.id ? updatedMovie : m
        );
        console.log(`Updated existing movie in seen list: ${updatedMovie.title}`);
        return updatedSeen;
      } else {
        console.log(`Adding new movie to seen list: ${updatedMovie.title}`);
        return [...currentSeen, updatedMovie];
      }
    });
    
    onAddToSeen(updatedMovie);
    return updatedMovie;
  }, [setSeen, onAddToSeen]);

  const getNextBaselineMovieId = useCallback(() => {
    const remainingBaselineIds = uniqueBaselineMovieIds.filter(
      id => !comparedMovies.includes(id) && !seen.some(sm => sm.id === id)
    );
    
    if (remainingBaselineIds.length === 0) {
      if (!baselineComplete) {
        safeSetState(setBaselineComplete, true);
        safeSetState(setComparisonPattern, 0);
      }
      return null;
    }
    
    return remainingBaselineIds[Math.floor(Math.random() * remainingBaselineIds.length)];
  }, [comparedMovies, baselineComplete, seen, safeSetState]);

  const markMovieAsCompared = useCallback((movieId) => {
    if (!comparedMovies.includes(movieId)) {
      safeSetState(setComparedMovies, prev => [...prev, movieId]);
    }
    
    safeSetState(setComparisonCount, prev => prev + 1);
    safeSetState(setComparisonPattern, prev => (prev + 1) % 5);
  }, [comparedMovies, safeSetState]);

  /**
   * Main function to fetch movies for comparison
   */
  const fetchRandomMovie = useCallback(async () => {
    if (isLoadingRef.current || !isMountedRef.current) {
      console.log('Already loading or component unmounted, skipping fetch');
      return;
    }
    
    isLoadingRef.current = true;
    safeSetState(setLoading, true);
    safeSetState(setError, null);
    
    if (seen.length < 3) {
      setErrorState('You must have at least 3 movies ranked to use Wildcard mode.');
      return;
    }

    try {
      console.log('🎬 Starting movie fetch with filters:', { genres: selectedGenres, decades: selectedDecades, streaming: selectedStreamingServices });
      
      const isKnownVsKnown = comparisonPattern === 4;
      
      // Handle known vs known comparisons
      if (isKnownVsKnown && seen.length >= 5) {
        console.log('🔄 Known vs known comparison');
        
        let eligibleMovies = seen;
        if (selectedGenres.length > 0) {
          eligibleMovies = seen.filter(m => 
            m.genre_ids && m.genre_ids.some(genreId => 
              selectedGenres.includes(genreId.toString())
            )
          );
          
          if (eligibleMovies.length < 2) {
            const genreNames = selectedGenres.map(id => genres[id] || 'Unknown').join(', ');
            setErrorState(`Not enough movies in the selected genres: ${genreNames}. You need at least 2 rated movies in these genres for comparisons.`);
            return;
          }
        }
        
        const shuffled = [...eligibleMovies].sort(() => 0.5 - Math.random());
        
        if (shuffled.length >= 2) {
          // Add streaming data to known movies if missing
          const movie1 = shuffled[0];
          const movie2 = shuffled[1];
          const movie1WithStreaming = {
            ...movie1,
            streamingServices: movie1.streamingServices || await getMovieStreamingData(movie1.id)
          };
          
          const movie2WithStreaming = {
            ...movie2,
            streamingServices: movie2.streamingServices || await getMovieStreamingData(movie2.id)
          };
          
          safeSetState(setSeenMovie, movie1WithStreaming);
          safeSetState(setNewMovie, movie2WithStreaming);
          resetLoadingState();
          console.log('✅ Known vs known pair ready');
          return;
        } else {
          throw new Error('Not enough different movies for comparison');
        }
      }
      
      const hasActiveFilters = selectedGenres.length > 0 || selectedDecades.length > 0;
      
      if (hasActiveFilters) {
        console.log('🎯 FILTERS ACTIVE - Using ONLY filtered system');
        
        if (filteredMoviePool.length === 0 && !isLoadingFilteredPool) {
          console.log('Building filtered pool...');
          await buildFilteredMoviePool();
        }
        
        // Handle known vs known with filters
        if (isKnownVsKnown && seen.length >= 5) {
          console.log('Known vs known with filters');
          
          let eligibleMovies = seen;
          if (selectedGenres.length > 0) {
            eligibleMovies = seen.filter(m => 
              m.genre_ids && m.genre_ids.some(genreId => 
                selectedGenres.includes(genreId.toString())
              )
            );
          }
          
          if (eligibleMovies.length < 2) {
            const genreNames = selectedGenres.map(id => genres[id] || 'Unknown').join(', ');
            setErrorState(`Not enough movies in selected genres: ${genreNames}`);
            return;
          }
          
          const shuffled = [...eligibleMovies].sort(() => 0.5 - Math.random());
          const movie1 = { ...shuffled[0], streamingServices: shuffled[0].streamingServices || await getMovieStreamingData(shuffled[0].id) };
          const movie2 = { ...shuffled[1], streamingServices: shuffled[1].streamingServices || await getMovieStreamingData(shuffled[1].id) };
          
          safeSetState(setSeenMovie, movie1);
          safeSetState(setNewMovie, movie2);
          resetLoadingState();
          console.log('✅ Filtered known vs known ready');
          return;
        }
        
        // Handle known vs unknown with filters
        console.log('Known vs unknown with filters');
        
        let eligibleSeenMovies = seen;
        if (selectedGenres.length > 0) {
          eligibleSeenMovies = seen.filter(movie => 
            movie.genre_ids && movie.genre_ids.some(genreId => 
              selectedGenres.includes(genreId.toString())
            )
          );
          
          if (eligibleSeenMovies.length < 1) {
            const genreNames = selectedGenres.map(id => genres[id] || 'Unknown').join(', ');
            setErrorState(`No movies found in selected genres: ${genreNames}`);
            return;
          }
        }
        
        let randomSeenMovie = eligibleSeenMovies[Math.floor(Math.random() * eligibleSeenMovies.length)];
        if (!randomSeenMovie.streamingServices) {
          randomSeenMovie = { ...randomSeenMovie, streamingServices: await getMovieStreamingData(randomSeenMovie.id) };
        }
        
        safeSetState(setSeenMovie, randomSeenMovie);
        console.log('✅ Selected filtered seen movie:', randomSeenMovie.title);
        
        const newMovieData = await getFilteredMovie();
        
        if (!newMovieData || newMovieData.id === randomSeenMovie.id) {
          throw new Error('Failed to find a suitable filtered movie for comparison');
        }
        
        console.log('✅ Selected filtered new movie:', newMovieData.title);
        safeSetState(setNewMovie, newMovieData);
        resetLoadingState();
        return;
        
      } else {
        console.log('📚 NO FILTERS - Using hardcoded/baseline system');
        
        // Handle known vs known WITHOUT filters (use baseline)
        if (isKnownVsKnown && seen.length >= 5) {
          console.log('Known vs known without filters');
          
          const shuffled = [...seen].sort(() => 0.5 - Math.random());
          const movie1 = { ...shuffled[0], streamingServices: shuffled[0].streamingServices || await getMovieStreamingData(shuffled[0].id) };
          const movie2 = { ...shuffled[1], streamingServices: shuffled[1].streamingServices || await getMovieStreamingData(shuffled[1].id) };
          
          safeSetState(setSeenMovie, movie1);
          safeSetState(setNewMovie, movie2);
          resetLoadingState();
          return;
        }
        
        // Handle known vs unknown WITHOUT filters (use baseline)
        console.log('Known vs unknown without filters');
        
        let randomSeenMovie = seen[Math.floor(Math.random() * seen.length)];
        if (!randomSeenMovie.streamingServices) {
          randomSeenMovie = { ...randomSeenMovie, streamingServices: await getMovieStreamingData(randomSeenMovie.id) };
        }
        
        safeSetState(setSeenMovie, randomSeenMovie);
        console.log('✅ Selected baseline seen movie:', randomSeenMovie.title);
        
        let newMovieData = null;
        
        if (!baselineComplete) {
          console.log('Using hardcoded baseline movies');
          
          const nextBaselineMovieId = getNextBaselineMovieId();
          if (nextBaselineMovieId && nextBaselineMovieId !== randomSeenMovie.id) {
            newMovieData = await getMovieDetails(nextBaselineMovieId);
            
            const remainingCount = uniqueBaselineMovieIds.filter(id => 
              !comparedMovies.includes(id) && !seen.some(sm => sm.id === id)
            ).length;
            
            if (remainingCount <= Math.floor(uniqueBaselineMovieIds.length * 0.15)) {
              setTimeout(() => {
                if (isMountedRef.current) {
                  setBaselineComplete(true);
                }
              }, 1000);
            }
          } else {
            safeSetState(setBaselineComplete, true);
            const popularResponse = await fetchWithTimeout(
              `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=${Math.floor(Math.random() * 10) + 1}`
            );
            const popularData = await popularResponse.json();
            const excludedIds = new Set([...seen.map(m => m.id), ...unseen.map(m => m.id), ...comparedMovies, ...skippedMovies]);
            const eligiblePopular = popularData.results.filter(m => m.poster_path && !excludedIds.has(m.id));
            const randomPopular = eligiblePopular[Math.floor(Math.random() * eligiblePopular.length)];
            newMovieData = await getMovieDetails(randomPopular.id);
          }
        } else {
          console.log('Baseline complete - Using popular movies');
          
          const popularResponse = await fetchWithTimeout(
            `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=${Math.floor(Math.random() * 10) + 1}`
          );
          const popularData = await popularResponse.json();
          const excludedIds = new Set([...seen.map(m => m.id), ...unseen.map(m => m.id), ...comparedMovies, ...skippedMovies]);
          const eligiblePopular = popularData.results.filter(m => m.poster_path && !excludedIds.has(m.id));
          const randomPopular = eligiblePopular[Math.floor(Math.random() * eligiblePopular.length)];
          newMovieData = await getMovieDetails(randomPopular.id);
        }
        
        if (!newMovieData || newMovieData.id === randomSeenMovie.id) {
          throw new Error('Failed to find a suitable baseline movie for comparison');
        }
        
        console.log('✅ Selected baseline new movie:', newMovieData.title);
        safeSetState(setNewMovie, newMovieData);
        resetLoadingState();
        return;
      }
      
    } catch (err) {
      console.error('❌ Error fetching movie:', err);
      setErrorState(`Failed to load movie: ${err.message}`);
    }
  }, [
    seen, selectedGenres, selectedDecades, selectedStreamingServices, genres, 
    baselineComplete, comparedMovies, comparisonPattern, getNextBaselineMovieId,
    getMovieDetails, getMovieStreamingData, buildFilteredMoviePool, 
    filteredMoviePool, isLoadingFilteredPool,
    unseen, skippedMovies, safeSetState, setErrorState, resetLoadingState
  ]);

  // Load stored state and streaming cache on mount
  useEffect(() => {
    const loadStoredState = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue != null && isMountedRef.current) {
          setComparedMovies(JSON.parse(jsonValue));
        }
        
        const baselineCompleteValue = await AsyncStorage.getItem(BASELINE_COMPLETE_KEY);
        const isBaselineComplete = baselineCompleteValue === 'true';
        if (isMountedRef.current) {
          setBaselineComplete(isBaselineComplete);
        }
        
        const countValue = await AsyncStorage.getItem(COMPARISON_COUNT_KEY);
        if (countValue != null && isMountedRef.current) {
          setComparisonCount(parseInt(countValue, 10));
        }
        
        const patternValue = await AsyncStorage.getItem(COMPARISON_PATTERN_KEY);
        if (patternValue != null && isMountedRef.current) {
          setComparisonPattern(parseInt(patternValue, 10));
        }
        
        // Load streaming cache
        await loadStreamingCache();
        
        appReady.current = true;
      } catch (e) {
        console.error('Failed to load stored state', e);
        appReady.current = true;
      }
    };
    
    loadStoredState();
  }, [loadStreamingCache]);

  // Fetch streaming providers on mount
  useEffect(() => {
    fetchStreamingProviders();
  }, [fetchStreamingProviders]);

  // Save state changes
  useEffect(() => {
    const saveComparedMovies = async () => {
      try {
        const jsonValue = JSON.stringify(comparedMovies);
        await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
      } catch (e) {
        console.error('Failed to save compared movies', e);
      }
    };
    
    if (comparedMovies.length > 0) {
      saveComparedMovies();
    }
  }, [comparedMovies]);

  useEffect(() => {
    const saveBaselineComplete = async () => {
      try {
        await AsyncStorage.setItem(BASELINE_COMPLETE_KEY, baselineComplete.toString());
      } catch (e) {
        console.error('Failed to save baseline complete status', e);
      }
    };
    
    saveBaselineComplete();
  }, [baselineComplete]);

  useEffect(() => {
    const saveComparisonCount = async () => {
      try {
        await AsyncStorage.setItem(COMPARISON_COUNT_KEY, comparisonCount.toString());
      } catch (e) {
        console.error('Failed to save comparison count', e);
      }
    };
    
    saveComparisonCount();
  }, [comparisonCount]);

  useEffect(() => {
    const saveComparisonPattern = async () => {
      try {
        await AsyncStorage.setItem(COMPARISON_PATTERN_KEY, comparisonPattern.toString());
      } catch (e) {
        console.error('Failed to save comparison pattern', e);
      }
    };
    
    saveComparisonPattern();
  }, [comparisonPattern]);

  // Rebuild filtered pool when filters change
  useEffect(() => {
    const hasActiveFilters = selectedGenres.length > 0 || selectedDecades.length > 0;    
    if (hasActiveFilters && appReady.current) {
      console.log('🔄 Filters changed, clearing pool to rebuild on next fetch');
      setFilteredMoviePool([]); // Clear pool so it rebuilds on next fetch
    }
  }, [selectedGenres, selectedDecades, selectedStreamingServices]);

  // Initial fetch
  useEffect(() => {
    const initialLoadTimeout = setTimeout(() => {
      if (loading && !seenMovie && !newMovie && isMountedRef.current) {
        console.log('Initial load timeout - attempting recovery');
        setErrorState('Loading took too long. Please try again.');
      }
    }, 15000);
    
    const initializeComponent = async () => {
      try {
        let attempts = 0;
        while (!appReady.current && attempts < 50 && isMountedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!isMountedRef.current) return;
        
        if (!appReady.current) {
          throw new Error('Component initialization timeout');
        }
        
        await fetchRandomMovie();
        clearTimeout(initialLoadTimeout);
      } catch (err) {
        console.error('Error in component initialization:', err);
        clearTimeout(initialLoadTimeout);
        setErrorState('Failed to initialize. Please try again.');
      }
    };
    
    initializeComponent();
    
    return () => {
      clearTimeout(initialLoadTimeout);
    };
  }, []);

  // Filter modal functions
  const openFilterModal = useCallback(() => {
    setTempGenres([...selectedGenres]);
    setTempDecades([...selectedDecades]);
    setTempStreamingServices([...selectedStreamingServices]);
    setFilterModalVisible(true);
  }, [selectedGenres, selectedDecades, selectedStreamingServices]);

  const applyFilters = useCallback(() => {
    setFilterModalVisible(false);
    
    const genresChanged = JSON.stringify(selectedGenres.sort()) !== JSON.stringify(tempGenres.sort());
    const decadesChanged = JSON.stringify(selectedDecades.sort()) !== JSON.stringify(tempDecades.sort());
    const streamingChanged = JSON.stringify(selectedStreamingServices.sort()) !== JSON.stringify(tempStreamingServices.sort());
    const settingsChanged = genresChanged || decadesChanged || streamingChanged;
    
    setSelectedGenres([...tempGenres]);
    setSelectedDecades([...tempDecades]);
    setSelectedStreamingServices([...tempStreamingServices]);
    
    if (settingsChanged) {
      console.log('🔄 Filters changed - Genres:', tempGenres, 'Decades:', tempDecades, 'Streaming:', tempStreamingServices);
      
      setTimeout(async () => {
        if (isMountedRef.current) {
          setNewMovie(null);
          setSeenMovie(null);
          setLoading(true);
          setError(null);
          isLoadingRef.current = false;
          
          try {
            await fetchRandomMovie();
          } catch (err) {
            console.error('Error after filter change:', err);
            setErrorState('Something went wrong while loading. Please try again.');
          }
        }
      }, 300);
    }
  }, [selectedGenres, selectedDecades, selectedStreamingServices, tempGenres, tempDecades, tempStreamingServices, fetchRandomMovie, setErrorState]);

  const cancelFilters = useCallback(() => {
    setFilterModalVisible(false);
  }, []);

  const toggleGenre = useCallback((genreId) => {
    setTempGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  }, []);

  const toggleDecade = useCallback((decade) => {
    setTempDecades(prev => 
      prev.includes(decade) 
        ? prev.filter(d => d !== decade)
        : [...prev, decade]
    );
  }, []);

  const toggleStreamingService = useCallback((serviceId) => {
    setTempStreamingServices(prev => 
      prev.includes(serviceId.toString()) 
        ? prev.filter(id => id !== serviceId.toString())
        : [...prev, serviceId.toString()]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setTempGenres([]);
    setTempDecades([]);
    setTempStreamingServices([]);
  }, []);

  const hasActiveFilters = selectedGenres.length > 0 || selectedDecades.length > 0;
  
  const calculateKFactor = useCallback((gamesPlayed) => {
    if (gamesPlayed < 5) return .5;
    if (gamesPlayed < 10) return .25;
    if (gamesPlayed < 20) return .125;
    return .1;
  }, []);

  const adjustRating = useCallback((winner, loser, winnerIsSeenMovie) => {
    const winnerRating = winner.userRating;
    const loserRating = loser.userRating;
    
    const ratingDifference = Math.abs(winnerRating - loserRating);
    const expectedWinProbability = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 4));
    
    const winnerK = calculateKFactor(winner.gamesPlayed || 0);
    const loserK = calculateKFactor(loser.gamesPlayed || 0);
    
    const winnerIncrease = Math.max(0.1, winnerK * (1 - expectedWinProbability));
    const loserDecrease = Math.max(0.1, loserK * (1 - expectedWinProbability));
    
    let adjustedWinnerIncrease = winnerIncrease;
    let adjustedLoserDecrease = loserDecrease;
    if (winnerRating < loserRating) {
      adjustedWinnerIncrease *= 1.2;
    }
    
    const isMajorUpset = winnerRating < loserRating && ratingDifference > 3.0;
    if (isMajorUpset) {
      adjustedWinnerIncrease += 3.0;
      console.log(`🚨 MAJOR UPSET! ${winner.title} (${winnerRating}) defeated ${loser.title} (${loserRating}). Adding 3.0 bonus points!`);
    }
    
    const MAX_RATING_CHANGE = 0.7;
    
    if (isMajorUpset) {
      adjustedLoserDecrease = Math.min(MAX_RATING_CHANGE, adjustedLoserDecrease);
    } else {
      adjustedWinnerIncrease = Math.min(MAX_RATING_CHANGE, adjustedWinnerIncrease);
      adjustedLoserDecrease = Math.min(MAX_RATING_CHANGE, adjustedLoserDecrease);
    }
    
    let newWinnerRating = winnerRating + adjustedWinnerIncrease;
    let newLoserRating = loserRating - adjustedLoserDecrease;
    
    newWinnerRating = Math.round(Math.min(10, Math.max(1, newWinnerRating)) * 10) / 10;
    newLoserRating = Math.round(Math.min(10, Math.max(1, newLoserRating)) * 10) / 10;
    
    const updatedWinner = {
      ...winner,
      userRating: newWinnerRating,
      eloRating: newWinnerRating * 10,
      gamesPlayed: (winner.gamesPlayed || 0) + 1
    };
    
    const updatedLoser = {
      ...loser,
      userRating: newLoserRating,
      eloRating: newLoserRating * 10,
      gamesPlayed: (loser.gamesPlayed || 0) + 1
    };
    
    return winnerIsSeenMovie 
      ? { updatedSeenMovie: updatedWinner, updatedNewMovie: updatedLoser } 
      : { updatedSeenMovie: updatedLoser, updatedNewMovie: updatedWinner };
  }, [calculateKFactor]);

  const handleSeenWin = useCallback(() => {
    if (isLoadingRef.current || !seenMovie || !newMovie || !isMountedRef.current) {
      console.log('Ignoring click while loading or missing movies');
      return;
    }
    
    console.log('=== SEEN MOVIE WIN ===');
    
    const isKnownVsKnown = seen.some(m => m.id === newMovie.id);
    const { updatedSeenMovie, updatedNewMovie } = adjustRating(seenMovie, newMovie, true);
    
    updateMovieRating(seenMovie, updatedSeenMovie.userRating);
    updateMovieRating(newMovie, updatedNewMovie.userRating);
    
    isLoadingRef.current = false;
    
    if (isKnownVsKnown) {
      safeSetState(setComparisonCount, prev => prev + 1);
      safeSetState(setComparisonPattern, prev => (prev + 1) % 5);
    } else {
      markMovieAsCompared(newMovie.id);
    }
    
    safeSetState(setLastAction, {
      type: isKnownVsKnown ? 'known_comparison' : 'comparison',
      seenMovie: {...seenMovie},
      newMovie: {...newMovie},
      winnerIsSeenMovie: true
    });
    
    safeSetState(setNewMovie, null);
    safeSetState(setSeenMovie, null);
    safeSetState(setLoading, true);
    
    setTimeout(() => {
      if (isMountedRef.current) {
        fetchRandomMovie();
      }
    }, 100);
  }, [seenMovie, newMovie, seen, adjustRating, updateMovieRating, fetchRandomMovie, markMovieAsCompared, safeSetState]);

  const handleNewWin = useCallback(() => {
    if (isLoadingRef.current || !seenMovie || !newMovie || !isMountedRef.current) {
      console.log('Ignoring click while loading or missing movies');
      return;
    }
    
    console.log('=== NEW MOVIE WIN ===');
    
    const isKnownVsKnown = seen.some(m => m.id === newMovie.id);
    const { updatedSeenMovie, updatedNewMovie } = adjustRating(newMovie, seenMovie, false);
    
    updateMovieRating(seenMovie, updatedSeenMovie.userRating);
    updateMovieRating(newMovie, updatedNewMovie.userRating);
    
    isLoadingRef.current = false;
    
    if (isKnownVsKnown) {
      safeSetState(setComparisonCount, prev => prev + 1);
      safeSetState(setComparisonPattern, prev => (prev + 1) % 5);
    } else {
      markMovieAsCompared(newMovie.id);
    }
    
    safeSetState(setLastAction, {
      type: isKnownVsKnown ? 'known_comparison' : 'comparison',
      seenMovie: {...seenMovie},
      newMovie: {...newMovie},
      winnerIsSeenMovie: false
    });
    
    safeSetState(setNewMovie, null);
    safeSetState(setSeenMovie, null);
    safeSetState(setLoading, true);
    
    setTimeout(() => {
      if (isMountedRef.current) {
        fetchRandomMovie();
      }
    }, 100);
  }, [seenMovie, newMovie, seen, adjustRating, updateMovieRating, fetchRandomMovie, markMovieAsCompared, safeSetState]);

  const handleUnseen = useCallback(() => {
    if (isLoadingRef.current || !seenMovie || !newMovie || !isMountedRef.current) {
      console.log('Ignoring click while loading or missing movies');
      return;
    }
    
    const isKnownVsKnown = seen.some(m => m.id === newMovie.id);
    
    if (isKnownVsKnown) {
      Alert.alert(
        'Already Rated',
        'This movie is already in your rated list. You can\'t add it to watchlist.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    markMovieAsCompared(newMovie.id);
    onAddToUnseen(newMovie);
    
    isLoadingRef.current = false;
    
    safeSetState(setLastAction, {
      type: 'unseen',
      movie: {...newMovie}
    });
    
    safeSetState(setNewMovie, null);
    safeSetState(setSeenMovie, null);
    safeSetState(setLoading, true);
    
    setTimeout(() => {
      if (isMountedRef.current) {
        fetchRandomMovie();
      }
    }, 100);
  }, [newMovie, onAddToUnseen, fetchRandomMovie, markMovieAsCompared, seenMovie, seen, safeSetState]);

  const handleSkip = useCallback(() => {
    if (isLoadingRef.current || !seenMovie || !newMovie || !isMountedRef.current) {
      console.log('Ignoring click while loading or missing movies');
      return;
    }
    
    const isKnownVsKnown = comparisonPattern === 4 && seen.some(m => m.id === newMovie.id);
    
    isLoadingRef.current = false;
    
    if (isKnownVsKnown) {
      safeSetState(setComparisonCount, prev => prev + 1);
      safeSetState(setComparisonPattern, prev => (prev + 1) % 5);
    } else {
      markMovieAsCompared(newMovie.id);
    }
    
    safeSetState(setLastAction, {
      type: 'skip',
      seenMovie: {...seenMovie},
      newMovie: {...newMovie},
      isKnownVsKnown: isKnownVsKnown
    });
    
    safeSetState(setNewMovie, null);
    safeSetState(setSeenMovie, null);
    safeSetState(setLoading, true);
    
    setTimeout(() => {
      if (isMountedRef.current) {
        fetchRandomMovie();
      }
    }, 100);
  }, [seenMovie, newMovie, fetchRandomMovie, markMovieAsCompared, comparisonPattern, seen, safeSetState]);

  const handleToughChoice = useCallback(() => {
    if (isLoadingRef.current || !seenMovie || !newMovie || !isMountedRef.current) {
      console.log('Ignoring click while loading or missing movies');
      return;
    }
    
    console.log('=== TOUGH CHOICE ===');
    
    const isKnownVsKnown = seen.some(m => m.id === newMovie.id);
    let newSeenRating, newMovieRating;
    
    isLoadingRef.current = false;
    
    if (isKnownVsKnown) {
      const avgRating = (seenMovie.userRating + newMovie.userRating) / 2;
      newSeenRating = Math.min(10, Math.max(1, avgRating + 0.05));
      newMovieRating = Math.min(10, Math.max(1, avgRating - 0.05));
      
      safeSetState(setComparisonCount, prev => prev + 1);
      safeSetState(setComparisonPattern, prev => (prev + 1) % 5);
    } else {
      markMovieAsCompared(newMovie.id);
      
      const averageRating = (seenMovie.userRating + (newMovie.userRating || newMovie.score)) / 2;
      
      const seenRating = seenMovie.userRating;
      const newRating = newMovie.userRating || newMovie.score;
      
      if (seenRating <= newRating) {
        newSeenRating = Math.min(10, Math.max(1, averageRating + 0.1));
        newMovieRating = Math.max(1, Math.min(10, averageRating - 0.1));
      } else {
        newMovieRating = Math.min(10, Math.max(1, averageRating + 0.1));
        newSeenRating = Math.max(1, Math.min(10, averageRating - 0.1));
      }
    }
    
    updateMovieRating(seenMovie, newSeenRating);
    updateMovieRating(newMovie, newMovieRating);
    
    safeSetState(setLastAction, {
      type: isKnownVsKnown ? 'tough_known' : 'tough',
      seenMovie: {...seenMovie},
      newMovie: {...newMovie}
    });
    
    safeSetState(setNewMovie, null);
    safeSetState(setSeenMovie, null);
    safeSetState(setLoading, true);
    
    setTimeout(() => {
      if (isMountedRef.current) {
        fetchRandomMovie();
      }
    }, 100);
  }, [seenMovie, newMovie, seen, updateMovieRating, fetchRandomMovie, markMovieAsCompared, safeSetState]);

  const handleUndo = () => {
    if (!lastAction || isLoadingRef.current) return;
    
    let filteredSeen, restoredSeen, filteredUnseen;
    
    switch (lastAction.type) {
      case 'comparison':
        filteredSeen = seen.filter(m => m.id !== lastAction.newMovie.id);
        restoredSeen = filteredSeen.map(m => 
          m.id === lastAction.seenMovie.id ? lastAction.seenMovie : m
        );
        
        setSeen(restoredSeen);
        setComparedMovies(prev => prev.filter(id => id !== lastAction.newMovie.id));
        setComparisonCount(prev => Math.max(0, prev - 1));
        setComparisonPattern(prev => (prev - 1 + 5) % 5);
        
        setSeenMovie(lastAction.seenMovie);
        setNewMovie(lastAction.newMovie);
        setLoading(false);
        break;
        
      case 'known_comparison':
        restoredSeen = seen.map(m => {
          if (m.id === lastAction.seenMovie.id) return lastAction.seenMovie;
          if (m.id === lastAction.newMovie.id) return lastAction.newMovie;
          return m;
        });
        
        setSeen(restoredSeen);
        setComparisonPattern(prev => (prev - 1 + 5) % 5);
        setSeenMovie(lastAction.seenMovie);
        setNewMovie(lastAction.newMovie);
        setLoading(false);
        break;
        
      case 'unseen':
        filteredUnseen = unseen.filter(m => m.id !== lastAction.movie.id);
        onAddToUnseen(filteredUnseen);
        setComparedMovies(prev => prev.filter(id => id !== lastAction.movie.id));
        setComparisonCount(prev => Math.max(0, prev - 1));
        setComparisonPattern(prev => (prev - 1 + 5) % 5);
        setNewMovie(lastAction.movie);
        setLoading(false);
        break;
        
      case 'skip':
        if (!lastAction.isKnownVsKnown) {
          setComparedMovies(prev => prev.filter(id => id !== lastAction.newMovie.id));
          setComparisonCount(prev => Math.max(0, prev - 1));
        }
        
        setComparisonPattern(prev => (prev - 1 + 5) % 5);
        setSeenMovie(lastAction.seenMovie);
        setNewMovie(lastAction.newMovie);
        setLoading(false);
        break;
        
      case 'tough':
        filteredSeen = seen.filter(m => m.id !== lastAction.newMovie.id);
        restoredSeen = filteredSeen.map(m => 
          m.id === lastAction.seenMovie.id ? lastAction.seenMovie : m
        );
        
        setSeen(restoredSeen);
        setComparedMovies(prev => prev.filter(id => id !== lastAction.newMovie.id));
        setComparisonCount(prev => Math.max(0, prev - 1));
        setComparisonPattern(prev => (prev - 1 + 5) % 5);
        setSeenMovie(lastAction.seenMovie);
        setNewMovie(lastAction.newMovie);
        setLoading(false);
        break;
        
      case 'tough_known':
        restoredSeen = seen.map(m => {
          if (m.id === lastAction.seenMovie.id) return lastAction.seenMovie;
          if (m.id === lastAction.newMovie.id) return lastAction.newMovie;
          return m;
        });
        
        setSeen(restoredSeen);
        setComparisonPattern(prev => (prev - 1 + 5) % 5);
        setSeenMovie(lastAction.seenMovie);
        setNewMovie(lastAction.newMovie);
        setLoading(false);
        break;
      
      default:
        break;
    }
    
    setLastAction(null);
  };

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setNewMovie(null);
    setSeenMovie(null);
    isLoadingRef.current = false;
    fetchRandomMovie();
  }, [fetchRandomMovie]);

  const getPosterUrl = path =>
    path
      ? `https://image.tmdb.org/t/p/w342${path}`
      : `https://image.tmdb.org/t/p/w342`;

  // Loading state UI
  if (loading) {
    return (
      <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: colors.background }]}>
        <View style={stateStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[stateStyles.loadingText, { color: colors.subText }]}>
            {isLoadingFilteredPool 
              ? 'Building filtered movie pool...' 
              : baselineComplete 
                ? 'Finding movies tailored to your taste...' 
                : 'Loading movies for comparison...'
            }
          </Text>
          {hasActiveFilters && (
            <Text style={[stateStyles.loadingText, { color: colors.subText, fontSize: 12, marginTop: 5 }]}>
              Active filters: {[
                selectedGenres.length > 0 && `${selectedGenres.length} genres`,
                selectedDecades.length > 0 && `${selectedDecades.length} decades`,
                selectedStreamingServices.length > 0 && `${selectedStreamingServices.length} services`
              ].filter(Boolean).join(', ')}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Error state UI
  if (error) {
    return (
      <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: colors.background }]}>
        <View style={[stateStyles.errorContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="information-circle-outline" size={48} color={colors.accent} />
          <Text style={[stateStyles.errorText, { color: colors.accent }]}>
            {error}
          </Text>
          <Text style={[stateStyles.errorSubText, { color: colors.subText }]}>
            {seen.length < 3 ? 'Go to the Add Movie tab to rate more movies.' : 'This may be temporary. Try again or select a different filter combination.'}
          </Text>
          <TouchableOpacity
            style={[stateStyles.retryButton, { backgroundColor: colors.accent }]}
            onPress={handleRetry}
            activeOpacity={0.7}
          >
            <Text style={[stateStyles.retryButtonText, { color: colors.background }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Return early if movies aren't loaded yet
  if (!seenMovie || !newMovie) return null;

  // Check if this is a known vs known comparison for UI display
  const isKnownVsKnown = seen.some(m => m.id === newMovie.id);

  // Main UI
  return (
    <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header section with themed gradient */}
      <ThemedHeader mediaType={mediaType} isDarkMode={isDarkMode} theme={theme}>
        <Text style={headerStyles.screenTitle}>
          {isKnownVsKnown ? 'Compare Your Ratings' : 
            baselineComplete ? 'Movie Recommendations' : 'Movie Ratings'}
        </Text>
        <View style={styles.actionRow}>
          {lastAction && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleUndo}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-undo" size={24} color={colors.accent} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={openFilterModal}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={24} color={colors.accent} />
            {hasActiveFilters && (
              <View style={[styles.filterBadge, { backgroundColor: colors.secondary }]} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </ThemedHeader>

      {/* Main comparison content */}
      <View style={compareStyles.compareContainer}>
        <View style={compareStyles.compareContent}>
          <Text style={compareStyles.compareTitle}>
            {isKnownVsKnown ? 'Which movie do you prefer?' : 'Which movie was better?'}
          </Text>
          
          <View style={compareStyles.compareMovies}>
            {/* Left Movie */}
            <TouchableOpacity
              style={compareStyles.posterContainer}
              onPress={handleSeenWin}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: getPosterUrl(seenMovie.poster || seenMovie.poster_path) }}
                style={compareStyles.poster}
                resizeMode="cover"
              />
              <View style={compareStyles.posterOverlay}>
                <Text 
  style={compareStyles.movieTitle} 
  numberOfLines={1}
  adjustsFontSizeToFit={true}
  minimumFontScale={10}
  ellipsizeMode="tail"
  allowFontScaling={false}
>
  {seenMovie.title}
</Text>
                
                {/* Streaming service icons - limit to 3 */}
                <View style={compareStyles.streamingContainer}>
                  {seenMovie.streamingServices && seenMovie.streamingServices.slice(0, 3).map((service) => {
                    const serviceData = streamingProviders.find(s => s.id === service.provider_id);
                    if (serviceData && serviceData.logo_url) {
                      return (
                        <Image
                          key={service.provider_id}
                          source={{ uri: serviceData.logo_url }}
                          style={[
                            compareStyles.streamingIcon,
                            service.paymentType === 'paid' && styles.paidIcon,
                            service.paymentType === 'free' && styles.freeIcon
                          ]}
                          resizeMode="contain"
                        />
                      );
                    }
                    return null;
                  })}
                </View>
                
                <Text 
                  style={compareStyles.ratingTag}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                >
                  Your rating: {seenMovie.userRating.toFixed(1)}
                </Text>
                <Text 
                  style={compareStyles.genreText} 
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                  ellipsizeMode="tail"
                >
                  {(seenMovie.genre_ids || seenMovie.genreIds || [])
                    .slice(0, 2) // Limit to 2 genres
                    .map(id => genres[id] || 'Unknown')
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>            </TouchableOpacity>
            
            {/* VS Section */}
            <View style={compareStyles.vsContainer}>
              <Text style={compareStyles.vsText}>VS</Text>
            </View>
            
            {/* Right Movie */}
            <TouchableOpacity
              style={compareStyles.posterContainer}
              onPress={handleNewWin}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: getPosterUrl(newMovie.poster || newMovie.poster_path) }}
                style={compareStyles.poster}
                resizeMode="cover"
              />
                
               <View style={compareStyles.posterOverlay}>
  <Text 
    style={compareStyles.movieTitle} 
    numberOfLines={1}
    adjustsFontSizeToFit={true}
    minimumFontScale={10}
    ellipsizeMode="tail"
    allowFontScaling={false}
  >
    {newMovie.title}
  </Text>
                
                {/* Streaming service icons - limit to 3 */}
                <View style={compareStyles.streamingContainer}>
                  {newMovie.streamingServices && newMovie.streamingServices.slice(0, 3).map((service) => {
                    const serviceData = streamingProviders.find(s => s.id === service.provider_id);
                    if (serviceData && serviceData.logo_url) {
                      return (
                        <Image
                          key={service.provider_id}
                          source={{ uri: serviceData.logo_url }}
                          style={[
                            compareStyles.streamingIcon,
                            service.paymentType === 'paid' && styles.paidIcon,
                            service.paymentType === 'free' && styles.freeIcon
                          ]}
                          resizeMode="contain"
                        />
                      );
                    }
                    return null;
                  })}
                </View>
                
                {isKnownVsKnown || seen.some(m => m.id === newMovie.id) ? (
                  <Text 
                    style={compareStyles.ratingTag}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    Your rating: {newMovie.userRating.toFixed(1)}
                  </Text>
                ) : (
                  <Text 
                    style={compareStyles.ratingTag}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    TMDb: {newMovie.score.toFixed(1)} ({newMovie.release_year || 'Unknown'})
                  </Text>
                )}
                <Text 
                  style={compareStyles.genreText} 
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                  ellipsizeMode="tail"
                >
                  {(newMovie.genre_ids || newMovie.genreIds || [])
                    .slice(0, 2) // Limit to 2 genres
                    .map(id => genres[id] || 'Unknown')
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={compareStyles.actionButtons}>
            <TouchableOpacity
              style={compareStyles.toughButton}
              onPress={handleToughChoice}
              activeOpacity={0.7}
            >
              <Text style={compareStyles.toughButtonText}>
                Too tough to decide
              </Text>
            </TouchableOpacity>
            
            {!isKnownVsKnown && !seen.some(m => m.id === newMovie.id) && (
              <TouchableOpacity
                style={compareStyles.unseenButton}
                onPress={handleUnseen}
                activeOpacity={0.7}
              >
                <Text style={compareStyles.unseenButtonText}>
                  Add to watchlist
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={compareStyles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={compareStyles.skipButtonText}>
                Skip
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Enhanced Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={cancelFilters}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.enhancedModalContent}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filter Movies
              </Text>
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={clearAllFilters}
                activeOpacity={0.7}
              >
                <Text style={[styles.clearAllText, { color: colors.accent }]}>
                  Clear All
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalScrollContainer}>
              <ScrollView 
                style={styles.modalScrollView} 
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
              >
              
              {/* Genre Filter Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Genres ({tempGenres.length} selected)
                </Text>
                <View style={styles.optionsGrid}>
                  {genres && Object.keys(genres).length > 0 ? (
                    Object.entries(genres)
                      .filter(([id, name]) => name && name.trim() !== '')
                      .map(([id, name]) => (
                        <TouchableOpacity
                          key={id}
                          style={[
                            styles.optionChip,
                            { 
                              backgroundColor: tempGenres.includes(id)
                                ? colors.primary 
                                : 'transparent',
                              borderColor: colors.primary
                            }
                          ]}
                          onPress={() => toggleGenre(id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.optionChipText,
                            { 
                              color: tempGenres.includes(id)
                                ? '#FFFFFF' 
                                : colors.subText
                            }
                          ]}>
                            {name}
                          </Text>
                        </TouchableOpacity>
                      ))
                  ) : (
                    <Text style={[
                      styles.optionChipText,
                      { color: colors.secondary, padding: 10 }
                    ]}>
                      No genres available
                    </Text>
                  )}
                </View>
              </View>

              {/* Decade Filter Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Decades ({tempDecades.length} selected)
                </Text>
                <View style={styles.optionsGrid}>
                  {DECADES.map((decade) => (
                    <TouchableOpacity
                      key={decade.value}
                      style={[
                        styles.optionChip,
                        { 
                          backgroundColor: tempDecades.includes(decade.value)
                            ? colors.primary 
                            : 'transparent',
                          borderColor: colors.primary
                        }
                      ]}
                      onPress={() => toggleDecade(decade.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.optionChipText,
                        { 
                          color: tempDecades.includes(decade.value)
                            ? '#FFFFFF' 
                            : colors.subText
                        }
                      ]}>
                        {decade.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              </ScrollView>
            </View>
            
            {/* Modal Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: colors.primary }
                ]}
                onPress={cancelFilters}
              >
                <Text style={[
                  styles.cancelButtonText,
                  { color: colors.subText }
                ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  { backgroundColor: colors.accent }
                ]}
                onPress={applyFilters}
              >
                <Text style={[
                  styles.applyButtonText,
                  { color: colors.background }
                ]}>
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// Themed styles using minimal custom styles - everything else uses theme system
const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 16,
    padding: 4,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedModalContent: {
    width: '95%',
    maxHeight: '85%',
    elevation: 10,
    shadowOpacity: 0.5,
    borderRadius: 12,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  clearAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalScrollContainer: {
    flex: 1,
    minHeight: 300,
    maxHeight: 500,
  },
  modalScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollViewContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  filterSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: 10,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  applyButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
// REPLACE WITH:
  // Streaming styles are now in compareStyles - remove these old styles

// Keep these icon styles:
  freeIcon: {
    borderColor: '#22C55E',
  },
  paidIcon: {
    borderColor: '#FF4444',
  },
  freeIcon: {
    borderColor: '#22C55E',
  },
  paidIcon: {
    borderColor: '#FF4444',
  },
});

WildcardScreen.defaultProps = {
  seen: [],
  unseen: [],
  genres: {},
  skippedMovies: [],
  addToSkippedMovies: () => {},
  removeFromSkippedMovies: () => {}
};

export default WildcardScreen;