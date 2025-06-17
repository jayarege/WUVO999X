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

// Import theme system and styles
import { useMediaType } from '../../Navigation/TabNavigator';
import { getLayoutStyles } from '../../Styles/layoutStyles';
import { getHeaderStyles, ThemedHeader } from '../../Styles/headerStyles';
import { getSearchStyles } from '../../Styles/searchStyles';
import { getMovieCardStyles } from '../../Styles/movieCardStyles';
import { getButtonStyles, ThemedButton } from '../../Styles/buttonStyles';
import { getModalStyles } from '../../Styles/modalStyles';
import stateStyles from '../../Styles/StateStyles';
import theme from '../../utils/Theme';

const API_KEY = 'b401be0ea16515055d8d0bde16f80069';
const { width } = Dimensions.get('window');

function AddMovieScreen({ seen, unseen, onAddToSeen, onAddToUnseen, onRemoveFromWatchlist, onUpdateRating, genres, isDarkMode }) {
  // Use media type context
  const { mediaType } = useMediaType();

  // Get all themed styles
  const layoutStyles = getLayoutStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const headerStyles = getHeaderStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const searchStyles = getSearchStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const movieCardStyles = getMovieCardStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const buttonStyles = getButtonStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);
  const modalStyles = getModalStyles(mediaType, isDarkMode ? 'dark' : 'light', theme);

  // Get theme colors for this media type and mode
  const colors = theme[mediaType][isDarkMode ? 'dark' : 'light'];

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
      // Determine API endpoint based on media type
      const endpoint = mediaType === 'movie' ? 'search/movie' : 'search/tv';
      
      const response = await fetch(
        `https://api.themoviedb.org/3/${endpoint}?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Process results
        const filteredResults = data.results
          .filter(item => {
            // Only keep items with posters
            return item.poster_path != null;
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
        const processedResults = filteredResults.map(item => ({
          id: item.id,
          title: item.title || item.name, // TV shows use 'name' instead of 'title'
          score: item.vote_average,
          voteCount: item.vote_count || 0,
          poster: item.poster_path,
          release_year: item.release_date ? new Date(item.release_date).getFullYear() : 
                       item.first_air_date ? new Date(item.first_air_date).getFullYear() : null,
          overview: item.overview || "",
          alreadyRated: seen.some(sm => sm.id === item.id),
          inWatchlist: unseen.some(um => um.id === item.id),
          currentRating: seen.find(sm => sm.id === item.id)?.userRating
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
  }, [seen, unseen, mediaType]);

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
      // Determine API endpoint based on media type
      const endpoint = mediaType === 'movie' ? 'search/movie' : 'search/tv';
      
      const response = await fetch(
        `https://api.themoviedb.org/3/${endpoint}?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to search for ${mediaType === 'movie' ? 'movies' : 'TV shows'}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Track IDs to avoid duplicates
        const seenIds = new Set();
        
        // Process results
        const processedResults = data.results
          .filter(item => {
            // Filter out items without posters
            if (!item.poster_path) return false;
            
            // Filter out duplicates
            if (seenIds.has(item.id)) return false;
            seenIds.add(item.id);
            
            return true;
          })
          .map(item => ({
            id: item.id,
            title: item.title || item.name, // TV shows use 'name' instead of 'title'
            score: item.vote_average,
            voteCount: item.vote_count || 0,
            poster: item.poster_path,
            overview: item.overview || "No overview available",
            release_date: item.release_date || item.first_air_date || 'Unknown',
            release_year: item.release_date ? new Date(item.release_date).getFullYear() : 
                         item.first_air_date ? new Date(item.first_air_date).getFullYear() : null,
            genre_ids: item.genre_ids || [],
            alreadyRated: seen.some(sm => sm.id === item.id),
            inWatchlist: unseen.some(um => um.id === item.id),
            currentRating: seen.find(sm => sm.id === item.id)?.userRating
          }));
        
        setSearchResults(processedResults);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching:', err);
      setError(`Failed to search for ${mediaType === 'movie' ? 'movies' : 'TV shows'}. Please try again.`);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, seen, unseen, mediaType]);

  // Handle selecting a suggestion
  const handleSelectSuggestion = useCallback((suggestion) => {
    // Update search query with selected item title
    setSearchQuery(suggestion.title);
    
    // Hide suggestions
    setShowSuggestions(false);
    
    // Dismiss keyboard
    Keyboard.dismiss();
    
    // Perform full search with the selected item
    handleFullSearch(suggestion.title);
  }, [handleFullSearch]);

  // Open rating modal
  const openRatingModal = useCallback((item) => {
    setSelectedMovie(item);
    // Initialize with current rating if already rated
    setSelectedRating(item.alreadyRated ? item.currentRating.toString() : '');
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
    
    // Check if it's an update to an existing item or a new one
    const isUpdate = seen.some(item => item.id === selectedMovie.id);
    
    if (isUpdate) {
      console.log(`📱 ADD ${mediaType.toUpperCase()}: Updating ${selectedMovie.title} via central store`);
      onUpdateRating(selectedMovie.id, rating);
    } else {
      console.log(`📱 ADD ${mediaType.toUpperCase()}: Adding new ${mediaType} ${selectedMovie.title} via central store`);
      // Create new item with rating
      const newItem = {
        ...selectedMovie,
        userRating: rating,
        eloRating: rating * 10,
        comparisonHistory: [],
        comparisonWins: 0,
        mediaType: mediaType, // Add the correct mediaType
      };
      
      // Add to seen list via central store
      onAddToSeen(newItem);
      
      // If item was in watchlist, remove it via central store
      if (unseen.some(item => item.id === selectedMovie.id)) {
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
  }, [selectedMovie, selectedRating, onAddToSeen, onUpdateRating, onRemoveFromWatchlist, seen, unseen, mediaType]);

  // Add item to watchlist - SIMPLIFIED FOR CENTRAL STORE
  const addToUnseen = useCallback((item) => {
    // Don't add if it's already rated
    if (seen.some(m => m.id === item.id)) {
      return;
    }
    
    // Check if it's already in watchlist
    if (item.inWatchlist) {
      console.log(`📱 ADD ${mediaType.toUpperCase()}: Removing ${item.title} from watchlist via central store`);
      onRemoveFromWatchlist(item.id);
      
      // Update local results for immediate UI feedback
      setSearchResults(prev => 
        prev.map(m => 
          m.id === item.id 
            ? { ...m, inWatchlist: false } 
            : m
        )
      );
      return;
    }
    
    console.log(`📱 ADD ${mediaType.toUpperCase()}: Adding ${item.title} to watchlist via central store`);
    // Add mediaType to the item before adding to watchlist
    const itemWithMediaType = {
      ...item,
      mediaType: mediaType
    };
    onAddToUnseen(itemWithMediaType);
    
    // Update local results for immediate UI feedback
    setSearchResults(prev => 
      prev.map(m => 
        m.id === item.id 
          ? { ...m, inWatchlist: true } 
          : m
      )
    );
  }, [onAddToUnseen, onRemoveFromWatchlist, seen, unseen, mediaType]);

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

 // Render an item (movie or TV show)
 const renderMovieItem = useCallback(({ item }) => (
   <View style={[movieCardStyles.movieCard, { backgroundColor: colors.card }]}>
     <Image
       source={{ uri: getPosterUrl(item.poster) }}
       style={styles.moviePoster}
       resizeMode="cover"
     />
     <View style={movieCardStyles.movieInfo}>
       <Text
         style={[movieCardStyles.movieTitle, { color: colors.text }]}
         numberOfLines={2}
       >
         {item.title}
       </Text>
       <Text style={[movieCardStyles.releaseDate, { color: colors.subText }]}>
         {item.release_year || 'Unknown'}
       </Text>
       <Text
         style={[movieCardStyles.movieOverview, { color: colors.text }]}
         numberOfLines={3}
       >
         {item.overview}
       </Text>
       <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
         <Ionicons name="star" size={14} color={colors.accent} />
         <Text style={{ color: colors.accent, marginLeft: 4 }}>
            {item.score ? item.score.toFixed(1) : '0.0'} ({(item.voteCount || 0).toLocaleString()} votes)
         </Text>
       </View>
       <Text style={[movieCardStyles.genresText, { color: colors.subText }]}>
         Genres: {item.genre_ids.map(id => genres[id] || 'Unknown').join(', ')}
       </Text>
       
       {item.alreadyRated && (
         <View style={styles.ratingContainer}>
           <Text style={{ color: colors.secondary, marginRight: 10, fontWeight: 'bold' }}>
             Your rating: {item.currentRating ? item.currentRating.toFixed(1) : '0.0'}
           </Text>
           
           {/* Add a reranking option for already rated items */}
           <TouchableOpacity
             style={[styles.reRankButton, { backgroundColor: colors.primary }]}
             onPress={() => openRatingModal(item)}
           >
             <Text style={[styles.buttonText, { color: colors.text }]}>
               Update Rating
             </Text>
           </TouchableOpacity>
         </View>
       )}
       
       <View style={styles.buttonContainer}>
         {!item.alreadyRated && (
           <TouchableOpacity
             style={[buttonStyles.primaryButton, { backgroundColor: colors.primary }]}
             onPress={() => openRatingModal(item)}
           >
             <Text style={[buttonStyles.primaryButtonText, { color: colors.accent }]}>
               Rate {mediaType === 'movie' ? 'Movie' : 'TV Show'}
             </Text>
           </TouchableOpacity>
         )}
         
         {/* Always show the watchlist button, but check actual unseen array */}
         <TouchableOpacity
           style={[
             buttonStyles.outlineButton, 
             { 
               borderColor: colors.primary,
               backgroundColor: unseen.some(m => m.id === item.id) ? 
                 colors.secondary : 'transparent'
             }
           ]}
           onPress={() => addToUnseen(item)}
         >
           <Text style={[buttonStyles.outlineButtonText, { color: colors.text }]}>
             {unseen.some(m => m.id === item.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
           </Text>
         </TouchableOpacity>
       </View>
     </View>
   </View>
 ), [colors, genres, getPosterUrl, openRatingModal, addToUnseen, unseen, movieCardStyles, buttonStyles, mediaType]);

 // Render a suggestion item with improved UI
 const renderSuggestionItem = useCallback((suggestion, index) => (
   <TouchableOpacity
     key={suggestion.id.toString()}
     style={[
       styles.suggestionItem,
       { 
         backgroundColor: colors.card,
         borderBottomColor: colors.secondary,
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
     
     {/* Item details */}
     <View style={styles.suggestionContent}>
       <Text 
         style={[styles.suggestionTitle, { color: colors.text }]}
         numberOfLines={1}
       >
         {suggestion.title}
       </Text>
       
       <View style={styles.suggestionMeta}>
         {/* Year */}
         {suggestion.release_year && (
           <Text style={[styles.suggestionYear, { color: colors.subText }]}>
             {suggestion.release_year}
           </Text>
         )}
         
         {/* Bullet separator */}
         {suggestion.release_year && suggestion.score > 0 && (
           <Text style={{ color: colors.subText, marginHorizontal: 4 }}>•</Text>
         )}
         
         {/* Rating */}
         {suggestion.score > 0 && (
           <View style={styles.suggestionRating}>
             <Ionicons name="star" size={12} color={colors.accent} />
             <Text style={{ color: colors.accent, marginLeft: 2, fontSize: 12 }}>
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
         { backgroundColor: suggestion.alreadyRated ? colors.secondary : colors.accent }
       ]}>
         <Text style={{ 
           color: colors.background,
           fontSize: 12,
           fontWeight: '500'
         }}>
           {suggestion.alreadyRated ? 'Rated' : 'Watchlist'}
         </Text>
       </View>
     )}
   </TouchableOpacity>
 ), [colors, handleSelectSuggestion, getThumbnailUrl, suggestions.length]);

 return (
   <SafeAreaView style={[layoutStyles.safeArea, { backgroundColor: colors.background }]}>
     <ThemedHeader mediaType={mediaType} isDarkMode={isDarkMode} theme={theme}>
       <Text style={headerStyles.screenTitle}>
         Add {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
       </Text>
     </ThemedHeader>
     
     {/* Search bar with improved styling */}
     <View style={[searchStyles.searchContainer, { backgroundColor: colors.background, borderBottomColor: colors.secondary }]}>
       <View style={styles.searchInputContainer}>
         <TextInput
           style={[
             searchStyles.searchInput,
             {
               backgroundColor: colors.card,
               borderColor: colors.secondary,
               color: colors.text,
             },
           ]}
           placeholder={`Search for a ${mediaType === 'movie' ? 'movie' : 'TV show'}...`}
           placeholderTextColor={colors.subText}
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
               color={colors.subText} 
             />
           </TouchableOpacity>
         )}
       </View>
       
       <TouchableOpacity
         style={[searchStyles.searchButton, { backgroundColor: colors.primary }]}
         onPress={() => handleFullSearch()}
         disabled={loading || !searchQuery.trim()}
       >
         {loading ? (
           <ActivityIndicator size="small" color={colors.text} />
         ) : (
           <Text style={[searchStyles.searchButtonText, { color: colors.text }]}>Search</Text>
         )}
       </TouchableOpacity>
     </View>
     
     {/* Suggestions with improved styling */}
     {showSuggestions && suggestions.length > 0 && (
       <View style={{ position: 'relative', zIndex: 2 }}>
         <View style={[
           searchStyles.suggestionsContainer,
           { 
             backgroundColor: colors.card,
             borderColor: colors.secondary 
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
       <View style={stateStyles.errorContainer}>
         <Ionicons name="alert-circle" size={32} color={colors.accent} />
         <Text style={[stateStyles.errorText, { color: colors.accent }]}>
           {error}
         </Text>
       </View>
     ) : searchResults.length === 0 && !loading ? (
       <View style={stateStyles.emptyStateContainer}>
         <Ionicons name="search" size={64} color={colors.subText} />
         <Text style={[stateStyles.emptyStateText, { color: colors.subText }]}>
           Search for {mediaType === 'movie' ? 'movies' : 'TV shows'} to add to your lists
         </Text>
         {searchQuery && suggestionLoading && (
           <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 16 }} />
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
             { backgroundColor: colors.card }
           ]}>
             <View style={modalStyles.modalHandle} />
             
             {/* Item Info */}
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
                   { color: colors.text }
                 ]}>
                   {selectedMovie.title}
                 </Text>
                 <Text style={[
                   styles.modalMovieYear,
                   { color: colors.subText }
                 ]}>
                   {selectedMovie.release_year || 'Unknown'}
                 </Text>
                 <View style={styles.ratingDisplay}>
                   <Ionicons name="star" size={16} color={colors.accent} />
                   <Text style={{ color: colors.accent, marginLeft: 4 }}>
                     {selectedMovie.score.toFixed(1)} ({selectedMovie.voteCount.toLocaleString()} votes)
                   </Text>
                 </View>
                 <Text style={[
                   styles.modalGenres,
                   { color: colors.subText }
                 ]}>
                   {selectedMovie.genre_ids?.map(id => genres[id] || '').filter(Boolean).join(', ')}
                 </Text>
               </View>
             </View>
             
             <View style={[styles.divider, { backgroundColor: colors.secondary }]} />
             
             {/* Rating input */}
             <View style={styles.ratingContainer}>
               <Text style={[
                 styles.ratingLabel,
                 { color: colors.text }
               ]}>
                 Your Rating (1.0-10.0):
               </Text>
               
               <TextInput
                 style={[
                   styles.ratingInput,
                   {
                     backgroundColor: colors.background,
                     borderColor: colors.secondary,
                     color: colors.text,
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
                 placeholderTextColor={colors.subText}
                 maxLength={4}
                 autoFocus={true}
               />
             </View>
             
             {/* Modal buttons */}
             <View style={modalStyles.modalButtons}>
               <TouchableOpacity
                 style={[
                   modalStyles.modalButton,
                   modalStyles.primaryButton,
                   { backgroundColor: colors.primary }
                 ]}
                 onPress={handleRateMovie}
               >
                 <Text style={[
                   modalStyles.modalButtonText,
                   { color: colors.accent }
                 ]}>
                   {selectedMovie.alreadyRated ? 'Update Rating' : `Rate ${mediaType === 'movie' ? 'Movie' : 'TV Show'}`}
                 </Text>
               </TouchableOpacity>
               <TouchableOpacity
                 style={[
                   modalStyles.modalButton,
                   modalStyles.cancelButton,
                   { borderColor: colors.primary }
                 ]}
                 onPress={() => setRatingModalVisible(false)}
               >
                 <Text style={[
                   modalStyles.modalButtonText,
                   { color: colors.subText }
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
 searchInputContainer: {
   flex: 1,
   position: 'relative',
   marginRight: 10,
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
moviePoster: {
  width: 110,
  height: 165,
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
  gap: 8,
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