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
  Animated,
  FlatList
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
import stateStyles from '../../Styles/StateStyles';
import theme from '../../utils/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { RatingModal } from '../../Components/RatingModal';
 

// Import constants
import { TMDB_API_KEY, API_TIMEOUT, STREAMING_SERVICES, DECADES } from '../../Constants';

const API_KEY = TMDB_API_KEY;

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
  // Use media type context
  const { mediaType, setMediaType } = useMediaType();

  // Get all themed styles
  const layoutStyles = getLayoutStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const headerStyles = getHeaderStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const listStyles = getListStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const modalStyles = getModalStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const buttonStyles = getButtonStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const movieCardStyles = getMovieCardStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);

  // Get theme colors for this media type and mode
  const colors = theme[mediaType][isDarkMode ? 'dark' : 'light'];

  // State

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

  // Clear filters when media type changes
useEffect(() => {
  setSelectedGenres([]);
  setSelectedDecades([]);
  setSelectedStreamingServices([]);
  setSelectedGenreId(null);
}, [mediaType]);

  // Filter movies by media type
const moviesByMediaType = useMemo(() => {
  return movies.filter(movie => (movie.mediaType || 'movie') === mediaType);
}, [movies, mediaType]);

  /**
   * Fetch streaming providers with logos from TMDB API
   */
  const fetchStreamingProviders = useCallback(async () => {
    try {
      const endpoint = mediaType === 'movie' ? 'movie' : 'tv';
      const response = await fetchWithTimeout(
        `https://api.themoviedb.org/3/watch/providers/${endpoint}?api_key=${API_KEY}&watch_region=US`
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
  }, [mediaType]);

  useEffect(() => {
    fetchStreamingProviders();
  }, [fetchStreamingProviders]);

  const getPosterUrl = path => {
    if (!path) return 'https://via.placeholder.com/100x150?text=No+Image';
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

  const sortedMovies = [...moviesByMediaType].sort((a, b) => b.score - a.score);

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
        const dateField = movie.release_date || movie.first_air_date;
        if (!dateField) return false;
        const year = new Date(dateField).getFullYear();
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
    return Array.from(new Set(moviesByMediaType.flatMap(m => m.genre_ids || [])));
  }, [moviesByMediaType]);

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
  <View style={{ flex: 1 }}>
     
    <ThemedHeader mediaType={mediaType} isDarkMode={isDarkMode} theme={theme}>
      <Text style={headerStyles.screenTitle}>
        Watchlist
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[headerStyles.screenTitle, { fontSize: 16, marginRight: 8 }]}>
          0
        </Text>
        <Ionicons name="list" size={24} color="#FFFFFF" />
      </View>
    </ThemedHeader>
  
    {/* No toggle - uses global mediaType from Home screen */}  
    <View style={[stateStyles.emptyStateContainer, { backgroundColor: colors.background }]}>
      <Ionicons
        name="eye-off-outline"
        size={64}
        color={colors.subText}
      />
      <Text style={[stateStyles.emptyStateText, { color: colors.text }]}>
        Your {mediaType === 'movie' ? 'movie' : 'TV show'} watchlist is empty.
      </Text>
    </View>
  </View>
);
  }

    return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
       
      {/* Header with Filter Button */}
        <ThemedHeader mediaType={mediaType} isDarkMode={isDarkMode} theme={theme}>
          <Text style={headerStyles.screenTitle}>
            Watchlist
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={openFilterModal}
              activeOpacity={0.7}
            >
              <Ionicons name="filter" size={24} color="#FFFFFF" />
              {hasActiveFilters && (
                <View style={styles.filterBadge} />
              )}
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
              <Text style={[headerStyles.screenTitle, { fontSize: 16, marginRight: 8 }]}>
                {filteredMovies.length}
              </Text>
              <Ionicons name="list" size={24} color="#FFFFFF" />
            </View>
          </View>
        </ThemedHeader>

       
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

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <View style={[styles.activeFiltersSection, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.activeFiltersTitle, { color: colors.text }]}>
              Active Filters ({filteredMovies.length} {mediaType === 'movie' ? 'movies' : 'TV shows'})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersContainer}>
              {selectedGenres.map(genreId => (
                <View key={`genre-${genreId}`} style={[styles.activeFilterChip, { backgroundColor: colors.primary }]}>
                  <Text style={styles.activeFilterText}>{genres[genreId] || 'Unknown'}</Text>
                </View>
              ))}
              {selectedDecades.map(decade => (
                <View key={`decade-${decade}`} style={[styles.activeFilterChip, { backgroundColor: colors.primary }]}>
                  <Text style={styles.activeFilterText}>{DECADES.find(d => d.value === decade)?.label}</Text>
                </View>
              ))}
              {selectedStreamingServices.map(serviceId => (
                <View key={`streaming-${serviceId}`} style={[styles.activeFilterChip, { backgroundColor: colors.primary }]}>
                  <Text style={styles.activeFilterText}>
                    {streamingProviders.find(s => s.id.toString() === serviceId)?.name || 'Service'}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

      {/* Movie/TV Show List */}
        <ScrollView style={[listStyles.rankingsList, { backgroundColor: colors.background }]}>
          {filteredMovies.map((item, index) => (
            <View
              key={item.id}
              style={[listStyles.rankingItem, { backgroundColor: colors.card }]}
            >
              <View style={[listStyles.rankBadge, { backgroundColor: colors.primary }]}>
                <Text style={[listStyles.rankNumber, { color: colors.accent }]}>
                  {index + 1}
                </Text>
              </View>
              <Image
                source={{ uri: getPosterUrl(item.poster || item.poster_path) }}
                style={listStyles.resultPoster}
                resizeMode="cover"
              />
            <View style={[listStyles.movieDetails, { backgroundColor: colors.card }]}>
                <View>
                  <Text
                    style={[listStyles.resultTitle, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {item.title || item.name}
                  </Text>
                  <View style={styles.scoreContainer}>
                    <Text style={[styles.finalScore, { color: colors.accent }]}>
                      {item.score ? item.score.toFixed(1) : item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
                    </Text>
                    <Text 
                      style={[movieCardStyles.genresText, { color: colors.subText }]}
                      numberOfLines={2}
                    >
                      Genres: {item.genre_ids && Array.isArray(item.genre_ids) 
                        ? item.genre_ids.map(id => (genres && genres[id]) || 'Unknown').join(', ') 
                        : 'Unknown'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.rateButton, { backgroundColor: colors.primary }]}
                  onPress={() => openRatingModal(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.rateButtonText, { color: colors.accent }]}>
                    Rate
                  </Text>
                </TouchableOpacity>
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
            <LinearGradient
              colors={colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={filterStyles.enhancedModalContent}
            >
              {/* Modal Header */}
              <View style={filterStyles.modalHeader}>
                <Text style={filterStyles.modalTitle}>
                  Filter {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
                </Text>
                <TouchableOpacity
                  style={filterStyles.clearAllButton}
                  onPress={clearAllFilters}
                  activeOpacity={0.7}
                >
                  <Text style={filterStyles.clearAllText}>
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
                  <Text style={filterStyles.sectionTitle}>
                    Filter {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
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
                                  ? '#FFFFFF'
                                  : 'transparent',
                                borderColor: '#FFFFFF'
                              }
                            ]}
                            onPress={() => toggleGenre(id)}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              filterStyles.optionChipText,
                              { 
                                color: tempGenres.includes(id)
                                  ? colors.primary
                                  : '#FFFFFF'
                              }
                            ]}>
                              {name}
                            </Text>
                          </TouchableOpacity>
                        ))
                    ) : (
                      <Text style={[
                        filterStyles.optionChipText,
                        { color: '#FF6B6B', padding: 10 }
                      ]}>
                        No genres available
                      </Text>
                    )}
                  </View>
                </View>

                {/* Decade Filter Section */}
                <View style={filterStyles.filterSection}>
                  <Text style={filterStyles.sectionTitle}>
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
                              ? '#FFFFFF'
                              : 'transparent',
                            borderColor: '#FFFFFF'
                          }
                        ]}
                        onPress={() => toggleDecade(decade.value)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          filterStyles.optionChipText,
                          { 
                            color: tempDecades.includes(decade.value)
                              ? colors.primary
                              : '#FFFFFF'
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
                  <Text style={filterStyles.sectionTitle}>
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
                              ? '#FFFFFF'
                              : 'transparent',
                            borderColor: '#FFFFFF'
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
                              ? colors.primary
                              : '#FFFFFF'
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
                   { borderColor: '#FFFFFF' }
                 ]}
                 onPress={cancelFilters}
               >
                 <Text style={[
                   filterStyles.cancelButtonText,
                   { color: '#FFFFFF' }
                 ]}>
                   Cancel
                 </Text>
               </TouchableOpacity>
               <TouchableOpacity
                 style={[
                   filterStyles.applyButton,
                   { backgroundColor: '#FFFFFF' }
                 ]}
                 onPress={applyFilters}
               >
                 <Text style={[
                   filterStyles.applyButtonText,
                   { color: colors.primary }
                 ]}>
                   Apply Filters
                 </Text>
               </TouchableOpacity>
             </View>
           </LinearGradient>
         </View>
       </Modal>

     {/* Rating Modal */}
       <RatingModal
         visible={ratingModalVisible}
         onClose={closeRatingModal}
         onSubmit={handleRatingSubmit}
         movie={selectedMovie}
         ratingInput={ratingInput}
         setRatingInput={setRatingInput}
         slideAnim={slideAnim}
         mediaType={mediaType}
         isDarkMode={isDarkMode}
         theme={theme}
         genres={genres}
       />
   </View>
 );
}

