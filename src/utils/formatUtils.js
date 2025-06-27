export const formatUtils = {
  formatRating(rating) {
    if (typeof rating !== 'number') return '0.0';
    return rating.toFixed(1);
  },

  formatPercentage(value) {
    if (typeof value !== 'number') return '0%';
    return `${Math.round(value)}%`;
  },

  formatTitle(title) {
    if (!title) return 'Unknown Title';
    return title.length > 50 ? `${title.substring(0, 47)}...` : title;
  },

  formatOverview(overview, maxLength = 150) {
    if (!overview) return 'No description available.';
    return overview.length > maxLength 
      ? `${overview.substring(0, maxLength)}...` 
      : overview;
  },

  formatGenres(genreIds, genreMap) {
    if (!genreIds || !Array.isArray(genreIds) || !genreMap) return '';
    return genreIds
      .map(id => genreMap[id])
      .filter(Boolean)
      .join(', ');
  },

  formatDuration(minutes) {
    if (typeof minutes !== 'number' || minutes <= 0) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  },

  formatVoteCount(voteCount) {
    if (typeof voteCount !== 'number') return '0';
    if (voteCount >= 1000000) {
      return `${(voteCount / 1000000).toFixed(1)}M`;
    }
    if (voteCount >= 1000) {
      return `${(voteCount / 1000).toFixed(1)}K`;
    }
    return voteCount.toString();
  },

  formatImageUrl(path, size = 'w500') {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
};