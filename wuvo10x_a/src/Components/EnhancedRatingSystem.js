import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Console log to verify file is loading
console.log('✅ EnhancedRatingSystem component loaded successfully!');

// Helper functions for percentile-based calculations
const calculateMidRatingFromPercentile = (userMovies, percentile) => {
  const sortedRatings = userMovies
    .map(m => m.userRating || (m.eloRating / 100))
    .filter(rating => rating && !isNaN(rating))
    .sort((a, b) => a - b);

  if (sortedRatings.length === 0) return 7.0;

  const lowIndex = Math.floor((percentile[0] / 100) * sortedRatings.length);
  const highIndex = Math.floor((percentile[1] / 100) * sortedRatings.length);
  
  const lowRating = sortedRatings[Math.max(0, lowIndex)] || sortedRatings[0];
  const highRating = sortedRatings[Math.min(highIndex, sortedRatings.length - 1)] || sortedRatings[sortedRatings.length - 1];
  
  return (lowRating + highRating) / 2;
};

const getDefaultRatingForCategory = (categoryKey) => {
  const defaults = {
    LOVED: 8.5,
    LIKED: 7.0,
    AVERAGE: 5.5,
    DISLIKED: 3.0
  };
  return defaults[categoryKey] || 7.0;
};

const getRatingRangeFromPercentile = (userMovies, percentile) => {
  const sortedRatings = userMovies
    .map(m => m.userRating || (m.eloRating / 100))
    .filter(rating => rating && !isNaN(rating))
    .sort((a, b) => a - b);

  if (sortedRatings.length === 0) return [1, 10];

  const lowIndex = Math.floor((percentile[0] / 100) * sortedRatings.length);
  const highIndex = Math.floor((percentile[1] / 100) * sortedRatings.length);
  
  const lowRating = sortedRatings[Math.max(0, lowIndex)] || sortedRatings[0];
  const highRating = sortedRatings[Math.min(highIndex, sortedRatings.length - 1)] || sortedRatings[sortedRatings.length - 1];
  
  return [lowRating, highRating];
};

// **DYNAMIC PERCENTILE-BASED RATING CATEGORIES**
const calculateDynamicRatingCategories = (userMovies) => {
  if (!userMovies || userMovies.length === 0) {
    // Fallback to default percentiles if no user data
    return {
      LOVED: { percentile: [75, 100], emoji: '❤️', color: '#4CAF50', borderColor: '#1B5E20', label: 'Loved it!', description: 'This was amazing!' },
      LIKED: { percentile: [50, 74], emoji: '👍', color: '#4CAF50', borderColor: '#4CAF50', label: 'Liked it', description: 'Pretty good!' },
      AVERAGE: { percentile: [25, 49], emoji: '🟡', color: '#FF9800', borderColor: '#FFC107', label: 'It was okay', description: 'Nothing special' },
      DISLIKED: { percentile: [0, 24], emoji: '👎', color: '#F44336', borderColor: '#D32F2F', label: 'Disliked it', description: 'Not for me' }
    };
  }

  // Sort user ratings to calculate percentiles
  const sortedRatings = userMovies
    .map(m => m.userRating || (m.eloRating / 100))
    .filter(rating => rating && !isNaN(rating))
    .sort((a, b) => a - b);

  if (sortedRatings.length === 0) {
    return calculateDynamicRatingCategories([]);
  }

  // Calculate percentile thresholds
  const get25thPercentile = () => sortedRatings[Math.floor(sortedRatings.length * 0.25)] || sortedRatings[0];
  const get50thPercentile = () => sortedRatings[Math.floor(sortedRatings.length * 0.50)] || sortedRatings[0];
  const get75thPercentile = () => sortedRatings[Math.floor(sortedRatings.length * 0.75)] || sortedRatings[0];
  
  const minRating = sortedRatings[0];
  const maxRating = sortedRatings[sortedRatings.length - 1];
  const p25 = get25thPercentile();
  const p50 = get50thPercentile();
  const p75 = get75thPercentile();

  console.log(`📊 Dynamic Rating Ranges - Min: ${minRating}, 25th: ${p25}, 50th: ${p50}, 75th: ${p75}, Max: ${maxRating}`);

  return {
    LOVED: { 
      percentile: [75, 100], 
      emoji: '❤️', 
      color: '#4CAF50',
      borderColor: '#1B5E20', // Dark green border
      label: 'Loved it!',
      description: 'This was amazing!'
    },
    LIKED: { 
      percentile: [50, 74], 
      emoji: '👍', 
      color: '#4CAF50',
      borderColor: '#4CAF50', // Light green border
      label: 'Liked it',
      description: 'Pretty good!'
    },
    AVERAGE: { 
      percentile: [25, 49], 
      emoji: '🟡', 
      color: '#FF9800',
      borderColor: '#FFC107', // Yellow border
      label: 'It was okay',
      description: 'Nothing special'
    },
    DISLIKED: { 
      percentile: [0, 24], 
      emoji: '👎', 
      color: '#F44336',
      borderColor: '#D32F2F', // Red border
      label: 'Disliked it',
      description: 'Not for me'
    }
  };
};

