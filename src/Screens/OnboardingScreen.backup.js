import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import constants
import { TMDB_API_KEY, ONBOARDING_COMPLETE_KEY } from '../Constants';

// Constants
const { width, height } = Dimensions.get('window');
const API_KEY = TMDB_API_KEY;

// Complete movie database for primary use
// Replace your current movieDatabase definition with this simplified version
const movieDatabase = [
  { id: 238, title: "The Godfather" },
  { id: 155, title: "The Dark Knight" },
  { id: 121, title: "The Lord of the Rings: The Two Towers" },
  { id: 27205, title: "Inception" },
  { id: 157336, title: "Interstellar" },
  { id: 98, title: "Gladiator" },
  { id: 37165, title: "The Departed" },
  { id: 244786, title: "Whiplash" },
  { id: 1124, title: "The Prestige" },
  { id: 68718, title: "Django Unchained" },
  { id: 438631, title: "Dune: Part Two" },
  { id: 10681, title: "WALL·E" },
  { id: 77, title: "Memento" },
  { id: 299536, title: "Avengers: Infinity War" },
  { id: 324857, title: "Spider-Man: Into the Spider-Verse" },
  { id: 569094, title: "Spider-Man: Across the Spider-Verse" },
  { id: 16869, title: "Inglourious Basterds" },
  { id: 49026, title: "The Dark Knight Rises" },
  { id: 354912, title: "Coco" },
  { id: 299534, title: "Avengers: Endgame" },
  { id: 475557, title: "Joker" },
  { id: 641, title: "Requiem for a Dream" },
  { id: 10193, title: "Toy Story 3" },
  { id: 301528, title: "Toy Story 4" },
  { id: 38, title: "Eternal Sunshine of the Spotless Mind" },
  { id: 14160, title: "Up" },
  { id: 872585, title: "Oppenheimer" },
  { id: 107, title: "Snatch" },
  { id: 530915, title: "1917" },
  { id: 106646, title: "The Wolf of Wall Street" },
  { id: 556574, title: "Hamilton" },
  { id: 490132, title: "Green Book" },
  { id: 272, title: "Batman Begins" },
  { id: 11324, title: "Shutter Island" },
  { id: 601434, title: "The Father" },
  { id: 7491, title: "There Will Be Blood" },
  { id: 361743, title: "Top Gun: Maverick" },
  { id: 359724, title: "Ford v Ferrari" },
  { id: 6977, title: "No Country for Old Men" },
  { id: 453, title: "A Beautiful Mind" },
  { id: 24, title: "Kill Bill: Vol. 1" },
  { id: 146233, title: "Prisoners" },
  { id: 12, title: "Finding Nemo" },
  { id: 508439, title: "Klaus" },
  { id: 752, title: "V for Vendetta" },
  { id: 150540, title: "Inside Out" },
  { id: 359940, title: "Three Billboards Outside Ebbing, Missouri" },
  { id: 640, title: "Catch Me If You Can" },
  { id: 59440, title: "Warrior" },
  { id: 12444, title: "Harry Potter and the Deathly Hallows: Part 2" },
  { id: 2649, title: "Gran Torino" },
  { id: 70, title: "Million Dollar Baby" },
  { id: 76341, title: "Mad Max: Fury Road" },
  { id: 634649, title: "Spider-Man: No Way Home" },
  { id: 76203, title: "12 Years a Slave" },
  { id: 120467, title: "The Grand Budapest Hotel" },
  { id: 324786, title: "Hacksaw Ridge" },
  { id: 210577, title: "Gone Girl" },
  { id: 2062, title: "Ratatouille" },
  { id: 585, title: "Monsters, Inc." },
  { id: 10191, title: "How to Train Your Dragon" },
  { id: 263115, title: "Logan" },
  { id: 227306, title: "Spotlight" },
  { id: 22, title: "Pirates of the Caribbean: The Curse of the Black Pearl" },
  { id: 264644, title: "Room" },
  { id: 4800, title: "Hotel Rwanda" },
  { id: 80, title: "Before Sunset" },
  { id: 9806, title: "The Incredibles" },
  { id: 28178, title: "Hachi: A Dog's Tale" },
  { id: 96721, title: "Rush" },
  { id: 5915, title: "Into the Wild" },
  { id: 50014, title: "The Help" },
  { id: 9522, title: "Wedding Crashers" },
  { id: 289, title: "Casablanca" },
  { id: 872, title: "Singin' in the Rain" },
  { id: 496243, title: "Parasite" },
  { id: 637, title: "Life Is Beautiful" },
  { id: 603, title: "The Matrix" },
  { id: 550, title: "Fight Club" },
  { id: 769, title: "Goodfellas" },
  { id: 680, title: "Pulp Fiction" },
  { id: 278, title: "The Shawshank Redemption" },
  { id: 13, title: "Forrest Gump" },
  { id: 857, title: "Saving Private Ryan" },
  { id: 597, title: "Titanic" },
  { id: 497, title: "The Green Mile" },
  { id: 14, title: "American Beauty" },
  { id: 745, title: "The Sixth Sense" },
  { id: 807, title: "L.A. Confidential" },
  { id: 4995, title: "Boogie Nights" },
  { id: 627, title: "Trainspotting" },
  { id: 807, title: "Se7en" },
  { id: 629, title: "The Usual Suspects" },
  { id: 500, title: "Reservoir Dogs" },
  { id: 621, title: "Heat" },
  { id: 37165, title: "The Truman Show" },
  { id: 197, title: "Braveheart" },
  { id: 105, title: "Back to the Future" },
  { id: 78, title: "Blade Runner" },
  { id: 679, title: "Aliens" },
  { id: 562, title: "Die Hard" },
  { id: 9377, title: "Ferris Bueller's Day Off" },
  { id: 2108, title: "The Breakfast Club" },
  { id: 218, title: "The Terminator" },
  { id: 694, title: "The Shining" },
  { id: 85, title: "Raiders of the Lost Ark" },
  { id: 1891, title: "Star Wars: The Empire Strikes Back" },
  { id: 601, title: "E.T. the Extra-Terrestrial" },
  { id: 620, title: "Ghostbusters" },
  { id: 744, title: "Top Gun" },
  { id: 111, title: "Scarface" },
  { id: 106, title: "Predator" },
  { id: 9340, title: "The Goonies" },
  { id: 235, title: "Stand by Me" },
  { id: 600, title: "Full Metal Jacket" },
  { id: 793, title: "Blue Velvet" },
  { id: 1578, title: "Raging Bull" },
  { id: 2493, title: "The Princess Bride" }
];

