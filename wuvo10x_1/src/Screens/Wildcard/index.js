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


// Import constants
import { 
  TMDB_API_KEY, 
  MIN_VOTE_COUNT, 
  MIN_SCORE, 
  STORAGE_KEY_MOVIES, 
  STORAGE_KEY_TV, 
  BASELINE_COMPLETE_KEY_MOVIES, 
  BASELINE_COMPLETE_KEY_TV, 
  COMPARISON_COUNT_KEY_MOVIES, 
  COMPARISON_COUNT_KEY_TV, 
  COMPARISON_PATTERN_KEY_MOVIES, 
  COMPARISON_PATTERN_KEY_TV, 
  STREAMING_CACHE_KEY, 
  API_TIMEOUT 
} from '../../Constants';

const API_KEY = TMDB_API_KEY;
import stateStyles from '../../Styles/StateStyles';
// Streaming services with their TMDB provider IDs
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

// Provider consolidation mapping
const PROVIDER_CONSOLIDATION = {
  9: { displayId: 9, displayName: 'Prime Video' },
  10: { displayId: 9, displayName: 'Prime Video' },
  2100: { displayId: 9, displayName: 'Prime Video' },
  350: { displayId: 350, displayName: 'Apple TV+' },
  2: { displayId: 350, displayName: 'Apple TV+' },
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

// High-quality movie IDs for baseline comparisons
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

// High-quality TV show IDs for baseline comparisons
const baselineTVIds = [
  1399, 46648, 62286, 1396, 60059, 1668, 456, 4614, 1390, 4026,
  1434, 18165, 46261, 1402, 2316, 1429, 1398, 1622, 31911, 46952,
  73586, 60735, 1100, 46648, 1408, 67915, 1433, 1403, 4607, 1399,
  1412, 1413, 1415, 1405, 1407, 46261, 1409, 1399, 1410, 1411
];

const uniqueBaselineMovieIds = [...new Set(baselineMovieIds)];
const uniqueBaselineTVIds = [...new Set(baselineTVIds)];

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
  const layoutStyles = getLayoutStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const headerStyles = getHeaderStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const buttonStyles = getButtonStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const modalStyles = getModalStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const movieCardStyles = getMovieCardStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const compareStyles = getCompareStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  
  // Get theme colors for this media type and mode
  const colors = theme[mediaType][isDarkMode ? 'dark' : 'light'];

  // Separate state for movies and TV shows
  const [seenContent, setSeenContent] = useState(null);
  const [newContent, setNewContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  
  // Separate compared content tracking for movies and TV
  const [comparedMovies, setComparedMovies] = useState([]);
  const [comparedTV, setComparedTV] = useState([]);
  const [baselineCompleteMovies, setBaselineCompleteMovies] = useState(false);
  const [baselineCompleteTV, setBaselineCompleteTV] = useState(false);
  const [comparisonCountMovies, setComparisonCountMovies] = useState(0);
  const [comparisonCountTV, setComparisonCountTV] = useState(0);
  const [comparisonPatternMovies, setComparisonPatternMovies] = useState(0);
  const [comparisonPatternTV, setComparisonPatternTV] = useState(0);
  
  // Filter state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedDecades, setSelectedDecades] = useState([]);
  const [selectedStreamingServices, setSelectedStreamingServices] = useState([]);
  const [tempGenres, setTempGenres] = useState([]);
  const [tempDecades, setTempDecades] = useState([]);
  const [tempStreamingServices, setTempStreamingServices] = useState([]);
 const [streamingProviders, setStreamingProviders] = useState([]);
 const [streamingCache, setStreamingCache] = useState(new Map());
 const [currentWuvoState, setCurrentWuvoState] = useState(null);
 const [wuvoProgress, setWuvoProgress] = useState(0);
 const [wuvoTargetMovie, setWuvoTargetMovie] = useState(null);
 const [wuvoCompletedCount, setWuvoCompletedCount] = useState(0);
  const [filteredContentPool, setFilteredContentPool] = useState([]);
  const [isLoadingFilteredPool, setIsLoadingFilteredPool] = useState(false);
  
  // Refs to prevent race conditions and track component state
  const isLoadingRef = useRef(false);
  const appReady = useRef(false);
  const isMountedRef = useRef(true);

  // Helper functions to get current data based on media type
  const getCurrentSeen = useCallback(() => {
    return seen.filter(item => (item.mediaType || 'movie') === mediaType);
  }, [seen, mediaType]);

  const getCurrentUnseen = useCallback(() => {
    return unseen.filter(item => (item.mediaType || 'movie') === mediaType);
  }, [unseen, mediaType]);

  const getCurrentCompared = useCallback(() => {
    return mediaType === 'movie' ? comparedMovies : comparedTV;
  }, [mediaType, comparedMovies, comparedTV]);

  const setCurrentCompared = useCallback((value) => {
    if (mediaType === 'movie') {
      setComparedMovies(typeof value === 'function' ? value(comparedMovies) : value);
    } else {
      setComparedTV(typeof value === 'function' ? value(comparedTV) : value);
    }
  }, [mediaType, comparedMovies, comparedTV]);

  const getCurrentBaselineComplete = useCallback(() => {
    return mediaType === 'movie' ? baselineCompleteMovies : baselineCompleteTV;
  }, [mediaType, baselineCompleteMovies, baselineCompleteTV]);

  const setCurrentBaselineComplete = useCallback((value) => {
    if (mediaType === 'movie') {
      setBaselineCompleteMovies(value);
    } else {
      setBaselineCompleteTV(value);
    }
  }, [mediaType]);

  const getCurrentComparisonCount = useCallback(() => {
    return mediaType === 'movie' ? comparisonCountMovies : comparisonCountTV;
  }, [mediaType, comparisonCountMovies, comparisonCountTV]);

  const setCurrentComparisonCount = useCallback((value) => {
    if (mediaType === 'movie') {
      setComparisonCountMovies(typeof value === 'function' ? value(comparisonCountMovies) : value);
    } else {
      setComparisonCountTV(typeof value === 'function' ? value(comparisonCountTV) : value);
    }
  }, [mediaType, comparisonCountMovies, comparisonCountTV]);

  const getCurrentComparisonPattern = useCallback(() => {
    return mediaType === 'movie' ? comparisonPatternMovies : comparisonPatternTV;
  }, [mediaType, comparisonPatternMovies, comparisonPatternTV]);

  const setCurrentComparisonPattern = useCallback((value) => {
    if (mediaType === 'movie') {
      setComparisonPatternMovies(typeof value === 'function' ? value(comparisonPatternMovies) : value);
    } else {
      setComparisonPatternTV(typeof value === 'function' ? value(comparisonPatternTV) : value);
    }
  }, [mediaType, comparisonPatternMovies, comparisonPatternTV]);

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
      const cacheObject = Object.fromEntries(cache);
      await AsyncStorage.setItem(STREAMING_CACHE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Failed to save streaming cache:', error);
    }
  }, []);

  /**
   * Get streaming data for content (with caching)
   */
  const getContentStreamingData = useCallback(async (contentId) => {
    if (streamingCache.has(contentId.toString())) {
      return streamingCache.get(contentId.toString());
    }

    try {
      const endpoint = mediaType === 'movie' 
        ? `https://api.themoviedb.org/3/movie/${contentId}/watch/providers?api_key=${API_KEY}`
        : `https://api.themoviedb.org/3/tv/${contentId}/watch/providers?api_key=${API_KEY}`;
        
      const streamingResponse = await fetchWithTimeout(endpoint);

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
      newCache.set(contentId.toString(), streamingServices);
      setStreamingCache(newCache);
      saveStreamingCache(newCache);

      return streamingServices;
    } catch (error) {
      console.error(`Error fetching streaming for ${mediaType} ${contentId}:`, error);
      return [];
    }
  }, [streamingCache, saveStreamingCache, mediaType]);

  /**
   * Build filtered content pool based on current filters
   */
  const buildFilteredContentPool = useCallback(async () => {
    if (isLoadingFilteredPool) return;

    console.log(`🔍 Building filtered ${mediaType} pool with filters:`, {
      genres: selectedGenres,
      decades: selectedDecades,
      streaming: selectedStreamingServices
    });
    setIsLoadingFilteredPool(true);

    try {
      const baseUrl = mediaType === 'movie' 
        ? `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&vote_count.gte=${MIN_VOTE_COUNT}&include_adult=false`
        : `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&vote_count.gte=${MIN_VOTE_COUNT}&include_adult=false`;
        
      let apiUrl = baseUrl;

      // Apply decade filters
      if (selectedDecades.length > 0) {
        const dateRanges = selectedDecades.map(decade => {
          const decadeInfo = DECADES.find(d => d.value === decade);
          return decadeInfo ? { start: decadeInfo.startYear, end: decadeInfo.endYear } : null;
        }).filter(Boolean);

        if (dateRanges.length > 0) {
          const startYear = Math.min(...dateRanges.map(r => r.start));
          const endYear = Math.max(...dateRanges.map(r => r.end));
          const dateParam = mediaType === 'movie' 
            ? `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31`
            : `&first_air_date.gte=${startYear}-01-01&first_air_date.lte=${endYear}-12-31`;
          apiUrl += dateParam;
          console.log(`📅 Date filter applied: ${startYear}-${endYear}`);
        }
      }

      // Apply genre filters
      if (selectedGenres.length > 0) {
        apiUrl += `&with_genres=${selectedGenres.join(',')}`;
        console.log(`🎭 Genre filter applied: ${selectedGenres.join(',')}`);
      }

      // Create exclusion set
      const currentSeen = getCurrentSeen();
      const currentUnseen = getCurrentUnseen();
      const currentCompared = getCurrentCompared();
      
      const excludedIds = new Set();
      currentSeen.forEach(content => excludedIds.add(content.id));
      currentUnseen.forEach(content => excludedIds.add(content.id));
      currentCompared.forEach(id => excludedIds.add(id));
      skippedMovies.forEach(id => excludedIds.add(id));

      console.log(`🚫 Excluding ${excludedIds.size} already seen/compared ${mediaType}s`);

      // Get multiple pages to have better selection
      const allContent = [];
      const maxPages = 3;

      for (let page = 1; page <= maxPages; page++) {
        try {
          const response = await fetchWithTimeout(`${apiUrl}&page=${page}`);
          if (!response.ok) continue;

          const data = await response.json();
          const pageContent = data.results.filter(m =>
            m.poster_path &&
            m.vote_average >= MIN_SCORE &&
            !excludedIds.has(m.id)
          );
          
          allContent.push(...pageContent);
          console.log(`📄 Page ${page}: Found ${pageContent.length} eligible ${mediaType}s`);
          
          if (allContent.length >= 30) break;
        } catch (error) {
          console.log(`Error fetching page ${page}:`, error);
          continue;
        }
      }

      console.log(`🎬 Total ${mediaType}s found matching genre/decade filters: ${allContent.length}`);

      // If no streaming filter, we're done
      if (selectedStreamingServices.length === 0) {
        setFilteredContentPool(allContent.slice(0, 20));
        setIsLoadingFilteredPool(false);
        return;
      }

      // For streaming filters, check each content item
      console.log(`🎥 Checking streaming availability for ${selectedStreamingServices.length} services...`);
      const streamingFilteredContent = [];
      
      for (let i = 0; i < Math.min(allContent.length, 20); i++) {
        const content = allContent[i];
        try {
          const streamingServices = await getContentStreamingData(content.id);
          
          const hasSelectedService = streamingServices.some(service => {
            const consolidatedService = PROVIDER_CONSOLIDATION[service.provider_id];
            const serviceId = consolidatedService ? consolidatedService.displayId : service.provider_id;
            return selectedStreamingServices.includes(serviceId.toString());
          });

          if (hasSelectedService) {
            streamingFilteredContent.push({
              ...content,
              streamingServices: streamingServices
            });
            console.log(`✅ ${content.title || content.name} available on selected streaming service`);
          } else {
            console.log(`❌ ${content.title || content.name} not available on selected services`);
          }
          
          if (streamingFilteredContent.length >= 15) break;
        } catch (error) {
          console.log(`❌ Error checking streaming for ${content.title || content.name}:`, error);
          continue;
        }
      }

      setFilteredContentPool(streamingFilteredContent);
      console.log(`🎯 Final filtered ${mediaType} pool ready: ${streamingFilteredContent.length} items`);
      
    } catch (error) {
      console.error(`❌ Error building filtered ${mediaType} pool:`, error);
      setFilteredContentPool([]);
    } finally {
      setIsLoadingFilteredPool(false);
    }
  }, [selectedDecades, selectedGenres, selectedStreamingServices, getCurrentSeen, getCurrentUnseen, getCurrentCompared, skippedMovies, getContentStreamingData, mediaType]);

  /**
   * Get content details with streaming data
   */
  const getContentDetails = useCallback(async (contentId) => {
    try {
      const endpoint = mediaType === 'movie' 
        ? `https://api.themoviedb.org/3/movie/${contentId}?api_key=${API_KEY}&language=en-US`
        : `https://api.themoviedb.org/3/tv/${contentId}?api_key=${API_KEY}&language=en-US`;
        
      const response = await fetchWithTimeout(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const streamingServices = await getContentStreamingData(contentId);
      
      return {
        id: data.id,
        title: mediaType === 'movie' ? data.title : data.name,
        score: data.vote_average,
        voteCount: data.vote_count,
        poster: data.poster_path,
        overview: data.overview,
        release_date: mediaType === 'movie' ? (data.release_date || 'Unknown') : (data.first_air_date || 'Unknown'),
        genre_ids: data.genres.map(g => g.id).slice(0, 3),
        release_year: mediaType === 'movie' 
          ? new Date(data.release_date).getFullYear() 
          : new Date(data.first_air_date).getFullYear(),
        eloRating: data.vote_average * 10,
        userRating: data.vote_average,
        streamingServices: streamingServices,
        mediaType: mediaType
      };
    } catch (error) {
      console.error(`Error fetching details for ${mediaType} ${contentId}:`, error);
      throw error;
    }
  }, [getContentStreamingData, mediaType]);

  const getFilteredContent = useCallback(async () => {
    const baseUrl = mediaType === 'movie' 
      ? `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&vote_count.gte=${MIN_VOTE_COUNT}`
      : `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&vote_count.gte=${MIN_VOTE_COUNT}`;
      
    let apiUrl = baseUrl;
    
    if (selectedDecades.length > 0) {
      const dateRanges = selectedDecades.map(decade => {
        const decadeInfo = DECADES.find(d => d.value === decade);
        return decadeInfo ? { start: decadeInfo.startYear, end: decadeInfo.endYear } : null;
      }).filter(Boolean);
      if (dateRanges.length > 0) {
        const startYear = Math.min(...dateRanges.map(r => r.start));
        const endYear = Math.max(...dateRanges.map(r => r.end));
        const dateParam = mediaType === 'movie' 
          ? `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31`
          : `&first_air_date.gte=${startYear}-01-01&first_air_date.lte=${endYear}-12-31`;
        apiUrl += dateParam;
      }
    }
    if (selectedGenres.length > 0) {
      apiUrl += `&with_genres=${selectedGenres.join(',')}`;
    }
    const randomPage = Math.floor(Math.random() * 5) + 1;
    apiUrl += `&page=${randomPage}`;
    const response = await fetchWithTimeout(apiUrl);
    const data = await response.json();
    
    const currentSeen = getCurrentSeen();
    const currentUnseen = getCurrentUnseen();
    const currentCompared = getCurrentCompared();
    
    const excludedIds = new Set([
      ...currentSeen.map(m => m.id), 
      ...currentUnseen.map(m => m.id), 
      ...currentCompared, 
      ...skippedMovies
    ]);
    
    const eligibleContent = data.results.filter(m =>
      m.poster_path && m.vote_average >= MIN_SCORE && !excludedIds.has(m.id)
    );
    if (eligibleContent.length === 0) {
      throw new Error(`No ${mediaType === 'movie' ? 'movies' : 'TV shows'} found matching your filters`);
    }
    const randomContent = eligibleContent[Math.floor(Math.random() * eligibleContent.length)];
    return await getContentDetails(randomContent.id);
  }, [selectedDecades, selectedGenres, getCurrentSeen, getCurrentUnseen, getCurrentCompared, skippedMovies, getContentDetails, mediaType]);

  /**
   * Reset function - clears all comparison data but keeps user ratings
   */
  const handleReset = useCallback(async () => {
    const contentType = mediaType === 'movie' ? 'movie' : 'TV show';
    Alert.alert(
      "Reset Wildcard",
      `Are you sure you want to reset the wildcard screen? This will clear all ${contentType} comparison data but keep your ratings.`,
     [
       { text: "Cancel", style: "cancel" },
       { 
         text: "Reset", 
         style: "destructive",
         onPress: async () => {
           try {
             safeSetState(setLoading, true);
             
             // Clear storage for current media type
             const storageKey = mediaType === 'movie' ? STORAGE_KEY_MOVIES : STORAGE_KEY_TV;
             const baselineKey = mediaType === 'movie' ? BASELINE_COMPLETE_KEY_MOVIES : BASELINE_COMPLETE_KEY_TV;
             const countKey = mediaType === 'movie' ? COMPARISON_COUNT_KEY_MOVIES : COMPARISON_COUNT_KEY_TV;
             const patternKey = mediaType === 'movie' ? COMPARISON_PATTERN_KEY_MOVIES : COMPARISON_PATTERN_KEY_TV;
             
             await AsyncStorage.removeItem(storageKey);
             await AsyncStorage.removeItem(baselineKey);
             await AsyncStorage.removeItem(countKey);
             await AsyncStorage.removeItem(patternKey);
             
             // Reset state for current media type
             setCurrentCompared([]);
             setCurrentBaselineComplete(false);
             setCurrentComparisonCount(0);
             setCurrentComparisonPattern(0);
             safeSetState(setLastAction, null);
             safeSetState(setSeenContent, null);
             safeSetState(setNewContent, null);
             safeSetState(setError, null);
             safeSetState(setFilteredContentPool, []);
             
             isLoadingRef.current = false;
             
             setTimeout(() => {
               if (isMountedRef.current) {
                 fetchRandomContent();
               }
             }, 300);
             
             console.log(`${contentType} wildcard state reset successfully`);
           } catch (e) {
             console.error('Failed to reset wildcard state', e);
             setErrorState('Failed to reset. Please try again.');
           }
         }
       }
     ]
   );
 }, [safeSetState, setErrorState, mediaType, setCurrentCompared, setCurrentBaselineComplete, setCurrentComparisonCount, setCurrentComparisonPattern]);

 /**
  * Fetch streaming providers with logos from TMDB API
  */
 const fetchStreamingProviders = useCallback(async () => {
   try {
     const endpoint = mediaType === 'movie'
       ? `https://api.themoviedb.org/3/watch/providers/movie?api_key=${API_KEY}&watch_region=US`
       : `https://api.themoviedb.org/3/watch/providers/tv?api_key=${API_KEY}&watch_region=US`;
       
     const response = await fetchWithTimeout(endpoint);
     
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
 }, [mediaType]);

 const updateContentRating = useCallback((contentToUpdate, newRating) => {
   const updatedContent = {
     ...contentToUpdate,
     userRating: newRating,
     eloRating: newRating * 10,
     gamesPlayed: (contentToUpdate.gamesPlayed || 0) + 1,
     mediaType: mediaType
   };
   
   console.log(`Updating ${mediaType}: ${updatedContent.title} from ${contentToUpdate.userRating || 'unrated'} to ${newRating}`);
   
   setSeen(currentSeen => {
     const contentExists = currentSeen.some(m => m.id === contentToUpdate.id && (m.mediaType || 'movie') === mediaType);
     
     if (contentExists) {
       const updatedSeen = currentSeen.map(m => 
         m.id === contentToUpdate.id && (m.mediaType || 'movie') === mediaType ? updatedContent : m
       );
       console.log(`Updated existing ${mediaType} in seen list: ${updatedContent.title}`);
       return updatedSeen;
     } else {
       console.log(`Adding new ${mediaType} to seen list: ${updatedContent.title}`);
       return [...currentSeen, updatedContent];
     }
   });
   
   onAddToSeen(updatedContent);
   return updatedContent;
 }, [setSeen, onAddToSeen, mediaType]);

 const getNextBaselineContentId = useCallback(() => {
   const baselineIds = mediaType === 'movie' ? uniqueBaselineMovieIds : uniqueBaselineTVIds;
   const currentCompared = getCurrentCompared();
   const currentSeen = getCurrentSeen();
   const currentBaselineComplete = getCurrentBaselineComplete();
   
   const remainingBaselineIds = baselineIds.filter(
     id => !currentCompared.includes(id) && !currentSeen.some(sm => sm.id === id)
   );
   
   if (remainingBaselineIds.length === 0) {
     if (!currentBaselineComplete) {
       setCurrentBaselineComplete(true);
       setCurrentComparisonPattern(0);
     }
     return null;
   }
   
   return remainingBaselineIds[Math.floor(Math.random() * remainingBaselineIds.length)];
 }, [getCurrentCompared, getCurrentSeen, getCurrentBaselineComplete, setCurrentBaselineComplete, setCurrentComparisonPattern, mediaType]);

const markContentAsCompared = useCallback((contentId) => {
  const currentCompared = getCurrentCompared();
  if (!currentCompared.includes(contentId)) {
    setCurrentCompared(prev => [...prev, contentId]);
  }
  
  setCurrentComparisonCount(prev => prev + 1);
  setCurrentComparisonPattern(prev => (prev + 1) % 5);
}, [getCurrentCompared, setCurrentCompared, setCurrentComparisonCount, setCurrentComparisonPattern]);

const setCurrentWuvoState = useCallback(async (state) => {
  const key = mediaType === 'movie' ? 'wuvo_wuvo_state_movies' : 'wuvo_wuvo_state_tv';
  await AsyncStorage.setItem(key, JSON.stringify(state));
  setCurrentWuvoState(state);
}, [mediaType]);

const getCurrentWuvoState = useCallback(async () => {
  const key = mediaType === 'movie' ? 'wuvo_wuvo_state_movies' : 'wuvo_wuvo_state_tv';
  const stored = await AsyncStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
}, [mediaType]);

const setWuvoProgressState = useCallback(async (progress) => {
  const key = mediaType === 'movie' ? 'wuvo_progress_movies' : 'wuvo_progress_tv';
  await AsyncStorage.setItem(key, JSON.stringify(progress));
  setWuvoProgress(progress);
}, [mediaType]);

const getWuvoProgressState = useCallback(async () => {
  const key = mediaType === 'movie' ? 'wuvo_progress_movies' : 'wuvo_progress_tv';
  const stored = await AsyncStorage.getItem(key);
  return stored ? JSON.parse(stored) : 0;
}, [mediaType]);

 /**
  * Main function to fetch content for comparison
  */
const fetchRandomContent = useCallback(async () => {
 // Load stored state and streaming cache on mount
 useEffect(() => {
   const loadStoredState = async () => {
     try {
       // Load movie data
       const jsonValueMovies = await AsyncStorage.getItem(STORAGE_KEY_MOVIES);
       if (jsonValueMovies != null && isMountedRef.current) {
         setComparedMovies(JSON.parse(jsonValueMovies));
       }
       
       // Load TV data
       const jsonValueTV = await AsyncStorage.getItem(STORAGE_KEY_TV);
       if (jsonValueTV != null && isMountedRef.current) {
         setComparedTV(JSON.parse(jsonValueTV));
       }
       
       // Load baseline completion states
       const baselineCompleteMoviesValue = await AsyncStorage.getItem(BASELINE_COMPLETE_KEY_MOVIES);
       const isBaselineCompleteMovies = baselineCompleteMoviesValue === 'true';
       if (isMountedRef.current) {
         setBaselineCompleteMovies(isBaselineCompleteMovies);
       }
       
       const baselineCompleteTVValue = await AsyncStorage.getItem(BASELINE_COMPLETE_KEY_TV);
       const isBaselineCompleteTV = baselineCompleteTVValue === 'true';
       if (isMountedRef.current) {
         setBaselineCompleteTV(isBaselineCompleteTV);
       }
       
       // Load comparison counts
       const countValueMovies = await AsyncStorage.getItem(COMPARISON_COUNT_KEY_MOVIES);
       if (countValueMovies != null && isMountedRef.current) {
         setComparisonCountMovies(parseInt(countValueMovies, 10));
       }
       
       const countValueTV = await AsyncStorage.getItem(COMPARISON_COUNT_KEY_TV);
       if (countValueTV != null && isMountedRef.current) {
         setComparisonCountTV(parseInt(countValueTV, 10));
       }
       
       // Load comparison patterns
       const patternValueMovies = await AsyncStorage.getItem(COMPARISON_PATTERN_KEY_MOVIES);
       if (patternValueMovies != null && isMountedRef.current) {
         setComparisonPatternMovies(parseInt(patternValueMovies, 10));
       }
       
       const patternValueTV = await AsyncStorage.getItem(COMPARISON_PATTERN_KEY_TV);
       if (patternValueTV != null && isMountedRef.current) {
         setComparisonPatternTV(parseInt(patternValueTV, 10));
       }
       
       // Load streaming cache
       await loadStreamingCache();

       // Load WUVO state
       const wuvoState = await getCurrentWuvoState();
       const wuvoProgressValue = await getWuvoProgressState();
       
       if (wuvoState) {
         setCurrentWuvoState(wuvoState);
       }
       if (wuvoProgressValue > 0) {
         setWuvoProgress(wuvoProgressValue);
       }
       
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

 // Save state changes - separate for movies and TV
 useEffect(() => {
   const saveComparedMovies = async () => {
     try {
       const jsonValue = JSON.stringify(comparedMovies);
       await AsyncStorage.setItem(STORAGE_KEY_MOVIES, jsonValue);
     } catch (e) {
       console.error('Failed to save compared movies', e);
     }
   };
   
   if (comparedMovies.length > 0) {
     saveComparedMovies();
   }
 }, [comparedMovies]);

 useEffect(() => {
   const saveComparedTV = async () => {
     try {
       const jsonValue = JSON.stringify(comparedTV);
       await AsyncStorage.setItem(STORAGE_KEY_TV, jsonValue);
     } catch (e) {
       console.error('Failed to save compared TV shows', e);
     }
   };
   
   if (comparedTV.length > 0) {
     saveComparedTV();
   }
 }, [comparedTV]);

 useEffect(() => {
   const saveBaselineCompleteMovies = async () => {
     try {
       await AsyncStorage.setItem(BASELINE_COMPLETE_KEY_MOVIES, baselineCompleteMovies.toString());
     } catch (e) {
       console.error('Failed to save baseline complete status for movies', e);
     }
   };
   
   saveBaselineCompleteMovies();
 }, [baselineCompleteMovies]);

 useEffect(() => {
   const saveBaselineCompleteTV = async () => {
     try {
       await AsyncStorage.setItem(BASELINE_COMPLETE_KEY_TV, baselineCompleteTV.toString());
     } catch (e) {
       console.error('Failed to save baseline complete status for TV', e);
     }
   };
   
   saveBaselineCompleteTV();
 }, [baselineCompleteTV]);

 useEffect(() => {
   const saveComparisonCountMovies = async () => {
     try {
       await AsyncStorage.setItem(COMPARISON_COUNT_KEY_MOVIES, comparisonCountMovies.toString());
     } catch (e) {
       console.error('Failed to save comparison count for movies', e);
     }
   };
   
   saveComparisonCountMovies();
 }, [comparisonCountMovies]);

 useEffect(() => {
   const saveComparisonCountTV = async () => {
     try {
       await AsyncStorage.setItem(COMPARISON_COUNT_KEY_TV, comparisonCountTV.toString());
     } catch (e) {
       console.error('Failed to save comparison count for TV', e);
     }
   };
   
   saveComparisonCountTV();
 }, [comparisonCountTV]);

 useEffect(() => {
   const saveComparisonPatternMovies = async () => {
     try {
       await AsyncStorage.setItem(COMPARISON_PATTERN_KEY_MOVIES, comparisonPatternMovies.toString());
     } catch (e) {
       console.error('Failed to save comparison pattern for movies', e);
     }
   };
   
   saveComparisonPatternMovies();
 }, [comparisonPatternMovies]);

 useEffect(() => {
   const saveComparisonPatternTV = async () => {
     try {
       await AsyncStorage.setItem(COMPARISON_PATTERN_KEY_TV, comparisonPatternTV.toString());
     } catch (e) {
       console.error('Failed to save comparison pattern for TV', e);
     }
   };
   
   saveComparisonPatternTV();
 }, [comparisonPatternTV]);

 // Rebuild filtered pool when filters change OR when media type changes
 useEffect(() => {
   const hasActiveFilters = selectedGenres.length > 0 || selectedDecades.length > 0;    
   if (hasActiveFilters && appReady.current) {
     console.log('🔄 Filters or media type changed, clearing pool to rebuild on next fetch');
     setFilteredContentPool([]);
   }
 }, [selectedGenres, selectedDecades, selectedStreamingServices, mediaType]);

 // Reset content when media type changes
 useEffect(() => {
   if (appReady.current) {
     console.log(`📺 Media type changed to ${mediaType}, resetting content`);
     setSeenContent(null);
     setNewContent(null);
     setLoading(true);
     setError(null);
     setFilteredContentPool([]);
     isLoadingRef.current = false;
     
     setTimeout(() => {
       if (isMountedRef.current) {
         fetchRandomContent();
       }
     }, 300);
   }
 }, [mediaType]);

 // Initial fetch
 useEffect(() => {
   const initialLoadTimeout = setTimeout(() => {
     if (loading && !seenContent && !newContent && isMountedRef.current) {
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
       
       await fetchRandomContent();
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
         setNewContent(null);
         setSeenContent(null);
         setLoading(true);
         setError(null);
         isLoadingRef.current = false;
         
         try {
           await fetchRandomContent();
         } catch (err) {
           console.error('Error after filter change:', err);
           setErrorState('Something went wrong while loading. Please try again.');
         }
       }
     }, 300);
   }
 }, [selectedGenres, selectedDecades, selectedStreamingServices, tempGenres, tempDecades, tempStreamingServices, fetchRandomContent, setErrorState]);

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

 const adjustRating = useCallback((winner, loser, winnerIsSeenContent) => {
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
   
   return winnerIsSeenContent 
     ? { updatedSeenContent: updatedWinner, updatedNewContent: updatedLoser } 
     : { updatedSeenContent: updatedLoser, updatedNewContent: updatedWinner };
 }, [calculateKFactor]);

 // Update the handleUnseen function (around line 800)
const handleUnseen = useCallback(async () => {
  if (isLoadingRef.current || !seenContent || !newContent || !isMountedRef.current) {
    console.log('Ignoring click while loading or missing content');
    return;
  }
  
  const currentSeen = getCurrentSeen();
  const isKnownVsKnown = currentSeen.some(m => m.id === newContent.id);
  const wuvoState = await getCurrentWuvoState();
  
  // If this is a WUVO, cancel it and start over
  if (wuvoState === 'active' && wuvoTargetMovie && newContent.id === wuvoTargetMovie.id) {
    console.log('🚫 WUVO cancelled - adding to watchlist');
    
    // Reset WUVO state
    await setCurrentWuvoState(null);
    await setWuvoProgressState(0);
    setWuvoTargetMovie(null);
    
    // Add to watchlist
    const newUnseenMovie = {
      ...newContent,
      mediaType: mediaType
    };
    onAddToUnseen(newUnseenMovie);
    
    safeSetState(setLastAction, {
      type: 'wuvo_cancelled',
      seenContent: {...seenContent},
      newContent: {...newContent},
      mediaType: mediaType
    });
  } else if (isKnownVsKnown) {
    const contentType = mediaType === 'movie' ? 'movie' : 'TV show';
    Alert.alert(
      'Already Rated',
      `This ${contentType} is already in your rated list.`,
      [{ text: 'OK' }]
    );
    return;
  } else {
    // Regular watchlist addition
    console.log(`Adding ${newContent.title} to watchlist`);
    
    const newUnseenMovie = {
      ...newContent,
      mediaType: mediaType
    };
    onAddToUnseen(newUnseenMovie);
    
    safeSetState(setLastAction, {
      type: 'watchlist',
      seenContent: {...seenContent},
      newContent: {...newContent},
      mediaType: mediaType
    });
  }
  
  isLoadingRef.current = false;
  safeSetState(setNewContent, null);
  safeSetState(setSeenContent, null);
  safeSetState(setLoading, true);
  
  setTimeout(() => {
    if (isMountedRef.current) {
      fetchRandomContent();
    }
  }, 100);
}, [seenContent, newContent, getCurrentSeen, onAddToUnseen, safeSetState, mediaType, wuvoTargetMovie]);

 const handleNewWin = useCallback(() => {
   if (isLoadingRef.current || !seenContent || !newContent || !isMountedRef.current) {
     console.log('Ignoring click while loading or missing content');
     return;
   }
   
   console.log('=== NEW CONTENT WIN ===');
   
   const currentSeen = getCurrentSeen();
   const isKnownVsKnown = currentSeen.some(m => m.id === newContent.id);
   const { updatedSeenContent, updatedNewContent } = adjustRating(newContent, seenContent, false);
   
   updateContentRating(seenContent, updatedSeenContent.userRating);
   updateContentRating(newContent, updatedNewContent.userRating);
   
   isLoadingRef.current = false;
   
   if (isKnownVsKnown) {
     setCurrentComparisonCount(prev => prev + 1);
     setCurrentComparisonPattern(prev => (prev + 1) % 5);
   } else {
     markContentAsCompared(newContent.id);
   }
   
   safeSetState(setLastAction, {
     type: isKnownVsKnown ? 'known_comparison' : 'comparison',
     seenContent: {...seenContent},
     newContent: {...newContent},
     winnerIsSeenContent: false,
     mediaType: mediaType
   });
   
   safeSetState(setNewContent, null);
   safeSetState(setSeenContent, null);
   safeSetState(setLoading, true);
   
   setTimeout(() => {
     if (isMountedRef.current) {
       fetchRandomContent();
     }
   }, 100);
 }, [seenContent, newContent, getCurrentSeen, adjustRating, updateContentRating, fetchRandomContent, markContentAsCompared, setCurrentComparisonCount, setCurrentComparisonPattern, safeSetState, mediaType]);

 const handleUnseen = useCallback(() => {
   if (isLoadingRef.current || !seenContent || !newContent || !isMountedRef.current) {
     console.log('Ignoring click while loading or missing content');
     return;
   }
   
   const currentSeen = getCurrentSeen();
   const isKnownVsKnown = currentSeen.some(m => m.id === newContent.id);
   
   if (isKnownVsKnown) {
     const contentType = mediaType === 'movie' ? 'movie' : 'TV show';
     Alert.alert(
       'Already Rated',
       `This ${contentType} is already in your rated list. You can't add it to watchlist.`,
       [{ text: 'OK' }]
     );
     return;
   }
   
   markContentAsCompared(newContent.id);
   
   // Add mediaType to the content before adding to unseen
   const contentWithMediaType = {
     ...newContent,
     mediaType: mediaType
   };
   
   onAddToUnseen(contentWithMediaType);
   
   isLoadingRef.current = false;
   
   safeSetState(setLastAction, {
     type: 'unseen',
     content: {...newContent},
     mediaType: mediaType
   });
   
   safeSetState(setNewContent, null);
   safeSetState(setSeenContent, null);
   safeSetState(setLoading, true);
   
   setTimeout(() => {
     if (isMountedRef.current) {
       fetchRandomContent();
     }
   }, 100);
 }, [newContent, onAddToUnseen, fetchRandomContent, markContentAsCompared, seenContent, getCurrentSeen, safeSetState, mediaType]);

 const handleSkip = useCallback(() => {
   if (isLoadingRef.current || !seenContent || !newContent || !isMountedRef.current) {
     console.log('Ignoring click while loading or missing content');
     return;
   }
   
   const currentComparisonPattern = getCurrentComparisonPattern();
   const currentSeen = getCurrentSeen();
   const isKnownVsKnown = currentComparisonPattern === 4 && currentSeen.some(m => m.id === newContent.id);
   
   isLoadingRef.current = false;
   
   if (isKnownVsKnown) {
     setCurrentComparisonCount(prev => prev + 1);
     setCurrentComparisonPattern(prev => (prev + 1) % 5);
   } else {
     markContentAsCompared(newContent.id);
   }
   
   safeSetState(setLastAction, {
     type: 'skip',
     seenContent: {...seenContent},
     newContent: {...newContent},
     isKnownVsKnown: isKnownVsKnown,
     mediaType: mediaType
   });
   
   safeSetState(setNewContent, null);
   safeSetState(setSeenContent, null);
   safeSetState(setLoading, true);
   
   setTimeout(() => {
     if (isMountedRef.current) {
       fetchRandomContent();
     }
   }, 100);
 }, [seenContent, newContent, fetchRandomContent, markContentAsCompared, getCurrentComparisonPattern, getCurrentSeen, setCurrentComparisonCount, setCurrentComparisonPattern, safeSetState, mediaType]);

 const handleToughChoice = useCallback(() => {
   if (isLoadingRef.current || !seenContent || !newContent || !isMountedRef.current) {
     console.log('Ignoring click while loading or missing content');
     return;
   }
   
   console.log('=== TOUGH CHOICE ===');
   
   const currentSeen = getCurrentSeen();
   const isKnownVsKnown = currentSeen.some(m => m.id === newContent.id);
   let newSeenRating, newContentRating;
   
   isLoadingRef.current = false;
   
   if (isKnownVsKnown) {
     const avgRating = (seenContent.userRating + newContent.userRating) / 2;
     newSeenRating = Math.min(10, Math.max(1, avgRating + 0.05));
     newContentRating = Math.min(10, Math.max(1, avgRating - 0.05));
     
     setCurrentComparisonCount(prev => prev + 1);
     setCurrentComparisonPattern(prev => (prev + 1) % 5);
   } else {
     markContentAsCompared(newContent.id);
     
     const averageRating = (seenContent.userRating + (newContent.userRating || newContent.score)) / 2;
     
     const seenRating = seenContent.userRating;
     const newRating = newContent.userRating || newContent.score;
     
     if (seenRating <= newRating) {
       newSeenRating = Math.min(10, Math.max(1, averageRating + 0.1));
       newContentRating = Math.max(1, Math.min(10, averageRating - 0.1));
     } else {
       newContentRating = Math.min(10, Math.max(1, averageRating + 0.1));
       newSeenRating = Math.max(1, Math.min(10, averageRating - 0.1));
     }
   }
   
   updateContentRating(seenContent, newSeenRating);
   updateContentRating(newContent, newContentRating);
   
   safeSetState(setLastAction, {
     type: isKnownVsKnown ? 'tough_known' : 'tough',
     seenContent: {...seenContent},
     newContent: {...newContent},
     mediaType: mediaType
   });
   
   safeSetState(setNewContent, null);
   safeSetState(setSeenContent, null);
   safeSetState(setLoading, true);
   
   setTimeout(() => {
     if (isMountedRef.current) {
       fetchRandomContent();
     }
   }, 100);
 }, [seenContent, newContent, getCurrentSeen, updateContentRating, fetchRandomContent, markContentAsCompared, setCurrentComparisonCount, setCurrentComparisonPattern, safeSetState, mediaType]);

 const handleUndo = () => {
   if (!lastAction || isLoadingRef.current) return;
   
   // Only undo if it's for the current media type
   if (lastAction.mediaType !== mediaType) return;
   
   let filteredSeen, restoredSeen, filteredUnseen;
   const currentSeen = getCurrentSeen();
   const currentUnseen = getCurrentUnseen();
   
   switch (lastAction.type) {
     case 'comparison':
       filteredSeen = seen.filter(m => m.id !== lastAction.newContent.id || (m.mediaType || 'movie') !== mediaType);
       restoredSeen = seen.map(m => 
         m.id === lastAction.seenContent.id && (m.mediaType || 'movie') === mediaType ? lastAction.seenContent : m
       );
       
       setSeen(restoredSeen);
       setCurrentCompared(prev => prev.filter(id => id !== lastAction.newContent.id));
       setCurrentComparisonCount(prev => Math.max(0, prev - 1));
       setCurrentComparisonPattern(prev => (prev - 1 + 5) % 5);
       
       setSeenContent(lastAction.seenContent);
       setNewContent(lastAction.newContent);
       setLoading(false);
       break;
       
     case 'known_comparison':
       restoredSeen = seen.map(m => {
         if (m.id === lastAction.seenContent.id && (m.mediaType || 'movie') === mediaType) return lastAction.seenContent;
         if (m.id === lastAction.newContent.id && (m.mediaType || 'movie') === mediaType) return lastAction.newContent;
         return m;
       });
       
       setSeen(restoredSeen);
       setCurrentComparisonPattern(prev => (prev - 1 + 5) % 5);
       setSeenContent(lastAction.seenContent);
       setNewContent(lastAction.newContent);
       setLoading(false);
       break;
       
     case 'unseen':
       filteredUnseen = unseen.filter(m => m.id !== lastAction.content.id || (m.mediaType || 'movie') !== mediaType);
       onAddToUnseen(filteredUnseen);
       setCurrentCompared(prev => prev.filter(id => id !== lastAction.content.id));
       setCurrentComparisonCount(prev => Math.max(0, prev - 1));
       setCurrentComparisonPattern(prev => (prev - 1 + 5) % 5);
       setNewContent(lastAction.content);
       setLoading(false);
       break;
       
     case 'skip':
       if (!lastAction.isKnownVsKnown) {
         setCurrentCompared(prev => prev.filter(id => id !== lastAction.newContent.id));
         setCurrentComparisonCount(prev => Math.max(0, prev - 1));
       }
       
       setCurrentComparisonPattern(prev => (prev - 1 + 5) % 5);
       setSeenContent(lastAction.seenContent);
       setNewContent(lastAction.newContent);
       setLoading(false);
       break;
       
     case 'tough':
       filteredSeen = seen.filter(m => m.id !== lastAction.newContent.id || (m.mediaType || 'movie') !== mediaType);
       restoredSeen = seen.map(m => 
         m.id === lastAction.seenContent.id && (m.mediaType || 'movie') === mediaType ? lastAction.seenContent : m
       );
       
       setSeen(restoredSeen);
       setCurrentCompared(prev => prev.filter(id => id !== lastAction.newContent.id));
       setCurrentComparisonCount(prev => Math.max(0, prev - 1));
       setCurrentComparisonPattern(prev => (prev - 1 + 5) % 5);
       setSeenContent(lastAction.seenContent);
       setNewContent(lastAction.newContent);
       setLoading(false);
       break;
       
     case 'tough_known':
       restoredSeen = seen.map(m => {
         if (m.id === lastAction.seenContent.id && (m.mediaType || 'movie') === mediaType) return lastAction.seenContent;
         if (m.id === lastAction.newContent.id && (m.mediaType || 'movie') === mediaType) return lastAction.newContent;
         return m;
       });
       
       setSeen(restoredSeen);
       setCurrentComparisonPattern(prev => (prev - 1 + 5) % 5);
       setSeenContent(lastAction.seenContent);
       setNewContent(lastAction.newContent);
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
   setNewContent(null);
   setSeenContent(null);
   isLoadingRef.current = false;
   fetchRandomContent();
 }, [fetchRandomContent]);

 const getPosterUrl = path =>
   path
     ? `https://image.tmdb.org/t/p/w342${path}`
     : `https://image.tmdb.org/t/p/w342`;

 // Loading state UI
 if (loading) {
   const currentBaselineComplete = getCurrentBaselineComplete();
   const contentType = mediaType === 'movie' ? 'movies' : 'TV shows';
   
   return (
     <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: colors.background }]}>
       <View style={stateStyles.loadingContainer}>
         <ActivityIndicator size="large" color={colors.accent} />
         <Text style={[stateStyles.loadingText, { color: colors.subText }]}>
           {isLoadingFilteredPool 
             ? `Building filtered ${contentType} pool...` 
             : currentBaselineComplete 
               ? `Finding ${contentType} tailored to your taste...` 
               : `Loading ${contentType} for comparison...`
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
   const currentSeen = getCurrentSeen();
   const contentType = mediaType === 'movie' ? 'movies' : 'TV shows';
   
   return (
     <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: colors.background }]}>
       <View style={[stateStyles.errorContainer, { backgroundColor: colors.card }]}>
         <Ionicons name="information-circle-outline" size={48} color={colors.accent} />
         <Text style={[stateStyles.errorText, { color: colors.accent }]}>
           {error}
         </Text>
         <Text style={[stateStyles.errorSubText, { color: colors.subText }]}>
           {currentSeen.length < 3 ? `Go to the Add Movie tab to rate more ${contentType}.` : 'This may be temporary. Try again or select a different filter combination.'}
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

 // Return early if content isn't loaded yet
 if (!seenContent || !newContent) return null;

 // Check if this is a known vs known comparison for UI display
 const currentSeen = getCurrentSeen();
 const isKnownVsKnown = currentSeen.some(m => m.id === newContent.id);
 const currentBaselineComplete = getCurrentBaselineComplete();

 // Main UI
 return (
   <View style={[{ flex: 1, backgroundColor: colors.background }]}>
     {/* WUVO Progress Indicator */}
     {wuvoProgress > 0 && wuvoTargetMovie && (
       <View style={{
         position: 'absolute',
         top: 60,
         left: 0,
         right: 0,
         zIndex: 1000,
         backgroundColor: 'rgba(0,0,0,0.8)',
         paddingVertical: 8,
         paddingHorizontal: 16,
       }}>
         <Text style={{
           color: '#FFD700',
           fontSize: 16,
           fontWeight: 'bold',
           textAlign: 'center',
         }}>
           🎯 WUVO Mode: {wuvoProgress}/3 comparisons for "{wuvoTargetMovie.title}"
         </Text>
         <View style={{
           flexDirection: 'row',
           justifyContent: 'center',
           marginTop: 4,
         }}>
           {[1, 2, 3].map((step) => (
             <View
               key={step}
               style={{
                 width: 20,
                 height: 4,
                 backgroundColor: step <= wuvoProgress ? '#FFD700' : 'rgba(255,255,255,0.3)',
                 marginHorizontal: 2,
                 borderRadius: 2,
               }}
             />
           ))}
         </View>
       </View>
     )}

     {/* Action buttons section */}
     <View style={[styles.actionRow, { backgroundColor: colors.background, paddingHorizontal: 16, paddingVertical: 4, justifyContent: 'flex-end' }]}>
       {lastAction && lastAction.mediaType === mediaType && (
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
         {(selectedGenres.length > 0 || selectedDecades.length > 0 || selectedStreamingServices.length > 0) && (
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

 {/* Main comparison content */}
     <View style={[compareStyles.compareContainer, { paddingTop: 0, marginTop: -10 }]}>
       <View style={compareStyles.compareContent}>
         <Text style={compareStyles.compareTitle}>
           {isKnownVsKnown ? `Which ${mediaType === 'movie' ? 'movie' : 'show'} do you prefer?` : `Which ${mediaType === 'movie' ? 'movie' : 'show'} was better?`}
         </Text>
         
         <View style={compareStyles.compareMovies}>
           {/* Left Content */}
           <TouchableOpacity
             style={compareStyles.posterContainer}
             onPress={handleSeenWin}
             activeOpacity={0.7}
           >
             <Image
               source={{ uri: getPosterUrl(seenContent.poster || seenContent.poster_path) }}
               style={compareStyles.poster}
               resizeMode="cover"
             />
             <View style={compareStyles.posterOverlay}>
               <Text 
               style={compareStyles.movieTitle} 
               numberOfLines={1}
               ellipsizeMode="tail"
             >
               {seenContent.title}
             </Text>
               
               <Text 
                 style={[compareStyles.movieTitle, { fontSize: 12, height: 12, marginTop: -14 }]}
                 numberOfLines={1}
               >
                 ({seenContent.release_year || seenContent.release_date ? new Date(seenContent.release_date).getFullYear() : 'Unknown'})
               </Text>
               
               {/* Streaming service icons - show free vs paid with hierarchy */}
               <View style={compareStyles.streamingContainer}>
                 {(() => {
                   const services = seenContent.streamingServices || [];
                   const freeServices = services.filter(s => s.paymentType === 'free');
                   const paidServices = services.filter(s => s.paymentType === 'paid');
                   
                   // Popular streaming service hierarchy
                   const popularityOrder = [8, 384, 9, 15, 337, 350, 387, 1899, 531, 26]; // Netflix, HBO Max, Prime Video, Hulu, Disney+, Apple TV+, Peacock, Max, Paramount+, Crunchyroll
                   
                   // Sort paid services by popularity
                   const sortedPaidServices = paidServices.sort((a, b) => {
                     const aIndex = popularityOrder.indexOf(a.provider_id);
                     const bIndex = popularityOrder.indexOf(b.provider_id);
                     return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
                   });
                   
                   // Combine free first, then popular paid services, limit to 3
                   const displayServices = [...freeServices, ...sortedPaidServices].slice(0, 3);
                   
                   return displayServices.map((service) => {
                     const serviceData = streamingProviders.find(s => s.id === service.provider_id);
                     if (serviceData && serviceData.logo_url) {
                       return (
                         <View key={service.provider_id} style={{ alignItems: 'center', marginHorizontal: 2 }}>
                           <Image
                             source={{ uri: serviceData.logo_url }}
                             style={[
                               compareStyles.streamingIcon,
                               { 
                                 borderColor: service.paymentType === 'paid' ? '#FF4444' : '#22C55E',
                                 borderWidth: .5,
                                 width: 25,
                                 height: 25
                               }
                             ]}
                             resizeMode="contain"
                           />
                           <Text style={{ 
                             fontSize: 8, 
                             color: service.paymentType === 'paid' ? '#FF4444' : '#22C55E',
                             fontWeight: 'bold'
                           }}>
                             {service.paymentType === 'paid' ? '$' : 'FREE'}
                           </Text>
                         </View>
                       );
                     }
                     return null;
                   });
                 })()}
               </View>
               
               <Text 
                 style={compareStyles.genreText} 
                 numberOfLines={1}
                 adjustsFontSizeToFit={true}
                 minimumFontScale={0.7}
                 ellipsizeMode="tail"
               >
                 Genre: {(seenContent.genre_ids || seenContent.genreIds || [])
                   .slice(0, 1)
                   .map(id => genres[id] || 'Unknown')
                   .filter(Boolean)
                   .join('')}
               </Text>
             </View>
           </TouchableOpacity>
           
           {/* VS Section */}
           <View style={compareStyles.vsContainer}>
             <Text style={compareStyles.vsText}>VS</Text>
           </View>
           
           {/* Right Content */}
           <TouchableOpacity
             style={compareStyles.posterContainer}
             onPress={handleNewWin}
             activeOpacity={0.7}
           >
             <Image
               source={{ uri: getPosterUrl(newContent.poster || newContent.poster_path) }}
               style={compareStyles.poster}
               resizeMode="cover"
             />
               
             <View style={compareStyles.posterOverlay}>
               <Text 
                 style={compareStyles.movieTitle} 
                 numberOfLines={1}
                 ellipsizeMode="tail"
               >
                 {newContent.title}
               </Text>
               
               <Text 
                 style={[compareStyles.movieTitle, { fontSize: 12, height: 12, marginTop: -14 }]}
                 numberOfLines={1}
               >
                 ({newContent.release_year || newContent.release_date ? new Date(newContent.release_date).getFullYear() : 'Unknown'})
               </Text>
               
               {/* Streaming service icons - show free vs paid with hierarchy */}
               <View style={[compareStyles.streamingContainer, { marginTop: 8 }]}>
                 {(() => {
                   const services = newContent.streamingServices || [];
                   const freeServices = services.filter(s => s.paymentType === 'free');
                   const paidServices = services.filter(s => s.paymentType === 'paid');
                   
                   // Popular streaming service hierarchy
                   const popularityOrder = [8, 384, 9, 15, 337, 350, 387, 1899, 531, 26]; // Netflix, HBO Max, Prime Video, Hulu, Disney+, Apple TV+, Peacock, Max, Paramount+, Crunchyroll
                   
                   // Sort paid services by popularity
                   const sortedPaidServices = paidServices.sort((a, b) => {
                     const aIndex = popularityOrder.indexOf(a.provider_id);
                     const bIndex = popularityOrder.indexOf(b.provider_id);
                     return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
                   });
                   
                   // Combine free first, then popular paid services, limit to 3
                   const displayServices = [...freeServices, ...sortedPaidServices].slice(0, 3);
                   
                   return displayServices.map((service) => {
                     const serviceData = streamingProviders.find(s => s.id === service.provider_id);
                     if (serviceData && serviceData.logo_url) {
                       return (
                         <View key={service.provider_id} style={{ alignItems: 'center', marginHorizontal: 2 }}>
                           <Image
                             source={{ uri: serviceData.logo_url }}
                             style={[
                               compareStyles.streamingIcon,
                               { 
                                 borderColor: service.paymentType === 'paid' ? '#FF4444' : '#22C55E',
                                 borderWidth: .5,
                                 width: 25,
                                 height: 25
                               }
                             ]}
                             resizeMode="contain"
                           />
                           <Text style={{ 
                             fontSize: 8, 
                             color: service.paymentType === 'paid' ? '#FF4444' : '#22C55E',
                             fontWeight: 'bold'
                           }}>
                             {service.paymentType === 'paid' ? '$' : 'FREE'}
                           </Text>
                         </View>
                       );
                     }
                     return null;
                   });
                 })()}
               </View>
               
               <Text 
                 style={compareStyles.genreText} 
                 numberOfLines={1}
                 adjustsFontSizeToFit={true}
                 minimumFontScale={0.7}
                 ellipsizeMode="tail"
               >
                 Genre: {(newContent.genre_ids || newContent.genreIds || [])
                   .slice(0, 1)
                   .map(id => genres[id] || 'Unknown')
                   .filter(Boolean)
                   .join('')}
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
           
           {!isKnownVsKnown && !currentSeen.some(m => m.id === newContent.id) && (
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
       <View style={[modalStyles.modalOverlay, { justifyContent: 'center', alignItems: 'center' }]}>
         <View
           style={{
             width: '90%',
             height: '80%',
             borderRadius: colors.border.radius,
             overflow: 'hidden'
           }}
         >
           <LinearGradient
             colors={colors.primaryGradient}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 1 }}
             style={{
               flex: 1,
               padding: 20
             }}
           >
             
             {/* Modal Header */}
             <View style={{
               flexDirection: 'row',
               justifyContent: 'space-between',
               alignItems: 'center',
               marginBottom: 20,
               paddingBottom: 10,
               borderBottomWidth: 1,
               borderBottomColor: 'rgba(255,255,255,0.3)'
             }}>
               <Text style={{
                 fontSize: 20,
                 fontWeight: 'bold',
                 color: colors.text
               }}>
                 Filter {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
               </Text>
               <TouchableOpacity
                 style={{
                   backgroundColor: 'rgba(255,255,255,0.2)',
                   paddingVertical: 6,
                   paddingHorizontal: 12,
                   borderRadius: 8
                 }}
                 onPress={clearAllFilters}
                 activeOpacity={0.7}
               >
                 <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
                   Clear All
                 </Text>
               </TouchableOpacity>
             </View>

             {/* Scrollable Content */}
             <ScrollView 
               style={{ flex: 1 }}
               contentContainerStyle={{ paddingBottom: 20 }}
               showsVerticalScrollIndicator={false}
             >
             
             {/* Genre Filter Section */}
             <View style={{ marginBottom: 25 }}>
               <Text style={[
                 modalStyles.detailTitle,
                 { 
                   fontSize: 16,
                   marginBottom: 12,
                   textAlign: 'left',
                   color: colors.text
                 }
               ]}>
                 Genres ({tempGenres.length} selected)
               </Text>
               <View style={{
                 flexDirection: 'row',
                 flexWrap: 'wrap',
                 gap: 8
               }}>
                 {Object.entries({
                   28: 'Action',
                   12: 'Adventure', 
                   16: 'Animation',
                   35: 'Comedy',
                   80: 'Crime',
                   99: 'Documentary',
                   18: 'Drama',
                   10751: 'Family',
                   14: 'Fantasy',
                   36: 'History',
                   27: 'Horror',
                   10402: 'Music',
                   9648: 'Mystery',
                   10749: 'Romance',
                   878: 'Science Fiction',
                   10770: 'TV Movie',
                   53: 'Thriller',
                   10752: 'War',
                   37: 'Western'
                 }).map(([id, name]) => (
                   <TouchableOpacity
                     key={id}
                     style={{
                       backgroundColor: tempGenres.includes(id)
                         ? 'rgba(255,255,255,0.3)' 
                         : 'rgba(255,255,255,0.1)',
                       borderColor: 'rgba(255,255,255,0.4)',
                       borderWidth: 1,
                       borderRadius: colors.border.radius,
                       paddingVertical: 8,
                       paddingHorizontal: 12,
                       marginBottom: 8
                     }}
                     onPress={() => toggleGenre(id)}
                     activeOpacity={0.7}
                   >
                     <Text style={{
                       color: colors.text,
                       fontSize: 13,
                       fontWeight: '500'
                     }}>
                       {name}
                     </Text>
                   </TouchableOpacity>
                 ))}
               </View>
             </View>

             {/* Decade Filter Section */}
             <View style={{ marginBottom: 25 }}>
               <Text style={[
                 modalStyles.detailTitle,
                 { 
                   fontSize: 16,
                   marginBottom: 12,
                   textAlign: 'left',
                   color: colors.text
                 }
               ]}>
                 Decades ({tempDecades.length} selected)
               </Text>
               <View style={{
                 flexDirection: 'row',
                 flexWrap: 'wrap',
                 gap: 8
               }}>
                 {DECADES.map((decade) => (
                   <TouchableOpacity
                     key={decade.value}
                     style={{
                       backgroundColor: tempDecades.includes(decade.value)
                         ? 'rgba(255,255,255,0.3)' 
                         : 'rgba(255,255,255,0.1)',
                       borderColor: 'rgba(255,255,255,0.4)',
                       borderWidth: 1,
                       borderRadius: colors.border.radius,
                       paddingVertical: 8,
                       paddingHorizontal: 12,
                       marginBottom: 8
                     }}
                     onPress={() => toggleDecade(decade.value)}
                     activeOpacity={0.7}
                   >
                     <Text style={{
                       color: colors.text,
                       fontSize: 13,
                       fontWeight: '500'
                     }}>
                       {decade.label}
                     </Text>
                   </TouchableOpacity>
                 ))}
               </View>
             </View>

             {/* Streaming Services Filter Section */}
             <View style={{ marginBottom: 25 }}>
               <Text style={[
                 modalStyles.detailTitle,
                 { 
                   fontSize: 16,
                   marginBottom: 12,
                   textAlign: 'left',
                   color: colors.text
                 }
               ]}>
                 Available On ({tempStreamingServices.length} selected)
               </Text>
               <View style={{
                 flexDirection: 'row',
                 flexWrap: 'wrap',
                 gap: 8
               }}>
                 {[
                   { id: 8, name: 'Netflix' },
                   { id: 9, name: 'Prime Video' },
                   { id: 15, name: 'Hulu' },
                   { id: 337, name: 'Disney+' },
                   { id: 350, name: 'Apple TV+' },
                   { id: 384, name: 'HBO Max' },
                   { id: 387, name: 'Peacock' }
                 ].map((service) => (
                   <TouchableOpacity
                     key={service.id}
                     style={{
                       backgroundColor: tempStreamingServices.includes(service.id.toString())
                         ? 'rgba(255,255,255,0.3)' 
                         : 'rgba(255,255,255,0.1)',
                       borderColor: 'rgba(255,255,255,0.4)',
                       borderWidth: 1,
                       borderRadius: colors.border.radius,
                       paddingVertical: 8,
                       paddingHorizontal: 12,
                       marginBottom: 8,
                       flexDirection: 'row',
                       alignItems: 'center'
                     }}
                     onPress={() => toggleStreamingService(service.id)}
                     activeOpacity={0.7}
                   >
                     <Text style={{
                       color: colors.text,
                       fontSize: 13,
                       fontWeight: '500'
                     }}>
                       {service.name}
                     </Text>
                   </TouchableOpacity>
                 ))}
               </View>
             </View>
             
             </ScrollView>
           
           {/* Modal Action Buttons */}
           <View style={{
               flexDirection: 'row',
               marginTop: 20,
               paddingTop: 15,
               borderTopWidth: 1,
               borderTopColor: 'rgba(255,255,255,0.3)'
             }}>
             <TouchableOpacity
               style={{
                 backgroundColor: 'rgba(255,255,255,0.1)',
                 borderColor: 'rgba(255,255,255,0.4)',
                 borderWidth: 1,
                 borderRadius: colors.border.radius,
                 paddingVertical: 12,
                 paddingHorizontal: 20,
                 flex: 1,
                 marginRight: 8,
                 alignItems: 'center'
               }}
               onPress={cancelFilters}
             >
               <Text style={{
                 color: colors.text,
                 fontSize: 16,
                 fontWeight: '600'
               }}>
                 Cancel
               </Text>
             </TouchableOpacity>
             <TouchableOpacity
               style={{
                 backgroundColor: colors.accent,
                 borderRadius: colors.border.radius,
                 paddingVertical: 12,
                 paddingHorizontal: 20,
                 flex: 1,
                 marginLeft: 8,
                 alignItems: 'center'
               }}
               onPress={applyFilters}
             >
               <Text style={{
                 color: colors.background,
                 fontSize: 16,
                 fontWeight: '600'
               }}>
                 Apply Filters
               </Text>
             </TouchableOpacity>
           </View>
           
           {/* Close button */}
           <TouchableOpacity 
             onPress={cancelFilters} 
             style={{ alignItems: 'center', paddingTop: 15 }}
           >
             <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>dismiss</Text>
           </TouchableOpacity>
           </LinearGradient>
         </View>
       </View>
     </Modal>

   </View>
 );
}

const styles = StyleSheet.create({
 actionRow: {
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'flex-end',
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
 // Keep these icon styles:
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