// Movie comparison engine
const MovieComparisonEngine = {
  getMoviesInPercentileRange(userMovies, targetPercentile, excludeMovieId) {
    if (!userMovies || userMovies.length === 0) return [];
    
    const sortedMovies = [...userMovies]
      .filter(movie => movie.id !== excludeMovieId && movie.userRating)
      .sort((a, b) => b.userRating - a.userRating);
    
    if (sortedMovies.length === 0) return [];
    
    const totalMovies = sortedMovies.length;
    const startIndex = Math.floor((targetPercentile[0] / 100) * totalMovies);
    const endIndex = Math.ceil((targetPercentile[1] / 100) * totalMovies);
    
    return sortedMovies.slice(startIndex, Math.min(endIndex, totalMovies));
  },

  calculateComparisonScore(movie, newMovie, genres) {
    let score = 0;
    
    // Genre similarity (highest weight)
    const newMovieGenres = new Set(newMovie.genre_ids || []);
    const movieGenres = new Set(movie.genre_ids || []);
    const genreIntersection = [...newMovieGenres].filter(g => movieGenres.has(g));
    score += (genreIntersection.length / Math.max(newMovieGenres.size, 1)) * 40;
    
    // Release year proximity (medium weight)
    const newYear = new Date(newMovie.release_date || '2000').getFullYear();
    const movieYear = new Date(movie.release_date || '2000').getFullYear();
    const yearDiff = Math.abs(newYear - movieYear);
    score += Math.max(0, 20 - yearDiff) * 0.5;
    
    // Rating proximity within category (low weight)
    const ratingDiff = Math.abs((newMovie.suggestedRating || 7) - movie.userRating);
    score += Math.max(0, 10 - ratingDiff * 2);
    
    return score;
  },

  findBestComparison(categoryMovies, newMovie, genres) {
    if (categoryMovies.length === 0) return null;
    
    const scoredMovies = categoryMovies.map(movie => ({
      ...movie,
      comparisonScore: this.calculateComparisonScore(movie, newMovie, genres)
    }));
    
    return scoredMovies.sort((a, b) => b.comparisonScore - a.comparisonScore)[0];
  }
};