// Extend movies with additional needed data
const completeMovieDatabase = movieDatabase.map(movie => ({
  ...movie,
  voteCount: Math.floor(Math.random() * 5000) + 1000,
  release_date: "2000-01-01",
  overview: `${movie.title} is a critically acclaimed film that has captivated audiences around the world.`
}));

// Popular genres list
const popularGenres = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasy" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
  { id: 9648, name: "Mystery" }
];

const OnboardingScreen = ({ isDarkMode, onComplete, onAddToSeen }) => {
  // State management
  const [step, setStep] = useState('welcome'); // welcome, genres, movies
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [moviesToRate, setMoviesToRate] = useState([]);
  const [ratedMovies, setRatedMovies] = useState([]);
  const [skippedMovies, setSkippedMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [allMoviesSkipped, setAllMoviesSkipped] = useState(false);

  // Welcome slides data
  const welcomeSlides = [
    {
      id: '1',
      title: 'Welcome to Wuvo',
      description: 'Your personal movie ranking app that learns what you like and helps you discover films you will love.',
      icon: 'film-outline'
    },
    {
      id: '2',
      title: 'Rate Movies',
      description: 'Tap on the numbers to rate movies you have seen. The more you rate, the better we understand your taste.',
      icon: 'star-outline'
    },
    {
      id: '3',
      title: 'Compare Films',
      description: 'In the Wildcard section, you will be shown pairs of movies to compare. This helps us fine-tune your preferences.',
      icon: 'git-compare-outline'
    },
    {
      id: '4',
      title: 'Discover New Films',
      description: 'The more you rate and compare, the more personalized your recommendations become.',
      icon: 'search-outline'
    }
  ];

  // Toggle genre selection
  const toggleGenre = useCallback((genreId) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreId)) {
        return prev.filter(id => id !== genreId);
      } else if (prev.length < 3) {
        return [...prev, genreId];
      }
      return prev;
    });
  }, []);

