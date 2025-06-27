export const dateUtils = {
  formatReleaseDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.getFullYear().toString();
    } catch (error) {
      return 'Unknown';
    }
  },

  formatFullDate(dateString) {
    if (!dateString) return 'Unknown Date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown Date';
    }
  },

  getRelativeTime(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      
      return this.formatFullDate(dateString);
    } catch (error) {
      return 'Unknown';
    }
  },

  isRecentRelease(dateString, monthsThreshold = 6) {
    if (!dateString) return false;
    
    try {
      const releaseDate = new Date(dateString);
      const now = new Date();
      const monthsAgo = new Date();
      monthsAgo.setMonth(now.getMonth() - monthsThreshold);
      
      return releaseDate >= monthsAgo;
    } catch (error) {
      return false;
    }
  },

  sortByDate(items, dateField = 'release_date', ascending = false) {
    return [...items].sort((a, b) => {
      const dateA = new Date(a[dateField] || 0);
      const dateB = new Date(b[dateField] || 0);
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }
};