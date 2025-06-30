import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { calculateDynamicRatingCategories } from '../Components/EnhancedRatingSystem';

const { width, height } = Dimensions.get('window');

// Elo calculation functions (extracted from WildcardScreen)
const calculateKFactor = (gamesPlayed) => {
  if (gamesPlayed < 5) return 0.5;
  if (gamesPlayed < 10) return 0.25;
  if (gamesPlayed < 20) return 0.125;
  return 0.1;
};

const calculateExpectedWinProbability = (ratingA, ratingB) => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 4));
};

const adjustRating = (winner, loser) => {
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
  
  return {
    updatedWinner: {
      ...winner,
      userRating: newWinnerRating,
      eloRating: newWinnerRating * 10,
      gamesPlayed: (winner.gamesPlayed || 0) + 1
    },
    updatedLoser: {
      ...loser,
      userRating: newLoserRating,
      eloRating: newLoserRating * 10,
      gamesPlayed: (loser.gamesPlayed || 0) + 1
    }
  };
};

// Initial emotion to rating mapping
const getInitialRatingFromEmotion = (emotion) => {
  const emotionRatings = {
    LOVED: 8.5,
    LIKED: 7.0,
    AVERAGE: 5.5,
    DISLIKED: 3.0
  };
  return emotionRatings[emotion] || 7.0;
};

// Percentile bucket selection
const selectMovieFromPercentile = (seenMovies, emotion, usedOpponentIds = []) => {
  const sortedMovies = [...seenMovies]
    .filter(movie => !usedOpponentIds.includes(movie.id))
    .sort((a, b) => (b.userRating || 0) - (a.userRating || 0));
  
  if (sortedMovies.length === 0) return null;
  
  const percentileRanges = {
    LOVED: [0.75, 1.0],      // Top 75-100%
    LIKED: [0.50, 0.75],     // 50-75%
    AVERAGE: [0.25, 0.50],   // 25-50%
    DISLIKED: [0.0, 0.25]    // Bottom 0-25%
  };
  
  const range = percentileRanges[emotion] || [0.25, 0.75];
  const startIndex = Math.floor(sortedMovies.length * range[0]);
  const endIndex = Math.floor(sortedMovies.length * range[1]);
  
  const bucketMovies = sortedMovies.slice(startIndex, endIndex);
  
  if (bucketMovies.length === 0) {
    // Fallback: exclude top/bottom 10% and pick randomly
    const fallbackStart = Math.floor(sortedMovies.length * 0.1);
    const fallbackEnd = Math.floor(sortedMovies.length * 0.9);
    const fallbackMovies = sortedMovies.slice(fallbackStart, fallbackEnd);
    return fallbackMovies[Math.floor(Math.random() * fallbackMovies.length)] || null;
  }
  
  return bucketMovies[Math.floor(Math.random() * bucketMovies.length)];
};

// Ladder comparison - find next movie ranked just above current rating
const selectLadderOpponent = (seenMovies, currentRating, usedOpponentIds = []) => {
  const availableMovies = seenMovies.filter(movie => 
    !usedOpponentIds.includes(movie.id) && 
    (movie.userRating || 0) >= currentRating
  );
  
  if (availableMovies.length === 0) {
    // Fallback: find closest rated movie
    return seenMovies
      .filter(movie => !usedOpponentIds.includes(movie.id))
      .sort((a, b) => Math.abs((a.userRating || 0) - currentRating) - Math.abs((b.userRating || 0) - currentRating))[0] || null;
  }
  
  // Sort by rating and pick the lowest (just above current)
  availableMovies.sort((a, b) => (a.userRating || 0) - (b.userRating || 0));
  return availableMovies[0];
};

