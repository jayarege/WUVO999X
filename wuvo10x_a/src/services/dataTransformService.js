export const dataTransformService = {
  normalizeMovieData(movie) {
    return {
      id: movie.id,
      title: movie.title || movie.name,
      overview: movie.overview || '',
      poster_path: movie.poster_path || null,
      backdrop_path: movie.backdrop_path || null,
      release_date: movie.release_date || movie.first_air_date || '',
      vote_average: movie.vote_average || 0,
      vote_count: movie.vote_count || 0,
      genre_ids: movie.genre_ids || [],
      adult: movie.adult || false,
      userRating: movie.userRating || null,
      eloRating: movie.eloRating || null,
      type: movie.title ? 'movie' : 'tv'
    };
  },

  normalizeTVShowData(show) {
    return {
      id: show.id,
      name: show.name || show.title,
      overview: show.overview || '',
      poster_path: show.poster_path || null,
      backdrop_path: show.backdrop_path || null,
      first_air_date: show.first_air_date || show.release_date || '',
      vote_average: show.vote_average || 0,
      vote_count: show.vote_count || 0,
      genre_ids: show.genre_ids || [],
      adult: show.adult || false,
      userRating: show.userRating || null,
      eloRating: show.eloRating || null,
      type: 'tv'
    };
  },

  createUserSession(userData) {
    return {
      id: userData.id || 'user_' + Date.now(),
      name: userData.name || 'User',
      email: userData.email || '',
      timestamp: new Date().toISOString(),
      preferences: userData.preferences || {}
    };
  },

  formatPreferences(isDarkMode, onboardingComplete) {
    return {
      isDarkMode: isDarkMode || false,
      onboardingComplete: onboardingComplete || false,
      lastUpdated: new Date().toISOString()
    };
  },

  mergeContentLists(list1, list2) {
    const merged = [...list1];
    list2.forEach(item => {
      const existingIndex = merged.findIndex(existing => existing.id === item.id);
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...item };
      } else {
        merged.push(item);
      }
    });
    return merged;
  },

  calculateRatingPercentile(userRating, allRatings) {
    if (!allRatings.length) return 0;
    const sortedRatings = allRatings.sort((a, b) => a - b);
    const index = sortedRatings.findIndex(rating => rating >= userRating);
    return index === -1 ? 100 : (index / sortedRatings.length) * 100;
  }
};