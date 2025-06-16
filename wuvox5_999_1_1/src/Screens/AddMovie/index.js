import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Keyboard,
  Modal,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import layoutStyles from '../../Styles/layoutStyles';
import headerStyles from '../../Styles/headerStyles';
import searchStyles from '../../Styles/searchStyles';
import movieCardStyles from '../../Styles/movieCardStyles';
import buttonStyles from '../../Styles/buttonStyles';
import stateStyles from '../../Styles/StateStyles';
import modalStyles from '../../Styles/modalStyles';

const API_KEY = 'b401be0ea16515055d8d0bde16f80069';
const { width } = Dimensions.get('window');

function AddMovieScreen({ seen, unseen, onAddToSeen, onAddToUnseen, onRemoveFromWatchlist, onUpdateRating, genres, isDarkMode }) {
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRating, setSelectedRating] = useState('');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  
  // For debouncing search
  const timeoutRef = useRef(null);

  // Function to fetch suggestions as user types
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSuggestionLoading(true);
    
    try {
      // TMDB API already filters adult content with the include_adult=false parameter
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Process results
        const filteredResults = data.results
          .filter(movie => {
            // Only keep movies with posters
            return movie.poster_path != null;
          })
          // Sort by popularity (vote_count) descending
          .sort((a, b) => {
            // Primary sort by vote_count (most votes first)
            if (b.vote_count !== a.vote_count) {
              return b.vote_count - a.vote_count;
            }
            // Secondary sort by vote_average (highest rating first)
            return b.vote_average - a.vote_average;
          })
          .slice(0, 3); // Limit to top 3 for better UI

        // Map to our data structure
        const processedResults = filteredResults.map(movie => ({
          id: movie.id,
          title: movie.title,
          score: movie.vote_average,
          voteCount: movie.vote_count || 0,
          poster: movie.poster_path,
          release_year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
          overview: movie.overview || "",
          alreadyRated: seen.some(sm => sm.id === movie.id),
          inWatchlist: unseen.some(um => um.id === movie.id),
          currentRating: seen.find(sm => sm.id === movie.id)?.userRating
        }));
        
        setSuggestions(processedResults);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSuggestionLoading(false);
    }
  }, [seen, unseen]);

  // Handle search input changes with debouncing
  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (!text || text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    // Set new timeout for debouncing
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  }, [fetchSuggestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle full search
  const handleFullSearch = useCallback(async (query = searchQuery) => {
    if (!query || query.trim().length === 0) return;
    
    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search for movies');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Track IDs to avoid duplicates
        const seenIds = new Set();
        
        // Process results
        const processedResults = data.results
          .filter(movie => {
            // Filter out movies without posters
            if (!movie.poster_path) return false;
            
            // Filter out duplicates
            if (seenIds.has(movie.id)) return false;
            seenIds.add(movie.id);
            
            return true;
          })
          .map(movie => ({
            id: movie.id,
            title: movie.title,
            score: movie.vote_average,
            voteCount: movie.vote_count || 0,
            poster: movie.poster_path,
            overview: movie.overview || "No overview available",
            release_date: movie.release_date || 'Unknown',
            release_year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
            genre_ids: movie.genre_ids || [],
            alreadyRated: seen.some(sm => sm.id === movie.id),
            inWatchlist: unseen.some(um => um.id === movie.id),
            currentRating: seen.find(sm => sm.id === movie.id)?.userRating
          }));
        
        setSearchResults(processedResults);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching movies:', err);
      setError('Failed to search for movies. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, seen, unseen]);

  // Handle selecting a suggestion
  const handleSelectSuggestion = useCallback((suggestion) => {
    // Update search query with selected movie title
    setSearchQuery(suggestion.title);
    
    // Hide suggestions
    setShowSuggestions(false);
    
    // Dismiss keyboard
    Keyboard.dismiss();
    
    // Perform full search with the selected movie
    handleFullSearch(suggestion.title);
  }, [handleFullSearch]);

  // Open rating modal
  const openRatingModal = useCallback((movie) => {
    setSelectedMovie(movie);
    // Initialize with current rating if already rated
    setSelectedRating(movie.alreadyRated ? movie.currentRating.toString() : '');
    setRatingModalVisible(true);
  }, []);

  // Handle rating submission - SIMPLIFIED FOR CENTRAL STORE
  const handleRateMovie = useCallback(() => {
    if (!selectedMovie) return;
    
    // Parse rating
    let rating = parseFloat(selectedRating);
    
    // Validate rating
    if (isNaN(rating) || rating < 1 || rating > 10) {
      Alert.alert(
        "Invalid Rating",
        "Please enter a valid rating between 1.0 and 10.0",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Ensure one decimal place
    rating = Math.round(rating * 10) / 10;
    
    // Check if it's an update to an existing movie or a new one
    const isUpdate = seen.some(movie => movie.id === selectedMovie.id);
    
    if (isUpdate) {
      console.log(`📱 ADD MOVIE: Updating ${selectedMovie.title} via central store`);
      onUpdateRating(selectedMovie.id, rating);
    } else {
      console.log(`📱 ADD MOVIE: Adding new movie ${selectedMovie.title} via central store`);
      // Create new movie with rating
      const newMovie = {
        ...selectedMovie,
        userRating: rating,
        eloRating: rating * 10,
        comparisonHistory: [],
        comparisonWins: 0,
      };
      
      // Add to seen list via central store
      onAddToSeen(newMovie);
      
      // If movie was in watchlist, remove it via central store
      if (unseen.some(movie => movie.id === selectedMovie.id)) {
        onRemoveFromWatchlist(selectedMovie.id);
      }
    }
    
    // Update local results for immediate UI feedback
    setSearchResults(prev => 
      prev.map(m => 
        m.id === selectedMovie.id 
          ? { ...m, alreadyRated: true, currentRating: rating, inWatchlist: false } 
          : m
      )
    );
    
    // Close modal
    setRatingModalVisible(false);
    setSelectedMovie(null);
  }, [selectedMovie, selectedRating, onAddToSeen, onUpdateRating, onRemoveFromWatchlist, seen, unseen]);

  // Add movie to watchlist - SIMPLIFIED FOR CENTRAL STORE
  const addToUnseen = useCallback((movie) => {
    // Don't add if it's already rated
    if (seen.some(m => m.id === movie.id)) {
      return;
    }
    
    // Check if it's already in watchlist
    if (movie.inWatchlist) {
      console.log(`📱 ADD MOVIE: Removing ${movie.title} from watchlist via central store`);
      onRemoveFromWatchlist(movie.id);
      
      // Update local results for immediate UI feedback
      setSearchResults(prev => 
        prev.map(m => 
          m.id === movie.id 
            ? { ...m, inWatchlist: false } 
            : m
        )
      );
      return;
    }
    
    console.log(`📱 ADD MOVIE: Adding ${movie.title} to watchlist via central store`);
    onAddToUnseen(movie);
    
    // Update local results for immediate UI feedback
    setSearchResults(prev => 
      prev.map(m => 
        m.id === movie.id 
          ? { ...m, inWatchlist: true } 
          : m
      )
    );
  }, [onAddToUnseen, onRemoveFromWatchlist, seen, unseen]);

 // Get poster URL
 const getPosterUrl = useCallback(path => {
   if (!path) return 'https://via.placeholder.com/342x513?text=No+Poster';
   return `https://image.tmdb.org/t/p/w342${path}`;
 }, []);

 // Get thumbnail poster URL
 const getThumbnailUrl = useCallback(path => {
   if (!path) return 'https://via.placeholder.com/92x138?text=No+Image';
   return `https://image.tmdb.org/t/p/w92${path}`;
 }, []);

 // Render a movie item
 const renderMovieItem = useCallback(({ item }) => (
   <View style={[styles.movieCard, { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5' }]}>
     <Image
       source={{ uri: getPosterUrl(item.poster) }}
       style={styles.moviePoster}
       resizeMode="cover"
     />
     <View style={styles.movieInfo}>
       <Text
         style={[styles.movieTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}
         numberOfLines={2}
       >
         {item.title}
       </Text>
       <Text style={[styles.releaseDate, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
         {item.release_year || 'Unknown'}
       </Text>
       <Text
         style={[styles.movieOverview, { color: isDarkMode ? '#E0E0E0' : '#555' }]}
         numberOfLines={3}
       >
         {item.overview}
       </Text>
       <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
         <Ionicons name="star" size={14} color={isDarkMode ? '#FFD700' : '#FFA000'} />
         <Text style={{ color: isDarkMode ? '#FFD700' : '#FFA000', marginLeft: 4 }}>
            {item.score ? item.score.toFixed(1) : '0.0'} ({(item.voteCount || 0).toLocaleString()} votes)
         </Text>
       </View>
       <Text style={[styles.genresText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
         Genres: {item.genre_ids.map(id => genres[id] || 'Unknown').join(', ')}
       </Text>
       
       {item.alreadyRated && (
         <View style={styles.ratingContainer}>
           <Text style={{ color: isDarkMode ? '#72B01D' : '#4CAF50', marginRight: 10, fontWeight: 'bold' }}>
             Your rating: {item.currentRating ? item.currentRating.toFixed(1) : '0.0'}
           </Text>
           
           {/* Add a reranking option for already rated movies */}
           <TouchableOpacity
             style={[styles.reRankButton, { backgroundColor: isDarkMode ? '#8A2BE2' : '#4B0082' }]}
             onPress={() => openRatingModal(item)}
           >
             <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
               Update Rating
             </Text>
           </TouchableOpacity>
         </View>
       )}
       
       <View style={styles.buttonContainer}>
         {!item.alreadyRated && (
           <TouchableOpacity
             style={[styles.rateButton, { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }]}
             onPress={() => openRatingModal(item)}
           >
             <Text style={[styles.buttonText, { color: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
               Rate Movie
             </Text>
           </TouchableOpacity>
         )}
         
         {/* Always show the watchlist button, but check actual unseen array */}
         <TouchableOpacity
           style={[
             styles.watchlistButton, 
             { 
               borderColor: isDarkMode ? '#8A2BE2' : '#4B0082',
               backgroundColor: unseen.some(m => m.id === item.id) ? 
                 (isDarkMode ? 'rgba(114, 176, 29, 0.2)' : 'rgba(76, 175, 80, 0.1)') : 
                 'transparent'
             }
           ]}
           onPress={() => addToUnseen(item)}
         >
           <Text style={[styles.buttonText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
             {unseen.some(m => m.id === item.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
           </Text>
         </TouchableOpacity>
       </View>
     </View>
   </View>
 ), [isDarkMode, genres, getPosterUrl, openRatingModal, addToUnseen, unseen]);

 // Render a suggestion item with improved UI
 const renderSuggestionItem = useCallback((suggestion, index) => (
   <TouchableOpacity
     key={suggestion.id.toString()}
     style={[
       styles.suggestionItem,
       { 
         backgroundColor: isDarkMode ? '#2A1A42' : '#F5F5F5',
         borderBottomColor: isDarkMode ? '#381E5E' : '#E0E0E0',
         borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
       }
     ]}
     onPress={() => handleSelectSuggestion(suggestion)}
     activeOpacity={0.7}
   >
     {/* Poster thumbnail */}
     <Image 
       source={{ uri: getThumbnailUrl(suggestion.poster) }}
       style={styles.suggestionImage}
       resizeMode="cover"
     />
     
     {/* Movie details */}
     <View style={styles.suggestionContent}>
       <Text 
         style={[styles.suggestionTitle, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}
         numberOfLines={1}
       >
         {suggestion.title}
       </Text>
       
       <View style={styles.suggestionMeta}>
         {/* Year */}
         {suggestion.release_year && (
           <Text style={[styles.suggestionYear, { color: isDarkMode ? '#BBB5C3' : '#666666' }]}>
             {suggestion.release_year}
           </Text>
         )}
         
         {/* Bullet separator */}
         {suggestion.release_year && suggestion.score > 0 && (
           <Text style={{ color: isDarkMode ? '#BBB5C3' : '#666666', marginHorizontal: 4 }}>•</Text>
         )}
         
         {/* Rating */}
         {suggestion.score > 0 && (
           <View style={styles.suggestionRating}>
             <Ionicons name="star" size={12} color={isDarkMode ? '#FFD700' : '#FFA000'} />
             <Text style={{ color: isDarkMode ? '#FFD700' : '#FFA000', marginLeft: 2, fontSize: 12 }}>
               {suggestion.score.toFixed(1)}
             </Text>
           </View>
         )}
       </View>
     </View>
     
     {/* Status indicators */}
     {(suggestion.alreadyRated || suggestion.inWatchlist) && (
       <View style={[
         styles.suggestionStatus,
         { backgroundColor: isDarkMode ? 
             (suggestion.alreadyRated ? 'rgba(114, 176, 29, 0.2)' : 'rgba(255, 215, 0, 0.2)') : 
             (suggestion.alreadyRated ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 160, 0, 0.1)')
         }
       ]}>
         <Text style={{ 
           color: suggestion.alreadyRated ? 
             (isDarkMode ? '#72B01D' : '#4CAF50') : 
             (isDarkMode ? '#FFD700' : '#FFA000'),
           fontSize: 12,
           fontWeight: '500'
         }}>
           {suggestion.alreadyRated ? 'Rated' : 'Watchlist'}
         </Text>
       </View>
     )}
   </TouchableOpacity>
 ), [isDarkMode, handleSelectSuggestion, getThumbnailUrl, suggestions.length]);

 return (
   <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
     <View
       style={[
         headerStyles.screenHeader,
         { backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5', borderBottomColor: isDarkMode ? '#8A2BE2' : '#E0E0E0' },
       ]}
     >
       <Text style={[headerStyles.screenTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
         Add Movies
       </Text>
     </View>
     
     {/* Search bar with improved styling */}
     <View
       style={[
         styles.searchContainer,
         { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF', borderBottomColor: isDarkMode ? '#8A2BE2' : '#E0E0E0' },
       ]}
     >
       <View style={styles.searchInputContainer}>
         <TextInput
           style={[
             styles.searchInput,
             {
               backgroundColor: isDarkMode ? '#2A1A42' : '#F0F0F0',
               borderColor: isDarkMode ? '#6C2BD9' : '#E0E0E0',
               color: isDarkMode ? '#F5F5F5' : '#333',
             },
           ]}
           placeholder="Search for a movie..."
           placeholderTextColor={isDarkMode ? '#9D8AC7' : '#999999'}
           value={searchQuery}
           onChangeText={handleSearchChange}
           returnKeyType="search"
           onSubmitEditing={() => handleFullSearch()}
           autoCorrect={false}
         />
         
         {/* Clear button */}
         {searchQuery.length > 0 && (
           <TouchableOpacity
             style={styles.clearButton}
             onPress={() => {
               setSearchQuery('');
               setSuggestions([]);
               setShowSuggestions(false);
             }}
           >
             <Ionicons 
               name="close-circle" 
               size={20} 
               color={isDarkMode ? '#9D8AC7' : '#999999'} 
             />
           </TouchableOpacity>
         )}
       </View>
       
       <TouchableOpacity
         style={[styles.searchButton, { backgroundColor: isDarkMode ? '#6C2BD9' : '#4B0082' }]}
         onPress={() => handleFullSearch()}
         disabled={loading || !searchQuery.trim()}
       >
         {loading ? (
           <ActivityIndicator size="small" color="#FFFFFF" />
         ) : (
           <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>Search</Text>
         )}
       </TouchableOpacity>
     </View>
     
     {/* Suggestions with improved styling */}
     {showSuggestions && suggestions.length > 0 && (
       <View style={{ position: 'relative', zIndex: 2 }}>
         <View style={[
           styles.suggestionsContainer,
           { 
             backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF',
             borderColor: isDarkMode ? '#6C2BD9' : '#E0E0E0' 
           }
         ]}>
           <ScrollView 
             keyboardShouldPersistTaps="handled"
             nestedScrollEnabled={true}
             style={styles.suggestionsScroll}
             contentContainerStyle={styles.suggestionsContent}
             showsVerticalScrollIndicator={false}
           >
             {suggestions.map((suggestion, index) => renderSuggestionItem(suggestion, index))}
           </ScrollView>
         </View>
       </View>
     )}

     {/* Search results or empty state */}
     {error ? (
       <View style={styles.errorContainer}>
         <Ionicons name="alert-circle" size={32} color={isDarkMode ? '#FFD700' : '#4B0082'} />
         <Text style={{ color: isDarkMode ? '#FFD700' : '#4B0082', fontSize: 18, textAlign: 'center', marginTop: 10, fontWeight: '500' }}>
           {error}
         </Text>
       </View>
     ) : searchResults.length === 0 && !loading ? (
       <View style={styles.emptyStateContainer}>
         <Ionicons name="search" size={64} color={isDarkMode ? '#D3D3D3' : '#A9A9A9'} />
         <Text style={{ color: isDarkMode ? '#D3D3D3' : '#666', fontSize: 16, textAlign: 'center', marginTop: 16 }}>
           Search for movies to add to your lists
         </Text>
         {searchQuery && suggestionLoading && (
           <ActivityIndicator size="small" color={isDarkMode ? '#FFD700' : '#4B0082'} style={{ marginTop: 16 }} />
         )}
       </View>
     ) : (
       <FlatList
         data={searchResults}
         keyExtractor={item => item.id.toString()}
         renderItem={renderMovieItem}
         contentContainerStyle={{ padding: 16 }}
         keyboardShouldPersistTaps="handled"
       />
     )}
     
     {/* Rating Modal */}
     {selectedMovie && (
       <Modal
         visible={ratingModalVisible}
         transparent={true}
         animationType="fade"
         onRequestClose={() => setRatingModalVisible(false)}
       >
         <View style={modalStyles.modalOverlay}>
           <View style={[
             modalStyles.modalContent,
             styles.ratingModalContent,
             { backgroundColor: isDarkMode ? '#4B0082' : '#FFFFFF' }
           ]}>
             <View style={modalStyles.modalHandle} />
             
             {/* Movie Info */}
             <View style={styles.modalMovieInfo}>
               {selectedMovie.poster && (
                 <Image 
                   source={{ uri: getPosterUrl(selectedMovie.poster) }}
                   style={styles.modalPoster}
                   resizeMode="cover"
                 />
               )}
               <View style={styles.modalMovieDetails}>
                 <Text style={[
                   styles.modalMovieTitle,
                   { color: isDarkMode ? '#F5F5F5' : '#333' }
                 ]}>
                   {selectedMovie.title}
                 </Text>
                 <Text style={[
                   styles.modalMovieYear,
                   { color: isDarkMode ? '#D3D3D3' : '#666' }
                 ]}>
                   {selectedMovie.release_year || 'Unknown'}
                 </Text>
                 <View style={styles.ratingDisplay}>
                   <Ionicons name="star" size={16} color={isDarkMode ? '#FFD700' : '#FFA000'} />
                   <Text style={{ color: isDarkMode ? '#FFD700' : '#FFA000', marginLeft: 4 }}>
                     {selectedMovie.score.toFixed(1)} ({selectedMovie.voteCount.toLocaleString()} votes)
                   </Text>
                 </View>
                 <Text style={[
                   styles.modalGenres,
                   { color: isDarkMode ? '#D3D3D3' : '#666' }
                 ]}>
                   {selectedMovie.genre_ids?.map(id => genres[id] || '').filter(Boolean).join(', ')}
                 </Text>
               </View>
             </View>
             
             <View style={[styles.divider, { backgroundColor: isDarkMode ? '#381E5E' : '#E0E0E0' }]} />
             
             {/* Rating input */}
             <View style={styles.ratingContainer}>
               <Text style={[
                 styles.ratingLabel,
                 { color: isDarkMode ? '#F5F5F5' : '#333' }
               ]}>
                 Your Rating (1.0-10.0):
               </Text>
               
               <TextInput
                 style={[
                   styles.ratingInput,
                   {
                     backgroundColor: isDarkMode ? '#2A1A42' : '#F0F0F0',
                     borderColor: isDarkMode ? '#6C2BD9' : '#E0E0E0',
                     color: isDarkMode ? '#F5F5F5' : '#333',
                   }
                 ]}
                 value={selectedRating.toString()}
                 onChangeText={(text) => {
                   // Handle all basic rating input
                   if (text === '' || text === '.' || text === '10' || text === '10.0') {
                     setSelectedRating(text);
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
                           setSelectedRating(parts[0] + '.' + parts[1].substring(0, 1));
                         } else {
                           // One decimal is fine, keep it
                           setSelectedRating(text);
                         }
                       } else {
                         // No decimal, just keep the value
                         setSelectedRating(text);
                       }
                     }
                   }
                 }}
                 keyboardType="decimal-pad"
                 placeholder="Enter rating"
                 placeholderTextColor={isDarkMode ? '#9D8AC7' : '#999999'}
                 maxLength={4}
                 autoFocus={true}
               />
             </View>
             
             {/* Modal buttons */}
             <View style={modalStyles.modalButtons}>
               <TouchableOpacity
                 style={[
                   modalStyles.modalButton,
                   { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }
                 ]}
                 onPress={handleRateMovie}
               >
                 <Text style={[
                   modalStyles.modalButtonText,
                   { color: isDarkMode ? '#1C2526' : '#FFFFFF' }
                 ]}>
                   {selectedMovie.alreadyRated ? 'Update Rating' : 'Rate Movie'}
                 </Text>
               </TouchableOpacity>
               <TouchableOpacity
                 style={[
                   modalStyles.modalButton,
                   modalStyles.cancelButton,
                   { borderColor: isDarkMode ? '#6C2BD9' : '#4B0082' }
                 ]}
                 onPress={() => setRatingModalVisible(false)}
               >
                 <Text style={[
                   modalStyles.modalButtonText,
                   { color: isDarkMode ? '#D3D3D3' : '#666' }
                 ]}>
                   Cancel
                 </Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>
     )}
   </SafeAreaView>
 );
}

const styles = StyleSheet.create({
 searchContainer: {
   flexDirection: 'row',
   padding: 16,
   borderBottomWidth: 1,
   position: 'relative',
   zIndex: 1,
 },
 searchInputContainer: {
   flex: 1,
   position: 'relative',
   marginRight: 10,
 },
 searchInput: {
   flex: 1,
   borderRadius: 12,
   paddingHorizontal: 16,
   paddingVertical: 12,
   fontSize: 16,
   borderWidth: 1,
   paddingRight: 40,
 },
 clearButton: {
   position: 'absolute',
   right: 10,
   top: '50%',
   marginTop: -10,
   height: 20,
   width: 20,
   justifyContent: 'center',
   alignItems: 'center',
 },
 searchButton: {
   paddingVertical: 12,
   paddingHorizontal: 20,
   borderRadius: 12,
   justifyContent: 'center',
   alignItems: 'center',
 },
 suggestionsContainer: {
   position: 'absolute',
   top: '100%',
   left: 16,
   right: 16,
   borderRadius: 16,
   maxHeight: 400,
   borderWidth: 1,
   zIndex: 100,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 4 },
   shadowOpacity: 0.2,
   shadowRadius: 8,
   elevation: 5,
   overflow: 'hidden',
   marginTop: 2,
 },
 suggestionsScroll: {
   maxHeight: 400,
 },
 suggestionsContent: {
   paddingVertical: 6,
 },
 suggestionItem: {
   flexDirection: 'row',
   alignItems: 'center',
   padding: 12,
   paddingVertical: 14,
   borderBottomWidth: 1,
 },
 suggestionImage: {
   width: 50,
   height: 75,
   borderRadius: 8,
   marginRight: 12,
 },
 suggestionContent: {
   flex: 1,
   justifyContent: 'center',
 },
 suggestionTitle: {
   fontSize: 14,
   fontWeight: '600',
   marginBottom: 4,
 },
 suggestionMeta: {
   flexDirection: 'row',
   alignItems: 'center',
 },
 suggestionYear: {
   fontSize: 12,
   fontWeight: '500',
 },
 suggestionRating: {
   flexDirection: 'row',
   alignItems: 'center',
 },
 suggestionStatus: {
   marginLeft: 8,
   paddingVertical: 3,
   paddingHorizontal: 8,
   borderRadius: 12,
 },
 errorContainer: {
   flex: 1,
   alignItems: 'center',
   justifyContent: 'center',
   padding: 20,
 },
 emptyStateContainer: {
   flex: 1,
   alignItems: 'center',
   justifyContent: 'center',
   padding: 20,
 },
 movieCard: {
   flexDirection: 'row',
   borderRadius: 16,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 4 },
   shadowOpacity: 0.15,
   shadowRadius: 8,
   elevation: 5,
   overflow: 'hidden',
   marginBottom: 20,
 },
 moviePoster: {
   width: 110,
   height: 165,
 },
 movieInfo: {
   flex: 1,
   padding: 16,
 },
 movieTitle: {
   fontSize: 18,
   fontWeight: 'bold',
   marginBottom: 6,
 },
 releaseDate: {
   fontSize: 14,
   marginBottom: 10,
 },
 movieOverview: {
   fontSize: 14,
   lineHeight: 20,
   marginBottom: 8,
 },
 genresText: {
   fontSize: 14,
   marginTop: 8,
   marginBottom: 10,
 },
 ratingContainer: {
   flexDirection: 'row',
   alignItems: 'center',
   marginTop: 8,
 },
 reRankButton: {
   paddingVertical: 4,
   paddingHorizontal: 10,
   borderRadius: 4,
   alignItems: 'center',
 },
 buttonContainer: {
   flexDirection: 'row',
   marginTop: 10,
   flexWrap: 'wrap',
 },
 rateButton: {
   paddingVertical: 8,
   paddingHorizontal: 16,
   borderRadius: 8,
   marginRight: 8,
   marginBottom: 8,
 },
 watchlistButton: {
   paddingVertical: 8,
   paddingHorizontal: 16,
   borderRadius: 8,
   borderWidth: 1,
   backgroundColor: 'transparent',
   marginBottom: 8,
 },
 buttonText: {
   fontSize: 14,
   fontWeight: '600',
 },
 ratingModalContent: {
   position: 'absolute',
   top: '10%',
   left: 0,
   right: 0,
   maxHeight: '60%',
   marginHorizontal: 20,
   borderRadius: 20,
   overflow: 'hidden',
 },
 modalMovieInfo: {
   flexDirection: 'row',
   marginBottom: 16,
   alignItems: 'center',
 },
 modalPoster: {
   width: 80,
   height: 120,
   borderRadius: 8,
   marginRight: 12,
 },
 modalMovieDetails: {
   flex: 1,
 },
 modalMovieTitle: {
   fontSize: 18,
   fontWeight: 'bold',
   marginBottom: 4,
 },
 modalMovieYear: {
   fontSize: 14,
   marginBottom: 4,
 },
 modalGenres: {
   fontSize: 12,
   marginTop: 4,
 },
 ratingDisplay: {
   flexDirection: 'row',
   alignItems: 'center',
 },
 divider: {
   height: 1,
   marginVertical: 12,
   width: '100%',
 },
 ratingContainer: {
   width: '100%',
   marginBottom: 20,
   alignItems: 'center',
 },
 ratingLabel: {
   fontSize: 16,
   fontWeight: '500',
   marginBottom: 12,
   textAlign: 'center',
 },
 ratingInput: {
   height: 50,
   borderWidth: 1,
   borderRadius: 8,
   paddingHorizontal: 16,
   fontSize: 24,
   fontWeight: 'bold',
   textAlign: 'center',
   marginHorizontal: 'auto',
   width: '50%',
   alignSelf: 'center',
 },
});

export default AddMovieScreen;