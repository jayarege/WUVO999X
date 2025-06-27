import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { STORAGE_KEYS } from '../config';
import { INITIAL_GENRES } from '../config';
import { isDevModeEnabled, getDevMovies, getDevTVShows } from '../utils/DevConfig';
import { storageService } from '../services/storageService';

export const useMovieData = (isAuthenticated, appReady) => {
  const [seen, setSeen] = useState([]);
  const [unseen, setUnseen] = useState([]);
  const [seenTVShows, setSeenTVShows] = useState([]);
  const [unseenTVShows, setUnseenTVShows] = useState([]);
  const [genres, setGenres] = useState(INITIAL_GENRES);
  const [dataLoaded, setDataLoaded] = useState(false);

  const filterAdultContent = useCallback((content) => {
    return content.filter(item => item.adult !== true);
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      if (isDevModeEnabled()) {
        console.log('🔧 DEV MODE: Loading pre-configured content');
        const devMovies = getDevMovies();
        const devTVShows = getDevTVShows();
        setSeen(devMovies);
        setSeenTVShows(devTVShows);
        setUnseen([]);
        setUnseenTVShows([]);
        setDataLoaded(true);
        console.log('🔧 DEV MODE: Loaded movies:', devMovies.map(m => m.title));
        console.log('🔧 DEV MODE: Loaded TV shows:', devTVShows.map(m => m.title));
        return;
      }

      const [savedSeen, savedUnseen, savedSeenTV, savedUnseenTV] = await Promise.all([
        storageService.getItem(STORAGE_KEYS.MOVIES.SEEN),
        storageService.getItem(STORAGE_KEYS.MOVIES.UNSEEN),
        storageService.getItem(STORAGE_KEYS.TV_SHOWS.SEEN),
        storageService.getItem(STORAGE_KEYS.TV_SHOWS.UNSEEN)
      ]);

      if (savedSeen) {
        setSeen(filterAdultContent(savedSeen));
      }
      if (savedUnseen) {
        setUnseen(filterAdultContent(savedUnseen));
      }
      if (savedSeenTV) {
        setSeenTVShows(filterAdultContent(savedSeenTV));
      }
      if (savedUnseenTV) {
        setUnseenTVShows(filterAdultContent(savedUnseenTV));
      }
    } catch (e) {
      console.error('Failed to load user data:', e);
    } finally {
      setDataLoaded(true);
    }
  }, [filterAdultContent]);

  const saveUserData = useCallback(async () => {
    if (isDevModeEnabled()) return;
    
    try {
      await Promise.all([
        storageService.setItem(STORAGE_KEYS.MOVIES.SEEN, seen),
        storageService.setItem(STORAGE_KEYS.MOVIES.UNSEEN, unseen),
        storageService.setItem(STORAGE_KEYS.TV_SHOWS.SEEN, seenTVShows),
        storageService.setItem(STORAGE_KEYS.TV_SHOWS.UNSEEN, unseenTVShows)
      ]);
    } catch (e) {
      console.error('Failed to save user data:', e);
    }
  }, [seen, unseen, seenTVShows, unseenTVShows]);

  const handleUpdateRating = useCallback((itemId, newRating) => {
    console.log(`🏪 CENTRAL STORE: Updating item ${itemId} to rating ${newRating}`);
    
    const movieExists = seen.some(movie => movie.id === itemId);
    if (movieExists) {
      setSeen(prev => 
        prev.map(movie => 
          movie.id === itemId 
            ? { ...movie, userRating: newRating, eloRating: newRating * 10 }
            : movie
        )
      );
      return;
    }
    
    const tvExists = seenTVShows.some(show => show.id === itemId);
    if (tvExists) {
      setSeenTVShows(prev => 
        prev.map(show => 
          show.id === itemId 
            ? { ...show, userRating: newRating, eloRating: newRating * 10 }
            : show
        )
      );
    }
  }, [seen, seenTVShows]);

  const handleAddToSeen = useCallback((item) => {
    if (item.adult === true) {
      console.log(`🚫 REJECTED: ${item.title || item.name} - Adult content`);
      Alert.alert('Content Filtered', 'Adult content is not allowed.');
      return;
    }
    
    const title = item.title || item.name;
    const isMovie = item.title && !item.name && !item.first_air_date;
    
    if (isMovie) {
      console.log(`🏪 CENTRAL STORE: Adding/updating movie ${title}`);
      setSeen(prev => [...prev.filter(m => m.id !== item.id), item]);
      setUnseen(prev => prev.filter(m => m.id !== item.id));
    } else {
      console.log(`🏪 CENTRAL STORE: Adding/updating TV show ${title}`);
      setSeenTVShows(prev => [...prev.filter(m => m.id !== item.id), item]);
      setUnseenTVShows(prev => prev.filter(m => m.id !== item.id));
    }
  }, []);

  const handleAddToUnseen = useCallback((item) => {
    if (item.adult === true) {
      console.log(`🚫 REJECTED: ${item.title || item.name} - Adult content`);
      Alert.alert('Content Filtered', 'Adult content is not allowed.');
      return;
    }
    
    const title = item.title || item.name;
    const isMovie = item.title && !item.name && !item.first_air_date;
    
    if (isMovie) {
      console.log(`🏪 CENTRAL STORE: Adding movie ${title} to watchlist`);
      setUnseen(prev => [...prev.filter(m => m.id !== item.id), item]);
    } else {
      console.log(`🏪 CENTRAL STORE: Adding TV show ${title} to watchlist`);
      setUnseenTVShows(prev => [...prev.filter(m => m.id !== item.id), item]);
    }
  }, []);

  const handleRemoveFromWatchlist = useCallback((itemId) => {
    console.log(`🏪 CENTRAL STORE: Removing item ${itemId} from watchlist`);
    setUnseen(prev => prev.filter(movie => movie.id !== itemId));
    setUnseenTVShows(prev => prev.filter(show => show.id !== itemId));
  }, []);

  const resetAllData = useCallback(() => {
    setSeen([]);
    setUnseen([]);
    setSeenTVShows([]);
    setUnseenTVShows([]);
    setDataLoaded(false);
  }, []);

  useEffect(() => {
    if (appReady && isAuthenticated && !dataLoaded) {
      loadUserData();
    }
  }, [appReady, isAuthenticated, dataLoaded, loadUserData]);

  return {
    seen,
    unseen,
    seenTVShows,
    unseenTVShows,
    genres,
    dataLoaded,
    loadUserData,
    saveUserData,
    handleUpdateRating,
    handleAddToSeen,
    handleAddToUnseen,
    handleRemoveFromWatchlist,
    resetAllData,
    setSeen,
    setUnseen,
    setSeenTVShows,
    setUnseenTVShows
  };
};