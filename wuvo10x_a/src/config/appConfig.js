export const APP_CONFIG = {
  NAME: 'WUVO',
  VERSION: '1.0.0',
  THEME: {
    DEFAULT_DARK_MODE: true,
    ANIMATION_DURATION: 300
  },
  RATING: {
    MIN: 0,
    MAX: 10,
    STEP: 0.1,
    DEFAULT: 5.0
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 50
  }
};

export const INITIAL_GENRES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

export const STREAMING_SERVICES = [
  { id: 8, name: 'Netflix' },
  { id: 350, name: 'Apple TV+' },
  { id: 15, name: 'Hulu' },
  { id: 384, name: 'HBO Max' },
  { id: 337, name: 'Disney+' },
  { id: 387, name: 'Peacock' },
  { id: 9, name: 'Prime Video' }
];

export const DECADES = [
  { value: '1960s', label: 'Pre-70s', startYear: 1900, endYear: 1969 },
  { value: '1970s', label: '1970s', startYear: 1970, endYear: 1979 },
  { value: '1980s', label: '1980s', startYear: 1980, endYear: 1989 },
  { value: '1990s', label: '1990s', startYear: 1990, endYear: 1999 },
  { value: '2000s', label: '2000s', startYear: 2000, endYear: 2009 },
  { value: '2010s', label: '2010s', startYear: 2010, endYear: 2019 },
  { value: '2020s', label: '2020s', startYear: 2020, endYear: 2029 }
];

export const CONTENT_TYPES = {
  MOVIE: 'movie',
  TV_SHOW: 'tv'
};

export const USER_ACTIONS = {
  ADD_TO_SEEN: 'ADD_TO_SEEN',
  ADD_TO_WATCHLIST: 'ADD_TO_WATCHLIST',
  REMOVE_FROM_WATCHLIST: 'REMOVE_FROM_WATCHLIST',
  UPDATE_RATING: 'UPDATE_RATING',
  MARK_AS_WATCHED: 'MARK_AS_WATCHED'
};