const styles = StyleSheet.create({


 // Filter Button
 filterButton: {
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

 // Filter Section Styles (copied from TopRated)
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

 // Active Filters Section
 activeFiltersSection: {
   paddingHorizontal: 12,
   paddingVertical: 8,
   borderBottomWidth: 1,
   borderBottomColor: 'rgba(255,255,255,0.1)',
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
   marginBottom: 16,
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
   marginTop: 8,
 },
 
 // Rating Modal Styles
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
   color: '#FFFFFF',
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
   color: '#FFFFFF',
 },
 ratingInstructionText: {
   fontSize: 16,
   fontWeight: 'bold',
   marginBottom: 16,
   color: '#FFFFFF',
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
   backgroundColor: 'rgba(0,0,0,0.3)',
   color: '#FFFFFF',
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
 
 // Add TopRated-style button and layout styles
 rateButton: {
   paddingVertical: 8,
   paddingHorizontal: 16,
   borderRadius: 8,
   alignSelf: 'flex-start',
   marginTop: 8,
 },
 rateButtonText: {
   fontSize: 14,
   fontWeight: '600',
 },
 scoreContainer: {
   marginTop: 8,
 },
 finalScore: {
   fontSize: 24,
   fontWeight: 'bold',
   marginBottom: 8,
 },
});

// Filter Modal Styles
const filterStyles = StyleSheet.create({
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
   color: '#FFFFFF',
 },
 clearAllButton: {
   paddingVertical: 6,
   paddingHorizontal: 12,
   borderRadius: 6,
 },
 clearAllText: {
   fontSize: 14,
   fontWeight: '600',
   color: '#FFFFFF',
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
   color: '#FFFFFF',
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
// Content Type Container Styles - ADD THESE
 contentTypeContainer: {
   paddingHorizontal: 16,
   paddingTop: 0,
   paddingBottom: 0,
   marginTop: 0,
   marginBottom: 0,
 },
 contentTypeToggle: {
   flexDirection: 'row',
   borderRadius: 25,
   overflow: 'hidden',
   backgroundColor: 'rgba(255, 255, 255, 0.1)',
   minHeight: 44,
 },
 toggleContent: {
   flexDirection: 'row',
   flex: 1,
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
 contentTypeText: {
   fontSize: 14,
   fontWeight: '600',
   marginLeft: 6,
 },
 // TopRated-style rating modal styles
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

export default WatchlistScreen;