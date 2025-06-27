export const arrayUtils = {
  removeDuplicatesById(array) {
    if (!Array.isArray(array)) return [];
    const seen = new Set();
    return array.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  },

  shuffleArray(array) {
    if (!Array.isArray(array)) return [];
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  getRandomItems(array, count) {
    if (!Array.isArray(array) || count <= 0) return [];
    const shuffled = this.shuffleArray(array);
    return shuffled.slice(0, Math.min(count, array.length));
  },

  sortByProperty(array, property, ascending = true) {
    if (!Array.isArray(array)) return [];
    return [...array].sort((a, b) => {
      const valueA = a[property];
      const valueB = b[property];
      
      if (valueA === valueB) return 0;
      if (valueA === null || valueA === undefined) return 1;
      if (valueB === null || valueB === undefined) return -1;
      
      if (ascending) {
        return valueA < valueB ? -1 : 1;
      } else {
        return valueA > valueB ? -1 : 1;
      }
    });
  },

  groupBy(array, keyFn) {
    if (!Array.isArray(array)) return {};
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  },

  chunkArray(array, size) {
    if (!Array.isArray(array) || size <= 0) return [];
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  findByProperty(array, property, value) {
    if (!Array.isArray(array)) return null;
    return array.find(item => item[property] === value) || null;
  },

  filterByProperties(array, filters) {
    if (!Array.isArray(array) || !filters) return array;
    return array.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (Array.isArray(value)) {
          return value.includes(item[key]);
        }
        return item[key] === value;
      });
    });
  }
};