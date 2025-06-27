import { GROQ_API_KEY, TMDB_API_KEY } from '../Constants';

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

export default aiRecommendationService;