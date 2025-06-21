// API Configuration
export const TMDB_API_KEY = 'b401be0ea16515055d8d0bde16f80069';
export const GROQ_API_KEY = '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';
export const API_KEY = 'b401be0ea16515055d8d0bde16f80069'; // Keep for backward compatibility
export const API_TIMEOUT = 10000;
export const MIN_VOTE_COUNT = 500;
export const MIN_SCORE = 7.0;

// Storage Keys
export const USER_SESSION_KEY = 'wuvo_user_session';
export const USER_DATA_KEY = 'wuvo_user_data';
export const USER_SEEN_MOVIES_KEY = 'wuvo_user_seen_movies';
export const USER_UNSEEN_MOVIES_KEY = 'wuvo_user_unseen_movies';
export const USER_PREFERENCES_KEY = 'wuvo_user_preferences';
export const ONBOARDING_COMPLETE_KEY = 'wuvo_onboarding_complete';

// Wildcard Storage Keys
export const STORAGE_KEY_MOVIES = 'wuvo_compared_movies';
export const STORAGE_KEY_TV = 'wuvo_compared_tv';
export const BASELINE_COMPLETE_KEY_MOVIES = 'wuvo_baseline_complete_movies';
export const BASELINE_COMPLETE_KEY_TV = 'wuvo_baseline_complete_tv';
export const COMPARISON_COUNT_KEY_MOVIES = 'wuvo_comparison_count_movies';
export const COMPARISON_COUNT_KEY_TV = 'wuvo_comparison_count_tv';
export const COMPARISON_PATTERN_KEY_MOVIES = 'wuvo_comparison_pattern_movies';
export const COMPARISON_PATTERN_KEY_TV = 'wuvo_comparison_pattern_tv';
export const STREAMING_CACHE_KEY = 'wuvo_streaming_cache';
export const RATE_LIMIT_KEY = 'groq_api_rate_limit';
export const WUVO_STATE_KEY_MOVIES = 'wuvo_wuvo_state_movies';
export const WUVO_STATE_KEY_TV = 'wuvo_wuvo_state_tv';

// Initial genres mapping
export const INITIAL_GENRES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

// Streaming services
export const STREAMING_SERVICES = [
  { id: 8, name: 'Netflix' },
  { id: 350, name: 'Apple TV+' },
  { id: 15, name: 'Hulu' },
  { id: 384, name: 'HBO Max' },
  { id: 337, name: 'Disney+' },
  { id: 387, name: 'Peacock' },
  { id: 9, name: 'Prime Video' }
];

// Decades for filtering
export const DECADES = [
  { value: '1960s', label: 'Pre-70s', startYear: 1900, endYear: 1969 },
  { value: '1970s', label: '1970s', startYear: 1970, endYear: 1979 },
  { value: '1980s', label: '1980s', startYear: 1980, endYear: 1989 },
  { value: '1990s', label: '1990s', startYear: 1990, endYear: 1999 },
  { value: '2000s', label: '2000s', startYear: 2000, endYear: 2009 },
  { value: '2010s', label: '2010s', startYear: 2010, endYear: 2019 },
  { value: '2020s', label: '2020s', startYear: 2020, endYear: 2029 }
];