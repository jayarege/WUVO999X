import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image, 
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedHeader } from '../../Styles/headerStyles';
import { ThemedButton } from '../../Styles/buttonStyles';

// Import theme system and styles
import { useMediaType } from '../../Navigation/TabNavigator';
import WildcardScreen from '../Wildcard';
import { getHomeStyles } from '../../Styles/homeStyles';
import { getHeaderStyles } from '../../Styles/headerStyles';
import { getModalStyles } from '../../Styles/modalStyles';
import { getButtonStyles } from '../../Styles/buttonStyles';
import { getRatingStyles } from '../../Styles/ratingStyles'; 
import { getLayoutStyles } from '../../Styles/layoutStyles';
import theme from '../../utils/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { getAIRecommendations } from '../../utils/AIRecommendations';
import { RatingModal } from '../../Components/RatingModal';
import { ActivityIndicator } from 'react-native';
import { TMDB_API_KEY as API_KEY } from '../../Constants';
import { filterAdultContent, filterSearchResults, isContentSafe } from '../../utils/ContentFilter';
import AsyncStorage from '@react-native-async-storage/async-storage';

// **ENHANCED RATING SYSTEM IMPORT**
import { EnhancedRatingButton } from '../../Components/EnhancedRatingSystem';

// **DEBUG LOGGING**
console.log('🏠 HomeScreen: Enhanced Rating System loaded');
console.log('✅ EnhancedRatingButton component:', EnhancedRatingButton);

const { width } = Dimensions.get('window');

const MOVIE_CARD_WIDTH = (width - 48) / 2.2;
const CAROUSEL_ITEM_WIDTH = MOVIE_CARD_WIDTH + 20;

