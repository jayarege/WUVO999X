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
import { getHomeStyles } from '../../Styles/homeStyles';
import { getHeaderStyles } from '../../Styles/headerStyles';
import { getModalStyles } from '../../Styles/modalStyles';
import { getButtonStyles } from '../../Styles/buttonStyles';
import { getRatingStyles } from '../../Styles/ratingStyles'; 
import { getLayoutStyles } from '../../Styles/layoutStyles';
import theme from '../../utils/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { LavaLampBackground } from '../../utils/Theme';

const { width } = Dimensions.get('window');
const MOVIE_CARD_WIDTH = (width - 48) / 2.5;
const CAROUSEL_ITEM_WIDTH = MOVIE_CARD_WIDTH + 20;
const API_KEY = 'b401be0ea16515055d8d0bde16f80069';

function HomeScreen({ seen, unseen, genres, newReleases, isDarkMode, toggleTheme, onAddToSeen, onAddToUnseen }) {
  const navigation = useNavigation();

  // Use media type context
  const { mediaType, setMediaType } = useMediaType();

  // Get all themed styles
  const homeStyles = getHomeStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const headerStyles = getHeaderStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const modalStyles = getModalStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const buttonStyles = getButtonStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const ratingStyles = getRatingStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const layoutStyles = getLayoutStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);

  // Update contentType to use mediaType from context
  const [activeTab, setActiveTab] = useState('new');
  const [contentType, setContentType] = useState('movies');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetailModalVisible, setMovieDetailModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingInput, setRatingInput] = useState('');
  const [recentReleases, setRecentReleases] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [movieCredits, setMovieCredits] = useState(null);
  const [movieProviders, setMovieProviders] = useState(null);
  
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
  
  const today = useMemo(() => new Date(), []);
  const oneWeekAgo = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 7);
    return date;
  }, [today]);

  const handleContentTypeChange = useCallback((type) => {
    setContentType(type);
    setMediaType(type === 'movies' ? 'movie' : 'tv');
  }, [setMediaType]);

  // Helper function to filter out adult content
  const filterAdultContent = useCallback((movies) => {
    if (!movies || !Array.isArray(movies)) return [];
    
    return movies.filter(movie => {
      if (movie.adult === true) return false;
      
      const title = (movie.title || '').toLowerCase();
      const overview = (movie.overview || '').toLowerCase();
      
      const adultKeywords = [
        'xxx', 'porn', 'erotic', 'adult', 'sexy', 'nude', 'naked',
        'sexual', 'seduction', 'strip', 'lingerie', 'intimate',
        'sensual', 'fetish', 'bdsm', 'kink'
      ];
      
      const hasAdultKeywords = adultKeywords.some(keyword => 
        title.includes(keyword) || overview.includes(keyword)
      );
      
      if (hasAdultKeywords) return false;
      
      if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
        const isDocumentary = movie.genre_ids.includes(99);
        if (isDocumentary && title.includes('sex')) return false;
      }
      
      return true;
    });
  }, []);
  
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

  const fetchPopularMovies = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=1&include_adult=false`
      );
      const { results } = await res.json();
      
      // Get top 10 most popular movies (already sorted by TMDB popularity)
      const filtered = filterAdultContent(results)
        .filter(m => !seen.some(s => s.id === m.id) && !unseen.some(u => u.id === m.id))
        .slice(0, 10);
      
      setPopularMovies(filtered);
    } catch (err) {
      console.warn('Failed fetching popular movies', err);
    }
  }, [seen, unseen, filterAdultContent]);

  const fetchRecentReleases = useCallback(async () => {
    try {
      setIsLoadingRecent(true);
      
      const todayFormatted = formatDateForAPI(today);
      const oneWeekAgoFormatted = formatDateForAPI(oneWeekAgo);
      
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=primary_release_date.desc&include_adult=false&include_video=false&page=1&primary_release_date.gte=${oneWeekAgoFormatted}&primary_release_date.lte=${todayFormatted}&vote_count.gte=5`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent releases');
      }
      
      const data = await response.json();
      const filteredResults = filterAdultContent(data.results);
      
      const recentMovies = filteredResults
        .filter(movie => movie.poster_path)
        .map(movie => ({
          id: movie.id,
          title: movie.title,
          poster: movie.poster_path,
          poster_path: movie.poster_path,
          score: movie.vote_average,
          vote_average: movie.vote_average,
          voteCount: movie.vote_count,
          release_date: movie.release_date,
          genre_ids: movie.genre_ids,
          overview: movie.overview || "",
          adult: movie.adult || false,
          alreadySeen: seen.some(m => m.id === movie.id),
          inWatchlist: unseen.some(m => m.id === movie.id),
          userRating: seen.find(m => m.id === movie.id)?.userRating
        }));
      
      setRecentReleases(recentMovies);
      setIsLoadingRecent(false);
    } catch (error) {
      console.error('Error fetching recent releases:', error);
      setIsLoadingRecent(false);
    }
  }, [today, oneWeekAgo, seen, unseen, formatDateForAPI, filterAdultContent]);

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

  useEffect(() => {
    if (contentType === 'movies') {
      fetchRecentReleases();
      fetchPopularMovies();
    }
  }, [contentType, fetchRecentReleases, fetchPopularMovies]);

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
    const cleanUnseen = filterAdultContent(unseen);
    
    const suggestions = [...cleanUnseen]
      .filter(movie => movie.poster && movie.poster_path)
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
  }, [seen, unseen, filterAdultContent]);

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

  const handleMovieSelect = useCallback(async (movie) => {
    if (movie.adult === true) {
      console.warn('Attempted to select adult movie, blocking:', movie.title);
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
  }, [fetchMovieCredits, fetchMovieProviders]);

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
      ...selectedMovie,
      userRating: rating,
      eloRating: rating * 100,
      comparisonHistory: [],
      comparisonWins: 0,
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
  }, [ratingInput, selectedMovie, onAddToSeen, recentReleases, closeRatingModal, slideAnim]);

  const handleWatchlistToggle = useCallback(() => {
    if (!selectedMovie) return;
    
    if (selectedMovie.adult === true) {
      console.warn('Attempted to add adult movie to watchlist, blocking:', selectedMovie.title);
      closeDetailModal();
      return;
    }
    
    const isInWatchlist = unseen.some(movie => movie.id === selectedMovie.id);
    
    if (isInWatchlist) {
      onAddToUnseen(unseen.filter(movie => movie.id !== selectedMovie.id));
    } else {
      const normalizedMovie = {
        ...selectedMovie,
        score: selectedMovie.vote_average || selectedMovie.score || 0,
        poster: selectedMovie.poster_path || selectedMovie.poster || '',
        adult: selectedMovie.adult || false,
      };
      
      if (!seen.some(movie => movie.id === selectedMovie.id)) {
        onAddToUnseen(normalizedMovie);
      }
    }
    
    closeDetailModal();
  }, [selectedMovie, unseen, seen, onAddToUnseen, closeDetailModal]);

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
              <Text style={homeStyles.movieYear}>
                {item.release_date ? new Date(item.release_date).getFullYear() : 'Unknown'} • {
                  item.genre_ids?.map(id => genres[id] || '').filter(Boolean).slice(0, 2).join(', ')
                }
              </Text>
              <ThemedButton 
                mediaType={mediaType} 
                isDarkMode={isDarkMode} 
                theme={theme}
                onPress={() => handleMovieSelect(item)}
              >
                View Details
              </ThemedButton>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }, [getCardScale, getCardRotation, calculateMatchPercentage, position.x, homeStyles, buttonStyles, handleMovieSelect, genres]);

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
        </View>
        <TouchableOpacity
          style={homeStyles.quickRateButton}
          onPress={() => handleMovieSelect(item)}
        >
          <Ionicons name="information-circle" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  ), [homeStyles, handleMovieSelect]);

  const renderRecentReleaseCard = useCallback(({ item }) => (
    <View style={homeStyles.movieCardBorder}>
      <TouchableOpacity 
        style={[homeStyles.enhancedCard, styles.recentCard]}
        activeOpacity={0.7}
        onPress={() => handleMovieSelect(item)}
      >
        <Image 
          source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster}` }} 
          style={styles.recentPoster}
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
          <Text style={homeStyles.movieYear}>
            Released: {formatReleaseDate(item.release_date)}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={homeStyles.genreScore.color} />
            <Text style={[homeStyles.genreScore, { marginLeft: 4 }]}>
              {item.alreadySeen ? `Your Rating: ${item.userRating.toFixed(1)}` : `TMDb: ${item.score.toFixed(1)}`}
            </Text>
          </View>
          {!item.alreadySeen && (
            <TouchableOpacity
              style={buttonStyles.primaryButton}
              onPress={() => handleMovieSelect(item)}
            >
              <Text style={buttonStyles.primaryButtonText}>View Details</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </View>
  ), [homeStyles, buttonStyles, formatReleaseDate, handleMovieSelect]);

  const renderWhatsOutNowSection = useCallback(() => {
    return (
      <View style={homeStyles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={homeStyles.sectionTitle}>
            What's Out Now
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

  const renderFavoriteGenresSection = useCallback(() => {
    return (
      <View style={homeStyles.section}>
        <Text style={homeStyles.sectionTitle}>
          Your Favorite Genres
        </Text>
        {topGenres.length > 0 ? (
          <View>
            {topGenres.map((genre, index) => (
              <View key={genre.id} style={homeStyles.genreItem}>
                <View>
                  <Text style={homeStyles.genreName}>
                    {genre.name}
                  </Text>
                  <Text style={homeStyles.movieYear}>
                    {genre.movieCount} movies
                  </Text>
                </View>
                <View style={styles.genreScoreContainer}>
                  <Text style={homeStyles.genreScore}>
                    {genre.averageScore.toFixed(1)}
                  </Text>
                  <Text style={homeStyles.genreTag}>
                    #{index + 1}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={homeStyles.swipeInstructions}>
            Rate more movies to see your favorite genres
          </Text>
        )}
      </View>
    );
  }, [homeStyles, topGenres]);

  const renderRecommendationsCarousel = useCallback(() => {
    return (
      <View style={homeStyles.carouselContainer} {...panResponder.panHandlers}>
        <View style={styles.recommendationHeader}>
          <Text style={homeStyles.genreTag}>
            Based on your taste profile
          </Text>
          <TouchableOpacity 
            style={buttonStyles.skipButton}
            onPress={() => {
              position.setValue({ x: 0, y: 0 });
              setCurrentIndex(0);
              if (autoScrollAnimation.current) {
                autoScrollAnimation.current.stop();
              }
              startAutoScroll();
            }}
          >
            <Ionicons 
              name="refresh" 
              size={18} 
              color={homeStyles.genreTag.color} 
            />
          </TouchableOpacity>
        </View>
        
        <Animated.FlatList
          ref={scrollRef}
          data={recommendations}
          renderItem={renderCarouselItem}
          keyExtractor={item => item.id.toString()}
          horizontal
          contentContainerStyle={homeStyles.carouselContent}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CAROUSEL_ITEM_WIDTH}
          decelerationRate="fast"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
        
        <View style={styles.recommendationFooter}>
          <Text style={homeStyles.swipeInstructions}>
            Swipe to explore more recommendations
          </Text>
          <View style={styles.dotIndicatorContainer}>
            {recommendations.slice(0, 5).map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.dotIndicator, 
                  currentIndex === index 
                    ? { backgroundColor: homeStyles.genreScore.color, width: 16 } 
                    : { backgroundColor: homeStyles.movieYear.color }
                ]} 
              />
            ))}
          </View>
        </View>
      </View>
    );
  }, [
    homeStyles, buttonStyles,
    panResponder.panHandlers,
    position,
    setCurrentIndex,
    autoScrollAnimation,
    startAutoScroll,
    scrollRef,
    recommendations,
    renderCarouselItem,
    scrollX,
    currentIndex
  ]);

 const renderPopularMoviesSection = useCallback(() => {
  return (
    <View style={homeStyles.section}>
      <Text style={homeStyles.sectionTitle}>
        Popular Movies
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
          <View style={homeStyles.movieCardBorder}>
            <TouchableOpacity
              style={[{ marginRight: 12, width: MOVIE_CARD_WIDTH, height: MOVIE_CARD_WIDTH * 1.8 }]}
              activeOpacity={0.7}
              onPress={() => handleMovieSelect(item)}
            >
              <View
                style={[homeStyles.enhancedCard, { width: MOVIE_CARD_WIDTH, height: MOVIE_CARD_WIDTH * 1.8, padding: 5 }]}
              >
                <View style={[styles.rankingBadge, { backgroundColor: theme[mediaType][isDarkMode ? 'dark' : 'light'].accent }]}>
                  <Text style={styles.rankingNumber}>{index + 1}</Text>
                </View>
                <Image
                  source={{
                    uri: `https://image.tmdb.org/t/p/w500${item.poster_path}`
                  }}
                  style={[styles.moviePoster, { width: MOVIE_CARD_WIDTH - 2, height: MOVIE_CARD_WIDTH * 1.5 - 2 }]}
                  resizeMode="cover"
                />
                <View style={[homeStyles.movieInfoBox, { height: 50, width: MOVIE_CARD_WIDTH - 2 }]}>
                  <Text
                    style={homeStyles.genreName}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.7}
                    ellipsizeMode="tail"
                  >
                    {item.title}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons
                      name="star"
                      size={12}
                      color={theme[mediaType][isDarkMode ? 'dark' : 'light'].accent}
                    />
                    <Text style={[homeStyles.genreScore, { marginLeft: 4, fontSize: 12 }]}>
                      {item.vote_average ? item.vote_average.toFixed(1) : '?'}
                    </Text>
                  </View>
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
}, [
  homeStyles,
  popularMovies,
  handleMovieSelect,
  popularScrollX,
  popularScrollRef,
  startPopularAutoScroll,
  autoScrollPopular,
  theme,
  mediaType,
  isDarkMode
]);

  const renderStatsSection = useCallback(() => {
    return (
      <View style={homeStyles.section}>
        <Text style={homeStyles.sectionTitle}>
          Your Stats
        </Text>
        <View style={styles.statsContent}>
          <View style={styles.statItem}>
            <Ionicons 
              name="star-outline" 
              size={24} 
              color={homeStyles.genreScore.color} 
              style={styles.statIcon}
            />
            <View>
              <Text style={homeStyles.genreScore}>
                {seen.length}
              </Text>
              <Text style={homeStyles.movieYear}>
                Movies Rated
              </Text>
            </View>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons 
              name="eye-off-outline" 
              size={24} 
              color={homeStyles.genreScore.color} 
              style={styles.statIcon}
            />
            <View>
              <Text style={homeStyles.genreScore}>
                {unseen.length}
              </Text>
              <Text style={homeStyles.movieYear}>
                Watchlist Size
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }, [homeStyles, seen.length, unseen.length]);

  return (
    <View style={{ flex: 1 }}>
      <LavaLampBackground mediaType={mediaType} isDarkMode={isDarkMode} theme={theme} />
      <SafeAreaView style={[layoutStyles.safeArea, homeStyles.homeContainer]}>
        <ThemedHeader mediaType={mediaType} isDarkMode={isDarkMode} theme={theme}>
          <Text style={headerStyles.screenTitle}>
            {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
          </Text>
          <TouchableOpacity
            style={headerStyles.themeToggle}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDarkMode ? 'sunny' : 'moon'}
              size={24}
              color={theme[mediaType][isDarkMode ? 'dark' : 'light'].accent}
            />
          </TouchableOpacity>
        </ThemedHeader>
        
    {/* Content Type Toggle (Movies/TV Shows) - FIXED VERSION */}
<View style={{
  marginTop: 12,
  marginBottom: 8,
  paddingHorizontal: 16,
}}>
  <View style={{
    borderWidth: 2,
    borderColor: mediaType === 'movie' ? '#6C2BD9' : '#59ADE8',
    borderRadius: 25,
    padding: 2,
    backgroundColor: 'transparent',
  }}>
    <View style={{
      flexDirection: 'row',
      borderRadius: 25,
      overflow: 'hidden',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      minHeight: 44,
    }}>
      <TouchableOpacity 
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          minHeight: 44,
          borderTopLeftRadius: 25,
          borderBottomLeftRadius: 25,
          backgroundColor: contentType === 'movies' ? '#FFFFFF' : 'transparent',
        }}
        onPress={() => handleContentTypeChange('movies')}
      >
        <Ionicons 
          name="film-outline" 
          size={18} 
          color={contentType === 'movies' ? '#000000' : '#FFFFFF'}
        />
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: contentType === 'movies' ? '#000000' : '#FFFFFF',
          marginLeft: 8,
        }}>
          Movies
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          minHeight: 44,
          borderTopRightRadius: 25,
          borderBottomRightRadius: 25,
          backgroundColor: contentType === 'tv' ? '#FFFFFF' : 'transparent',
        }}
        onPress={() => handleContentTypeChange('tv')}
      >
        <Ionicons 
          name="tv-outline" 
          size={18} 
          color={contentType === 'tv' ? '#000000' : '#FFFFFF'}
        />
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: contentType === 'tv' ? '#000000' : '#FFFFFF',
          marginLeft: 8,
        }}>
          TV Shows
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</View>
      
      {/* Movies Content */}
      {contentType === 'movies' && (
        <>
          <View style={styles.tabContainer}>
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
                activeTab === 'recommendations' && { 
                  borderBottomColor: homeStyles.genreScore.color, 
                  borderBottomWidth: 2 
                }
              ]}
              onPress={() => setActiveTab('recommendations')}
            >
              <Text 
                style={[
                  buttonStyles.skipButtonText,
                  { 
                    color: activeTab === 'recommendations' ? 
                      homeStyles.genreScore.color : 
                      homeStyles.movieYear.color
                  }
                ]}
              >
                Movies For You
              </Text>
            </TouchableOpacity>
          </View>
          
          {activeTab === 'new' && (
            <ScrollView style={homeStyles.homeContainer}>
              {renderWhatsOutNowSection()}
              {renderPopularMoviesSection()}
            </ScrollView>
          )}
          
          {activeTab === 'recommendations' && (
            <ScrollView style={homeStyles.homeContainer}>
              {renderFavoriteGenresSection()}
              
              <View style={homeStyles.section}>
                <Text style={homeStyles.sectionTitle}>
                  Recommended For You
                </Text>
                
                {recommendations.length > 0 ? (
                  renderRecommendationsCarousel()
                ) : (
                  <Text style={homeStyles.swipeInstructions}>
                    Rate more movies to get personalized recommendations
                  </Text>
                )}
              </View>
              
              {renderStatsSection()}
            </ScrollView>
          )}
        </>
      )}
      
      {/* TV Shows Content */}
      {contentType === 'tv' && (
        <ScrollView style={homeStyles.homeContainer}>
          <View style={homeStyles.section}>
            <Text style={homeStyles.sectionTitle}>
              TV Shows Coming Soon
            </Text>
            <Text style={homeStyles.swipeInstructions}>
              TV Shows functionality will be implemented soon!
            </Text>
          </View>
        </ScrollView>
      )}
      
      {/* Movie Detail Modal */}
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
              <TouchableOpacity 
                style={modalStyles.actionButton}
                onPress={openRatingModal}
              >
                <Text style={modalStyles.actionButtonText}>Rate</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={modalStyles.actionButton}
                onPress={handleWatchlistToggle}
              >
                <Text style={modalStyles.actionButtonText}>
                  {unseen.some(movie => movie.id === selectedMovie?.id) ? 'Remove from Watchlist' : 'Watchlist'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={modalStyles.actionButton}
                onPress={() => {
                  console.log('Wildcard pressed');
                }}
              >
                <Text style={modalStyles.actionButtonText}>Wildcard</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity onPress={closeDetailModal} style={modalStyles.cancelButtonContainer}>
              <Text style={modalStyles.cancelText}>cancel</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* Rating Input Modal */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeRatingModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <View style={modalStyles.modalOverlay}>
            <View style={modalStyles.animatedContainer}>
              <View style={modalStyles.modalContent}>
                <View style={styles.ratingCompactHeader}>
                  <Image 
                    source={{ uri: `https://image.tmdb.org/t/p/w500${selectedMovie?.poster_path}` }} 
                    style={styles.ratingPosterThumbnail}
                    resizeMode="cover" 
                  />
                  
                  <Text style={modalStyles.modalTitle}>
                    {selectedMovie?.title}
                  </Text>
                  
                  <View style={styles.ratingCompactScoreRow}>
                    <Ionicons name="star" size={16} color={homeStyles.genreScore.color} />
                    <Text style={[homeStyles.genreScore, { marginLeft: 4 }]}>
                      {selectedMovie?.vote_average?.toFixed(1)}
                    </Text>
                  </View>
                  
                  <Text style={homeStyles.genreTag}>
                    {selectedMovie?.genre_ids?.map(id => genres[id] || '').filter(Boolean).join(', ')}
                  </Text>
                </View>
                
                <Text style={ratingStyles.ratingQuestion}>
                  Your Rating (1.0-10.0):
                </Text>
                
                <TextInput
                  style={ratingStyles.ratingInput}
                  value={ratingInput}
                  onChangeText={setRatingInput}
                  keyboardType="decimal-pad"
                  placeholder="Enter rating"
                  maxLength={4}
                  returnKeyType="done"
                  autoFocus={true}
                />
                
                <View style={modalStyles.modalButtons}>
                  <TouchableOpacity
                    style={[modalStyles.modalButton, modalStyles.primaryButton]}
                    onPress={submitRating}
                    activeOpacity={0.7}
                  >
                    <Text style={modalStyles.modalButtonText}>
                      Rate Movie
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[modalStyles.modalButton, modalStyles.cancelButton]}
                    onPress={closeRatingModal}
                    activeOpacity={0.7}
                  >
                    <Text style={modalStyles.modalButtonText}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
    </View>
  );
}

