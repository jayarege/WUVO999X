import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  Modal, 
  Animated,
  Platform,
  StyleSheet,
  FlatList,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import theme system and styles
import { useMediaType } from '../../Navigation/TabNavigator';
import { getLayoutStyles } from '../../Styles/layoutStyles';
import { getHeaderStyles, ThemedHeader } from '../../Styles/headerStyles';
import { getListStyles } from '../../Styles/listStyles';
import { getModalStyles } from '../../Styles/modalStyles';
import { getButtonStyles } from '../../Styles/buttonStyles';
import { getMovieCardStyles } from '../../Styles/movieCardStyles';
import { RatingModal } from '../../Components/RatingModal';
import stateStyles from '../../Styles/StateStyles';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../utils/Theme';
import { TMDB_API_KEY } from '../../Constants';

const API_KEY = TMDB_API_KEY;

function TopRatedScreen({ movies, onUpdateRating, genres, isDarkMode }) {
  // Use media type context
  const { mediaType } = useMediaType();

  // Get all themed styles
  const layoutStyles = getLayoutStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const headerStyles = getHeaderStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const listStyles = getListStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const modalStyles = getModalStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const buttonStyles = getButtonStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const movieCardStyles = getMovieCardStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);

  // Get theme colors for this media type and mode
  const colors = theme[mediaType][isDarkMode ? 'dark' : 'light'];

  // Modal state
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetailModalVisible, setMovieDetailModalVisible] = useState(false);
  const [movieCredits, setMovieCredits] = useState(null);
  const [movieProviders, setMovieProviders] = useState(null);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newRating, setNewRating] = useState('');
  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const slideAnim = useRef(new Animated.Value(300)).current;

  // Clear genre filter when media type changes
  useEffect(() => {
    setSelectedGenreId(null);
  }, [mediaType]);

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

  const deduplicateProviders = useCallback((providers) => {
    if (!providers || !Array.isArray(providers)) return [];
    
    const seen = new Set();
    const filtered = [];
    
    for (const provider of providers) {
      const normalizedName = provider.provider_name.toLowerCase();
      if (!seen.has(normalizedName)) {
        seen.add(normalizedName);
        filtered.push(provider);
      }
    }
    
    return filtered;
  }, []);
  const getProviderLogoUrl = useCallback((logoPath) => {
    if (!logoPath) return null;
    return `https://image.tmdb.org/t/p/w92${logoPath}`;
  }, []);

  const handleMovieSelect = useCallback(async (movie) => {
    setSelectedMovie(movie);
    setMovieDetailModalVisible(true);
    
    const [credits, providers] = await Promise.all([
      fetchMovieCredits(movie.id),
      fetchMovieProviders(movie.id)
    ]);
    
    setMovieCredits(credits);
    setMovieProviders(providers);
  }, [fetchMovieCredits, fetchMovieProviders]);

  const closeDetailModal = useCallback(() => {
    setMovieDetailModalVisible(false);
    setSelectedMovie(null);
    setMovieCredits(null);
    setMovieProviders(null);
  }, []);

  const getPosterUrl = useCallback(path => {
    if (!path) return 'https://via.placeholder.com/342x513?text=No+Poster';
    // If path already includes https:// it's a full URL
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  }, []);
  
  // Filter movies by media type - this is the key fix
  const mediaFilteredMovies = useMemo(() => {
    if (!movies || !Array.isArray(movies)) return [];
    
    return movies.filter(movie => {
      // Check if this item matches the current media type using mediaType property
      const itemMediaType = movie.mediaType || 'movie'; // Default to 'movie' if not set
      return itemMediaType === mediaType;
    });
  }, [movies, mediaType]);
  
  // Extract all unique genre IDs from filtered movies for filter options
  const uniqueGenreIds = useMemo(() => {
    const genreSet = new Set();
    mediaFilteredMovies.forEach(movie => {
      if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
        movie.genre_ids.forEach(id => genreSet.add(id));
      }
    });
    return Array.from(genreSet);
  }, [mediaFilteredMovies]);
  
  // Filter and sort movies by selected genre and rating
  const filteredAndRankedMovies = useMemo(() => {
    let filtered = [...mediaFilteredMovies];
    
    // Apply genre filter if selected
    if (selectedGenreId !== null) {
      filtered = filtered.filter(movie => 
        movie.genre_ids && movie.genre_ids.includes(selectedGenreId)
      );
    }
    
    // Sort by userRating or eloRating
    filtered = filtered.sort((a, b) => {
      // First try to sort by userRating if available
      if (a.userRating !== undefined && b.userRating !== undefined) {
        return b.userRating - a.userRating;
      }
      // Fall back to eloRating if userRating is not available
      return b.eloRating - a.eloRating;
    });
    
    // Take top 10 after filtering and sorting
    return filtered.slice(0, 10);
  }, [mediaFilteredMovies, selectedGenreId]);

  const openEditModal = useCallback((movie) => {
    setSelectedMovie(movie);
    // Use userRating if available, otherwise convert from eloRating
    const initialRating = movie.userRating !== undefined
      ? movie.userRating.toFixed(1)
      : (movie.eloRating / 100).toFixed(1);
    setNewRating(initialRating);
    setEditModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const closeEditModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setEditModalVisible(false);
      setSelectedMovie(null);
      setNewRating('');
    });
  }, [slideAnim]);

  const updateRating = useCallback(() => {
    const rating = parseFloat(newRating);
    if (isNaN(rating) || rating < 1 || rating > 10) {
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      return;
    }
    onUpdateRating(selectedMovie.id, rating);
    closeEditModal();
  }, [newRating, selectedMovie, onUpdateRating, closeEditModal, slideAnim]);

  // Function to display rating correctly
  const displayRating = useCallback((movie) => {
    // Use userRating if available, otherwise convert from eloRating
    if (movie.userRating !== undefined) {
      return movie.userRating.toFixed(1);
    }
    return (movie.eloRating / 100).toFixed(1);
  }, []);
  
  // Handle genre selection
  const handleGenreSelect = useCallback((genreId) => {
    setSelectedGenreId(prev => prev === genreId ? null : genreId);
  }, []);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedGenreId(null);
  }, []);

  // Render a genre filter button
  const renderGenreButton = useCallback(({ item }) => {
    const isSelected = item === selectedGenreId;
    const genreName = genres[item] || 'Unknown';
    
    return (
      <TouchableOpacity
        style={[
          styles.genreButton,
          isSelected && styles.selectedGenreButton,
          { 
            backgroundColor: isSelected 
              ? colors.primary 
              : colors.card,
            borderColor: colors.border.color
          }
        ]}
        onPress={() => handleGenreSelect(item)}
        activeOpacity={0.7}
      >
        <Text 
          style={[
            styles.genreButtonText,
            { 
              color: isSelected 
                ? colors.accent 
                : colors.subText
            }
          ]}
        >
          {genreName}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedGenreId, genres, colors, handleGenreSelect]);

  // Get the title for the current media type
  const getTitle = useCallback((item) => {
    return item.title || item.name || 'Unknown Title';
  }, []);

  if (mediaFilteredMovies.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C2526' }}>
        <ThemedHeader mediaType={mediaType} isDarkMode={isDarkMode} theme={theme}>
          <Text style={headerStyles.screenTitle}>
            Top {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
          </Text>
        </ThemedHeader>
        <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: 'transparent' }]}>
          <View style={stateStyles.emptyStateContainer}>
            <Ionicons name={mediaType === 'movie' ? 'film-outline' : 'tv-outline'} size={64} color={colors.subText} />
            <Text style={[stateStyles.emptyStateText, { color: colors.subText }]}>
              You haven't ranked any {mediaType === 'movie' ? 'movies' : 'TV shows'} yet.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }



