export const validationUtils = {
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidRating(rating) {
    return typeof rating === 'number' && rating >= 0 && rating <= 10;
  },

  isValidMovieData(movie) {
    return (
      movie &&
      typeof movie === 'object' &&
      movie.id &&
      (movie.title || movie.name)
    );
  },

  isValidUserData(userData) {
    return (
      userData &&
      typeof userData === 'object' &&
      (userData.name || userData.email)
    );
  },

  sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
  },

  isAdultContent(item) {
    return item && item.adult === true;
  },

  hasRequiredFields(obj, requiredFields) {
    return requiredFields.every(field => 
      obj && obj.hasOwnProperty(field) && obj[field] !== null && obj[field] !== undefined
    );
  }
};