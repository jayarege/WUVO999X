// src/utils/DevConfig.js
// Development configuration to skip auth and onboarding with pre-selected movies

const DEV_CONFIG = {
  // Set to true to skip auth and onboarding during development
  ENABLE_DEV_MODE: true,
  
  // Pre-selected movies that will be automatically added to seen list
  DEV_MOVIES: [
    {
      id: 238,
      title: "The Godfather",
      userRating: 9.5,
      eloRating: 950,
      score: 9.2,
      voteCount: 1800000,
      poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      poster: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      release_date: "1972-03-14",
      release_year: 1972,
      genre_ids: [80, 18], // Crime, Drama
      overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family. When organized crime family patriarch, Vito Corleone barely survives an attempt on his life, his youngest son, Michael steps in to take care of the would-be killers, launching a campaign of bloody revenge.",
      comparisonHistory: [],
      comparisonWins: 8,
      gamesPlayed: 10,
      adult: false,
      isOnboarded: true
    },
    {
      id: 155,
      title: "The Dark Knight",
      userRating: 9.2,
      eloRating: 920,
      score: 9.0,
      voteCount: 2500000,
      poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      poster: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      release_date: "2008-07-18",
      release_year: 2008,
      genre_ids: [28, 80, 18, 53], // Action, Crime, Drama, Thriller
      overview: "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.",
      comparisonHistory: [],
      comparisonWins: 5,
      gamesPlayed: 8,
      adult: false,
      isOnboarded: true
    },
    {
      id: 313369,
      title: "La La Land",
      userRating: 7.8,
      eloRating: 780,
      score: 8.0,
      voteCount: 780000,
      poster_path: "/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
      poster: "/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
      release_date: "2016-11-29",
      release_year: 2016,
      genre_ids: [35, 18, 10402, 10749], // Comedy, Drama, Music, Romance
      overview: "Mia, an aspiring actress, serves lattes to movie stars in between auditions and Sebastian, a jazz musician, scrapes by playing cocktail party gigs in dingy bars.",
      comparisonHistory: [],
      comparisonWins: 1,
      gamesPlayed: 3,
      adult: false,
      isOnboarded: true
    }
  ],

  // Pre-selected TV shows that will be automatically added to seen list
  DEV_TV_SHOWS: [
    {
      id: 1398,
      title: "The Sopranos",
      name: "The Sopranos",
      userRating: 9.4,
      eloRating: 940,
      score: 9.2,
      voteCount: 180000,
      poster_path: "/rTc7ZXdroqjkKivFPvCPX0Ru7uw.jpg",
      poster: "/rTc7ZXdroqjkKivFPvCPX0Ru7uw.jpg",
      first_air_date: "1999-01-10",
      release_year: 1999,
      genre_ids: [80, 18], // Crime, Drama
      overview: "The story of New Jersey-based Italian-American mobster Tony Soprano and the difficulties he faces as he tries to balance the conflicting requirements of his home life and the criminal organization he heads.",
      comparisonHistory: [],
      comparisonWins: 8,
      gamesPlayed: 10,
      adult: false,
      isOnboarded: true
    },
    {
      id: 1396,
      title: "Breaking Bad",
      name: "Breaking Bad",
      userRating: 9.6,
      eloRating: 960,
      score: 9.5,
      voteCount: 220000,
      poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      poster: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      first_air_date: "2008-01-20",
      release_year: 2008,
      genre_ids: [80, 18, 53], // Crime, Drama, Thriller
      overview: "When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live, he becomes filled with a sense of fearlessness and an unrelenting desire to secure his family's financial future at any cost.",
      comparisonHistory: [],
      comparisonWins: 12,
      gamesPlayed: 15,
      adult: false,
      isOnboarded: true
    },
    {
      id: 87108,
      title: "Chernobyl",
      name: "Chernobyl",
      userRating: 9.3,
      eloRating: 930,
      score: 9.4,
      voteCount: 95000,
      poster_path: "/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg",
      poster: "/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg",
      first_air_date: "2019-05-06",
      release_year: 2019,
      genre_ids: [18, 36, 10764], // Drama, History, War & Politics
      overview: "The true story of one of the worst man-made catastrophes in history: the catastrophic nuclear accident at Chernobyl. A tale of the brave men and women who sacrificed to save Europe from unimaginable disaster.",
      comparisonHistory: [],
      comparisonWins: 6,
      gamesPlayed: 7,
      adult: false,
      isOnboarded: true
    }
  ],
  
  // Mock user data for development
  DEV_USER: {
    id: 'dev_user_123',
    name: 'Dev User',
    email: 'dev@wuvo.app',
    provider: 'dev'
  }
};

// Helper functions
export const isDevModeEnabled = () => {
  return DEV_CONFIG.ENABLE_DEV_MODE;
};

export const getDevMovies = () => {
  return DEV_CONFIG.DEV_MOVIES;
};

export const getDevTVShows = () => {
  return DEV_CONFIG.DEV_TV_SHOWS;
};

export const getDevUser = () => {
  return DEV_CONFIG.DEV_USER;
};

export default DEV_CONFIG;