return (
      <View style={{ flex: 1, backgroundColor: '#8B5CF6' }}>
     
    <ThemedHeader mediaType={mediaType} isDarkMode={isDarkMode} theme={theme}>
      <Text style={headerStyles.screenTitle}>
        Top {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
      </Text>
    </ThemedHeader>
    <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: 'transparent' }]}>
      
      {/* Genre Filter Section */}
      <View style={[
        styles.filterSection, 
        { 
          borderBottomColor: colors.border.color,
          backgroundColor: colors.background
        }
      ]}>
        <View style={styles.filterHeader}>
          <Text style={[styles.filterTitle, { color: colors.text }]}>
            Filter by Genre
          </Text>
          {selectedGenreId !== null && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearFilters}
            >
              <Text style={[styles.clearButtonText, { color: colors.accent }]}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <FlatList
          data={uniqueGenreIds}
          renderItem={renderGenreButton}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreList}
        />
        
        {selectedGenreId !== null && (
          <View style={styles.activeFilterIndicator}>
            <Text style={[styles.activeFilterText, { color: colors.subText }]}>
              Showing: {genres[selectedGenreId] || 'Unknown'} {mediaType === 'movie' ? 'movies' : 'TV shows'}
            </Text>
          </View>
        )}
      </View>
      
      {/* Rankings List */}
      {filteredAndRankedMovies.length > 0 ? (
        <ScrollView style={[listStyles.rankingsList, { backgroundColor: colors.background }]}>
          {filteredAndRankedMovies.map((movie, index) => (
            <View
              key={movie.id}
              style={[listStyles.rankingItem, { backgroundColor: colors.card }]}
            >
              <View style={[listStyles.rankBadge, { backgroundColor: colors.primary }]}>
                <Text style={[listStyles.rankNumber, { color: colors.accent }]}>
                  {index + 1}
                </Text>
              </View>
              <Image
                source={{ uri: getPosterUrl(movie.poster || movie.poster_path) }}
                style={listStyles.resultPoster}
                resizeMode="cover"
              />
              <View style={[listStyles.movieDetails, { backgroundColor: colors.card }]}>
                <Text
                  style={[listStyles.resultTitle, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {getTitle(movie)}
                </Text>
                <View style={styles.scoreContainer}>
                  <Text style={[styles.finalScore, { color: colors.accent }]}>
                    {displayRating(movie)}
                  </Text>
                  <Text style={[movieCardStyles.genresText, { color: colors.subText }]}>
                    Genres: {movie.genre_ids && Array.isArray(movie.genre_ids) 
                      ? movie.genre_ids.map(id => (genres && genres[id]) || 'Unknown').join(', ') 
                      : 'Unknown'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: colors.primary }]}
                  onPress={() => openEditModal(movie)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.editButtonText, { color: colors.accent }]}>
                    Edit Rating
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={stateStyles.emptyStateContainer}>
          <Ionicons name="search-outline" size={64} color={colors.subText} />
          <Text style={[stateStyles.emptyStateText, { color: colors.subText }]}>
            No {mediaType === 'movie' ? 'movies' : 'TV shows'} found for this genre.
          </Text>
          <TouchableOpacity
            style={[styles.clearFiltersButton, { backgroundColor: colors.primary }]}
            onPress={clearFilters}
          >
            <Text style={[styles.clearFiltersButtonText, { color: colors.accent }]}>
              Show All {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
  {/* Rating Edit Modal */}
      <RatingModal
        visible={editModalVisible}
        onClose={closeEditModal}
        onSubmit={updateRating}
        movie={selectedMovie}
        ratingInput={newRating}
        setRatingInput={setNewRating}
        slideAnim={slideAnim}
        mediaType={mediaType}
        isDarkMode={isDarkMode}
        theme={theme}
        genres={genres}
      />
    {/* Movie Detail Modal */}
        <Modal
          visible={movieDetailModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeDetailModal}
        >
          <View style={modalStyles.detailModalOverlay}>
            <LinearGradient
              colors={colors.primaryGradient}
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
                Your Rating: {selectedMovie?.userRating?.toFixed(1) || 'N/A'}
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
                  onPress={() => {
                    closeDetailModal();
                    openEditModal(selectedMovie);
                  }}
                >
                  <Text style={modalStyles.actionButtonText}>Edit Rating</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={modalStyles.actionButton}
                  onPress={() => {
                    console.log('Remove from rated pressed');
                  }}
                >
                  <Text style={modalStyles.actionButtonText}>Remove</Text>
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
                <Text style={modalStyles.cancelText}>close</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Modal>
    </SafeAreaView>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterSection: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4, 
    borderBottomWidth: 1,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  genreList: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  genreButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  selectedGenreButton: {
    borderWidth: 1,
  },
  genreButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterIndicator: {
    marginTop: 8,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    fontSize: 16,
  },
  scoreContainer: {
    marginTop: 8,
  },
  finalScore: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingModalContent: {
    position: 'absolute',
    maxHeight: 'auto',
    width: '90%',
    marginHorizontal: '5%',
    borderRadius: 20,
    overflow: 'hidden',
    top: '10%', 
    left: 0,
    right: 0,
  },
  modalContentContainer: {
    padding: 20,
  },
  modalMovieInfo: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  modalPoster: {
    width: 110,
    height: 165,
    borderRadius: 8,
    marginRight: 12,
  },
  modalMovieDetails: {
    flex: 1,
  },
  modalMovieTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalGenres: {
    fontSize: 16,
  },
  genreTextContainer: {
    marginVertical: 8,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: 'normal',
    textAlign: 'center',
    width: '100%',
    alignSelf: 'center',
  },
  fixedButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
  },
});

export default TopRatedScreen;