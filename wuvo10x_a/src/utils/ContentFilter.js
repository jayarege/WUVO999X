/**
 * Central Content Filter Utility
 * This utility provides comprehensive adult content filtering for the entire app
 */

// Comprehensive list of adult keywords and phrases
const ADULT_KEYWORDS = [
  'xxx', 'porn', 'pornographic', 'erotic', 'adult', 'sexy', 'nude', 'naked',
  'sexual', 'seduction', 'strip', 'stripper', 'lingerie', 'intimate',
  'sensual', 'fetish', 'bdsm', 'kink', 'kinky', 'sex', 'hardcore',
  'softcore', 'playboy', 'penthouse', 'hustler', 'escort', 'prostitute',
  'brothel', 'massage parlor', 'adult entertainment', 'red light',
  'mature content', 'explicit', 'uncensored', 'nsfw', 'adults only',
  'over 18', '18+', 'restricted', 'x-rated', 'r-rated content'
];

// Adult genre IDs that should be filtered out
const ADULT_GENRE_IDS = [
  // Note: TMDB doesn't have explicit adult genre IDs, but we check for combinations
];

// Problematic production companies known for adult content
const ADULT_PRODUCTION_COMPANIES = [
  'vivid', 'digital playground', 'brazzers', 'evil angel', 'wicked pictures',
  'new sensations', 'zero tolerance', 'devils film', 'elegant angel'
];

// Countries with less strict content ratings that might have adult content
const HIGH_RISK_COUNTRIES = [
  'JP', // Japan - some anime/content can be adult
  'DE', // Germany - liberal content policies
  'FR', // France - liberal content policies
  'NL', // Netherlands - liberal content policies
];

/**
 * Main content filter function
 * @param {Array} contentArray - Array of movies/TV shows to filter
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Array} Filtered content array with adult content removed
 */
