import React, { useState, useRef, useCallback, useMemo } from 'react';
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
import layoutStyles from '../../Styles/layoutStyles';
import headerStyles from '../../Styles/headerStyles';
import listStyles from '../../Styles/listStyles';
import scoreDisplayStyles from '../../Styles/scoreDisplayStyles';
import modalStyles from '../../Styles/modalStyles';
import ratingStyles from '../../Styles/ratingStyles';
import stateStyles from '../../Styles/StateStyles';
import movieCardStyles from '../../Styles/movieCardStyles';

function TopRatedScreen({ movies, onUpdateRating, genres, isDarkMode }) {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [newRating, setNewRating] = useState('');
  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const slideAnim = useRef(new Animated.Value(300)).current;

  const getPosterUrl = useCallback(path => {
    if (!path) return 'https://via.placeholder.com/342x513?text=No+Poster';
    // If path already includes https:// it's a full URL
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  }, []);
  
  // Extract all unique genre IDs from movies for filter options
  const uniqueGenreIds = useMemo(() => {
    const genreSet = new Set();
    movies.forEach(movie => {
      if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
        movie.genre_ids.forEach(id => genreSet.add(id));
      }
    });
    return Array.from(genreSet);
  }, [movies]);
  
  // Filter and sort movies by selected genre and rating
  const filteredAndRankedMovies = useMemo(() => {
    let filtered = [...movies];
    
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
  }, [movies, selectedGenreId]);

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
              ? (isDarkMode ? '#FFD700' : '#4B0082') 
              : (isDarkMode ? '#33242F' : '#F0F0F0'),
            borderColor: isDarkMode ? '#8A2BE2' : '#4B0082'
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
                ? (isDarkMode ? '#1C2526' : '#FFFFFF') 
                : (isDarkMode ? '#D3D3D3' : '#666')
            }
          ]}
        >
          {genreName}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedGenreId, genres, isDarkMode, handleGenreSelect]);

  if (movies.length === 0) {
    return (
      <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
        <View style={stateStyles.emptyStateContainer}>
          <Ionicons name="film-outline" size={64} color={isDarkMode ? '#D3D3D3' : '#A9A9A9'} />
          <Text style={{ color: isDarkMode ? '#D3D3D3' : '#666', fontSize: 16, textAlign: 'center', marginTop: 16 }}>
            You haven't ranked any movies yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
      <View
        style={[
          headerStyles.screenHeader,
          { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5', borderBottomColor: isDarkMode ? '#8A2BE2' : '#E0E0E0' },
        ]}
      >
        <Text style={[headerStyles.screenTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
          Your Top Movies
        </Text>
      </View>
      
      {/* Genre Filter Section */}
      <View style={[
        styles.filterSection, 
        { borderBottomColor: isDarkMode ? '#8A2BE2' : '#E0E0E0' }
      ]}>
        <View style={styles.filterHeader}>
          <Text style={[styles.filterTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
            Filter by Genre
          </Text>
          {selectedGenreId !== null && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearFilters}
            >
              <Text style={[styles.clearButtonText, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
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
            <Text style={[styles.activeFilterText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
              Showing: {genres[selectedGenreId] || 'Unknown'} movies
            </Text>
          </View>
        )}
      </View>
      
      {/* Movie Rankings List */}
      {filteredAndRankedMovies.length > 0 ? (
        <ScrollView style={listStyles.rankingsList}>
          {filteredAndRankedMovies.map((movie, index) => (
            <View
              key={movie.id}
              style={[listStyles.rankingItem, { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5' }]}
            >
              <View style={[listStyles.rankBadge, { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }]}>
                <Text style={[listStyles.rankNumber, { color: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
                  {index + 1}
                </Text>
              </View>
              <Image
                source={{ uri: getPosterUrl(movie.poster || movie.poster_path) }}
                style={listStyles.resultPoster}
                resizeMode="cover"
              />
              <View style={listStyles.movieDetails}>
                <Text
                  style={[listStyles.resultTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}
                  numberOfLines={2}
                >
                  {movie.title}
                </Text>
                <View style={scoreDisplayStyles.scoreContainer}>
                  <Text style={[scoreDisplayStyles.finalScore, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
                    {displayRating(movie)}
                  </Text>
                  <Text style={[movieCardStyles.genresText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
                    Genres: {movie.genre_ids && Array.isArray(movie.genre_ids) 
                      ? movie.genre_ids.map(id => (genres && genres[id]) || 'Unknown').join(', ') 
                      : 'Unknown'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(movie)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editButtonText}>
                    Edit Rating
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={stateStyles.emptyStateContainer}>
          <Ionicons name="search-outline" size={64} color={isDarkMode ? '#D3D3D3' : '#A9A9A9'} />
          <Text style={{ color: isDarkMode ? '#D3D3D3' : '#666', fontSize: 16, textAlign: 'center', marginTop: 16 }}>
            No movies found for this genre.
          </Text>
          <TouchableOpacity
            style={[styles.clearFiltersButton, { backgroundColor: isDarkMode ? '#8A2BE2' : '#4B0082' }]}
            onPress={clearFilters}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
              Show All Movies
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Rating Edit Modal - SIMPLIFIED STRUCTURE */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="none" // We're using our own animation
        onRequestClose={closeEditModal}
      >
        <View style={modalStyles.modalOverlay}>
          <Animated.View
            style={[
              modalStyles.modalContent,
              styles.ratingModalContent,
              { 
                transform: [{ translateY: slideAnim }], 
                backgroundColor: isDarkMode ? '#4B0082' : '#4B0082' 
              }
            ]}
          >
            {/* Content Container */}
            <View style={styles.modalContentContainer}>
              <View style={modalStyles.modalHandle} />
              
              {/* Movie Info */}
              <View style={styles.modalMovieInfo}>
                {/* Always attempt to display poster, with fallback handling in getPosterUrl */}
                <Image 
                  source={{ uri: getPosterUrl(selectedMovie?.poster_path || selectedMovie?.poster) }}
                  style={styles.modalPoster}
                  resizeMode="cover"
                />
                <View style={styles.modalMovieDetails}>
                  <Text style={[
                    styles.modalMovieTitle,
                    { color: isDarkMode ? '#F5F5F5' : '#FFFFFF' }
                  ]}>
                    {selectedMovie?.title}
                  </Text>
                  
                  <View style={styles.genreTextContainer}>
                    <Text style={[
                      styles.modalGenres,
                      { color: isDarkMode ? '#D3D3D3' : '#D3D3D3' }
                    ]}>
                      {selectedMovie?.genre_ids?.map(id => genres[id] || '').filter(Boolean).join(', ')}
                    </Text>
                  </View>
                  
                  <View style={styles.ratingDisplay}>
                    <Ionicons name="star" size={16} color={isDarkMode ? '#FFD700' : '#FFD700'} />
                    <Text style={{ color: isDarkMode ? '#FFD700' : '#FFD700', marginLeft: 4 }}>
                      TMDb: {selectedMovie?.score?.toFixed(1) || '0.0'}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Rating input */}
              <Text style={[
                styles.ratingLabel,
                { color: isDarkMode ? '#F5F5F5' : '#FFFFFF', marginTop: 20 }
              ]}>
                Your Rating (1.0-10.0):
              </Text>
              
              <TextInput
                style={[
                  styles.ratingInput,
                  {
                    backgroundColor: isDarkMode ? '#2A1A42' : 'rgba(255,255,255,0.15)',
                    borderColor: isDarkMode ? '#6C2BD9' : 'rgba(255,255,255,0.3)',
                    color: isDarkMode ? '#F5F5F5' : '#FFFFFF',
                    marginTop: 10,
                    marginBottom: 20,
                  }
                ]}
                value={newRating.toString()}
                onChangeText={(text) => {
                  // Handle all basic rating input
                  if (text === '' || text === '.' || text === '10' || text === '10.0') {
                    setNewRating(text);
                  } else {
                    // Try to parse as a number
                    const value = parseFloat(text);
                    
                    // Check if it's a valid number between 1 and 10
                    if (!isNaN(value) && value >= 1 && value <= 10) {
                      // Handle decimal places
                      if (text.includes('.')) {
                        const parts = text.split('.');
                        if (parts[1].length > 1) {
                          // Too many decimals, limit to one
                          setNewRating(parts[0] + '.' + parts[1].substring(0, 1));
                        } else {
                          // One decimal is fine, keep it
                          setNewRating(text);
                        }
                      } else {
                        // No decimal, just keep the value
                        setNewRating(text);
                      }
                    }
                  }
                }}
                keyboardType="decimal-pad"
                placeholder="Enter rating"
                placeholderTextColor={isDarkMode ? '#9D8AC7' : 'rgba(255,255,255,0.7)'}
                maxLength={4}
                autoFocus={true}
                selectTextOnFocus={true}
                blurOnSubmit={false}
              />
            </View>
            
            {/* Modal buttons - Fixed at bottom */}
            <View style={[
              styles.fixedButtonsContainer, 
              { 
                backgroundColor: isDarkMode ? '#4B0082' : '#4B0082',
                borderTopColor: 'rgba(255,255,255,0.1)'
              }
            ]}>
              <TouchableOpacity
                style={[
                  modalStyles.modalButton,
                  { backgroundColor: isDarkMode ? '#FFD700' : '#FFD700' }
                ]}
                onPress={updateRating}
              >
                <Text style={[
                  modalStyles.modalButtonText,
                  { color: isDarkMode ? '#1C2526' : '#000000', fontWeight: '600' }
                ]}>
                  Submit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  modalStyles.modalButton,
                  modalStyles.cancelButton,
                  { 
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.3)',
                    backgroundColor: 'transparent' 
                  }
                ]}
                onPress={closeEditModal}
              >
                <Text style={[
                  modalStyles.modalButtonText,
                  { color: isDarkMode ? '#FFFFFF' : '#FFFFFF' }
                ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Extended styles
const styles = StyleSheet.create({
  // Original styles
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#8A2BE2',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  
  // Modal styles from AddMovieScreen - SIMPLIFIED
  ratingModalContent: {
    position: 'absolute',
    maxHeight: 'auto', // Allow natural height
    width: '90%',
    marginHorizontal: '5%',
    borderRadius: 20,
    overflow: 'hidden',
    // Position higher to leave room for keyboard
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