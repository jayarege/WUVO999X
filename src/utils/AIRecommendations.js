import { GROQ_API_KEY, TMDB_API_KEY } from '../Constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================================================
// USER PREFERENCE SERVICE - Integrated into AIRecommendations
// =============================================================================

class UserPreferenceService {
  constructor() {
    this.cache = new Map();
    this.preferenceKeys = {
      NOT_INTERESTED: 'user_not_interested',
      VIEWING_HISTORY: 'user_viewing_history', 
      PREFERENCE_WEIGHTS: 'user_preference_weights',
      DEMOGRAPHIC_PROFILE: 'user_demographic_profile',
      INTERACTION_PATTERNS: 'user_interaction_patterns'
    };
  }

  async addNotInterestedItem(item, reason = 'not_interested', mediaType = 'movie') {
    try {
      const notInterestedList = await this.getNotInterestedList(mediaType);
      
      const notInterestedItem = {
        id: item.id,
        title: item.title || item.name,
        genre_ids: item.genre_ids || [],
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date,
        reason: reason,
        timestamp: new Date().toISOString(),
        confidence: this.calculateReasonConfidence(reason)
      };

      const filteredList = notInterestedList.filter(existing => existing.id !== item.id);
      filteredList.unshift(notInterestedItem);
      const limitedList = filteredList.slice(0, 500);

      await AsyncStorage.setItem(
        `${this.preferenceKeys.NOT_INTERESTED}_${mediaType}`,
        JSON.stringify(limitedList)
      );

      await this.updatePreferenceWeights(notInterestedItem, -1, mediaType);
      console.log(`❌ Added to not interested: ${item.title || item.name} (${reason})`);
      return true;
    } catch (error) {
      console.error('Error adding not interested item:', error);
      return false;
    }
  }