// **THREE-COMPARISON SYSTEM LIKE WILDCARD**
const WildcardComparison = ({ 
  visible, 
  newMovie, 
  comparisonMovies, 
  category, 
  onClose, 
  onComparisonComplete,
  colors,
  genres,
  userMovies 
}) => {
  const [currentComparison, setCurrentComparison] = useState(0);
  const [comparisonResults, setComparisonResults] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  const RATING_CATEGORIES = calculateDynamicRatingCategories(userMovies);
  const categoryInfo = RATING_CATEGORIES[category];

  const handleComparison = useCallback((winner) => {
    const currentComparisonMovie = comparisonMovies[currentComparison];
    const result = {
      comparison: currentComparison + 1,
      winner: winner === 'new' ? newMovie : currentComparisonMovie,
      loser: winner === 'new' ? currentComparisonMovie : newMovie,
      userChoice: winner
    };

    const newResults = [...comparisonResults, result];
    setComparisonResults(newResults);

    if (currentComparison < 2) {
      // Move to next comparison
      setCurrentComparison(currentComparison + 1);
    } else {
      // All comparisons complete
      setIsComplete(true);
      
      // Calculate final rating based on comparison results
      const newMovieWins = newResults.filter(r => r.userChoice === 'new').length;
      const finalRating = calculateRatingFromComparisons(newMovieWins, newResults, categoryInfo);
      
      console.log(`🎯 Comparison Complete: ${newMovieWins}/3 wins, Final Rating: ${finalRating}`);
      
      setTimeout(() => {
        onComparisonComplete(finalRating);
      }, 1500);
    }
  }, [currentComparison, comparisonResults, comparisonMovies, newMovie, categoryInfo, onComparisonComplete]);

  const calculateRatingFromComparisons = (wins, results, categoryInfo) => {
    // Get the comparison movies' ratings
    const comparisonRatings = results.map(r => {
      const movie = r.winner === newMovie ? r.loser : r.winner;
      return movie.userRating || (movie.eloRating / 100);
    });

    const avgComparisonRating = comparisonRatings.reduce((sum, r) => sum + r, 0) / comparisonRatings.length;
    
    // Adjust rating based on wins vs losses
    if (wins === 3) {
      // Won all comparisons - higher end of category
      return Math.min(10, avgComparisonRating + 0.5);
    } else if (wins === 2) {
      // Won majority - middle-high of category  
      return Math.min(10, avgComparisonRating + 0.2);
    } else if (wins === 1) {
      // Won minority - middle-low of category
      return Math.max(1, avgComparisonRating - 0.2);
    } else {
      // Won nothing - lower end of category
      return Math.max(1, avgComparisonRating - 0.5);
    }
  };

  const resetComparison = () => {
    setCurrentComparison(0);
    setComparisonResults([]);
    setIsComplete(false);
  };

  useEffect(() => {
    if (visible) {
      resetComparison();
    }
  }, [visible]);

  if (!visible || !comparisonMovies || comparisonMovies.length < 3) return null;

  const currentComparisonMovie = comparisonMovies[currentComparison];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={colors.primaryGradient || ['#667eea', '#764ba2']}
          style={[styles.comparisonModalContent]}
        >
          {!isComplete ? (
            <>
              <View style={styles.comparisonHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {categoryInfo?.emoji} Comparison {currentComparison + 1}/3
                </Text>
                <Text style={[styles.comparisonSubtitle, { color: colors.subText }]}>
                  Which one do you prefer?
                </Text>
              </View>
              
              <View style={styles.moviesComparison}>
                {/* New Movie */}
                <TouchableOpacity 
                  style={styles.movieComparisonCard}
                  onPress={() => handleComparison('new')}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w500${newMovie?.poster_path}` }}
                    style={styles.comparisonPoster}
                    resizeMode="cover"
                  />
                  <Text style={[styles.movieCardName, { color: colors.text }]} numberOfLines={2}>
                    {newMovie?.title || newMovie?.name}
                  </Text>
                  <Text style={[styles.movieCardYear, { color: colors.subText }]}>
                    {newMovie?.release_date ? new Date(newMovie.release_date).getFullYear() : 'N/A'}
                  </Text>
                </TouchableOpacity>
                
                {/* VS Indicator */}
                <View style={styles.vsIndicator}>
                  <Text style={[styles.vsText, { color: colors.accent }]}>VS</Text>
                </View>
                
                {/* Comparison Movie */}
                <TouchableOpacity 
                  style={styles.movieComparisonCard}
                  onPress={() => handleComparison('comparison')}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w500${currentComparisonMovie?.poster_path}` }}
                    style={styles.comparisonPoster}
                    resizeMode="cover"
                  />
                  <Text style={[styles.movieCardName, { color: colors.text }]} numberOfLines={2}>
                    {currentComparisonMovie?.title || currentComparisonMovie?.name}
                  </Text>
                  <Text style={[styles.movieCardYear, { color: colors.subText }]}>
                    {currentComparisonMovie?.release_date ? new Date(currentComparisonMovie.release_date).getFullYear() : 'N/A'}
                  </Text>
                  <View style={[styles.ratingBadge, { backgroundColor: categoryInfo?.color }]}>
                    <Text style={styles.ratingText}>
                      {currentComparisonMovie?.userRating?.toFixed(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Progress Indicator */}
              <View style={styles.progressIndicator}>
                {[0, 1, 2].map(index => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      { 
                        backgroundColor: index <= currentComparison ? colors.accent : colors.border?.color || '#ccc'
                      }
                    ]}
                  />
                ))}
              </View>
            </>
          ) : (
            // Completion Screen
            <View style={styles.completionScreen}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                🎯 Rating Complete!
              </Text>
              <Text style={[styles.comparisonSubtitle, { color: colors.subText }]}>
                Based on your {comparisonResults.filter(r => r.userChoice === 'new').length}/3 comparisons
              </Text>
              
              <View style={styles.resultsContainer}>
                {comparisonResults.map((result, index) => (
                  <View key={index} style={styles.resultRow}>
                    <Text style={[styles.resultText, { color: colors.text }]}>
                      {result.comparison}. vs {result.loser.title}: {result.userChoice === 'new' ? '✅ Won' : '❌ Lost'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: colors.border?.color || '#ccc' }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelButtonText, { color: colors.subText }]}>
              {isComplete ? 'Close' : 'Cancel'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
};

// Sentiment Rating Modal Component  
const SentimentRatingModal = ({ visible, movie, onClose, onRatingSelect, colors, userMovies }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Calculate dynamic categories based on user's rating history
  const RATING_CATEGORIES = calculateDynamicRatingCategories(userMovies);

  const handleCategorySelect = useCallback((categoryKey) => {
    console.log('🎭 User selected sentiment:', categoryKey);
    setSelectedCategory(categoryKey);
    
    const category = RATING_CATEGORIES[categoryKey];
    // Calculate mid-rating based on percentile position (default to 7.0 for new users)
    const midRating = userMovies && userMovies.length > 0 ? 
      calculateMidRatingFromPercentile(userMovies, category.percentile) : 
      getDefaultRatingForCategory(categoryKey);
    
    const movieWithRating = { ...movie, suggestedRating: midRating };
    onRatingSelect(movieWithRating, categoryKey, midRating);
  }, [movie, onRatingSelect, RATING_CATEGORIES, userMovies]);

  const renderSentimentButton = (categoryKey) => {
    const category = RATING_CATEGORIES[categoryKey];
    const isSelected = selectedCategory === categoryKey;
    
    return (
      <TouchableOpacity
        key={categoryKey}
        style={[
          styles.sentimentButton,
          { 
            backgroundColor: isSelected ? category.color : 'transparent',
            borderColor: category.borderColor || category.color,
            borderWidth: 3
          }
        ]}
        onPress={() => handleCategorySelect(categoryKey)}
        activeOpacity={0.8}
      >
        <Text style={styles.sentimentEmoji}>{category.emoji}</Text>
        <Text style={[
          styles.sentimentLabel,
          { color: isSelected ? '#FFF' : category.color }
        ]}>
          {category.label}
        </Text>
        <Text style={[
          styles.sentimentDescription,
          { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.subText }
        ]}>
          {category.description}
        </Text>
        <Text style={[
          styles.sentimentRange,
          { color: isSelected ? 'rgba(255,255,255,0.6)' : colors.subText }
        ]}>
          {userMovies && userMovies.length > 0 ? 
            (() => {
              const range = getRatingRangeFromPercentile(userMovies, category.percentile);
              return `${range[0].toFixed(1)} - ${range[1].toFixed(1)}`;
            })() :
            `${category.percentile[0]}th - ${category.percentile[1]}th percentile`
          }
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.sentimentModalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            How did you feel about
          </Text>
          <Text style={[styles.movieTitle, { color: colors.accent }]}>
            {movie?.title || movie?.name}?
          </Text>
          
          <View style={styles.sentimentGrid}>
            {Object.keys(RATING_CATEGORIES).map(renderSentimentButton)}
          </View>
          
          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: colors.border?.color || '#ccc' }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelButtonText, { color: colors.subText }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// **SINGLE UNIFIED ENHANCED RATING BUTTON COMPONENT**
const EnhancedRatingButton = ({ 
  movie, 
  seen, 
  onAddToSeen, 
  onUpdateRating,
  colors,
  buttonStyles,
  modalStyles,
  genres,
  mediaType,
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'default', // 'default', 'compact', 'icon-only'
  onSuccess, // Callback when rating is completed
  showRatingValue = false // Show current rating on button
}) => {
  console.log('🎬 EnhancedRatingButton rendering for:', movie?.title);
  
  const [sentimentModalVisible, setSentimentModalVisible] = useState(false);
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [suggestedRating, setSuggestedRating] = useState(null);
  const [comparisonMovies, setComparisonMovies] = useState([]);

  const isAlreadyRated = useMemo(() => {
    return seen?.some(item => item.id === movie?.id) || false;
  }, [seen, movie?.id]);

  const currentRating = useMemo(() => {
    const ratedMovie = seen?.find(item => item.id === movie?.id);
    return ratedMovie?.userRating || null;
  }, [seen, movie?.id]);

  const handleRateButtonPress = useCallback(() => {
    console.log('📱 Rate button pressed for:', movie?.title);
    if (!movie) return;
    setSentimentModalVisible(true);
  }, [movie]);

  const handleSentimentSelect = useCallback((movieWithRating, categoryKey, rating) => {
    console.log('🎭 Sentiment selected:', categoryKey, 'Rating:', rating);
    setSelectedCategory(categoryKey);
    setSuggestedRating(rating);
    setSentimentModalVisible(false);
    
    // Calculate dynamic categories based on user's rating history
    const RATING_CATEGORIES = calculateDynamicRatingCategories(seen);
    const categoryInfo = RATING_CATEGORIES[categoryKey];
    
    // Find movies in the same percentile range for comparison
    const categoryMovies = MovieComparisonEngine.getMoviesInPercentileRange(
      seen,
      categoryInfo.percentile,
      movie.id
    );
    
    if (categoryMovies.length >= 3) {
      // Get best 3 comparison movies
      const scoredMovies = categoryMovies.map(m => ({
        ...m,
        comparisonScore: MovieComparisonEngine.calculateComparisonScore(m, movieWithRating, genres)
      }));
      
      const bestComparisons = scoredMovies
        .sort((a, b) => b.comparisonScore - a.comparisonScore)
        .slice(0, 3);
      
      setComparisonMovies(bestComparisons);
      setComparisonModalVisible(true);
      return;
    }
    
    // Not enough movies for comparison, use category average
    const categoryAverage = (categoryInfo.range[0] + categoryInfo.range[1]) / 2;
    handleConfirmRating(categoryAverage);
  }, [seen, movie, genres]);

  const handleComparisonComplete = useCallback((finalRating) => {
    console.log('✅ Comparison complete, final rating:', finalRating);
    setComparisonModalVisible(false);
    handleConfirmRating(finalRating);
  }, []);

  const handleConfirmRating = useCallback((finalRating) => {
    console.log('✅ Confirming rating:', finalRating, 'for:', movie?.title);
    if (!movie || !finalRating) return;
    
    const newItem = {
      ...movie,
      userRating: finalRating,
      eloRating: finalRating * 10,
      comparisonHistory: [],
      comparisonWins: 0,
      mediaType: mediaType,
      ratingCategory: selectedCategory
    };
    
    if (isAlreadyRated) {
      onUpdateRating(movie.id, finalRating);
    } else {
      onAddToSeen(newItem);
    }
    
    // Reset state
    setSelectedCategory(null);
    setSuggestedRating(null);
    setComparisonMovies([]);
    
    // Call success callback if provided
    if (onSuccess) {
      onSuccess(finalRating, movie);
    }
    
    const RATING_CATEGORIES = calculateDynamicRatingCategories(seen);
    
    Alert.alert(
      "Rating Added!", 
      `You ${RATING_CATEGORIES[selectedCategory]?.label?.toLowerCase()} "${movie.title}" (${finalRating.toFixed(1)}/10)`,
      [
        {
          text: "OK",
          onPress: () => {
            console.log('🏠 Returning to home screen after rating');
          }
        }
      ]
    );
  }, [movie, selectedCategory, isAlreadyRated, onUpdateRating, onAddToSeen, mediaType, seen]);

  const handleCloseModals = useCallback(() => {
    console.log('🚫 Closing modals');
    setSentimentModalVisible(false);
    setComparisonModalVisible(false);
    setSelectedCategory(null);
    setSuggestedRating(null);
    setComparisonMovies([]);
  }, []);

  // Dynamic button styles based on size and variant
  const getButtonStyles = () => {
    const baseStyle = {
      flexDirection: variant === 'icon-only' ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: size === 'small' ? 6 : size === 'large' ? 12 : 8,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: isAlreadyRated ? (colors.secondary || colors.primary) : colors.primary,
    };

    // Size-based padding
    if (size === 'small') {
      baseStyle.paddingVertical = 4;
      baseStyle.paddingHorizontal = variant === 'icon-only' ? 6 : 8;
    } else if (size === 'large') {
      baseStyle.paddingVertical = 12;
      baseStyle.paddingHorizontal = variant === 'icon-only' ? 16 : 20;
    } else {
      baseStyle.paddingVertical = 8;
      baseStyle.paddingHorizontal = variant === 'icon-only' ? 12 : 16;
    }

    // Variant-based adjustments
    if (variant === 'compact') {
      baseStyle.paddingVertical = Math.max(4, baseStyle.paddingVertical - 2);
      baseStyle.paddingHorizontal = Math.max(6, baseStyle.paddingHorizontal - 2);
    }

    return baseStyle;
  };

  const getIconSize = () => {
    if (size === 'small') return 12;
    if (size === 'large') return 20;
    return 16;
  };

  const getTextSize = () => {
    if (size === 'small') return 12;
    if (size === 'large') return 16;
    return 14;
  };

  const getButtonText = () => {
    if (variant === 'icon-only') return '';
    if (isAlreadyRated) {
      if (showRatingValue && currentRating) {
        return variant === 'compact' ? `${currentRating.toFixed(1)}★` : `${currentRating.toFixed(1)}/10`;
      }
      return variant === 'compact' ? 'Edit' : 'Update Rating';
    }
    return variant === 'compact' ? 'Rate' : 'Rate';
  };

  return (
    <>
      <TouchableOpacity
        style={[
          buttonStyles?.primaryButton || styles.defaultButton,
          styles.enhancedRateButton,
          getButtonStyles()
        ]}
        onPress={handleRateButtonPress}
        activeOpacity={0.8}
      >
        <Ionicons 
          name={isAlreadyRated ? "star" : "star-outline"} 
          size={getIconSize()} 
          color={colors.accent} 
        />
        {variant !== 'icon-only' && (
          <Text style={[
            buttonStyles?.primaryButtonText || styles.defaultButtonText,
            styles.enhancedRateButtonText,
            { 
              color: colors.accent,
              fontSize: getTextSize(),
              marginLeft: variant === 'compact' ? 4 : 6,
              marginTop: 0
            }
          ]}>
            {getButtonText()}
          </Text>
        )}
        {variant === 'icon-only' && showRatingValue && currentRating && (
          <Text style={[
            styles.iconOnlyRatingText,
            { 
              color: colors.accent,
              fontSize: size === 'small' ? 8 : size === 'large' ? 12 : 10
            }
          ]}>
            {currentRating.toFixed(1)}
          </Text>
        )}
      </TouchableOpacity>

      <SentimentRatingModal
        visible={sentimentModalVisible}
        movie={movie}
        onClose={handleCloseModals}
        onRatingSelect={handleSentimentSelect}
        colors={colors}
        userMovies={seen}
      />

      <WildcardComparison
        visible={comparisonModalVisible}
        newMovie={movie}
        comparisonMovies={comparisonMovies}
        category={selectedCategory}
        onClose={handleCloseModals}
        onComparisonComplete={handleComparisonComplete}
        colors={colors}
        genres={genres}
        userMovies={seen}
      />
    </>
  );
};

// Styles
const styles = StyleSheet.create({
  // Enhanced Rate Button
  enhancedRateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  enhancedRateButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  iconOnlyRatingText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  defaultButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  defaultButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sentiment Modal
  sentimentModalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  sentimentGrid: {
    gap: 16,
    marginBottom: 24,
  },
  sentimentButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  sentimentEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  sentimentLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sentimentDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  sentimentRange: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },

  // Comparison Modal
  comparisonModalContent: {
    width: '95%',
    maxWidth: 500,
    padding: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  comparisonHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  comparisonSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  moviesComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  movieCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  movieCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  movieCardName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  movieCardYear: {
    fontSize: 12,
    marginBottom: 8,
  },
  ratingBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  ratingText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  vsIndicator: {
    marginHorizontal: 16,
    paddingVertical: 8,
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // **Wildcard-Style Comparison Modal**
  movieComparisonCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  comparisonPoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  completionScreen: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  resultsContainer: {
    marginTop: 20,
    width: '100%',
  },
  resultRow: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  resultText: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Action Buttons
  actionButtons: {
    gap: 12,
  },
  confirmButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adjustButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  adjustButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Cancel Button
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// Quick Rating Button for Home Screen Cards
const QuickRatingButton = ({ 
  movie, 
  seen, 
  onAddToSeen, 
  onUpdateRating,
  colors,
  onSuccess
}) => {
  return (
    <EnhancedRatingButton
      movie={movie}
      seen={seen}
      onAddToSeen={onAddToSeen}
      onUpdateRating={onUpdateRating}
      colors={colors}
      size="small"
      variant="icon-only"
      showRatingValue={true}
      onSuccess={onSuccess}
    />
  );
};

// Compact Rating Button for Lists
const CompactRatingButton = ({ 
  movie, 
  seen, 
  onAddToSeen, 
  onUpdateRating,
  colors,
  onSuccess
}) => {
  return (
    <EnhancedRatingButton
      movie={movie}
      seen={seen}
      onAddToSeen={onAddToSeen}
      onUpdateRating={onUpdateRating}
      colors={colors}
      size="small"
      variant="compact"
      showRatingValue={true}
      onSuccess={onSuccess}
    />
  );
};

// Helper function to get rating category for a movie
const getRatingCategory = (rating, userMovies) => {
  if (!rating) return null;
  
  if (!userMovies || userMovies.length === 0) {
    // Use default thresholds for new users
    const categories = calculateDynamicRatingCategories([]);
    if (rating >= 8.5) return { key: 'LOVED', ...categories.LOVED };
    if (rating >= 6.5) return { key: 'LIKED', ...categories.LIKED };
    if (rating >= 4.5) return { key: 'AVERAGE', ...categories.AVERAGE };
    return { key: 'DISLIKED', ...categories.DISLIKED };
  }
  
  const categories = calculateDynamicRatingCategories(userMovies);
  const sortedRatings = userMovies
    .map(m => m.userRating || (m.eloRating / 100))
    .filter(r => r && !isNaN(r))
    .sort((a, b) => a - b);
  
  // Find rating's percentile position
  const position = sortedRatings.findIndex(r => r >= rating);
  const percentile = position === -1 ? 100 : (position / sortedRatings.length) * 100;
  
  for (const [key, category] of Object.entries(categories)) {
    if (percentile >= category.percentile[0] && percentile <= category.percentile[1]) {
      return { key, ...category };
    }
  }
  
  return null;
};

export { EnhancedRatingButton, QuickRatingButton, CompactRatingButton, getRatingCategory, calculateDynamicRatingCategories };