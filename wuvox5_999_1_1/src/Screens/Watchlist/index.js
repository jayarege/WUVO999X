import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import layoutStyles from '../../Styles/layoutStyles';
import headerStyles from '../../Styles/headerStyles';
import listStyles from '../../Styles/listStyles';
import scoreDisplayStyles from '../../Styles/scoreDisplayStyles';
import stateStyles from '../../Styles/StateStyles';
import movieCardStyles from '../../Styles/movieCardStyles';
import modalStyles from '../../Styles/modalStyles';

// Constants for filtering
const API_KEY = 'b401be0ea16515055d8d0bde16f80069';
const API_TIMEOUT = 10000;

// Streaming services with their TMDB provider IDs (logos will be fetched from API)
const STREAMING_SERVICES = [
  { id: 8, name: 'Netflix' },
  { id: 350, name: 'Apple TV+' },
  { id: 15, name: 'Hulu' },
  { id: 384, name: 'HBO Max' },
  { id: 337, name: 'Disney+' },
  { id: 387, name: 'Peacock' },
  { id: 9, name: 'Prime Video' }
];

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

function WatchlistScreen({ movies, genres, isDarkMode, onAddToSeen, onRemoveFromWatchlist }) {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingInput, setRatingInput] = useState('');
  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  
  // Filter modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedDecades, setSelectedDecades] = useState([]);
  const [selectedStreamingServices, setSelectedStreamingServices] = useState([]);
  const [tempGenres, setTempGenres] = useState([]);
  const [tempDecades, setTempDecades] = useState([]);
  const [tempStreamingServices, setTempStreamingServices] = useState([]);
  const [streamingProviders, setStreamingProviders] = useState([]);

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
      
      // Filter to only the providers we want and add logo URLs
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
      // Fallback to basic service list without logos
      setStreamingProviders(STREAMING_SERVICES.map(service => ({
        ...service,
        logo_url: null
      })));
    }
  }, []);

  /**
   * Fetch streaming providers on component mount
   */
  useEffect(() => {
    fetchStreamingProviders();
  }, [fetchStreamingProviders]);

  const getPosterUrl = path => {
    if (!path) return 'https://via.placeholder.com/100x150?text=No+Image';
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

  const sortedMovies = [...movies].sort((a, b) => b.score - a.score);

  const filteredMovies = useMemo(() => {
    let filtered = sortedMovies;

    // Apply advanced filters
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(movie => 
        movie.genre_ids && movie.genre_ids.some(genreId => 
          selectedGenres.includes(genreId.toString())
        )
      );
    }

    if (selectedDecades.length > 0) {
      filtered = filtered.filter(movie => {
        if (!movie.release_date) return false;
        const year = new Date(movie.release_date).getFullYear();
        return selectedDecades.some(decade => {
          const decadeInfo = DECADES.find(d => d.value === decade);
          return year >= decadeInfo.startYear && year <= decadeInfo.endYear;
        });
      });
    }

    // Apply legacy genre filter if no advanced filters are active
    if (selectedGenres.length === 0 && selectedDecades.length === 0 && selectedStreamingServices.length === 0 && selectedGenreId) {
      filtered = filtered.filter(movie => movie.genre_ids?.includes(selectedGenreId));
    }

    return filtered;
  }, [selectedGenres, selectedDecades, selectedStreamingServices, selectedGenreId, sortedMovies]);

  const uniqueGenreIds = useMemo(() => {
    return Array.from(new Set(movies.flatMap(m => m.genre_ids || [])));
  }, [movies]);

  const handleGenreSelect = useCallback((genreId) => {
    setSelectedGenreId(prev => prev === genreId ? null : genreId);
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
    setSelectedGenres([...tempGenres]);
    setSelectedDecades([...tempDecades]);
    setSelectedStreamingServices([...tempStreamingServices]);
    // Clear legacy genre filter when advanced filters are applied
    if (tempGenres.length > 0 || tempDecades.length > 0 || tempStreamingServices.length > 0) {
      setSelectedGenreId(null);
    }
  }, [tempGenres, tempDecades, tempStreamingServices]);

  const cancelFilters = useCallback(() => {
    setFilterModalVisible(false);
  }, []);

  // Helper functions for multi-select management
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

  // Check if any filters are active
  const hasActiveFilters = selectedGenres.length > 0 || selectedDecades.length > 0 || selectedStreamingServices.length > 0;

  const openRatingModal = useCallback((movie) => {
    setSelectedMovie(movie);
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
      setSelectedMovie(null);
    });
  }, [slideAnim]);

  const handleRatingSubmit = useCallback(() => {
    const rating = parseFloat(ratingInput);
    if (!isNaN(rating) && rating >= 1 && rating <= 10) {
      onAddToSeen({
        ...selectedMovie,
        userRating: rating,
        eloRating: rating * 100,
        comparisonWins: 0,
        gamesPlayed: 0,
        comparisonHistory: [],
      });
      closeRatingModal();
    } else {
      // Shake animation for invalid input
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [ratingInput, selectedMovie, onAddToSeen, closeRatingModal, slideAnim]);

  const handleRemoveFromWatchlist = useCallback((movie) => {
    onRemoveFromWatchlist(movie.id);
  }, [onRemoveFromWatchlist]);

  if (sortedMovies.length === 0) {
    return (
      <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
        <View style={stateStyles.emptyStateContainer}>
          <Ionicons name="eye-off-outline" size={64} color={isDarkMode ? '#D3D3D3' : '#A9A9A9'} />
          <Text style={[stateStyles.emptyStateText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>Your watchlist is empty.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
      {/* Header with Filter Button */}
      <View style={[headerStyles.screenHeader, { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5', borderBottomColor: isDarkMode ? '#8A2BE2' : '#E0E0E0' }]}>
        <Text style={[headerStyles.screenTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>Top Rated You Haven't Seen</Text>
        <View style={filterStyles.actionRow}>
          <TouchableOpacity
            style={filterStyles.actionButton}
            onPress={openFilterModal}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={24} color={isDarkMode ? '#FFD700' : '#4B0082'} />
            {hasActiveFilters && (
              <View style={filterStyles.filterBadge} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter by Genre Section (Legacy) */}
      {!hasActiveFilters && (
        <View style={styles.filterSection}>
          <Text style={[styles.filterTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
            Filter by Genre
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.genreList}
          >
            {uniqueGenreIds.map(id => (
              <TouchableOpacity
                key={id}
                onPress={() => handleGenreSelect(id)}
                style={[
                  styles.genreButton,
                  { 
                    backgroundColor: selectedGenreId === id 
                      ? (isDarkMode ? '#FFD700' : '#4B0082') 
                      : (isDarkMode ? '#33242F' : '#F0F0F0'),
                    borderColor: isDarkMode ? '#8A2BE2' : '#4B0082'
                  }
                ]}
                activeOpacity={0.7}
              >
                <Text 
                  style={[
                    styles.genreButtonText,
                    { 
                      color: selectedGenreId === id
                        ? (isDarkMode ? '#1C2526' : '#FFFFFF')
                        : (isDarkMode ? '#FFF' : '#000') 
                    }
                  ]}
                >
                  {genres[id] || 'Unknown'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersSection}>
          <Text style={[styles.activeFiltersTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
            Active Filters ({filteredMovies.length} movies)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersContainer}>
            {selectedGenres.map(genreId => (
              <View key={`genre-${genreId}`} style={[styles.activeFilterChip, { backgroundColor: isDarkMode ? '#8A2BE2' : '#4B0082' }]}>
                <Text style={styles.activeFilterText}>{genres[genreId] || 'Unknown'}</Text>
              </View>
            ))}
            {selectedDecades.map(decade => (
              <View key={`decade-${decade}`} style={[styles.activeFilterChip, { backgroundColor: isDarkMode ? '#8A2BE2' : '#4B0082' }]}>
                <Text style={styles.activeFilterText}>{DECADES.find(d => d.value === decade)?.label}</Text>
              </View>
            ))}
            {selectedStreamingServices.map(serviceId => (
              <View key={`streaming-${serviceId}`} style={[styles.activeFilterChip, { backgroundColor: isDarkMode ? '#8A2BE2' : '#4B0082' }]}>
                <Text style={styles.activeFilterText}>
                  {streamingProviders.find(s => s.id.toString() === serviceId)?.name || 'Service'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Movie Cards */}
      <ScrollView style={listStyles.rankingsList}>
        {filteredMovies.map((movie, index) => (
          <View 
            key={movie.id} 
            style={[styles.movieCard, { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5' }]}
          >
            <View style={styles.cardContent}>
              {/* Rank Badge */}
              <View style={[styles.rankBadge, { backgroundColor: isDarkMode ? '#FFD700' : '#FFD700' }]}>
                <Text style={[styles.rankNumber, { color: isDarkMode ? '#1C2526' : '#1C2526' }]}>
                  {index + 1}
                </Text>
              </View>

              {/* Movie Poster */}
              <Image 
                source={{ uri: getPosterUrl(movie.poster || movie.poster_path) }} 
                style={styles.posterImage}
                resizeMode="cover"
              />
              
              {/* Movie Details */}
              <View style={styles.movieDetails}>
                <Text style={[styles.movieTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
                  {movie.title}
                </Text>
                
                <Text style={[styles.movieScore, { color: isDarkMode ? '#FFD700' : '#4B0082' }]}>
                  {movie.score ? movie.score.toFixed(1) : '0.0'}
                </Text>
                
                <Text style={[styles.genresText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
                  Genres: {(movie.genre_ids || []).map(id => genres[id] || 'Unknown').join(', ')}
                </Text>
                
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    onPress={() => openRatingModal(movie)}
                    style={[styles.actionButton, styles.rateButton]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionButtonText}>Rate</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => handleRemoveFromWatchlist(movie)}
                    style={[styles.actionButton, styles.removeButton]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Enhanced Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={cancelFilters}
      >
        <View style={filterStyles.modalOverlay}>
          <View style={[
            filterStyles.enhancedModalContent,
            { backgroundColor: isDarkMode ? '#4B0082' : '#FFFFFF' }
          ]}>
            {/* Modal Header */}
            <View style={filterStyles.modalHeader}>
              <Text style={[
                filterStyles.modalTitle,
                { color: isDarkMode ? '#F5F5F5' : '#333' }
              ]}>
                Filter Movies
              </Text>
              <TouchableOpacity
                style={filterStyles.clearAllButton}
                onPress={clearAllFilters}
                activeOpacity={0.7}
              >
                <Text style={[
                  filterStyles.clearAllText,
                  { color: isDarkMode ? '#FFD700' : '#4B0082' }
                ]}>
                  Clear All
                </Text>
              </TouchableOpacity>
            </View>

            <View style={filterStyles.modalScrollContainer}>
              <ScrollView 
                style={filterStyles.modalScrollView} 
                contentContainerStyle={filterStyles.scrollViewContent}
                showsVerticalScrollIndicator={false}
              >
              
              {/* Genre Filter Section */}
              <View style={filterStyles.filterSection}>
                <Text style={[
                  filterStyles.sectionTitle,
                  { color: isDarkMode ? '#F5F5F5' : '#333' }
                ]}>
                  Genres ({tempGenres.length} selected)
                </Text>
                <View style={filterStyles.optionsGrid}>
                  {genres && Object.keys(genres).length > 0 ? (
                    Object.entries(genres)
                      .filter(([id, name]) => name && name.trim() !== '')
                      .map(([id, name]) => (
                        <TouchableOpacity
                          key={id}
                          style={[
                            filterStyles.optionChip,
                            { 
                              backgroundColor: tempGenres.includes(id)
                                ? (isDarkMode ? '#8A2BE2' : '#4B0082') 
                                : 'transparent',
                              borderColor: isDarkMode ? '#8A2BE2' : '#4B0082'
                            }
                          ]}
                          onPress={() => toggleGenre(id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            filterStyles.optionChipText,
                            { 
                              color: tempGenres.includes(id)
                                ? '#FFFFFF' 
                                : (isDarkMode ? '#D3D3D3' : '#666')
                            }
                          ]}>
                            {name}
                          </Text>
                        </TouchableOpacity>
                      ))
                  ) : (
                    <Text style={[
                      filterStyles.optionChipText,
                      { color: isDarkMode ? '#FF6B6B' : '#FF0000', padding: 10 }
                    ]}>
                      No genres available
                    </Text>
                  )}
                </View>
              </View>

              {/* Decade Filter Section */}
              <View style={filterStyles.filterSection}>
                <Text style={[
                  filterStyles.sectionTitle,
                  { color: isDarkMode ? '#F5F5F5' : '#333' }
                ]}>
                  Decades ({tempDecades.length} selected)
                </Text>
                <View style={filterStyles.optionsGrid}>
                  {DECADES.map((decade) => (
                    <TouchableOpacity
                      key={decade.value}
                      style={[
                        filterStyles.optionChip,
                        { 
                          backgroundColor: tempDecades.includes(decade.value)
                            ? (isDarkMode ? '#8A2BE2' : '#4B0082') 
                            : 'transparent',
                          borderColor: isDarkMode ? '#8A2BE2' : '#4B0082'
                        }
                      ]}
                      onPress={() => toggleDecade(decade.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        filterStyles.optionChipText,
                        { 
                          color: tempDecades.includes(decade.value)
                            ? '#FFFFFF' 
                            : (isDarkMode ? '#D3D3D3' : '#666')
                        }
                      ]}>
                        {decade.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Streaming Services Filter Section */}
              <View style={filterStyles.filterSection}>
                <Text style={[
                  filterStyles.sectionTitle,
                  { color: isDarkMode ? '#F5F5F5' : '#333' }
                ]}>
                  Streaming Services ({tempStreamingServices.length} selected)
                </Text>
                <View style={filterStyles.optionsGrid}>
                  {streamingProviders.map((service) => (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        filterStyles.streamingChip,
                        { 
                          backgroundColor: tempStreamingServices.includes(service.id.toString())
                            ? (isDarkMode ? '#8A2BE2' : '#4B0082') 
                            : 'transparent',
                          borderColor: isDarkMode ? '#8A2BE2' : '#4B0082'
                        }
                      ]}
                      onPress={() => toggleStreamingService(service.id)}
                      activeOpacity={0.7}
                    >
                      {service.logo_url ? (
                        <Image
                          source={{ uri: service.logo_url }}
                          style={filterStyles.streamingLogoImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={filterStyles.streamingLogoPlaceholder}>
                          <Text style={filterStyles.streamingLogoText}>
                            {service.name.charAt(0)}
                          </Text>
                        </View>
                      )}
                      <Text style={[
                        filterStyles.streamingText,
                        { 
                          color: tempStreamingServices.includes(service.id.toString())
                            ? '#FFFFFF' 
                            : (isDarkMode ? '#D3D3D3' : '#666')
                        }
                      ]}>
                        {service.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

            </ScrollView>
            </View>
            
            {/* Modal Action Buttons */}
            <View style={filterStyles.modalButtons}>
              <TouchableOpacity
                style={[
                  filterStyles.cancelButton,
                  { borderColor: isDarkMode ? '#8A2BE2' : '#4B0082' }
                ]}
                onPress={cancelFilters}
              >
                <Text style={[
                  filterStyles.cancelButtonText,
                  { color: isDarkMode ? '#D3D3D3' : '#666' }
                ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  filterStyles.applyButton,
                  { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }
                ]}
                onPress={applyFilters}
              >
                <Text style={[
                  filterStyles.applyButtonText,
                  { color: isDarkMode ? '#4B0082' : '#FFFFFF' }
                ]}>
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeRatingModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          >
            <View style={styles.modalOverlay}>
              <Animated.View
                style={[
                  styles.modalContent,
                  { 
                    transform: [{ translateY: slideAnim }],
                    backgroundColor: isDarkMode ? '#4B0082' : '#8B2BE2',
                  }
                ]}
              >
                <View style={styles.ratingHeader}>
                  <Image 
                    source={{ uri: getPosterUrl(selectedMovie?.poster || selectedMovie?.poster_path) }} 
                    style={styles.ratingPosterThumbnail}
                    resizeMode="cover" 
                  />
                  
                  <View style={styles.ratingHeaderInfo}>
                    <Text style={[styles.ratingMovieTitle, { color: '#FFFFFF' }]}>
                      {selectedMovie?.title}
                    </Text>
                    
                    <View style={styles.ratingScoreRow}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={[styles.ratingTmdbScore, { color: '#FFD700' }]}>
                        TMDb: {selectedMovie?.score ? selectedMovie.score.toFixed(1) : '0.0'}
                      </Text>
                    </View>
                    
                    <Text style={[styles.ratingGenres, { color: '#FFFFFF' }]}>
                      {(selectedMovie?.genre_ids || []).map(id => genres[id] || '').filter(Boolean).join(', ')}
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.ratingInstructionText, { color: '#FFFFFF' }]}>
                  Your Rating (1.0-10.0):
                </Text>
                
                <TextInput
                  style={[
                    styles.ratingInputField,
                    {
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      color: '#FFFFFF',
                    },
                  ]}
                  value={ratingInput}
                  onChangeText={setRatingInput}
                  keyboardType="decimal-pad"
                  placeholder="Enter rating"
                  placeholderTextColor="#AAAAAA"
                  maxLength={4}
                  returnKeyType="done"
                  autoFocus={true}
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#FFD700' }]}
                    onPress={handleRatingSubmit}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#1C2526', fontWeight: '600' }}>
                      Submit
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { borderColor: '#FFFFFF' }]}
                    onPress={closeRatingModal}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Filter Section Styles
  filterSection: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1C2526', // Dark background for filter section
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  genreList: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  genreButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  genreButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Active Filters Section
  activeFiltersSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
  },
  activeFilterChip: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 12,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Movie Card Styles
  movieCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardContent: {
    position: 'relative',
    flexDirection: 'row',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  posterImage: {
    width: 100,
    height: 150,
  },
  movieDetails: {
    flex: 1,
    padding: 12,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  movieScore: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  genresText: {
    fontSize: 14,
    marginBottom: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  rateButton: {
    backgroundColor: '#8A2BE2',
  },
  removeButton: {
    backgroundColor: '#FF5252',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingPosterThumbnail: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  ratingHeaderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  ratingMovieTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingTmdbScore: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  ratingGenres: {
    fontSize: 12,
    opacity: 0.9,
  },
  ratingInstructionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  ratingInputField: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
});

// Filter Modal Styles (same as WildcardScreen)
const filterStyles = StyleSheet.create({
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
    backgroundColor: '#FF9500',
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
  streamingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
    minWidth: 120,
  },
  streamingLogoImage: {
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 4,
  },
  streamingLogoPlaceholder: {
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamingLogoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streamingText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
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
});

export default WatchlistScreen;