export const filterAdultContent = (contentArray, mediaType = 'movie') => {
  if (!contentArray || !Array.isArray(contentArray)) {
    console.warn('filterAdultContent: Invalid input provided');
    return [];
  }

  return contentArray.filter(item => {
    try {
      // Primary filter: Check the adult flag
      if (item.adult === true) {
        console.log(`🚫 FILTERED (adult flag): ${item.title || item.name}`);
        return false;
      }

      // Get title and overview for text analysis
      const title = (item.title || item.name || '').toLowerCase();
      const overview = (item.overview || '').toLowerCase();
      const originalTitle = (item.original_title || item.original_name || '').toLowerCase();

      // Filter by keywords in title
      const titleHasAdultKeywords = ADULT_KEYWORDS.some(keyword => 
        title.includes(keyword) || originalTitle.includes(keyword)
      );
      
      if (titleHasAdultKeywords) {
        console.log(`🚫 FILTERED (title keywords): ${item.title || item.name}`);
        return false;
      }

      // Filter by keywords in overview/description
      const overviewHasAdultKeywords = ADULT_KEYWORDS.some(keyword => 
        overview.includes(keyword)
      );
      
      if (overviewHasAdultKeywords) {
        console.log(`🚫 FILTERED (overview keywords): ${item.title || item.name}`);
        return false;
      }

      // Special checks for documentaries about adult topics
      if (item.genre_ids && Array.isArray(item.genre_ids)) {
        const isDocumentary = item.genre_ids.includes(99);
        if (isDocumentary) {
          // Be more strict with documentaries that might cover adult topics
          const documentaryAdultKeywords = ['sex', 'sexuality', 'prostitution', 'porn industry'];
          const hasDocumentaryAdultContent = documentaryAdultKeywords.some(keyword => 
            title.includes(keyword) || overview.includes(keyword)
          );
          
          if (hasDocumentaryAdultContent) {
            console.log(`🚫 FILTERED (documentary adult content): ${item.title || item.name}`);
            return false;
          }
        }
      }

      // Check for suspicious patterns in titles
      const suspiciousPatterns = [
        /\b(hot|wild|naughty|tempting|seductive)\s+(girls?|women|ladies?)\b/i,
        /\b(girls?|women|ladies?)\s+(gone|getting)\s+(wild|crazy|naughty)\b/i,
        /\b(bedroom|private|secret)\s+(desires?|fantasies?|affairs?)\b/i,
        /\b(forbidden|taboo)\s+(love|romance|desire)\b/i,
        /\bmidnight\s+(desires?|temptations?)\b/i,
      ];

      const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
        pattern.test(title) || pattern.test(overview)
      );

      if (hasSuspiciousPattern) {
        console.log(`🚫 FILTERED (suspicious pattern): ${item.title || item.name}`);
        return false;
      }

      // Check production companies if available
      if (item.production_companies && Array.isArray(item.production_companies)) {
        const hasAdultProductionCompany = item.production_companies.some(company => 
          ADULT_PRODUCTION_COMPANIES.some(adultCompany => 
            (company.name || '').toLowerCase().includes(adultCompany)
          )
        );

        if (hasAdultProductionCompany) {
          console.log(`🚫 FILTERED (production company): ${item.title || item.name}`);
          return false;
        }
      }

      // Additional safety check for very low ratings with adult-sounding titles
      if (item.vote_average && item.vote_average < 3 && item.vote_count && item.vote_count < 50) {
        // Low-rated content with few votes might be adult content
        const hasAdultSoundingTitle = ADULT_KEYWORDS.slice(0, 10).some(keyword => 
          title.includes(keyword)
        );
        
        if (hasAdultSoundingTitle) {
          console.log(`🚫 FILTERED (low rating + suspicious title): ${item.title || item.name}`);
          return false;
        }
      }

      // Country-specific checks (be more cautious with certain countries)
      if (item.origin_country && Array.isArray(item.origin_country)) {
        const hasHighRiskCountry = item.origin_country.some(country => 
          HIGH_RISK_COUNTRIES.includes(country)
        );
        
        if (hasHighRiskCountry && mediaType === 'tv') {
          // For TV shows from high-risk countries, be extra cautious
          const extraCautiousKeywords = ['hot', 'sexy', 'tempting', 'seductive'];
          const hasExtraCautiousKeywords = extraCautiousKeywords.some(keyword => 
            title.includes(keyword) || overview.includes(keyword)
          );
          
          if (hasExtraCautiousKeywords) {
            console.log(`🚫 FILTERED (high-risk country + keywords): ${item.title || item.name}`);
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error filtering content item:', error, item);
      // If there's an error, err on the side of caution and filter it out
      return false;
    }
  });
};

/**
 * Additional filter for search results to be extra cautious
 * @param {Array} searchResults - Search results to filter
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Array} Filtered search results
 */
export const filterSearchResults = (searchResults, mediaType = 'movie') => {
  const basicFiltered = filterAdultContent(searchResults, mediaType);
  
  // Additional filtering for search results (be more conservative)
  return basicFiltered.filter(item => {
    const title = (item.title || item.name || '').toLowerCase();
    
    // Filter out anything that sounds even remotely adult in search
    const conservativeKeywords = ['hot', 'wild', 'naughty', 'tempting', 'desire'];
    const hasConservativeKeywords = conservativeKeywords.some(keyword => 
      title.includes(keyword)
    );
    
    if (hasConservativeKeywords) {
      console.log(`🚫 FILTERED (search conservative): ${item.title || item.name}`);
      return false;
    }
    
    return true;
  });
};

/**
 * Filter for specific movie/TV show details to double-check
 * @param {Object} item - Single movie/TV show item
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {boolean} True if content is safe, false if it should be filtered
 */
export const isContentSafe = (item, mediaType = 'movie') => {
  if (!item) return false;
  
  const filtered = filterAdultContent([item], mediaType);
  return filtered.length > 0;
};

/**
 * Get a safe version of content with potentially problematic items removed
 * @param {Array} contentArray - Array of content to make safe
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Array} Safe content array
 */
export const getSafeContent = (contentArray, mediaType = 'movie') => {
  return filterAdultContent(contentArray, mediaType);
};

/**
 * Utility to check if a single item is potentially adult content
 * @param {Object} item - Content item to check
 * @returns {boolean} True if likely adult content
 */
export const isLikelyAdultContent = (item) => {
  if (!item) return true; // Err on the side of caution
  
  const filtered = filterAdultContent([item]);
  return filtered.length === 0; // If it was filtered out, it's likely adult content
};

export default {
  filterAdultContent,
  filterSearchResults,
  isContentSafe,
  getSafeContent,
  isLikelyAdultContent
};