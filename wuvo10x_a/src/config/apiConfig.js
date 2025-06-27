export const API_CONFIG = {
  TMDB_API_KEY: 'b401be0ea16515055d8d0bde16f80069',
  GROQ_API_KEY: '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',
  TIMEOUT: 10000,
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  MIN_VOTE_COUNT: 500,
  MIN_SCORE: 7.0
};

export const IMAGE_SIZES = {
  POSTER: {
    SMALL: 'w185',
    MEDIUM: 'w342',
    LARGE: 'w500',
    XLARGE: 'w780',
    ORIGINAL: 'original'
  },
  BACKDROP: {
    SMALL: 'w300',
    MEDIUM: 'w780',
    LARGE: 'w1280',
    ORIGINAL: 'original'
  }
};

export const ENDPOINTS = {
  MOVIE: {
    POPULAR: '/movie/popular',
    TOP_RATED: '/movie/top_rated',
    NOW_PLAYING: '/movie/now_playing',
    UPCOMING: '/movie/upcoming',
    DETAILS: '/movie',
    SEARCH: '/search/movie',
    GENRES: '/genre/movie/list'
  },
  TV: {
    POPULAR: '/tv/popular',
    TOP_RATED: '/tv/top_rated',
    ON_AIR: '/tv/on_the_air',
    AIRING_TODAY: '/tv/airing_today',
    DETAILS: '/tv',
    SEARCH: '/search/tv',
    GENRES: '/genre/tv/list'
  }
};