// Minimal custom styles for layout and positioning only
const styles = StyleSheet.create({
  // Content Type Toggle Layout
  contentTypeToggleContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  contentTypeToggle: {
    flexDirection: 'row',
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 44,
  },
  contentTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  leftButton: {
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
  },
  rightButton: {
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
  },
  activeContentButton: {
    backgroundColor: '#FFFFFF',
  },
  buttonContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
contentTypeIcon: {
  marginRight: 6,
},
contentTypeText: {
  fontSize: 14,
  fontWeight: '600',
},
  
  // Tab Layout
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
  
  // Section Layout
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  // Carousel and Card Layout
  moviePoster: {
    width: '100%',
    height: MOVIE_CARD_WIDTH * 1.5,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
  
  // Recent Releases Layout
  recentCard: {
    width: 300,
    marginRight: 16,
    flexDirection: 'row',
  },
  recentPoster: {
    width: 100,
    height: 150,
  },
  
  // Rating Container Layout
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  
  // Genre Score Layout
  genreScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Recommendation Header Layout
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  
  // Recommendation Footer Layout
  recommendationFooter: {
    alignItems: 'center',
    marginTop: 8,
  },
  dotIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dotIndicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  
  // Stats Layout
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: '40%',
  },
  statIcon: {
    marginRight: 12,
  },
  
  // Loading Container
  loadingContainer: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Rating Modal Layout
  ratingCompactHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingPosterThumbnail: {
    width: 70,
    height: 105,
    borderRadius: 6,
    marginBottom: 8,
  },
  ratingCompactScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
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
  posterBorder: {
    width: MOVIE_CARD_WIDTH,
    height: MOVIE_CARD_WIDTH * 1.5,
    borderRadius: 12,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
contentTypeIcon: {
  marginRight: 6,
},
});

export default HomeScreen;