// **MAIN HOME SCREEN COMPONENT WITH ENHANCED RATING SYSTEM**
function HomeScreen({ 
  seen, 
  unseen, 
  setSeen, 
  setUnseen, 
  genres, 
  newReleases, 
  isDarkMode, 
  toggleTheme, 
  onAddToSeen, 
  onAddToUnseen, 
  onRemoveFromWatchlist, 
  onUpdateRating, // ✅ REQUIRED PROP FOR ENHANCED RATING
  skippedMovies, 
  addToSkippedMovies, 
  removeFromSkippedMovies 
}) {
  const navigation = useNavigation();

  // Use media type context
  const { mediaType, setMediaType } = useMediaType();

  // Get all themed styles
  const homeStyles = getHomeStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const colors = theme[mediaType][isDarkMode ? 'dark' : 'light'];
  const headerStyles = getHeaderStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const modalStyles = getModalStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const buttonStyles = getButtonStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const ratingStyles = getRatingStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const layoutStyles = getLayoutStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);

  // **STATE MANAGEMENT - ENGINEER TEAM 1-3**
  const [activeTab, setActiveTab] = useState('new');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetailModalVisible, setMovieDetailModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingInput, setRatingInput] = useState('');
  const [recentReleases, setRecentReleases] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [movieCredits, setMovieCredits] = useState(null);
  const [movieProviders, setMovieProviders] = useState(null);
  const [notInterestedMovies, setNotInterestedMovies] = useState([]);
  
  // **ANIMATION SYSTEM - ENGINEER TEAM 4-6**
  const slideAnim = useRef(new Animated.Value(300)).current;
  const popularScrollX = useRef(new Animated.Value(0)).current;
  const popularScrollRef = useRef(null);
  const [popularIndex, setPopularIndex] = useState(0);
  const autoScrollPopular = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.ValueXY()).current;
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoScrollAnimation = useRef(null);
  
  // **CONTENT TYPE HELPERS - ENGINEER TEAM 7**
  const contentType = mediaType === 'movie' ? 'movies' : 'tv';
  
  // **DATE UTILITIES - ENGINEER TEAM 8**
  const today = useMemo(() => new Date(), []);
  const oneWeekAgo = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 7);
    return date;
  }, [today]);

  // ============================================================================
  // **NOT INTERESTED SYSTEM - ENGINEER TEAM 9**
  // ============================================================================

  const sendNegativeFeedbackToAI = useCallback(async (content, mediaType) => {
    try {
      console.log(`📉 AI Feedback: User not interested in ${content.title} (${mediaType})`);
      
      const feedbackKey = `ai_negative_feedback_${mediaType}`;
      let existingFeedback = [];
      
      try {
        const stored = await AsyncStorage.getItem(feedbackKey);
        if (stored) {
          existingFeedback = JSON.parse(stored);
        }
      } catch (e) {
        console.log('No existing negative feedback found');
      }
      
      const feedbackEntry = {
        id: content.id,
        title: content.title,
        genre_ids: content.genre_ids || content.genreIds || [],
        vote_average: content.vote_average,
        timestamp: Date.now(),
        mediaType: mediaType
      };
      
      existingFeedback.push(feedbackEntry);
      
      if (existingFeedback.length > 100) {
        existingFeedback = existingFeedback.slice(-100);
      }
      
      await AsyncStorage.setItem(feedbackKey, JSON.stringify(existingFeedback));
      console.log(`✅ Negative feedback stored for ${content.title}`);
      
    } catch (error) {
      console.error('Failed to store negative feedback:', error);
    }
  }, []);

  const storePermanentlyNotInterested = useCallback(async (movieId, mediaType) => {
    try {
      const notInterestedKey = `not_interested_${mediaType}`;
      let notInterestedList = [];
      
      const stored = await AsyncStorage.getItem(notInterestedKey);
      if (stored) {
        notInterestedList = JSON.parse(stored);
      }
      
      if (!notInterestedList.includes(movieId)) {
        notInterestedList.push(movieId);
        await AsyncStorage.setItem(notInterestedKey, JSON.stringify(notInterestedList));
        
        setNotInterestedMovies(notInterestedList);
        console.log(`💾 Added movie ${movieId} to permanent not interested list`);
      }
    } catch (error) {
      console.error('Failed to store not interested movie:', error);
    }
  }, []);

  const loadNotInterestedMovies = useCallback(async () => {
    try {
      const notInterestedKey = `not_interested_${mediaType}`;
      const stored = await AsyncStorage.getItem(notInterestedKey);
      if (stored) {
        const notInterestedList = JSON.parse(stored);
        console.log(`📋 Loaded ${notInterestedList.length} not interested ${mediaType}s`);
        return notInterestedList;
      }
      return [];
    } catch (error) {
      console.error('Failed to load not interested movies:', error);
      return [];
    }
  }, [mediaType]);

  const handleNotInterested = useCallback(async () => {
    if (!selectedMovie) return;
    
    console.log('🎬 NOT INTERESTED CLICKED for:', selectedMovie.title);
    
    try {
      const movieId = selectedMovie.id;
      
      sendNegativeFeedbackToAI(selectedMovie, mediaType);
      
      if (addToSkippedMovies) {
        addToSkippedMovies(movieId);
      }
      
      storePermanentlyNotInterested(movieId, mediaType);
      
      // **IMMEDIATE UI UPDATES**
      setPopularMovies(prev => {
        const filtered = prev.filter(movie => movie.id !== movieId);
        console.log(`🗑️ Removed from popularMovies: ${prev.length} -> ${filtered.length}`);
        return filtered;
      });
      
      setRecentReleases(prev => {
        const filtered = prev.filter(movie => movie.id !== movieId);
        console.log(`🗑️ Removed from recentReleases: ${prev.length} -> ${filtered.length}`);
        return filtered;
      });
      
      setAiRecommendations(prev => {
        const filtered = prev.filter(movie => movie.id !== movieId);
        console.log(`🗑️ Removed from aiRecommendations: ${prev.length} -> ${filtered.length}`);
        return filtered;
      });
      
      if (unseen.some(movie => movie.id === movieId)) {
        onRemoveFromWatchlist(movieId);
        console.log(`🗑️ Removed from watchlist`);
      }
      
      console.log(`❌ Movie completely removed from app: ${selectedMovie.title}`);
      closeDetailModal();
      
    } catch (error) {
      console.error('Failed to handle not interested action:', error);
    }
  }, [selectedMovie, mediaType, sendNegativeFeedbackToAI, addToSkippedMovies, storePermanentlyNotInterested, unseen, onRemoveFromWatchlist]);

  // ============================================================================
  // **UTILITY FUNCTIONS - ENGINEER TEAM 10**
  // ============================================================================

  const handleContentTypeChange = useCallback((type) => {
    setMediaType(type === 'movies' ? 'movie' : 'tv');
  }, [setMediaType]);

  const formatDate = useCallback((date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }, []);
  
  const formatDateForAPI = useCallback((date) => {
    return date.toISOString().split('T')[0];
  }, []);
  
  const formatReleaseDate = useCallback((dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  const normalizeProviderName = useCallback((providerName) => {
    const normalized = providerName.toLowerCase();
    
    if (normalized.includes('netflix')) return 'netflix';
    if (normalized.includes('prime') || normalized.includes('amazon')) return 'prime';
    if (normalized.includes('apple')) return 'apple';
    if (normalized.includes('hulu')) return 'hulu';
    if (normalized.includes('disney')) return 'disney';
    if (normalized.includes('max') || normalized.includes('hbo')) return 'max';
    if (normalized.includes('paramount')) return 'paramount';
    if (normalized.includes('peacock')) return 'peacock';
    if (normalized.includes('showtime')) return 'showtime';
    if (normalized.includes('starz')) return 'starz';
    
    return normalized
      .replace(/\s*\(.*?\)/g, '')
      .replace(/\s*(with\s+)?ads?$/gi, '')
      .replace(/\s*premium$/gi, '')
      .replace(/\s*plus$/gi, '')
      .replace(/\s*\+$/gi, '')
      .trim();
  }, []);

  const deduplicateProviders = useCallback((providers) => {
    if (!providers || !Array.isArray(providers)) return [];
    
    const seen = new Set();
    const filtered = [];
    
    const sorted = [...providers].sort((a, b) => {
      const aHasAds = a.provider_name.toLowerCase().includes('ads');
      const bHasAds = b.provider_name.toLowerCase().includes('ads');
      
      if (aHasAds && !bHasAds) return 1;
      if (!aHasAds && bHasAds) return -1;
      return 0;
    });
    
    for (const provider of sorted) {
      const normalizedName = normalizeProviderName(provider.provider_name);
      
      if (!seen.has(normalizedName)) {
        seen.add(normalizedName);
        filtered.push(provider);
      }
    }
    
    return filtered;
  }, [normalizeProviderName]);

  const getProviderLogoUrl = useCallback((logoPath) => {
    if (!logoPath) return null;
    return `https://image.tmdb.org/t/p/w92${logoPath}`;
  }, []);

  // ============================================================================
  // **DATA FETCHING SYSTEM - ENGINEER TEAM 11**
  // ============================================================================

  const fetchMovieCredits = useCallback(async (movieId) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}`
      );
      const data = await response.json();
      return data.cast?.slice(0, 3) || [];
    } catch (error) {
      console.error('Error fetching movie credits:', error);
      return [];
    }
  }, []);

  const fetchMovieProviders = useCallback(async (movieId) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}`
      );
      const data = await response.json();
      return data.results?.US?.flatrate || [];
    } catch (error) {
      console.error('Error fetching movie providers:', error);
      return [];
    }
  }, []);

  const fetchAIRecommendations = useCallback(async () => {
    try {
      setIsLoadingRecommendations(true);
      
      const topRatedContent = seen
        .filter(item => item.userRating && item.userRating >= 7)
        .sort((a, b) => b.userRating - a.userRating)
        .slice(0, 10);

      if (topRatedContent.length < 3) {
        setAiRecommendations([]);
        return;
      }

      const currentMediaType = contentType === 'movies' ? 'movie' : 'tv';
      const recommendations = await getAIRecommendations(
        topRatedContent, 
        currentMediaType,
        seen,
        unseen,
        [...skippedMovies, ...notInterestedMovies]
      );
      
      setAiRecommendations(recommendations);
      
    } catch (error) {
      console.error('Failed to fetch AI recommendations:', error);
      setAiRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [seen, unseen, contentType, skippedMovies, notInterestedMovies]);

  const fetchPopularMovies = useCallback(async () => {
    try {
      let allResults = [];
      
      for (let page = 1; page <= 5; page++) {
        const endpoint = contentType === 'movies'
          ? `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}&include_adult=false`
          : `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=en-US&page=${page}&include_adult=false`;
          
        const res = await fetch(endpoint);
        const { results } = await res.json();
        allResults = [...allResults, ...results];
      }
      
      // **🏠 FILTER OUT RATED MOVIES FROM HOME SCREEN**
      const filtered = filterAdultContent(allResults, contentType === 'movies' ? 'movie' : 'tv')
        .filter(m => !seen.some(s => s.id === m.id)) // Remove rated movies
        .filter(m => !unseen.some(u => u.id === m.id)) // Remove watchlist movies
        .filter(m => !skippedMovies.includes(m.id))
        .filter(m => !notInterestedMovies.includes(m.id))
        .filter(item => {
          if (contentType === 'tv') {
            const excludedGenres = [10767, 10763, 10762, 10764];
            const topThreeGenres = item.genre_ids ? item.genre_ids.slice(0, 3) : [];
            
            const hasExcludedGenre = topThreeGenres.some(genreId => excludedGenres.includes(genreId));
            
            if (hasExcludedGenre) {
              console.log(`🚫 FILTERED OUT: ${item.name} - Top 3 genres: ${topThreeGenres} contain excluded genre`);
              return false;
            }
            
            if (item.origin_country && Array.isArray(item.origin_country)) {
              const allowedCountries = ['US', 'GB', 'UK'];
              const hasAllowedCountry = item.origin_country.some(country => allowedCountries.includes(country));
              if (!hasAllowedCountry) {
                return false;
              }
            }
            
            if (item.name && item.name.toLowerCase().includes('good mythical morning')) {
              return false;
            }
            
            if (item.vote_average && item.vote_average < 6.5) {
              return false;
            }
          }
          return true;
        })
        .slice(0, 15);

      const enrichedResults = await Promise.all(
        filtered.map(async (item) => {
          let streamingProviders = [];
          try {
            const mediaTypeForAPI = contentType === 'movies' ? 'movie' : 'tv';
            const providerResponse = await fetch(
              `https://api.themoviedb.org/3/${mediaTypeForAPI}/${item.id}/watch/providers?api_key=${API_KEY}`
            );
            const providerData = await providerResponse.json();
            streamingProviders = providerData.results?.US?.flatrate || [];
          } catch (error) {
            console.error('Error fetching streaming providers:', error);
          }
          
          return {
            ...item,
            title: contentType === 'movies' ? item.title : item.name,
            release_date: contentType === 'movies' ? item.release_date : item.first_air_date,
            poster_path: item.poster_path,
            vote_average: item.vote_average,
            genre_ids: item.genre_ids,
            overview: item.overview,
            adult: item.adult || false,
            mediaType: contentType === 'movies' ? 'movie' : 'tv',
            streamingProviders: streamingProviders,
            weightedScore: (item.popularity * 0.7) + (item.vote_average * 0.3)
          };
        })
      );
      
      const sortedFiltered = enrichedResults
        .sort((a, b) => b.weightedScore - a.weightedScore)
        .slice(0, 10);
      
      console.log(`🎬 Popular movies updated: ${sortedFiltered.length} items (filtered out ${allResults.length - sortedFiltered.length} rated/watchlisted movies)`);
      setPopularMovies(sortedFiltered);
    } catch (err) {
      console.warn(`Failed fetching popular ${contentType}`, err);
    }
  }, [seen, unseen, contentType, skippedMovies, notInterestedMovies]);
  
  const fetchRecentReleases = useCallback(async () => {
    try {
      setIsLoadingRecent(true);
      
      const todayFormatted = formatDateForAPI(today);
      const oneWeekAgoFormatted = formatDateForAPI(oneWeekAgo);
      
      const endpoint = contentType === 'movies' 
        ? `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=primary_release_date.desc&include_adult=false&include_video=false&page=1&primary_release_date.gte=${oneWeekAgoFormatted}&primary_release_date.lte=${todayFormatted}&vote_count.gte=5`
        : `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=en-US&sort_by=first_air_date.desc&include_adult=false&page=1&first_air_date.gte=${oneWeekAgoFormatted}&first_air_date.lte=${todayFormatted}&vote_count.gte=5`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent releases');
      }
      
      const data = await response.json();
      const filteredResults = filterAdultContent(data.results, contentType === 'movies' ? 'movie' : 'tv');
      
      // **🏠 FILTER OUT RATED MOVIES FROM RECENT RELEASES**
      const recentContent = filteredResults
        .filter(item => item.poster_path)
        .filter(item => !skippedMovies.includes(item.id))
        .filter(item => !notInterestedMovies.includes(item.id))
        .filter(item => !seen.some(m => m.id === item.id)) // Remove already rated movies
        .map(item => ({
          id: item.id,
          title: contentType === 'movies' ? item.title : item.name,
          poster: item.poster_path,
          poster_path: item.poster_path,
          score: item.vote_average,
          vote_average: item.vote_average,
          voteCount: item.vote_count,
          release_date: contentType === 'movies' ? item.release_date : item.first_air_date,
          genre_ids: item.genre_ids,
          overview: item.overview || "",
          adult: item.adult || false,
          alreadySeen: false, // Always false since we filtered out rated movies
          inWatchlist: unseen.some(m => m.id === item.id),
          userRating: null, // Always null since we filtered out rated movies
          mediaType: contentType === 'movies' ? 'movie' : 'tv'
        }));
      
      console.log(`🎬 Recent releases updated: ${recentContent.length} items (filtered out rated movies)`);
      setRecentReleases(recentContent);
      setIsLoadingRecent(false);
    } catch (error) {
      console.error('Error fetching recent releases:', error);
      setIsLoadingRecent(false);
    }
  }, [today, oneWeekAgo, seen, unseen, formatDateForAPI, contentType, skippedMovies, notInterestedMovies]);

  // ============================================================================
  // **ANIMATION SYSTEM - ENGINEER TEAM 12**
  // ============================================================================

  const startPopularAutoScroll = useCallback(() => {
    if (autoScrollPopular.current) clearInterval(autoScrollPopular.current);
    autoScrollPopular.current = setInterval(() => {
      const next = (popularIndex + 1) % 10;
      Animated.timing(popularScrollX, {
        toValue: next * CAROUSEL_ITEM_WIDTH,
        duration: 800,
        useNativeDriver: true
      }).start();
      setPopularIndex(next);
    }, 5000);
  }, [popularIndex, popularScrollX]);

  const startAutoScroll = useCallback(() => {
    if (autoScrollAnimation.current) {
      autoScrollAnimation.current.stop();
    }
    
    autoScrollAnimation.current = Animated.loop(
      Animated.timing(position.x, {
        toValue: -CAROUSEL_ITEM_WIDTH * 3,
        duration: 15000,
        useNativeDriver: true,
      })
    );
    
    autoScrollAnimation.current.start();
  }, [position.x]);

  // ============================================================================
  // **EVENT HANDLERS - ENGINEER TEAM 13**
  // ============================================================================

  const handleMovieSelect = useCallback(async (movie) => {
    console.log('🎬 Movie selected:', movie?.title, 'Safety check:', isContentSafe(movie, mediaType));
    
    if (!isContentSafe(movie, mediaType)) {
      console.warn('Attempted to select unsafe content, blocking:', movie.title || movie.name);
      return;
    }
    
    setSelectedMovie(movie);
    setMovieDetailModalVisible(true);
    
    const [credits, providers] = await Promise.all([
      fetchMovieCredits(movie.id),
      fetchMovieProviders(movie.id)
    ]);
    
    setMovieCredits(credits);
    setMovieProviders(providers);
  }, [fetchMovieCredits, fetchMovieProviders, mediaType]);

  const openRatingModal = useCallback(() => {
    setMovieDetailModalVisible(false);
    setRatingInput('');
    setRatingModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const closeRatingModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setRatingModalVisible(false);
      setRatingInput('');
    });
  }, [slideAnim]);

  const closeDetailModal = useCallback(() => {
    setMovieDetailModalVisible(false);
    setSelectedMovie(null);
    setMovieCredits(null);
    setMovieProviders(null);
  }, []);
  
  const submitRating = useCallback(() => {
    const rating = parseFloat(ratingInput);
    if (isNaN(rating) || rating < 1 || rating > 10) {
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      return;
    }
    
    const ratedMovie = {
      id: selectedMovie.id,
      title: selectedMovie.title || selectedMovie.name,
      poster: selectedMovie.poster_path || selectedMovie.poster,
      poster_path: selectedMovie.poster_path,
      score: selectedMovie.vote_average || selectedMovie.score || 0,
      vote_average: selectedMovie.vote_average,
      voteCount: selectedMovie.vote_count || 0,
      release_date: selectedMovie.release_date || selectedMovie.first_air_date,
      genre_ids: selectedMovie.genre_ids || [],
      overview: selectedMovie.overview || "",
      adult: selectedMovie.adult || false,
      userRating: rating,
      eloRating: rating * 100,
      comparisonHistory: [],
      comparisonWins: 0,
      mediaType: contentType === 'movies' ? 'movie' : 'tv'
    };
    
    onAddToSeen(ratedMovie);
    
    if (recentReleases.some(m => m.id === selectedMovie.id)) {
      setRecentReleases(prev => 
        prev.map(m => 
          m.id === selectedMovie.id 
            ? { ...m, alreadySeen: true, userRating: rating } 
            : m
        )
      );
    }
    
    closeRatingModal();
  }, [ratingInput, selectedMovie, onAddToSeen, recentReleases, closeRatingModal, slideAnim, contentType]);

  const handleWatchlistToggle = useCallback(() => {
    if (!selectedMovie) return;
    
    if (!isContentSafe(selectedMovie, mediaType)) {
      console.warn('Attempted to add unsafe content to watchlist, blocking:', selectedMovie.title || selectedMovie.name);
      closeDetailModal();
      return;
    }
    
    const isInWatchlist = unseen.some(movie => movie.id === selectedMovie.id);
    
    if (isInWatchlist) {
      onRemoveFromWatchlist(selectedMovie.id);
    } else {
      const normalizedMovie = {
        id: selectedMovie.id,
        title: selectedMovie.title || selectedMovie.name,
        poster: selectedMovie.poster_path || selectedMovie.poster,
        poster_path: selectedMovie.poster_path,
        score: selectedMovie.vote_average || selectedMovie.score || 0,
        vote_average: selectedMovie.vote_average,
        voteCount: selectedMovie.vote_count || 0,
        release_date: selectedMovie.release_date || selectedMovie.first_air_date,
        genre_ids: selectedMovie.genre_ids || [],
        overview: selectedMovie.overview || "",
        adult: selectedMovie.adult || false,
        mediaType: contentType === 'movies' ? 'movie' : 'tv'
      };
      
      if (!seen.some(movie => movie.id === selectedMovie.id)) {
        onAddToUnseen(normalizedMovie);
      }
    }
    
    closeDetailModal();
  }, [selectedMovie, unseen, seen, onAddToUnseen, onRemoveFromWatchlist, closeDetailModal, contentType, mediaType]);

  // ============================================================================
  // **COMPUTED VALUES - ENGINEER TEAM 14**
  // ============================================================================

  const recommendations = useMemo(() => {
    if (seen.length === 0) return [];
    
    const genreScores = {};
    let totalVotes = 0;
    
    seen.forEach(movie => {
      if (movie.genre_ids) {
        const rating = movie.userRating || movie.eloRating / 100;
        totalVotes += rating;
        movie.genre_ids.forEach(genreId => {
          if (!genreScores[genreId]) genreScores[genreId] = 0;
          genreScores[genreId] += rating;
        });
      }
    });

    let totalYears = 0;
    let totalRatings = 0;
    seen.forEach(movie => {
      if (movie.release_date) {
        const year = new Date(movie.release_date).getFullYear();
        if (!isNaN(year)) {
          totalYears += year * (movie.userRating || movie.eloRating / 100);
          totalRatings += (movie.userRating || movie.eloRating / 100);
        }
      }
    });
    
    const avgPreferredYear = totalRatings > 0 ? Math.round(totalYears / totalRatings) : new Date().getFullYear() - 10;
    const cleanUnseen = filterAdultContent(unseen, mediaType);
    
    const suggestions = [...cleanUnseen]
      .filter(movie => movie.poster && movie.poster_path)
      .filter(movie => !skippedMovies.includes(movie.id))
      .filter(movie => !notInterestedMovies.includes(movie.id))
      .map(movie => {
        let yearProximity = 0;
        if (movie.release_date) {
          const movieYear = new Date(movie.release_date).getFullYear();
          const yearDiff = Math.abs(movieYear - avgPreferredYear);
          yearProximity = Math.max(0, 1 - (yearDiff / 50));
        }
        
        const genreMatchScore = movie.genre_ids
          ? movie.genre_ids.reduce((sum, genreId) => sum + (genreScores[genreId] || 0), 0)
          : 0;
            
        return {
          ...movie,
          recommendationScore: (genreMatchScore * 0.7) + (yearProximity * 0.3),
          hasBeenSeen: false
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 20);

    return suggestions;
  }, [seen, unseen, mediaType, skippedMovies, notInterestedMovies]);

  const topGenres = useMemo(() => {
    if (seen.length === 0) return [];
    
    const genreScores = {};
    const genreVotes = {};
    
    seen.forEach(movie => {
      if (movie.genre_ids) {
        const rating = movie.userRating || movie.eloRating / 100;
        movie.genre_ids.forEach(genreId => {
          if (!genreScores[genreId]) {
            genreScores[genreId] = 0;
            genreVotes[genreId] = 0;
          }
          genreScores[genreId] += rating;
          genreVotes[genreId] += 1;
        });
      }
    });

    return Object.entries(genreScores)
      .map(([genreId, totalScore]) => ({
        id: genreId,
        name: genres[genreId] || 'Unknown',
        averageScore: totalScore / genreVotes[genreId],
        movieCount: genreVotes[genreId]
      }))
      .filter(genre => genre.movieCount >= 2)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);
  }, [seen, genres]);

  // ============================================================================
  // **ANIMATION HELPERS - ENGINEER TEAM 14 CONTINUED**
  // ============================================================================

  const getCardScale = useCallback((index) => {
    const inputRange = [
      (index - 1) * CAROUSEL_ITEM_WIDTH,
      index * CAROUSEL_ITEM_WIDTH,
      (index + 1) * CAROUSEL_ITEM_WIDTH,
    ];
    
    return scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });
  }, [scrollX]);
  
  const getCardRotation = useCallback((index) => {
    const inputRange = [
      (index - 1) * CAROUSEL_ITEM_WIDTH,
      index * CAROUSEL_ITEM_WIDTH,
      (index + 1) * CAROUSEL_ITEM_WIDTH,
    ];
    
    return scrollX.interpolate({
      inputRange,
      outputRange: ['5deg', '0deg', '-5deg'],
      extrapolate: 'clamp',
    });
  }, [scrollX]);

  const calculateMatchPercentage = useCallback((movie) => {
    if (!movie.genre_ids || topGenres.length === 0) return null;
    
    const topGenreIds = topGenres.map(g => parseInt(g.id));
    const matchingGenres = movie.genre_ids.filter(id => 
      topGenreIds.includes(parseInt(id))
    ).length;
    
    if (matchingGenres === 0) return null;
    
    const maxPossibleMatches = Math.min(movie.genre_ids.length, topGenreIds.length);
    const matchPercentage = Math.round((matchingGenres / maxPossibleMatches) * 100);
    
    return matchPercentage;
  }, [topGenres]);

  // ============================================================================
  // **PAN RESPONDER SYSTEM**
  // ============================================================================

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (autoScrollAnimation.current) {
          autoScrollAnimation.current.stop();
        }
        position.setOffset({
          x: position.x._value,
          y: position.y._value,
        });
        position.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, { dx, vx }) => {
        position.flattenOffset();
        const newIndex = Math.max(
          0,
          Math.min(
            recommendations.length - 1,
            currentIndex - Math.sign(dx)
          )
        );
        setCurrentIndex(newIndex);
        Animated.spring(position, {
          toValue: { x: -newIndex * CAROUSEL_ITEM_WIDTH, y: 0 },
          useNativeDriver: true,
        }).start(() => {
          setTimeout(startAutoScroll, 3000);
        });
      },
    })
  ).current;

  // ============================================================================
  // **RENDER FUNCTIONS - ENGINEER TEAM 15**
  // ============================================================================

  const renderCarouselItem = useCallback(({ item, index }) => {
    const cardScale = getCardScale(index);
    const cardRotation = getCardRotation(index);
    const matchPercentage = calculateMatchPercentage(item);
    
    return (
      <Animated.View
        style={[
          homeStyles.carouselItem,
          {
            transform: [
              { scale: cardScale },
              { rotate: cardRotation },
              { translateX: position.x },
              { translateY: Animated.multiply(position.x, 0.1) },
            ],
          },
        ]}
      >
        <View style={homeStyles.movieCardBorder}>
          <TouchableOpacity
            style={homeStyles.enhancedCard}
            activeOpacity={0.7}
            onPress={() => handleMovieSelect(item)}
          >
            <Image 
              source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }} 
              style={styles.moviePoster}
              resizeMode="cover"
            />
            {matchPercentage && (
              <View style={[
                styles.matchBadge,
                homeStyles.ratingButtonContainer
              ]}>
                <Text style={[
                  styles.matchText,
                  homeStyles.rateButtonText
                ]}>
                  {matchPercentage}% Match
                </Text>
              </View>
            )}
            <View style={homeStyles.movieInfoBox}>
              <Text
                style={homeStyles.genreName}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.7}
                ellipsizeMode="tail"
              >
                {item.title}
              </Text>
              <View style={homeStyles.ratingRow}>
                <View style={homeStyles.ratingLine}>
                  <Ionicons name="star" size={12} color={colors.accent} />
                  <Text style={homeStyles.tmdbText}>
                    TMDb {item.vote_average ? item.vote_average.toFixed(1) : '?'}
                  </Text>
                </View>
                <View style={homeStyles.ratingLine}>
                  <Ionicons name="people" size={12} color="#4CAF50" />
                  <Text style={homeStyles.friendsText}>
                    Friends {item.friendsRating ? item.friendsRating.toFixed(1) : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }, [getCardScale, getCardRotation, calculateMatchPercentage, position.x, homeStyles, handleMovieSelect, colors]);

  const renderMovieCard = useCallback(({ item }) => (
    <View style={homeStyles.movieCardBorder}>
      <TouchableOpacity 
        style={homeStyles.enhancedCard}
        activeOpacity={0.7}
        onPress={() => handleMovieSelect(item)}
      >
        <Image 
          source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }} 
          style={styles.moviePoster}
          resizeMode="cover"
        />
        <View style={homeStyles.movieInfoBox}>
          <Text
            style={homeStyles.genreName}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
          <View style={homeStyles.ratingRow}>
            <View style={homeStyles.ratingLine}>
              <Ionicons name="star" size={12} color={colors.accent} />
              <Text style={homeStyles.tmdbText}>
                TMDb {item.vote_average ? item.vote_average.toFixed(1) : '?'}
              </Text>
            </View>
            <View style={homeStyles.ratingLine}>
              <Ionicons name="people" size={12} color="#4CAF50" />
              <Text style={homeStyles.friendsText}>
                Friends {item.friendsRating ? item.friendsRating.toFixed(1) : 'N/A'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={homeStyles.quickRateButton}
          onPress={() => handleMovieSelect(item)}
        >
          <Ionicons name="information-circle" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  ), [homeStyles, handleMovieSelect, colors]);

  // **🎯 CRITICAL ENHANCED RATING BUTTON INTEGRATION**
  const renderRecentReleaseCard = useCallback(({ item }) => {
    console.log('🎬 Rendering recent release card for:', item?.title, 'Already seen:', item?.alreadySeen);
    
    return (
      <View style={[homeStyles.movieCardBorder, { width: 320, alignSelf: 'center', height: 150 }]}>
        <TouchableOpacity 
          style={[homeStyles.enhancedCard, styles.recentCard, { alignItems: 'center', height: 150 }]}
          activeOpacity={0.7}
          onPress={() => handleMovieSelect(item)}
        >
          <Image 
            source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster}` }} 
            style={styles.recentPoster}
            resizeMode="cover"
          />
          <View style={[homeStyles.movieInfoBox, { flex: 1, padding: 12, minWidth: 200, alignItems: 'center', justifyContent: 'center', height: 150 }]}>
            <Text
              style={[homeStyles.genreName, { fontSize: 20, lineHeight: 25, textAlign: 'center' }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.title}
            </Text>
            <Text style={[homeStyles.movieYear, { fontSize: 11, marginTop: 2, marginBottom: 4, textAlign: 'center' }]}>
              Released: {formatReleaseDate(item.release_date)}
            </Text>
            <View style={[styles.ratingContainer, { marginVertical: 2, justifyContent: 'center' }]}>
              <Ionicons name="star" size={12} color={homeStyles.genreScore.color} />
              <Text style={[homeStyles.genreScore, { marginLeft: 4, fontSize: 11 }]}>
                TMDb: {item.score.toFixed(1)}
              </Text>
            </View>
            
            {/* **🚀 ENHANCED RATING BUTTON - TEAM'S MASTERPIECE** */}
            <EnhancedRatingButton
              movie={item}
              seen={seen}
              onAddToSeen={onAddToSeen}
              onUpdateRating={onUpdateRating}
              colors={colors}
              buttonStyles={buttonStyles}
              modalStyles={modalStyles}
              genres={genres}
              mediaType={mediaType}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [homeStyles, buttonStyles, formatReleaseDate, handleMovieSelect, seen, onAddToSeen, onUpdateRating, colors, modalStyles, genres, mediaType]);

  const renderAIRecommendationsSection = useCallback(() => {
    return (
      <View style={homeStyles.section}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 1, marginTop: -5 }}>
          <Ionicons 
            name="sparkles" 
            size={16} 
            color={homeStyles.genreScore.color} 
            style={{ marginRight: 8, marginBottom: 2 }}
          />
          <Text style={homeStyles.sectionTitle}>
            AI Recommendations For You
          </Text>
        </View>
        <Text style={homeStyles.swipeInstructions}>
          Based on your top-rated {contentType === 'movies' ? 'movies' : 'TV shows'}
        </Text>
        
        {isLoadingRecommendations ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={homeStyles.genreScore.color} />
            <Text style={homeStyles.swipeInstructions}>
              AI is analyzing your taste...
            </Text>
          </View>
        ) : aiRecommendations.length === 0 ? (
          <Text style={homeStyles.swipeInstructions}>
            Rate more {contentType === 'movies' ? 'movies' : 'TV shows'} to get AI recommendations
          </Text>
        ) : (
          <Animated.FlatList
            data={aiRecommendations}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={homeStyles.carouselContent}
            keyExtractor={item => item.id.toString()}
            snapToInterval={MOVIE_CARD_WIDTH + 12}
            decelerationRate="fast"
            renderItem={({ item, index }) => (
              <View style={homeStyles.movieCardBorder}>
                <TouchableOpacity
                  style={[{ marginRight: 12, width: MOVIE_CARD_WIDTH, height: MOVIE_CARD_WIDTH * 1.9 }]}
                  activeOpacity={0.7}
                  onPress={() => handleMovieSelect(item)}
                >
                  <View
                    style={[homeStyles.enhancedCard, { width: MOVIE_CARD_WIDTH, height: MOVIE_CARD_WIDTH * 1.9 }]}
                  >
                    <View style={[styles.aiRecommendationBadge, { backgroundColor: '#4CAF50', top: 12 }]}>
                      <Text style={styles.rankingNumber}>AI</Text>
                    </View>
                    <Image
                      source={{
                        uri: `https://image.tmdb.org/t/p/w500${item.poster_path}`
                      }}
                      style={[styles.moviePoster, { width: MOVIE_CARD_WIDTH - 6, height: MOVIE_CARD_WIDTH * 1.5 - 6 }]}
                      resizeMode="cover"
                    />
                    <View style={[homeStyles.movieInfoBox, { width: MOVIE_CARD_WIDTH - 6, minHeight: 80 }]}>
                      <Text
                        style={[homeStyles.genreName, { fontSize: 16, lineHeight: 18, marginBottom: 2 }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.title}
                      </Text>
                      <View style={homeStyles.ratingRow}>
                        <View style={homeStyles.ratingLine}>
                          <Ionicons name="star" size={12} color={colors.accent} />
                          <Text style={homeStyles.tmdbText}>
                            TMDb {item.vote_average ? item.vote_average.toFixed(1) : '?'}
                          </Text>
                        </View>
                        <View style={homeStyles.ratingLine}>
                          <Ionicons name="people" size={12} color="#4CAF50" />
                          <Text style={homeStyles.friendsText}>
                            Friends {item.friendsRating ? item.friendsRating.toFixed(1) : 'N/A'}
                          </Text>
                        </View>
                      </View>

                      {/* **🚀 ENHANCED RATING BUTTON FOR AI RECOMMENDATIONS** */}
                      <EnhancedRatingButton
                        movie={item}
                        seen={seen}
                        onAddToSeen={onAddToSeen}
                        onUpdateRating={onUpdateRating}
                        colors={colors}
                        buttonStyles={buttonStyles}
                        modalStyles={modalStyles}
                        genres={genres}
                        mediaType={mediaType}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    );
  }, [aiRecommendations, isLoadingRecommendations, homeStyles, contentType, handleMovieSelect, colors, seen, onAddToSeen, onUpdateRating, buttonStyles, modalStyles, genres, mediaType]);

  const renderPopularMoviesSection = useCallback(() => {
    return (
      <View style={homeStyles.section}>
        <Text style={homeStyles.sectionTitle}>
          Popular {contentType === 'movies' ? 'Movies' : 'TV Shows'}
        </Text>
        <Animated.FlatList
          ref={popularScrollRef}
          data={popularMovies}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={homeStyles.carouselContent}
          keyExtractor={item => item.id.toString()}
          snapToInterval={MOVIE_CARD_WIDTH + 12}
          decelerationRate="fast"
          renderItem={({ item, index }) => (
            <View style={[homeStyles.movieCardBorder, { padding: 0 }]}>
              <TouchableOpacity
                style={[{ marginRight: 12, width: MOVIE_CARD_WIDTH, height: MOVIE_CARD_WIDTH * 1.9 }]}
                activeOpacity={0.7}
                onPress={() => handleMovieSelect(item)}
              >
                <View
                  style={[homeStyles.enhancedCard, { width: MOVIE_CARD_WIDTH, height: MOVIE_CARD_WIDTH * 1.9 }]}
                >
                  <View style={[styles.rankingBadge, { backgroundColor: theme[mediaType][isDarkMode ? 'dark' : 'light'].accent }]}>
                    <Text style={styles.rankingNumber}>{index + 1}</Text>
                  </View>
                  <Image
                    source={{
                      uri: `https://image.tmdb.org/t/p/w500${item.poster_path}`
                    }}
                    style={[styles.moviePoster, { width: MOVIE_CARD_WIDTH - 6, height: MOVIE_CARD_WIDTH * 1.5 - 6 }]}
                    resizeMode="cover"
                  />
                  <View style={[homeStyles.movieInfoBox, { width: MOVIE_CARD_WIDTH - 6, minHeight: 80 }]}>
                    <Text
                      style={[homeStyles.genreName, { fontSize: 16, lineHeight: 18, marginBottom: 2 }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.title}
                    </Text>
                    <View style={homeStyles.ratingRow}>
                      <View style={homeStyles.ratingLine}>
                        <Ionicons name="star" size={12} color={colors.accent} />
                        <Text style={homeStyles.tmdbText}>
                          TMDb {item.vote_average ? item.vote_average.toFixed(1) : '?'}
                        </Text>
                      </View>
                      <View style={homeStyles.ratingLine}>
                        <Ionicons name="people" size={12} color="#4CAF50" />
                        <Text style={homeStyles.friendsText}>
                          Friends {item.friendsRating ? item.friendsRating.toFixed(1) : 'N/A'}
                        </Text>
                      </View>
                    </View>
                    {item.streamingProviders && item.streamingProviders.length > 0 && (
                      <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' }}>
                        {item.streamingProviders.slice(0, 3).map((provider) => (
                          <Image
                            key={provider.provider_id}
                            source={{ uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}` }}
                            style={{ width: 16, height: 16, marginRight: 2, borderRadius: 2 }}
                            resizeMode="contain"
                          />
                        ))}
                      </View>
                    )}

                    {/* **🚀 ENHANCED RATING BUTTON FOR POPULAR MOVIES** */}
                    <EnhancedRatingButton
                      movie={item}
                      seen={seen}
                      onAddToSeen={onAddToSeen}
                      onUpdateRating={onUpdateRating}
                      colors={colors}
                      buttonStyles={buttonStyles}
                      modalStyles={modalStyles}
                      genres={genres}
                      mediaType={mediaType}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: popularScrollX } } }],
            { useNativeDriver: true }
          )}
          onTouchStart={() => clearInterval(autoScrollPopular.current)}
          onTouchEnd={startPopularAutoScroll}
        />
      </View>
    );
  }, [homeStyles, popularMovies, handleMovieSelect, popularScrollX, popularScrollRef, startPopularAutoScroll, autoScrollPopular, theme, mediaType, isDarkMode, colors, seen, onAddToSeen, onUpdateRating, buttonStyles, modalStyles, genres]);

  const renderWhatsOutNowSection = useCallback(() => {
    return (
      <View style={homeStyles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={homeStyles.sectionTitle}>
            In Theatres
          </Text>
          <Text style={homeStyles.swipeInstructions}>
            {formatDate(today)}
          </Text>
        </View>
        
        {isLoadingRecent ? (
          <View style={styles.loadingContainer}>
            <Text style={homeStyles.swipeInstructions}>
              Loading recent releases...
            </Text>
          </View>
        ) : recentReleases.length === 0 ? (
          <Text style={homeStyles.swipeInstructions}>
            No new releases found this week
          </Text>
        ) : (
          <FlatList
            data={recentReleases}
            renderItem={renderRecentReleaseCard}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={homeStyles.carouselContent}
          />
        )}
      </View>
    );
  }, [homeStyles, formatDate, today, isLoadingRecent, recentReleases, renderRecentReleaseCard]);

  // ============================================================================
  // **LIFECYCLE EFFECTS**
  // ============================================================================

  useEffect(() => {
    console.log('🔄 Content type changed to:', contentType);
    fetchRecentReleases();
    fetchPopularMovies();
  }, [contentType, fetchRecentReleases, fetchPopularMovies]);

  // **🏠 AUTO-REFRESH WHEN MOVIES ARE RATED**
  useEffect(() => {
    console.log('🎬 Seen movies updated, count:', seen.length);
    // Refresh home screen data when movies are rated to remove them from display
    fetchRecentReleases();
    fetchPopularMovies();
    fetchAIRecommendations();
  }, [seen.length, fetchRecentReleases, fetchPopularMovies, fetchAIRecommendations]);

  useEffect(() => {
    if (popularMovies.length > 0 && activeTab === 'new' && contentType === 'movies') {
      startPopularAutoScroll();
    }
    return () => clearInterval(autoScrollPopular.current);
  }, [popularMovies, activeTab, contentType, startPopularAutoScroll]);

  useEffect(() => {
    if (activeTab === 'recommendations' && recommendations.length > 0 && contentType === 'movies') {
      startAutoScroll();
    }
    return () => {
      if (autoScrollAnimation.current) {
        autoScrollAnimation.current.stop();
      }
    };
  }, [activeTab, recommendations, contentType, startAutoScroll]);

  useEffect(() => {
    if (seen.length >= 3) {
      console.log('🤖 Fetching AI recommendations - user has', seen.length, 'rated items');
      fetchAIRecommendations();
    }
  }, [seen.length, contentType, fetchAIRecommendations]);

  useEffect(() => {
    const loadNotInterested = async () => {
      const notInterestedList = await loadNotInterestedMovies();
      setNotInterestedMovies(notInterestedList);
    };
    
    loadNotInterested();
  }, [mediaType, loadNotInterestedMovies]);

  useEffect(() => {
    console.log('🔄 skippedMovies updated:', skippedMovies);
    if (skippedMovies.length > 0) {
      console.log('🔄 Re-fetching data due to skippedMovies change');
      fetchPopularMovies();
      fetchRecentReleases();
      fetchAIRecommendations();
    }
  }, [skippedMovies, fetchPopularMovies, fetchRecentReleases, fetchAIRecommendations]);

  // ============================================================================
  // **MAIN RENDER - COLLABORATIVE UI MASTERPIECE**
  // ============================================================================

  return (
    <View style={{ flex: 1, backgroundColor: mediaType === 'movie' ? '#8B5CF6' : '#3B82F6' }}>
      <ThemedHeader mediaType={mediaType} isDarkMode={isDarkMode} theme={theme}>
        <Text style={headerStyles.screenTitle}>
          {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
        </Text>
      </ThemedHeader>
      <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: 'transparent' }]}>
        
        {/* **MOVIES CONTENT WITH ENHANCED RATING** */}
        {contentType === 'movies' && (
          <>
            <View style={[styles.tabContainer, { backgroundColor: '#1C2526' }]}>
              <TouchableOpacity 
                style={[
                  styles.tabButton, 
                  activeTab === 'new' && { 
                    borderBottomColor: homeStyles.genreScore.color, 
                    borderBottomWidth: 2 
                  }
                ]}
                onPress={() => setActiveTab('new')}
              >
                <Text 
                  style={[
                    buttonStyles.skipButtonText,
                    { 
                      color: activeTab === 'new' ? 
                        homeStyles.genreScore.color : 
                        homeStyles.movieYear.color
                    }
                  ]}
                >
                  New Releases
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.tabButton, 
                  activeTab === 'compare' && { 
                    borderBottomColor: homeStyles.genreScore.color, 
                    borderBottomWidth: 2 
                  }
                ]}
                onPress={() => setActiveTab('compare')}
              >
                <Text 
                  style={[
                    buttonStyles.skipButtonText,
                    { 
                      color: activeTab === 'compare' ? 
                        homeStyles.genreScore.color : 
                        homeStyles.movieYear.color
                    }
                  ]}
                >
                  Compare Movies
                </Text>
              </TouchableOpacity>
            </View>
            
            {activeTab === 'new' && (
              <ScrollView 
                style={homeStyles.homeContainer}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
              >
                {renderAIRecommendationsSection()}
                {renderPopularMoviesSection()}
                {renderWhatsOutNowSection()}
              </ScrollView>
            )}
            
            {activeTab === 'compare' && (
              <WildcardScreen
                seen={seen}
                unseen={unseen}
                setSeen={setSeen}
                setUnseen={setUnseen}
                onAddToSeen={onAddToSeen}
                onAddToUnseen={onAddToUnseen}
                genres={genres}
                isDarkMode={isDarkMode}
                skippedMovies={skippedMovies}
                addToSkippedMovies={addToSkippedMovies}
                removeFromSkippedMovies={removeFromSkippedMovies}
              />
            )}
          </>
        )}
        
        {/* **TV SHOWS CONTENT WITH ENHANCED RATING** */}
        {contentType === 'tv' && (
          <>
            <View style={[styles.tabContainer, { backgroundColor: '#1C2526' }]}>
              <TouchableOpacity 
                style={[
                  styles.tabButton, 
                  activeTab === 'new' && { 
                    borderBottomColor: homeStyles.genreScore.color, 
                    borderBottomWidth: 2 
                  }
                ]}
                onPress={() => setActiveTab('new')}
              >
                <Text 
                  style={[
                    buttonStyles.skipButtonText,
                    { 
                      color: activeTab === 'new' ? 
                        homeStyles.genreScore.color : 
                        homeStyles.movieYear.color
                    }
                  ]}
                >
                  New Releases
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.tabButton, 
                  activeTab === 'compare' && { 
                    borderBottomColor: homeStyles.genreScore.color, 
                    borderBottomWidth: 2 
                  }
                ]}
                onPress={() => setActiveTab('compare')}
              >
                <Text 
                  style={[
                    buttonStyles.skipButtonText,
                    { 
                      color: activeTab === 'compare' ? 
                        homeStyles.genreScore.color : 
                        homeStyles.movieYear.color
                    }
                  ]}
                >
                  Compare TV Shows
                </Text>
              </TouchableOpacity>
            </View>
            
            {activeTab === 'new' && (
              <ScrollView 
                style={homeStyles.homeContainer}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
              >
                {renderAIRecommendationsSection()}
                {renderPopularMoviesSection()}
              </ScrollView>
            )}
            
            {activeTab === 'compare' && (
              <WildcardScreen
                seen={seen}
                unseen={unseen}
                setSeen={setSeen}
                setUnseen={setUnseen}
                onAddToSeen={onAddToSeen}
                onAddToUnseen={onAddToUnseen}
                genres={genres}
                isDarkMode={isDarkMode}
                skippedMovies={skippedMovies}
                addToSkippedMovies={addToSkippedMovies}
                removeFromSkippedMovies={removeFromSkippedMovies}
              />
            )}
          </>
        )}
        
        {/* **MOVIE DETAIL MODAL WITH ENHANCED RATING INTEGRATION** */}
        <Modal
          visible={movieDetailModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeDetailModal}
        >
          <View style={modalStyles.detailModalOverlay}>
            <LinearGradient
              colors={theme[mediaType][isDarkMode ? 'dark' : 'light'].primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={modalStyles.detailModalContent}
            >
              <Image 
                source={{ uri: `https://image.tmdb.org/t/p/w500${selectedMovie?.poster_path}` }} 
                style={modalStyles.detailPoster}
                resizeMode="cover" 
              />
              
              <Text style={modalStyles.detailTitle}>
                {selectedMovie?.title}
              </Text>
              
              <Text style={modalStyles.detailYear}>
                ({selectedMovie?.release_date ? new Date(selectedMovie.release_date).getFullYear() : 'Unknown'})
              </Text>
              
              <Text style={modalStyles.detailScore}>
                TMDb: {selectedMovie?.vote_average?.toFixed(1) || 'N/A'}
              </Text>
              
              {movieCredits && movieCredits.length > 0 && (
                <Text style={modalStyles.detailActors}>
                  Actors: {movieCredits.map(actor => actor.name).join(', ')}
                </Text>
              )}
              
              <Text 
                style={modalStyles.detailPlot}
                numberOfLines={4}
                ellipsizeMode="tail"
              >
                {selectedMovie?.overview || 'No description available.'}
              </Text>
              
              <View style={modalStyles.streamingRow}>
                {movieProviders && movieProviders.length > 0 ? (
                  deduplicateProviders(movieProviders)
                    .filter(provider => provider.logo_path)
                    .slice(0, 5)
                    .map((provider) => (
                      <Image 
                        key={provider.provider_id}
                        source={{ uri: getProviderLogoUrl(provider.logo_path) }}
                        style={modalStyles.platformIcon}
                        resizeMode="contain"
                      />
                    ))
                ) : null}
              </View>
              
              <View style={modalStyles.buttonRow}>
                {/* **🚀 ENHANCED RATING BUTTON IN MODAL** */}
                <View style={{ flex: 1, marginHorizontal: 4 }}>
                  <EnhancedRatingButton
                    movie={selectedMovie}
                    seen={seen}
                    onAddToSeen={onAddToSeen}
                    onUpdateRating={onUpdateRating}
                    colors={colors}
                    buttonStyles={buttonStyles}
                    modalStyles={modalStyles}
                    genres={genres}
                    mediaType={mediaType}
                  />
                </View>
                
                <TouchableOpacity 
                  style={[modalStyles.actionButton, { flex: 1, marginHorizontal: 4 }]}
                  onPress={handleWatchlistToggle}
                >
                  <Text style={modalStyles.actionButtonText}>
                    {unseen.some(movie => movie.id === selectedMovie?.id) ? 'Remove from Watchlist' : 'Watchlist'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[modalStyles.actionButton, { flex: 1, marginHorizontal: 4 }]}
                  onPress={handleNotInterested}
                >
                  <Text style={modalStyles.actionButtonText}>Not Interested</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity onPress={closeDetailModal} style={modalStyles.cancelButtonContainer}>
                <Text style={modalStyles.cancelText}>cancel</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Modal>

        {/* **LEGACY RATING MODAL (FALLBACK)** */}
        <RatingModal
          visible={ratingModalVisible}
          onClose={closeRatingModal}
          onSubmit={submitRating}
          movie={selectedMovie}
          ratingInput={ratingInput}
          setRatingInput={setRatingInput}
          slideAnim={slideAnim}
          mediaType={mediaType}
          isDarkMode={isDarkMode}
          theme={theme}
          genres={genres}
        />
      </SafeAreaView>
    </View>
  );
}

// ============================================================================
// **ENHANCED STYLES SYSTEM**
// ============================================================================

const styles = StyleSheet.create({
  // **Tab Layout**
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  
  // **Section Layout**
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  // **Carousel and Card Layout**
  moviePoster: {
    width: '100%',
    height: MOVIE_CARD_WIDTH * 1.5,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  
  matchBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    zIndex: 1,
  },
  matchText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // **Recent Releases Layout**
  recentCard: {
    flex: 1,
    marginRight: 16,
    flexDirection: 'row',
  },
  recentPoster: {
    width: 100,
    height: 150,
  },
  
  // **Rating Container Layout**
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  
  // **Loading Container**
  loadingContainer: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // **Enhanced Badge System**
  rankingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  rankingNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  aiRecommendationBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
    minWidth: 24,
    alignItems: 'center',
  },
});

export default HomeScreen;