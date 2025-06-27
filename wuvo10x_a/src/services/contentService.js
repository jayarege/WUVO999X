import { Alert } from 'react-native';

export const contentService = {
  filterAdultContent(content) {
    if (!Array.isArray(content)) return [];
    return content.filter(item => item.adult !== true);
  },

  validateContent(item) {
    if (!item) return false;
    if (item.adult === true) {
      console.log(`🚫 REJECTED: ${item.title || item.name} - Adult content`);
      Alert.alert('Content Filtered', 'Adult content is not allowed.');
      return false;
    }
    return true;
  },

  isMovie(item) {
    return item.title && !item.name && !item.first_air_date;
  },

  isTVShow(item) {
    return !this.isMovie(item);
  },

  getContentTitle(item) {
    return item.title || item.name || 'Unknown Title';
  },

  updateContentRating(content, itemId, newRating) {
    return content.map(item => 
      item.id === itemId 
        ? { ...item, userRating: newRating, eloRating: newRating * 10 }
        : item
    );
  },

  addContentToList(list, newItem) {
    const filteredList = list.filter(item => item.id !== newItem.id);
    return [...filteredList, newItem];
  },

  removeContentFromList(list, itemId) {
    return list.filter(item => item.id !== itemId);
  },

  findContentById(list, itemId) {
    return list.find(item => item.id === itemId);
  },

  sortContentByRating(content, ascending = false) {
    return [...content].sort((a, b) => {
      const ratingA = a.userRating || a.eloRating || 0;
      const ratingB = b.userRating || b.eloRating || 0;
      return ascending ? ratingA - ratingB : ratingB - ratingA;
    });
  },

  getTopRatedContent(content, limit = 10) {
    return this.sortContentByRating(content).slice(0, limit);
  }
};