  async getNotInterestedList(mediaType = 'movie') {
    try {
      const stored = await AsyncStorage.getItem(`${this.preferenceKeys.NOT_INTERESTED}_${mediaType}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting not interested list:', error);
      return [];
    }
  }

  calculateReasonConfidence(reason) {
    const confidenceMap = {
      'not_interested': 0.9,
      'wrong_genre': 0.8,
      'too_old': 0.6,
      'seen_before': 0.7,
      'low_quality': 0.8,
      'too_long': 0.5,
      'too_short': 0.5
    };
    return confidenceMap[reason] || 0.5;
  }

  async updatePreferenceWeights(item, weight, mediaType = 'movie') {
    try {
      const weights = await this.getPreferenceWeights(mediaType);
      
      if (item.genre_ids && Array.isArray(item.genre_ids)) {
        item.genre_ids.forEach(genreId => {
          weights.genres[genreId] = (weights.genres[genreId] || 0) + weight;
        });
      }

      if (item.release_date) {
        const year = parseInt(item.release_date.substring(0, 4));
        const decade = Math.floor(year / 10) * 10;
        weights.decades[decade] = (weights.decades[decade] || 0) + weight;
      }

      if (item.vote_average) {
        const qualityTier = this.getQualityTier(item.vote_average);
        weights.quality[qualityTier] = (weights.quality[qualityTier] || 0) + weight;
      }

      weights.lastUpdated = new Date().toISOString();

      await AsyncStorage.setItem(
        `${this.preferenceKeys.PREFERENCE_WEIGHTS}_${mediaType}`,
        JSON.stringify(weights)
      );

      return weights;
    } catch (error) {
      console.error('Error updating preference weights:', error);
      return null;
    }
  }

  async getPreferenceWeights(mediaType = 'movie') {
    try {
      const stored = await AsyncStorage.getItem(`${this.preferenceKeys.PREFERENCE_WEIGHTS}_${mediaType}`);
      if (stored) {
        return JSON.parse(stored);
      }
      
      return {
        genres: {},
        decades: {},
        quality: {},
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting preference weights:', error);
      return { genres: {}, decades: {}, quality: {}, lastUpdated: new Date().toISOString() };
    }
  }

  getQualityTier(voteAverage) {
    if (voteAverage >= 8.5) return 'exceptional';
    if (voteAverage >= 7.5) return 'high';
    if (voteAverage >= 6.5) return 'good';
    if (voteAverage >= 5.5) return 'average';
    return 'low';
  }

  async getPreferenceInsights(mediaType = 'movie') {
    try {
      const [weights, notInterested] = await Promise.all([
        this.getPreferenceWeights(mediaType),
        this.getNotInterestedList(mediaType)
      ]);

      return {
        topLikedGenres: this.getTopPreferences(weights.genres, 5),
        topAvoidedGenres: this.getBottomPreferences(weights.genres, 3),
        preferredDecades: this.getTopPreferences(weights.decades, 3),
        qualityPreference: this.getTopPreferences(weights.quality, 1)[0],
        totalNotInterested: notInterested.length,
        commonAvoidanceReasons: this.analyzeAvoidanceReasons(notInterested)
      };
    } catch (error) {
      console.error('Error getting preference insights:', error);
      return null;
    }
  }

  getTopPreferences(preferences, count) {
    return Object.entries(preferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([key, value]) => ({ preference: key, score: value }));
  }

  getBottomPreferences(preferences, count) {
    return Object.entries(preferences)
      .filter(([,score]) => score < 0)
      .sort(([,a], [,b]) => a - b)
      .slice(0, count)
      .map(([key, value]) => ({ preference: key, score: value }));
  }

  analyzeAvoidanceReasons(notInterestedList) {
    const reasonCounts = {};
    notInterestedList.forEach(item => {
      reasonCounts[item.reason] = (reasonCounts[item.reason] || 0) + 1;
    });
    
    return Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([reason, count]) => ({ reason, count }));
  }

  async clearAllPreferences() {
    try {
      const keys = Object.values(this.preferenceKeys);
      const allKeys = [];
      
      ['movie', 'tv'].forEach(mediaType => {
        keys.forEach(key => {
          if (key.includes('user_')) {
            allKeys.push(`${key}_${mediaType}`);
          }
        });
      });
      
      allKeys.push(this.preferenceKeys.DEMOGRAPHIC_PROFILE);
      
      await AsyncStorage.multiRemove(allKeys);
      this.cache.clear();
      
      console.log('✅ All user preferences cleared');
      return true;
    } catch (error) {
      console.error('Error clearing preferences:', error);
      return false;
    }
  }
}

// =============================================================================
// ENHANCED RECOMMENDATION ENGINE - Integrated into AIRecommendations  
// =============================================================================

class EnhancedRecommendationEngine {
  constructor() {
    this.cache = new Map();
    this.rateLimitDelay = 1000;
    this.lastRequestTime = 0;
  }

  async getPersonalizedRecommendations(userMovies, mediaType = 'movie', options = {}) {
    try {
      console.log(`🎯 Getting personalized recommendations for ${mediaType}`);
      
      const {
        count = 20,
        includePopular = true,
        includeHidden = true
      } = options;

      // Step 1: Analyze user preferences
      const userProfile = await this.buildUserProfile(userMovies, mediaType);
      
      // Step 2: Get base recommendations using multiple strategies
      const baseRecommendations = await this.getBaseRecommendations(
        userMovies, 
        userProfile, 
        mediaType, 
        count * 3
      );

      // Step 3: Apply preference-based filtering and scoring
      const scoredRecommendations = await this.scoreAndFilterRecommendations(
        baseRecommendations,
        userProfile,
        mediaType
      );

      // Step 4: Apply diversity and quality controls
      const finalRecommendations = this.optimizeRecommendationList(
        scoredRecommendations,
        userProfile,
        count
      );

      console.log(`✅ Generated ${finalRecommendations.length} personalized recommendations`);
      return finalRecommendations;

    } catch (error) {
      console.error('Error in personalized recommendations:', error);
      return this.getFallbackRecommendations(userMovies, mediaType);
    }
  }

  async buildUserProfile(userMovies, mediaType) {
    try {
      const userPreferenceService = new UserPreferenceService();
      const [preferenceWeights, notInterestedList] = await Promise.all([
        userPreferenceService.getPreferenceWeights(mediaType),
        userPreferenceService.getNotInterestedList(mediaType)
      ]);

      const ratingAnalysis = this.analyzeRatingPatterns(userMovies);
      
      const profile = {
        totalRated: userMovies.length,
        averageRating: this.calculateAverageRating(userMovies),
        ratingDistribution: this.analyzeRatingDistribution(userMovies),
        genrePreferences: this.analyzeGenrePreferences(userMovies, preferenceWeights.genres),
        decadePreferences: this.analyzeDecadePreferences(userMovies, preferenceWeights.decades),
        qualityPreferences: this.analyzeQualityPreferences(userMovies, preferenceWeights.quality),
        ratingPatterns: ratingAnalysis,
        diversityScore: this.calculateDiversityScore(userMovies),
        notInterestedItems: notInterestedList,
        lastUpdated: new Date().toISOString()
      };

      return profile;
    } catch (error) {
      console.error('Error building user profile:', error);
      return this.getDefaultProfile();
    }
  }

  analyzeRatingPatterns(userMovies) {
    const ratings = userMovies.map(m => m.userRating).filter(r => r != null);
    
    return {
      isGenerousRater: ratings.filter(r => r >= 8).length / ratings.length > 0.4,
      isCriticalRater: ratings.filter(r => r <= 5).length / ratings.length > 0.3,
      usesFullScale: (Math.max(...ratings) - Math.min(...ratings)) >= 7,
      averageDeviation: this.calculateAverageDeviation(userMovies),
      consistencyScore: this.calculateConsistencyScore(userMovies)
    };
  }

  calculateAverageDeviation(userMovies) {
    const withTMDBRatings = userMovies.filter(m => m.vote_average && m.userRating);
    if (withTMDBRatings.length === 0) return 0;
    
    const deviations = withTMDBRatings.map(m => Math.abs(m.userRating - m.vote_average));
    return deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
  }

  calculateConsistencyScore(userMovies) {
    const genreConsistency = {};
    
    userMovies.forEach(movie => {
      if (movie.genre_ids && movie.userRating) {
        movie.genre_ids.forEach(genreId => {
          if (!genreConsistency[genreId]) genreConsistency[genreId] = [];
          genreConsistency[genreId].push(movie.userRating);
        });
      }
    });

    const consistencyScores = Object.values(genreConsistency)
      .filter(ratings => ratings.length >= 3)
      .map(ratings => {
        const mean = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length;
        return Math.sqrt(variance);
      });

    return consistencyScores.length > 0 
      ? consistencyScores.reduce((sum, score) => sum + score, 0) / consistencyScores.length
      : 0;
  }

  analyzeGenrePreferences(userMovies, existingWeights) {
    const genreScores = { ...existingWeights };
    
    userMovies.forEach(movie => {
      if (movie.genre_ids && movie.userRating) {
        const weight = this.getRatingWeight(movie.userRating);
        movie.genre_ids.forEach(genreId => {
          genreScores[genreId] = (genreScores[genreId] || 0) + weight;
        });
      }
    });

    const maxScore = Math.max(...Object.values(genreScores));
    if (maxScore > 0) {
      Object.keys(genreScores).forEach(genre => {
        genreScores[genre] = genreScores[genre] / maxScore;
      });
    }

    return genreScores;
  }

  getRatingWeight(userRating) {
    if (userRating >= 9) return 3;
    if (userRating >= 8) return 2;
    if (userRating >= 7) return 1;
    if (userRating >= 6) return 0.5;
    if (userRating >= 4) return -1;
    return -2;
  }

  async getBaseRecommendations(userMovies, userProfile, mediaType, count) {
    // Simplified implementation for consolidation
    try {
      const topRated = userMovies
        .filter(m => m.userRating >= 7)
        .sort((a, b) => b.userRating - a.userRating)
        .slice(0, 3);

      const fallbackPromises = topRated.map(async (movie) => {
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${movie.id}/similar?api_key=${TMDB_API_KEY}&page=1`
          );
          const data = await response.json();
          return data.results?.slice(0, Math.ceil(count / topRated.length)) || [];
        } catch (error) {
          console.error('Base recommendation error:', error);
          return [];
        }
      });

      const results = await Promise.all(fallbackPromises);
      const combined = results.flat();
      
      return this.removeDuplicates(combined).slice(0, count);
    } catch (error) {
      console.error('Error in base recommendations:', error);
      return [];
    }
  }

  async scoreAndFilterRecommendations(recommendations, userProfile, mediaType) {
    try {
      const userPreferenceService = new UserPreferenceService();
      const notInterestedList = await userPreferenceService.getNotInterestedList(mediaType);

      const filteredRecommendations = recommendations.filter(item => {
        return !notInterestedList.some(notInterested => notInterested.id === item.id);
      });

      const scoredRecommendations = filteredRecommendations.map(item => ({
        ...item,
        personalizedScore: this.calculatePersonalizedScore(item, userProfile),
        confidenceScore: this.calculateConfidenceScore(item, userProfile),
        noveltyScore: this.calculateNoveltyScore(item, userProfile)
      }));

      scoredRecommendations.sort((a, b) => {
        const scoreA = (a.personalizedScore * 0.6) + (a.confidenceScore * 0.3) + (a.noveltyScore * 0.1);
        const scoreB = (b.personalizedScore * 0.6) + (b.confidenceScore * 0.3) + (b.noveltyScore * 0.1);
        return scoreB - scoreA;
      });

      return scoredRecommendations;
    } catch (error) {
      console.error('Error scoring recommendations:', error);
      return recommendations;
    }
  }

  calculatePersonalizedScore(item, userProfile) {
    let score = 0;
    let factors = 0;

    if (item.genre_ids && userProfile.genrePreferences) {
      const genreScore = item.genre_ids.reduce((sum, genreId) => {
        return sum + (userProfile.genrePreferences[genreId] || 0);
      }, 0) / item.genre_ids.length;
      score += genreScore;
      factors++;
    }

    if (item.vote_average && userProfile.averageRating) {
      const qualityAlignment = 1 - Math.abs(item.vote_average - userProfile.averageRating) / 10;
      score += qualityAlignment;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  calculateConfidenceScore(item, userProfile) {
    if (!item.vote_average || !item.vote_count) return 0.5;
    
    const qualityScore = item.vote_average / 10;
    const popularityScore = Math.min(item.vote_count / 1000, 1);
    const reliabilityScore = item.vote_count > 100 ? 1 : item.vote_count / 100;
    
    return (qualityScore * 0.5) + (popularityScore * 0.3) + (reliabilityScore * 0.2);
  }

  calculateNoveltyScore(item, userProfile) {
    let noveltyFactors = 0;
    let noveltySum = 0;

    if (item.genre_ids && userProfile.genrePreferences) {
      const avgGenreScore = item.genre_ids.reduce((sum, genreId) => {
        return sum + (userProfile.genrePreferences[genreId] || 0);
      }, 0) / item.genre_ids.length;
      
      noveltySum += (avgGenreScore < 0 ? 1 : 0);
      noveltyFactors++;
    }

    return noveltyFactors > 0 ? noveltySum / noveltyFactors : 0.5;
  }

  optimizeRecommendationList(scoredRecommendations, userProfile, targetCount) {
    const result = [];
    const genresUsed = {};
    
    for (const item of scoredRecommendations) {
      if (result.length >= targetCount) break;
      
      const itemGenres = item.genre_ids || [];
      const genreOverlap = itemGenres.filter(genre => genresUsed[genre]).length;
      const maxGenreRepetition = Math.ceil(targetCount / 10);
      
      if (genreOverlap <= maxGenreRepetition) {
        result.push(item);
        itemGenres.forEach(genre => {
          genresUsed[genre] = (genresUsed[genre] || 0) + 1;
        });
      }
    }
    
    if (result.length < targetCount) {
      const remaining = scoredRecommendations
        .filter(item => !result.includes(item))
        .slice(0, targetCount - result.length);
      result.push(...remaining);
    }
    
    return result;
  }

  removeDuplicates(recommendations) {
    const seen = new Set();
    return recommendations.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  getFallbackRecommendations(userMovies, mediaType) {
    console.log('🔄 Using basic fallback recommendations');
    return [];
  }

  getDefaultProfile() {
    return {
      totalRated: 0,
      averageRating: 7,
      genrePreferences: {},
      decadePreferences: {},
      notInterestedItems: [],
      ratingPatterns: {
        isGenerousRater: false,
        isCriticalRater: false,
        usesFullScale: true
      }
    };
  }

  calculateAverageRating(userMovies) {
    const ratings = userMovies.map(m => m.userRating).filter(r => r != null);
    return ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 7;
  }

  analyzeRatingDistribution(userMovies) {
    const distribution = {};
    userMovies.forEach(movie => {
      if (movie.userRating) {
        const rating = Math.floor(movie.userRating);
        distribution[rating] = (distribution[rating] || 0) + 1;
      }
    });
    return distribution;
  }

  analyzeDecadePreferences(userMovies, existingWeights) {
    const decadeScores = { ...existingWeights };
    
    userMovies.forEach(movie => {
      if ((movie.release_date || movie.first_air_date) && movie.userRating) {
        const year = parseInt((movie.release_date || movie.first_air_date).substring(0, 4));
        const decade = Math.floor(year / 10) * 10;
        const weight = this.getRatingWeight(movie.userRating);
        decadeScores[decade] = (decadeScores[decade] || 0) + weight;
      }
    });

    return decadeScores;
  }

  analyzeQualityPreferences(userMovies, existingWeights) {
    const qualityScores = { ...existingWeights };
    
    userMovies.forEach(movie => {
      if (movie.vote_average && movie.userRating) {
        const qualityTier = this.getQualityTier(movie.vote_average);
        const weight = this.getRatingWeight(movie.userRating);
        qualityScores[qualityTier] = (qualityScores[qualityTier] || 0) + weight;
      }
    });

    return qualityScores;
  }

  getQualityTier(voteAverage) {
    if (voteAverage >= 8.5) return 'exceptional';
    if (voteAverage >= 7.5) return 'high';
    if (voteAverage >= 6.5) return 'good';
    if (voteAverage >= 5.5) return 'average';
    return 'low';
  }

  calculateDiversityScore(userMovies) {
    const genres = new Set();
    const decades = new Set();
    
    userMovies.forEach(movie => {
      if (movie.genre_ids) movie.genre_ids.forEach(genre => genres.add(genre));
      if (movie.release_date || movie.first_air_date) {
        const year = parseInt((movie.release_date || movie.first_air_date).substring(0, 4));
        decades.add(Math.floor(year / 10) * 10);
      }
    });

    return (genres.size + decades.size) / userMovies.length;
  }
}

// Create service instances
const userPreferenceService = new UserPreferenceService();
const enhancedRecommendationEngine = new EnhancedRecommendationEngine();

class AIRecommendationService {
  constructor() {
    this.cache = new Map();
    this.rateLimitDelay = 1000;
    this.lastRequestTime = 0;
    this.userProfileCache = new Map();
  }

  // =============================================================================
  // USER TASTE PROFILE ANALYSIS
  // =============================================================================
  
  async analyzeUserTasteProfile(userMovies, mediaType = 'movie') {
    const cacheKey = `profile_${mediaType}_${userMovies.map(m => `${m.id}_${m.userRating}`).join(',')}`;
    
    if (this.userProfileCache.has(cacheKey)) {
      return this.userProfileCache.get(cacheKey);
    }

    // Separate into rating tiers
    const loved = userMovies.filter(m => m.userRating >= 8);
    const liked = userMovies.filter(m => m.userRating >= 6 && m.userRating < 8);
    const disliked = userMovies.filter(m => m.userRating < 6);

    // Analyze genre preferences with weights
    const genrePreferences = this.analyzeGenrePreferences(loved, liked, disliked);
    
    // Analyze rating patterns
    const ratingPatterns = this.analyzeRatingPatterns(userMovies);
    
    // Analyze temporal preferences (decades)
    const decadePreferences = this.analyzeDecadePreferences(loved, liked, disliked);
    
    // Analyze TMDB score alignment
    const scoreAlignment = this.analyzeScoreAlignment(userMovies);

    const profile = {
      genrePreferences,
      ratingPatterns,
      decadePreferences,
      scoreAlignment,
      totalRated: userMovies.length,
      averageUserRating: userMovies.reduce((sum, m) => sum + m.userRating, 0) / userMovies.length,
      ratingRange: Math.max(...userMovies.map(m => m.userRating)) - Math.min(...userMovies.map(m => m.userRating)),
      tastePersona: this.generateTastePersona(genrePreferences, ratingPatterns, scoreAlignment)
    };

    this.userProfileCache.set(cacheKey, profile);
    return profile;
  }

  analyzeGenrePreferences(loved, liked, disliked) {
    const genreScores = {};
    const genreMap = {
      28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
      80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
      14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
      9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
      53: 'Thriller', 10752: 'War', 37: 'Western'
    };

    // Calculate weighted genre preferences
    [...loved, ...liked, ...disliked].forEach(movie => {
      const weight = movie.userRating >= 8 ? 3 : movie.userRating >= 6 ? 1 : -2;
      (movie.genre_ids || []).forEach(genreId => {
        const genreName = genreMap[genreId] || 'Unknown';
        genreScores[genreName] = (genreScores[genreName] || 0) + weight;
      });
    });

    // Sort and return top preferences
    return Object.entries(genreScores)
      .sort(([,a], [,b]) => b - a)
      .reduce((acc, [genre, score]) => ({ ...acc, [genre]: score }), {});
  }

  analyzeRatingPatterns(userMovies) {
    const patterns = {
      isGenerousRater: userMovies.filter(m => m.userRating >= 8).length / userMovies.length > 0.4,
      isCritical: userMovies.filter(m => m.userRating <= 5).length / userMovies.length > 0.3,
      prefersHighTMDB: userMovies.filter(m => m.vote_average >= 7.5 && m.userRating >= 7).length / userMovies.length > 0.5,
      contraindicated: userMovies.filter(m => Math.abs(m.vote_average - m.userRating) > 3).length / userMovies.length > 0.3
    };

    return patterns;
  }

  analyzeDecadePreferences(loved, liked, disliked) {
    const decadeScores = {};
    
    [...loved, ...liked, ...disliked].forEach(movie => {
      if (movie.release_date || movie.first_air_date) {
        const year = parseInt((movie.release_date || movie.first_air_date).substring(0, 4));
        const decade = Math.floor(year / 10) * 10;
        const weight = movie.userRating >= 8 ? 3 : movie.userRating >= 6 ? 1 : -2;
        decadeScores[`${decade}s`] = (decadeScores[`${decade}s`] || 0) + weight;
      }
    });

    return Object.entries(decadeScores)
      .sort(([,a], [,b]) => b - a)
      .reduce((acc, [decade, score]) => ({ ...acc, [decade]: score }), {});
  }

  analyzeScoreAlignment(userMovies) {
    const alignments = userMovies.map(movie => {
      const diff = Math.abs(movie.vote_average - movie.userRating);
      return { diff, category: diff < 1 ? 'aligned' : diff < 2.5 ? 'moderate' : 'divergent' };
    });

    return {
      averageDifference: alignments.reduce((sum, a) => sum + a.diff, 0) / alignments.length,
      alignedPercentage: alignments.filter(a => a.category === 'aligned').length / alignments.length,
      tendsToRateHigher: userMovies.filter(m => m.userRating > m.vote_average).length > userMovies.length / 2
    };
  }

  generateTastePersona(genrePrefs, ratingPatterns, scoreAlignment) {
    const topGenres = Object.keys(genrePrefs).slice(0, 3);
    const bottomGenres = Object.entries(genrePrefs)
      .filter(([,score]) => score < 0)
      .map(([genre]) => genre)
      .slice(0, 2);

    let persona = `Viewer who loves ${topGenres.join(', ')}`;
    
    if (bottomGenres.length > 0) {
      persona += ` but dislikes ${bottomGenres.join(', ')}`;
    }
    
    if (ratingPatterns.isGenerousRater) {
      persona += `. Tends to rate movies generously`;
    } else if (ratingPatterns.isCritical) {
      persona += `. Has very high standards and rates critically`;
    }
    
    if (ratingPatterns.prefersHighTMDB) {
      persona += `. Appreciates critically acclaimed content`;
    } else if (ratingPatterns.contraindicated) {
      persona += `. Has unique taste that often differs from mainstream opinion`;
    }

    return persona;
  }

  // =============================================================================
  // ENHANCED AI PROMPTING
  // =============================================================================

  async getGroqRecommendations(userMovies, mediaType = 'movie') {
    try {
      const { apiRateLimitManager } = await import('./APIRateLimit');
      
      const canMakeCall = await apiRateLimitManager.canMakeCall(mediaType);
      if (!canMakeCall) {
        const remaining = await apiRateLimitManager.getAllRemainingCalls();
        console.log(`🚫 Rate limit exceeded for ${mediaType}. Remaining: Movies(${remaining.movie}), TV(${remaining.tv}), Total(${remaining.total})`);
        throw new Error(`Daily API limit reached for ${mediaType}. Please try again tomorrow.`);
      }

      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.rateLimitDelay) {
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
      }
      this.lastRequestTime = Date.now();

      // Generate comprehensive user profile
      const userProfile = await this.analyzeUserTasteProfile(userMovies, mediaType);
      
      // Create enhanced cache key including profile
      const cacheKey = `${mediaType}-v2-${JSON.stringify(userProfile).slice(0, 100)}`;
      
      if (this.cache.has(cacheKey)) {
        console.log('🎯 Using cached AI recommendations');
        return this.cache.get(cacheKey);
      }

      // Get negative feedback
      const negativeFeedback = await this.getNegativeFeedback(mediaType);
      
      // Create enhanced prompt
      const prompt = await this.createEnhancedPrompt(userMovies, userProfile, negativeFeedback, mediaType);

      console.log('🧠 Enhanced AI Prompt:', prompt.substring(0, 200) + '...');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: "You are an expert film/TV critic and recommendation engine. Provide only titles, one per line, no explanations or numbers."
            },
            {
              role: "user", 
              content: prompt
            }
          ],
          max_tokens: 400,
          temperature: 0.6 // Slightly lower for more focused recommendations
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const recommendedTitles = data.choices[0].message.content
        .split('\n')
        .map(line => line.trim().replace(/^\d+\.?\s*/, '').replace(/^-\s*/, ''))
        .filter(title => title.length > 0 && title.length < 100)
        .slice(0, 25); // Get more initial results

      console.log('🤖 Enhanced Groq recommended:', recommendedTitles);

      // Enhanced TMDB search with multiple strategies
      const recommendations = await this.enhancedTMDBSearch(recommendedTitles, mediaType);
      
      await apiRateLimitManager.incrementCallCount(mediaType);
      console.log(`✅ Groq API call successful for ${mediaType}. Call count incremented.`);
      
      // Cache results for 2 hours (longer due to enhanced processing)
      setTimeout(() => this.cache.delete(cacheKey), 2 * 60 * 60 * 1000);
      this.cache.set(cacheKey, recommendations);
      
      return recommendations;
      
    } catch (error) {
      console.error('❌ Enhanced Groq recommendation error:', error);
      // Fallback to algorithmic recommendations
      return this.getFallbackRecommendations(userMovies, mediaType);
    }
  }

  async createEnhancedPrompt(userMovies, userProfile, negativeFeedback, mediaType) {
    const contentType = mediaType === 'movie' ? 'movies' : 'TV shows';
    
    // Create detailed rating analysis
    const lovedMovies = userMovies.filter(m => m.userRating >= 8);
    const likedMovies = userMovies.filter(m => m.userRating >= 6 && m.userRating < 8);
    const dislikedMovies = userMovies.filter(m => m.userRating < 6);

    // Build genre preference string
    const topGenres = Object.entries(userProfile.genrePreferences)
      .slice(0, 4)
      .map(([genre, score]) => `${genre} (${score > 0 ? '+' : ''}${score})`)
      .join(', ');

    const avoidGenres = Object.entries(userProfile.genrePreferences)
      .filter(([,score]) => score < 0)
      .slice(0, 3)
      .map(([genre]) => genre)
      .join(', ');

    // Negative feedback context
    let negativeContext = '';
    if (negativeFeedback.length > 0) {
      const recentNegative = negativeFeedback
        .slice(-15)
        .map(item => item.title)
        .join(', ');
      negativeContext = `\n\nAVOID recommending: ${recentNegative}`;
    }

    const prompt = `RECOMMENDATION REQUEST for ${userProfile.tastePersona}

LOVED (Rated 8-10):
${lovedMovies.slice(0, 8).map(m => `• ${m.title} (User: ${m.userRating}/10, TMDB: ${m.vote_average?.toFixed(1) || '?'})`).join('\n')}

LIKED (Rated 6-7):
${likedMovies.slice(0, 5).map(m => `• ${m.title} (${m.userRating}/10)`).join('\n')}

${dislikedMovies.length > 0 ? `DISLIKED (Rated 1-5):
${dislikedMovies.slice(0, 3).map(m => `• ${m.title} (${m.userRating}/10)`).join('\n')}` : ''}

TASTE PROFILE:
• Preferred genres: ${topGenres}
${avoidGenres ? `• Avoid: ${avoidGenres}` : ''}
• Rating style: ${userProfile.ratingPatterns.isGenerousRater ? 'Generous' : userProfile.ratingPatterns.isCritical ? 'Critical' : 'Balanced'}
• TMDB alignment: ${userProfile.scoreAlignment.alignedPercentage > 0.6 ? 'Mainstream taste' : 'Unique taste'}
${negativeContext}

Recommend 20 ${contentType} this user would rate 8+ based on their specific taste profile. Focus on hidden gems and perfect matches rather than obvious popular choices.`;

    return prompt;
  }

  async getNegativeFeedback(mediaType) {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const feedbackKey = `ai_negative_feedback_${mediaType}`;
      const stored = await AsyncStorage.getItem(feedbackKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  // =============================================================================
  // ENHANCED TMDB SEARCH
  // =============================================================================

  async enhancedTMDBSearch(titles, mediaType = 'movie') {
    const endpoint = mediaType === 'movie' ? 'search/movie' : 'search/tv';
    
    const searchPromises = titles.map(async (title) => {
      try {
        // Try exact search first
        let response = await fetch(
          `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&include_adult=false`
        );
        let data = await response.json();
        let item = data.results?.[0];
        
        // If no good match, try without special characters
        if (!item || this.calculateConfidence(title, item.title || item.name) < 0.6) {
          const cleanedTitle = title.replace(/[^\w\s]/g, '').trim();
          response = await fetch(
            `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanedTitle)}&include_adult=false`
          );
          data = await response.json();
          const betterMatch = data.results?.[0];
          if (betterMatch && this.calculateConfidence(title, betterMatch.title || betterMatch.name) > this.calculateConfidence(title, item?.title || item?.name || '')) {
            item = betterMatch;
          }
        }
        
        if (item && item.poster_path) {
          // Get additional details for better filtering
          const detailsResponse = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,keywords`
          );
          const details = await detailsResponse.json();
          
          return {
            ...item,
            ...details,
            title: mediaType === 'movie' ? item.title : item.name,
            mediaType: mediaType,
            isAIRecommendation: true,
            aiConfidence: this.calculateConfidence(title, item.title || item.name),
            enhancedScore: this.calculateEnhancedScore(item, details)
          };
        }
        return null;
      } catch (error) {
        console.error(`❌ Enhanced TMDB search error for "${title}":`, error);
        return null;
      }
    });

    const results = await Promise.all(searchPromises);
    return results
      .filter(Boolean)
      .filter(item => item.vote_count > 50) // Minimum vote threshold
      .sort((a, b) => (b.aiConfidence * b.enhancedScore) - (a.aiConfidence * a.enhancedScore))
      .slice(0, 20);
  }

  calculateEnhancedScore(item, details) {
    let score = 1.0;
    
    // Boost for good ratings with sufficient votes
    if (item.vote_average >= 7.0 && item.vote_count >= 500) score += 0.3;
    if (item.vote_average >= 8.0 && item.vote_count >= 1000) score += 0.2;
    
    // Boost for recent releases
    const releaseYear = parseInt((item.release_date || item.first_air_date || '2000').substring(0, 4));
    if (releaseYear >= 2020) score += 0.1;
    if (releaseYear >= 2022) score += 0.1;
    
    // Penalty for very old low-rated content
    if (releaseYear < 2000 && item.vote_average < 6.5) score -= 0.2;
    
    return Math.max(0.1, score);
  }

  calculateConfidence(originalTitle, foundTitle) {
    if (!originalTitle || !foundTitle) return 0;
    
    const original = originalTitle.toLowerCase().trim();
    const found = foundTitle.toLowerCase().trim();
    
    if (original === found) return 1.0;
    if (found.includes(original) || original.includes(found)) return 0.9;
    
    // Enhanced word overlap with stemming
    const originalWords = original.split(' ').filter(w => w.length > 2);
    const foundWords = found.split(' ').filter(w => w.length > 2);
    
    let commonWords = 0;
    originalWords.forEach(origWord => {
      foundWords.forEach(foundWord => {
        if (origWord === foundWord || 
            origWord.includes(foundWord) || 
            foundWord.includes(origWord)) {
          commonWords++;
        }
      });
    });
    
    const maxWords = Math.max(originalWords.length, foundWords.length);
    return maxWords > 0 ? Math.min(commonWords / maxWords, 0.8) : 0;
  }

  // =============================================================================
  // FALLBACK RECOMMENDATIONS
  // =============================================================================

  async getFallbackRecommendations(userMovies, mediaType) {
    console.log('🔄 Using algorithmic fallback recommendations');
    
    try {
      // Get user's top-rated movies
      const topRated = userMovies
        .filter(m => m.userRating >= 7)
        .sort((a, b) => b.userRating - a.userRating)
        .slice(0, 3);

      // Use TMDB's "similar" endpoint
      const fallbackPromises = topRated.map(async (movie) => {
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${movie.id}/similar?api_key=${TMDB_API_KEY}&page=1`
          );
          const data = await response.json();
          return data.results?.slice(0, 5) || [];
        } catch (error) {
          console.error('Fallback recommendation error:', error);
          return [];
        }
      });

      const fallbackResults = await Promise.all(fallbackPromises);
      const combined = fallbackResults.flat();
      
      // Remove duplicates and add metadata
      const unique = combined.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      ).map(item => ({
        ...item,
        title: mediaType === 'movie' ? item.title : item.name,
        mediaType: mediaType,
        isAIRecommendation: false,
        isFallback: true
      }));

      return unique.slice(0, 10);
    } catch (error) {
      console.error('❌ Fallback recommendation error:', error);
      return [];
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  filterUnseenContent(recommendations, seenList, unseenList, skippedList = []) {
    return recommendations.filter(rec => 
      !seenList.some(seen => seen.id === rec.id) &&
      !unseenList.some(unseen => unseen.id === rec.id) &&
      !skippedList.includes(rec.id)
    );
  }

  clearCache() {
    this.cache.clear();
    this.userProfileCache.clear();
  }

  // =============================================================================
  // ENHANCED RECOMMENDATION INTERFACE - NEW SYSTEM
  // =============================================================================

  async getEnhancedRecommendations(userMovies, mediaType = 'movie', options = {}) {
    try {
      console.log(`🚀 Getting enhanced recommendations for ${mediaType} (${userMovies.length} user movies)`);
      
      // Use integrated enhanced recommendation engine
      const enhancedRecommendations = await enhancedRecommendationEngine.getPersonalizedRecommendations(
        userMovies,
        mediaType,
        {
          count: options.count || 20,
          includePopular: options.includePopular !== false,
          includeHidden: options.includeHidden !== false
        }
      );

      if (enhancedRecommendations && enhancedRecommendations.length > 0) {
        console.log(`✅ Enhanced system returned ${enhancedRecommendations.length} recommendations`);
        return enhancedRecommendations;
      }

      // Fallback to original system if enhanced fails
      console.log('🔄 Enhanced system failed, falling back to original');
      return await this.getGroqRecommendations(userMovies, mediaType);
      
    } catch (error) {
      console.error('❌ Enhanced recommendations failed:', error);
      
      // Double fallback to original system
      try {
        return await this.getGroqRecommendations(userMovies, mediaType);
      } catch (fallbackError) {
        console.error('❌ Fallback recommendations also failed:', fallbackError);
        return this.getFallbackRecommendations(userMovies, mediaType);
      }
    }
  }

  async recordNotInterested(item, reason = 'not_interested', mediaType = 'movie') {
    try {
      const success = await userPreferenceService.addNotInterestedItem(item, reason, mediaType);
      
      if (success) {
        console.log(`📝 Recorded not interested: ${item.title || item.name} (${reason})`);
        
        // Clear recommendation cache to get fresh results
        this.cache.clear();
        this.userProfileCache.clear();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error recording not interested:', error);
      return false;
    }
  }

  async recordUserRating(item, userRating, mediaType = 'movie') {
    try {
      // Update preference weights based on rating
      const weight = this.calculatePreferenceWeight(userRating);
      await userPreferenceService.updatePreferenceWeights(item, weight, mediaType);
      
      console.log(`📊 Updated preferences based on rating: ${item.title || item.name} (${userRating}/10)`);
      
      // Clear caches for fresh recommendations
      this.cache.clear();
      this.userProfileCache.clear();
      
      return true;
    } catch (error) {
      console.error('Error recording user rating:', error);
      return false;
    }
  }

  calculatePreferenceWeight(userRating) {
    // Convert user rating to preference weight
    if (userRating >= 9) return 3;      // Loved
    if (userRating >= 8) return 2;      // Really liked
    if (userRating >= 7) return 1;      // Liked
    if (userRating >= 6) return 0.5;    // Neutral positive
    if (userRating >= 4) return -1;     // Disliked
    return -2;                          // Strongly disliked
  }

  async getUserPreferenceInsights(mediaType = 'movie') {
    try {
      return await userPreferenceService.getPreferenceInsights(mediaType);
    } catch (error) {
      console.error('Error getting preference insights:', error);
      return null;
    }
  }

  async clearUserPreferences() {
    try {
      const success = await userPreferenceService.clearAllPreferences();
      if (success) {
        this.cache.clear();
        this.userProfileCache.clear();
        console.log('✅ All user preferences cleared');
      }
      return success;
    } catch (error) {
      console.error('Error clearing preferences:', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiRecommendationService = new AIRecommendationService();

// Enhanced export function
export const getAIRecommendations = async (userMovies, mediaType, seenList, unseenList, skippedList = []) => {
  try {
    // Require minimum data for quality recommendations
    if (userMovies.length < 5) {
      console.log('📊 Insufficient data for AI recommendations. Need at least 5 rated items.');
      return [];
    }

    const recommendations = await aiRecommendationService.getGroqRecommendations(userMovies, mediaType);
    const filtered = aiRecommendationService.filterUnseenContent(recommendations, seenList, unseenList, skippedList);
    
    console.log(`🎯 Returning ${filtered.length} AI recommendations for ${mediaType}`);
    return filtered;
  } catch (error) {
    console.error('AI recommendations failed:', error);
    return [];
  }
};

// =============================================================================
// ENHANCED EXPORT INTERFACE
// =============================================================================

// Export both original function for compatibility and enhanced system
export const getEnhancedRecommendations = aiRecommendationService.getEnhancedRecommendations.bind(aiRecommendationService);
export const recordNotInterested = aiRecommendationService.recordNotInterested.bind(aiRecommendationService);
export const recordUserRating = aiRecommendationService.recordUserRating.bind(aiRecommendationService);
export const getUserPreferenceInsights = aiRecommendationService.getUserPreferenceInsights.bind(aiRecommendationService);
export const clearUserPreferences = aiRecommendationService.clearUserPreferences.bind(aiRecommendationService);

export default aiRecommendationService;