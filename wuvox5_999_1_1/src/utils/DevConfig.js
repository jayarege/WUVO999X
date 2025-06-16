// src/utils/DevConfig.js
// Development configuration to skip auth and onboarding with pre-selected movies

const DEV_CONFIG = {
  // Set to true to skip auth and onboarding during development
  ENABLE_DEV_MODE: true,
  
  // Pre-selected movies that will be automatically added to seen list
  DEV_MOVIES: [
    {
      id: 426426,
      title: "Sicario",
      userRating: 8.5,
      eloRating: 850,
      score: 7.6,
      voteCount: 850000,
      poster_path: "/lIv1QinFqz4dlp5U4lQ6HaiskOZ.jpg",
      poster: "/lIv1QinFqz4dlp5U4lQ6HaiskOZ.jpg",
      release_date: "2015-09-17",
      release_year: 2015,
      genre_ids: [28, 80, 18, 53], // Action, Crime, Drama, Thriller
      overview: "An idealistic FBI agent is enlisted by a government task force to aid in the escalating war against drugs at the border area between the U.S. and Mexico.",
      comparisonHistory: [],
      comparisonWins: 2,
      gamesPlayed: 5,
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

export const getDevUser = () => {
  return DEV_CONFIG.DEV_USER;
};

export default DEV_CONFIG;