const getNextMovie = useCallback(() => {
  if (loading) return null;
  // IDs the user has already seen
  const doneIds = new Set([
    ...ratedMovies.map(m => m.id),
    ...skippedMovies
  ]);
  // next unseen
  const next = moviesToRate.find(m => !doneIds.has(m.id));
  return next || null;
}, [moviesToRate, ratedMovies, skippedMovies, loading]);



  // Updated fetchMoviesByGenres to first show only local movies matching selected genres
// and, if none match, fetch the single most popular movie via TMDb Discover API.
const fetchMoviesByGenres = useCallback(async () => {
  setLoading(true);
  setAllMoviesSkipped(false);
  try {
    const MIN_REQUIRED = 5;
    const selected = [];
    const seenIds = new Set();

    // 1) Fetch details for all hard-coded movies to get their genres
    const details = await Promise.all(
      movieDatabase.map(m =>
        fetch(
          `https://api.themoviedb.org/3/movie/${m.id}?api_key=${API_KEY}&language=en-US`
        ).then(res => res.json())
      )
    );
    const validDetails = details.filter(m => m && !m.hasOwnProperty('success'));

    // 2) Local matches based on genres
    const localMatches = validDetails.filter(movie =>
      movie.genres.some(g => selectedGenres.includes(g.id))
    );
    localMatches.forEach(m => {
      selected.push({
        id: m.id,
        title: m.title,
        poster: m.poster_path,
        score: m.vote_average,
        voteCount: m.vote_count,
        release_date: m.release_date,
        genre_Ids: m.genres.map(g => g.id),
        overview: m.overview,
        userRating: null
      });
      seenIds.add(m.id);
    });

    // 3) Fill up to MIN_REQUIRED via Discover API
    while (selected.length < MIN_REQUIRED) {
      const randGenre = selectedGenres[
        Math.floor(Math.random() * selectedGenres.length)
      ];
      const res = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}` +
        `&with_genres=${randGenre}` +
        `&primary_release_date.gte=1980-01-01` +
        `&sort_by=popularity.desc&page=1`
      );
      const data = await res.json();
      if (!data.results?.length) break;
      const top = data.results.find(m => !seenIds.has(m.id));
      if (!top) break;
      seenIds.add(top.id);
      selected.push({
        id: top.id,
        title: top.title,
        poster: top.poster_path,
        score: top.vote_average,
        voteCount: top.vote_count,
        release_date: top.release_date,
        genre_Ids: top.genre_ids,
        overview: top.overview,
        userRating: null
      });
    }

    // 4) Edge: not enough unique movies
    if (selected.length < MIN_REQUIRED) {
      Alert.alert(
        'No unique movies',
        'Could not find enough unique picks. Tap OK to continue.',
        [{ text: 'OK', onPress: handleComplete }],
        { cancelable: false }
      );
      return;
    }

    setMoviesToRate(selected);
  } catch (error) {
    Alert.alert(
      'No unique movies',
      'Could not load movies. Tap OK to continue.',
      [{ text: 'OK', onPress: handleComplete }],
      { cancelable: false }
    );
  } finally {
    setLoading(false);
  }
}, [selectedGenres, handleComplete]);



  // Initialize movie state when moving to the movie rating screen
  // Initialize movie state when moving to the movie rating screen
const goToMovieRating = useCallback(() => {
  setStep('movies');
  setAllMoviesSkipped(false);
  fetchMoviesByGenres();
}, [fetchMoviesByGenres]);


  // Handle rating a movie
  const handleRateMovie = useCallback(async (movie, rating) => {
    // Create a properly structured movie object with all necessary fields
    const ratedMovie = {
  ...movie,
  isOnboarded: true,
  poster_path: movie.poster || movie.poster_path || '',
  genre_ids: movie.genre_ids || movie.genre_Ids || movie.genreIds || [],
  userRating: rating,
  eloRating: rating * 10,           // <— Fixed this!
  comparisonHistory: [],
  comparisonWins: 0,
  gamesPlayed: 0,
  // Add these for full compatibility:
  score: rating,                    // <— Add this
  voteCount: movie.voteCount || 1000,
  release_date: movie.release_date || '2000-01-01'
};


// If movie has genreIds property but not genre_ids, copy it over
if (movie.genreIds && !movie.genre_ids) {
  ratedMovie.genre_ids = movie.genreIds;
}
// If movie has neither, set an empty array
if (!ratedMovie.genre_ids && !ratedMovie.genreIds) {
  ratedMovie.genre_ids = [];
}
    
    // Update rated movies
    // Fetch full metadata before saving
const response = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}&language=en-US`);
const fullMovie = await response.json();
const enrichedMovie = {
  ...fullMovie,
  poster_path: fullMovie.poster_path || movie.poster, // fix missing posters
  genre_ids: fullMovie.genres?.map(g => g.id) || movie.genre_ids || movie.genre_Ids || [],
  userRating: rating,
  eloRating: rating * 10,
  comparisonHistory: [],
  comparisonWins: 0,
  gamesPlayed: 0
};

// Update rated movies and persist
const updatedRatedMovies = [...ratedMovies.filter(m => m.id !== movie.id), enrichedMovie];
setRatedMovies(updatedRatedMovies);

// Add to global seen list
onAddToSeen(enrichedMovie);

    
    // Complete after 5 ratings instead of 3
    if (updatedRatedMovies.length >= 5) {
      handleComplete();
      return;
    }
    
    // Get the next movie
    const nextMovie = getNextMovie();
    if (nextMovie) {
      setCurrentMovieIndex(prev => prev + 1);
    } else if (updatedRatedMovies.length >= 3) {
      // If we've rated at least 3 movies and no more are available, complete
      handleComplete();
    } else {
      // If we need more ratings but have no more movies, show alert
      setAllMoviesSkipped(true);
    }
  }, [getNextMovie, ratedMovies, onAddToSeen, handleComplete]);

  // Handle skipping a movie
  const handleSkipMovie = useCallback((movie) => {
    // Add to skipped movies
    setSkippedMovies(prev => [...prev, movie.id]);
    
    // Get the next movie
    const nextMovie = getNextMovie();
    if (nextMovie) {
      setCurrentMovieIndex(prev => prev + 1);
    } else if (ratedMovies.length >= 3) {
      // If we've rated enough movies, we can proceed
      handleComplete();
    } else {
      // If we need more ratings but have no more movies, show alert
      setAllMoviesSkipped(true);
    }
  }, [getNextMovie, ratedMovies.length, handleComplete]);

  // Handle completing the onboarding process
  const handleComplete = useCallback(() => {
  // Mark onboarding as complete
  AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')
    .then(() => onComplete())
    .catch(error => {
      console.error('Failed to save onboarding state:', error);
      onComplete(); // Continue anyway
    });
}, [onComplete]);

  // Next slide in welcome section
  const goToNextSlide = useCallback(() => {
  if (welcomeIndex < welcomeSlides.length - 1) {
    setWelcomeIndex(welcomeIndex + 1);
  } else {
    setStep('genres');
  }
}, [welcomeIndex, welcomeSlides.length]);

  // Skip to genre selection
  const goToGenres = useCallback(() => {
    setStep('genres');
  }, []);

  // Skip onboarding entirely
  const skipOnboarding = useCallback(() => {
    // Mark onboarding as complete and proceed
    AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')
      .then(() => onComplete())
      .catch(error => {
        console.error('Failed to save onboarding state:', error);
        onComplete(); // Continue anyway
      });
  }, [onComplete]);

  // Skip all remaining movies and complete onboarding with current ratings
  const skipRemainingMovies = useCallback(() => {
  if (ratedMovies.length >= 3) {
    handleComplete();
  } else {
    // Alert the user that they need to rate at least 3 movies
    Alert.alert(
      "More Ratings Needed",
      `Please rate at least 3 movies. You've rated ${ratedMovies.length} so far.`,
      [{ text: "OK" }]
    );
  }
}, [ratedMovies.length, handleComplete]);

  // Current movie to display