const InitialRatingFlow = ({
  visible,
  movie,
  seenMovies = [],
  onClose,
  onComplete,
  isDarkMode = false
}) => {
  const [currentStep, setCurrentStep] = useState('emotion'); // 'emotion', 'comparison', 'complete'
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [currentMovieRating, setCurrentMovieRating] = useState(null);
  const [opponentMovie, setOpponentMovie] = useState(null);
  const [usedOpponentIds, setUsedOpponentIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [comparedMovieIds, setComparedMovieIds] = useState([]);
  const [flowStartTime] = useState(new Date().toISOString());
  
  const colors = {
    background: isDarkMode ? '#1C2526' : '#FFFFFF',
    card: isDarkMode ? '#4B0082' : '#F8F9FA',
    text: isDarkMode ? '#F5F5F5' : '#333333',
    subText: isDarkMode ? '#D3D3D3' : '#666666',
    accent: isDarkMode ? '#FFD700' : '#4B0082',
    border: isDarkMode ? '#8A2BE2' : '#E0E0E0',
    success: '#4CAF50',
    error: '#F44336'
  };

  // Check if user has enough rated movies (10 minimum)
  const hasEnoughMovies = useMemo(() => {
    return seenMovies && seenMovies.length >= 10;
  }, [seenMovies]);

  // Get dynamic rating categories
  const RATING_CATEGORIES = useMemo(() => {
    return calculateDynamicRatingCategories(seenMovies);
  }, [seenMovies]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setCurrentStep('emotion');
      setSelectedEmotion(null);
      setRoundIndex(0);
      setCurrentMovieRating(null);
      setOpponentMovie(null);
      setUsedOpponentIds([]);
      setIsLoading(false);
      setComparedMovieIds([]);
    }
  }, [visible]);

  const handleEmotionSelect = useCallback((emotion) => {
    if (!hasEnoughMovies) {
      Alert.alert(
        "Not Enough Ratings",
        "You need at least 10 rated movies to use this feature. Please rate more movies first!",
        [{ text: "OK", onPress: onClose }]
      );
      return;
    }

    setSelectedEmotion(emotion);
    const initialRating = getInitialRatingFromEmotion(emotion);
    setCurrentMovieRating(initialRating);
    
    // Select first opponent from emotion-based percentile
    const firstOpponent = selectMovieFromPercentile(seenMovies, emotion, []);
    
    if (!firstOpponent) {
      Alert.alert(
        "No Comparison Available",
        "Could not find a suitable movie for comparison. Please try rating this movie manually.",
        [{ text: "OK", onPress: onClose }]
      );
      return;
    }
    
    setOpponentMovie(firstOpponent);
    setUsedOpponentIds([firstOpponent.id]);
    setComparedMovieIds([firstOpponent.id]);
    setCurrentStep('comparison');
  }, [hasEnoughMovies, seenMovies, onClose]);

  const handleComparison = useCallback((newMovieWins) => {
    if (!opponentMovie || !movie) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      // Create temporary movie objects for Elo calculation
      const newMovieForCalculation = {
        ...movie,
        userRating: currentMovieRating,
        gamesPlayed: roundIndex,
        eloRating: currentMovieRating * 10
      };
      
      const opponentForCalculation = {
        ...opponentMovie,
        userRating: opponentMovie.userRating || opponentMovie.eloRating / 10,
        gamesPlayed: opponentMovie.gamesPlayed || 1
      };
      
      // Apply Elo adjustment
      const { updatedWinner, updatedLoser } = newMovieWins 
        ? adjustRating(newMovieForCalculation, opponentForCalculation)
        : adjustRating(opponentForCalculation, newMovieForCalculation);
      
      const updatedNewMovie = newMovieWins ? updatedWinner : updatedLoser;
      setCurrentMovieRating(updatedNewMovie.userRating);
      
      console.log(`🎬 Round ${roundIndex + 1}: ${movie.title} (${updatedNewMovie.userRating}) vs ${opponentMovie.title} (${opponentForCalculation.userRating}) - ${newMovieWins ? 'NEW WINS' : 'OPPONENT WINS'}`);
      
      // Check if we need more rounds
      if (roundIndex < 2) {
        // Select next opponent using ladder comparison
        const nextOpponent = selectLadderOpponent(
          seenMovies, 
          updatedNewMovie.userRating, 
          usedOpponentIds
        );
        
        if (nextOpponent) {
          setOpponentMovie(nextOpponent);
          setUsedOpponentIds(prev => [...prev, nextOpponent.id]);
          setComparedMovieIds(prev => [...prev, nextOpponent.id]);
          setRoundIndex(prev => prev + 1);
        } else {
          // No more opponents available, finish early
          finishRatingFlow(updatedNewMovie.userRating);
        }
      } else {
        // All 3 rounds complete
        finishRatingFlow(updatedNewMovie.userRating);
      }
      
      setIsLoading(false);
    }, 300);
  }, [opponentMovie, movie, currentMovieRating, roundIndex, usedOpponentIds, seenMovies]);

  const finishRatingFlow = useCallback((finalRating) => {
    const finalRoundedRating = Math.round(finalRating * 10) / 10;
    
    const ratedMovie = {
      ...movie,
      userRating: finalRoundedRating,
      eloRating: finalRoundedRating * 10,
      gamesPlayed: 3,
      ratingMetadata: {
        initialEmotion: selectedEmotion,
        comparedMovieIds: comparedMovieIds,
        timestamp: new Date().toISOString(),
        flowStartTime: flowStartTime,
        method: 'initial_rating_flow'
      }
    };
    
    setCurrentStep('complete');
    
    setTimeout(() => {
      onComplete(ratedMovie);
      onClose();
    }, 2000);
  }, [movie, selectedEmotion, comparedMovieIds, flowStartTime, onComplete, onClose]);

  const renderEmotionStep = () => (
    <View style={[styles.stepContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        How did you feel about
      </Text>
      <Text style={[styles.movieTitle, { color: colors.accent }]}>
        {movie?.title || movie?.name}?
      </Text>
      
      {!hasEnoughMovies && (
        <View style={[styles.warningContainer, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
          <Ionicons name="warning" size={20} color={colors.error} />
          <Text style={[styles.warningText, { color: colors.error }]}>
            You need at least 10 rated movies to use this feature
          </Text>
        </View>
      )}
      
      <View style={styles.emotionGrid}>
        {Object.entries(RATING_CATEGORIES).map(([key, category]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.emotionButton,
              { 
                backgroundColor: colors.background,
                borderColor: category.borderColor,
                opacity: hasEnoughMovies ? 1 : 0.5
              }
            ]}
            onPress={() => handleEmotionSelect(key)}
            disabled={!hasEnoughMovies}
            activeOpacity={0.8}
          >
            <Text style={styles.emotionEmoji}>{category.emoji}</Text>
            <Text style={[styles.emotionLabel, { color: category.color }]}>
              {category.label}
            </Text>
            <Text style={[styles.emotionDescription, { color: colors.subText }]}>
              {category.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderComparisonStep = () => (
    <View style={[styles.stepContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Round {roundIndex + 1} of 3
      </Text>
      <Text style={[styles.comparisonSubtitle, { color: colors.subText }]}>
        Which movie is better?
      </Text>
      
      <View style={styles.comparisonContainer}>
        {/* New Movie */}
        <TouchableOpacity
          style={[styles.movieCard, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => handleComparison(true)}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Image
            source={{
              uri: movie?.poster_path 
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : 'https://via.placeholder.com/200x300?text=No+Image'
            }}
            style={styles.moviePoster}
            resizeMode="cover"
          />
          <Text style={[styles.movieCardTitle, { color: colors.text }]} numberOfLines={2}>
            {movie?.title || movie?.name}
          </Text>
          <Text style={[styles.movieYear, { color: colors.subText }]}>
            {movie?.release_date?.split('-')[0] || movie?.first_air_date?.split('-')[0] || 'Unknown'}
          </Text>
        </TouchableOpacity>

        <View style={styles.vsContainer}>
          <Text style={[styles.vsText, { color: colors.accent }]}>VS</Text>
        </View>

        {/* Opponent Movie */}
        <TouchableOpacity
          style={[styles.movieCard, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => handleComparison(false)}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Image
            source={{
              uri: opponentMovie?.poster_path 
                ? `https://image.tmdb.org/t/p/w500${opponentMovie.poster_path}`
                : 'https://via.placeholder.com/200x300?text=No+Image'
            }}
            style={styles.moviePoster}
            resizeMode="cover"
          />
          <Text style={[styles.movieCardTitle, { color: colors.text }]} numberOfLines={2}>
            {opponentMovie?.title || opponentMovie?.name}
          </Text>
          <Text style={[styles.movieYear, { color: colors.subText }]}>
            {opponentMovie?.release_date?.split('-')[0] || opponentMovie?.first_air_date?.split('-')[0] || 'Unknown'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.subText }]}>
            Processing comparison...
          </Text>
        </View>
      )}
    </View>
  );

  const renderCompleteStep = () => (
    <View style={[styles.stepContainer, { backgroundColor: colors.card }]}>
      <Ionicons name="checkmark-circle" size={64} color={colors.success} />
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Rating Complete!
      </Text>
      <Text style={[styles.finalRatingText, { color: colors.accent }]}>
        Final Rating: {currentMovieRating?.toFixed(1)}/10
      </Text>
      <Text style={[styles.completionSubtitle, { color: colors.subText }]}>
        Based on 3 movie comparisons
      </Text>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Initial Rating
            </Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={[styles.content, { backgroundColor: colors.background }]}>
            {currentStep === 'emotion' && renderEmotionStep()}
            {currentStep === 'comparison' && renderComparisonStep()}
            {currentStep === 'complete' && renderCompleteStep()}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.95,
    height: height * 0.85,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  movieTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  emotionButton: {
    width: (width - 80) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  emotionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emotionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emotionDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  comparisonSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  movieCard: {
    width: (width - 120) / 2,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  moviePoster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  movieCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  movieYear: {
    fontSize: 12,
    textAlign: 'center',
  },
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  vsText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  finalRatingText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  completionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default InitialRatingFlow;