const currentMovie = useMemo(() => getNextMovie(), [getNextMovie]);

  // Render welcome slide
  const renderWelcomeSlide = () => {
    const slide = welcomeSlides[welcomeIndex];
    
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
        <View style={styles.slideContent}>
          <View style={[
            styles.iconContainer, 
            { backgroundColor: isDarkMode ? '#4B0082' : '#F0F0F0' }
          ]}>
            <Ionicons
              name={slide.icon}
              size={80}
              color={isDarkMode ? '#FFD700' : '#4B0082'}
            />
          </View>
          
          <Text style={[
            styles.title, 
            { color: isDarkMode ? '#FFFFFF' : '#333333' }
          ]}>
            {slide.title}
          </Text>
          
          <Text style={[
            styles.description, 
            { color: isDarkMode ? '#D3D3D3' : '#666666' }
          ]}>
            {slide.description}
          </Text>
        </View>
        
        {/* Pagination dots */}
        <View style={styles.pagination}>
          {welcomeSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === welcomeIndex ? 
                  { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082', width: 20 } : 
                  { backgroundColor: isDarkMode ? '#444444' : '#CCCCCC', width: 10 }
              ]}
            />
          ))}
        </View>
        
        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }
            ]}
            onPress={goToNextSlide}
          >
            <Text style={[
              styles.buttonText,
              { color: isDarkMode ? '#1C2526' : '#FFFFFF' }
            ]}>
              Next
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={isDarkMode ? '#1C2526' : '#FFFFFF'}
              style={{ marginLeft: 5 }}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={goToGenres}
          >
            <Text style={[
              styles.skipButtonText,
              { color: isDarkMode ? '#D3D3D3' : '#666666' }
            ]}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Render genre selection screen
  const renderGenreSelection = () => {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
        <View style={styles.slideContent}>
          <View style={[
            styles.iconContainer, 
            { backgroundColor: isDarkMode ? '#4B0082' : '#F0F0F0' }
          ]}>
            <Ionicons
              name="film-outline"
              size={80}
              color={isDarkMode ? '#FFD700' : '#4B0082'}
            />
          </View>
          
          <Text style={[
            styles.title, 
            { color: isDarkMode ? '#FFFFFF' : '#333333' }
          ]}>
            Select Your Favorite Genres
          </Text>
          
          <Text style={[
            styles.description, 
            { color: isDarkMode ? '#D3D3D3' : '#666666' }
          ]}>
            Choose up to 3 genres you enjoy the most. This helps us show you more relevant movies.
          </Text>
          
          <Text style={[
            styles.genreCounter,
            { color: isDarkMode ? '#FFD700' : '#4B0082' }
          ]}>
            {selectedGenres.length}/3 Selected
          </Text>
          
          <View style={styles.genreGrid}>
            {popularGenres.map(genre => (
              <TouchableOpacity
                key={genre.id}
                style={[
                  styles.genreButton,
                  selectedGenres.includes(genre.id) && 
                    { backgroundColor: isDarkMode ? '#8A2BE2' : '#4B0082' },
                  { borderColor: isDarkMode ? '#8A2BE2' : '#4B0082' }
                ]}
                onPress={() => toggleGenre(genre.id)}
                disabled={selectedGenres.length >= 3 && !selectedGenres.includes(genre.id)}
              >
                <Text style={[
                  styles.genreText,
                  selectedGenres.includes(genre.id) ?
                    { color: '#FFFFFF' } :
                    { color: isDarkMode ? '#D3D3D3' : '#666666' }
                ]}>
                  {genre.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082', marginTop: 20 }
            ]}
            onPress={goToMovieRating}
          >
            <Text style={[
              styles.buttonText,
              { color: isDarkMode ? '#1C2526' : '#FFFFFF' }
            ]}>
              {selectedGenres.length > 0 ? 'Continue' : 'Skip Genre Selection'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={skipOnboarding}
          >
            <Text style={[
              styles.skipButtonText,
              { color: isDarkMode ? '#D3D3D3' : '#666666' }
            ]}>
              Skip Onboarding
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Render movie rating screen
  const renderMovieRating = () => {
    // Check if we have enough rated movies to proceed
    const ratedCount = ratedMovies.length;
    const canProceed = ratedCount >= 3;
    const requiredCount = 5;
    
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
        <View style={styles.movieRatingContent}>
          <Text style={[
            styles.title, 
            { color: isDarkMode ? '#FFFFFF' : '#333333' }
          ]}>
            Rate Movies
          </Text>
          
          <Text style={[
            styles.description, 
            { color: isDarkMode ? '#D3D3D3' : '#666666', marginBottom: 20 }
          ]}>
            Rate {requiredCount} movies to jump-start your recommendations.
            {ratedCount > 0 ? ` (${ratedCount}/${requiredCount} rated)` : ''}
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={isDarkMode ? '#FFD700' : '#4B0082'} />
              <Text style={[
                styles.loadingText, 
                { color: isDarkMode ? '#D3D3D3' : '#666666' }
              ]}>
                Loading movies based on your genres...
              </Text>
            </View>
          ) : allMoviesSkipped ? (
            <View style={styles.allSkippedContainer}>
              <Ionicons 
                name="alert-circle-outline" 
                size={64} 
                color={isDarkMode ? '#FFD700' : '#4B0082'} 
              />
              <Text style={[
                styles.allSkippedText,
                { color: isDarkMode ? '#FFFFFF' : '#333333' }
              ]}>
                You've skipped all available movies!
              </Text>
              <Text style={[
                styles.allSkippedSubtext,
                { color: isDarkMode ? '#D3D3D3' : '#666666' }
              ]}>
                {ratedCount >= 3 
                  ? "Don't worry, you've rated enough movies to continue."
                  : `Please rate at least 3 movies to continue. You've rated ${ratedCount} so far.`}
              </Text>
              
              {canProceed && (
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }
                  ]}
                  onPress={handleComplete}
                >
                  <Text style={[
                    styles.continueButtonText,
                    { color: isDarkMode ? '#1C2526' : '#FFFFFF' }
                  ]}>
                    I'm Done Rating
                  </Text>
                </TouchableOpacity>
              )}
              
              {/* Skip all remaining movies button */}
              {ratedCount > 0 && (
                <TouchableOpacity
                  style={[
                    styles.skipAllButton,
                    { borderColor: isDarkMode ? '#8A2BE2' : '#4B0082' }
                  ]}
                  onPress={skipRemainingMovies}
                >
                  <Text style={[
                    styles.skipAllButtonText,
                    { color: isDarkMode ? '#D3D3D3' : '#666666' }
                  ]}>
                    {canProceed ? "Skip to App" : "I Don't Know Any More Movies"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
         ) : currentMovie ? (
  <View style={styles.singleMovieContainer}>
    <View 
      style={[
        styles.movieCard,
        { backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5' }
      ]}
    >
      <Image 
        source={{ uri: `https://image.tmdb.org/t/p/w342${currentMovie.poster}` }}
        style={styles.singleMoviePoster}
        resizeMode="cover"
      />
      
      <View style={styles.movieDetails}>
  <Text 
    style={[
      styles.movieTitle,
      { color: isDarkMode ? '#FFFFFF' : '#333333' }
    ]}
    numberOfLines={2}
    ellipsizeMode="tail"
  >
    {currentMovie.title}
  </Text>
  
  <Text 
    style={[
      styles.movieScore,
      { color: isDarkMode ? '#FFD700' : '#4B0082' }
    ]}
  >
    TMDb: {currentMovie.score.toFixed(1)}
  </Text>
  
  {/* "Haven't seen it" button moved above the rating buttons */}
  <TouchableOpacity
    style={[
      styles.skipMovieButton,
      { 
        marginBottom: 12,
        marginTop: 4,
        backgroundColor: isDarkMode ? 'rgba(75, 0, 130, 0.2)' : 'rgba(240, 240, 240, 0.8)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: isDarkMode ? '#8A2BE2' : '#E0E0E0'
      }
    ]}
    onPress={() => handleSkipMovie(currentMovie)}
  >
    <Text style={[
      styles.skipMovieText,
      { 
        color: isDarkMode ? '#D3D3D3' : '#666666',
        fontWeight: '500'
      }
    ]}>
      Haven't seen it
    </Text>
  </TouchableOpacity>
  
  <View style={styles.ratingButtons}>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
      <TouchableOpacity
        key={rating}
        style={[
          styles.ratingButton,
          { backgroundColor: isDarkMode ? '#4B0082' : '#F0F0F0' }
        ]}
        onPress={() => handleRateMovie(currentMovie, rating)}
      >
        <Text style={[
          styles.ratingText,
          { color: isDarkMode ? '#FFFFFF' : '#4B0082' }
        ]}>
          {rating}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>
    </View>
    
    {/* Progress indicator */}
    <View style={styles.progressContainer}>
      <Text style={[
        styles.progressText,
        { color: isDarkMode ? '#D3D3D3' : '#666666' }
      ]}>
        Movies Rated: {ratedCount}/{requiredCount}
      </Text>
      <View style={[
        styles.progressBar,
        { backgroundColor: isDarkMode ? '#333333' : '#E0E0E0' }
      ]}>
        <View 
          style={[
            styles.progressFill,
            { 
              backgroundColor: isDarkMode ? '#FFD700' : '#4B0082',
              width: `${Math.min(100, (ratedCount / requiredCount) * 100)}%`
            }
          ]} 
        />
      </View>
    </View>
    
    {canProceed && (
      <TouchableOpacity
        style={[
          styles.completeButton,
          { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }
        ]}
        onPress={handleComplete}
      >
        <Text style={[
          styles.completeButtonText,
          { color: isDarkMode ? '#1C2526' : '#FFFFFF' }
        ]}>
          I'm Done Rating
        </Text>
      </TouchableOpacity>
    )}
    
    {/* Skip all remaining movies button */}
    {ratedCount > 0 && (
      <TouchableOpacity
        style={[
          styles.skipAllButton,
          { borderColor: isDarkMode ? '#8A2BE2' : '#4B0082' }
        ]}
        onPress={skipRemainingMovies}
      >
        <Text style={[
          styles.skipAllButtonText,
          { color: isDarkMode ? '#D3D3D3' : '#666666' }
        ]}>
          {canProceed ? "Skip to App" : "I Don't Know Any More Movies"}
        </Text>
      </TouchableOpacity>
    )}
  </View>
) : (
  <View style={styles.noMoviesContainer}>
    <Ionicons 
      name="film-outline" 
      size={64} 
      color={isDarkMode ? '#FFD700' : '#4B0082'} 
    />
    <Text style={[
      styles.noMoviesText,
      { color: isDarkMode ? '#FFFFFF' : '#333333' }
    ]}>
      No more movies to rate
    </Text>
    <TouchableOpacity
      style={[
        styles.tryAgainButton,
        { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }
      ]}
      onPress={goToMovieRating}
    >
      <Text style={[
        styles.tryAgainButtonText,
        { color: isDarkMode ? '#1C2526' : '#FFFFFF' }
      ]}>
        Try Different Genres
      </Text>
    </TouchableOpacity>
    
    {canProceed && (
      <TouchableOpacity
        style={[
          styles.completeButton,
          { backgroundColor: isDarkMode ? '#8A2BE2' : '#4B0082', marginTop: 10 }
        ]}
        onPress={handleComplete}
      >
        <Text style={[
          styles.completeButtonText,
          { color: '#FFFFFF' }
        ]}>
          Continue to App
        </Text>
      </TouchableOpacity>
    )}
  </View>
          )}
        </View>
      </SafeAreaView>
    );
  };

  // Render the appropriate screen based on current step
  switch (step) {
    case 'welcome':
      return renderWelcomeSlide();
    case 'genres':
      return renderGenreSelection();
    case 'movies':
      return renderMovieRating();
    default:
      return renderWelcomeSlide();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  movieRatingContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  paginationDot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
    minWidth: 200,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    padding: 10,
  },
  skipButtonText: {
    fontSize: 16,
  },
  // Genre selection styles
  genreCounter: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  genreButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 6,
  },
  genreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Movie rating styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  singleMovieContainer: {
    flex: 1,
    alignItems: 'center',
  },
  movieCard: {
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  singleMoviePoster: {
    width: 200,
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  movieDetails: {
    width: '100%',
    alignItems: 'center',
  },
  movieTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    maxWidth: '100%',
    height: 60, // Fixed height for title to prevent layout shifts
    textAlignVertical: 'center',
  },
  movieScore: {
    fontSize: 18,
    marginBottom: 20,
  },
  skipMovieButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipMovieText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
ratingButtons: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',  // Changed from 'space-around' for better distribution
  marginTop: 10,
  paddingHorizontal: 10,            // Add padding to prevent touching edges
  width: '100%',                    // Ensure full width
},
ratingButton: {
  width: '18%',                     // Keep 5 buttons per row
  minWidth: 45,                     // Minimum width for smaller screens
  aspectRatio: 1,                   // Keeps square shape
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 999,                // Full circle
  marginVertical: 10,               // Increased from 8 for more spacing
},
ratingText: {
  fontSize: 18,                     // Increased from 14 for better visibility
  fontWeight: '700',                // Increased from '600' for bolder text
},
  progressContainer: {
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  noMoviesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMoviesText: {
    fontSize: 20,
    marginVertical: 16,
    textAlign: 'center',
  },
  tryAgainButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginTop: 20,
  },
  tryAgainButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  allSkippedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  allSkippedText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  allSkippedSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  continueButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginTop: 10,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipAllButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 12,
  },
  skipAllButtonText: {
    fontSize: 14,
  }
});

export default OnboardingScreen;