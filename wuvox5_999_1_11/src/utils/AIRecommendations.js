import { GROQ_API_KEY, TMDB_API_KEY } from '../Constants';

class AIRecommendationService {
  constructor() {
    this.cache = new Map(); // Simple in-memory cache
    this.rateLimitDelay = 1000; // 1 second between requests
    this.lastRequestTime = 0;
  }

  async getGroqRecommendations(userMovies, mediaType = 'movie') {
    try {
      // Import rate limiting here to avoid circular imports
      const { apiRateLimitManager } = await import('./APIRateLimit');
      
      // Check if we can make the API call
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

      // Create cache key
      const cacheKey = `${mediaType}-${userMovies.map(m => m.id).sort().join(',')}-${userMovies.map(m => m.userRating).join(',')}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        console.log('🎯 Using cached AI recommendations');
        return this.cache.get(cacheKey);
      }

      const movieList = userMovies
        .map(item => `${item.title} (${item.userRating}/10)`)
        .join('\n');

      const contentType = mediaType === 'movie' ? 'movies' : 'TV shows';
      const prompt = `Based on these highly rated ${contentType}, recommend 10 similar ${contentType} this user would love:

${movieList}

Return only ${contentType} titles, one per line, no explanations or numbering. Focus on ${contentType} with similar themes, directors, or genres.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const recommendedTitles = data.choices[0].message.content
        .split('\n')
        .map(line => line.trim().replace(/^\d+\.?\s*/, ''))
        .filter(title => title.length > 0 && title.length < 100) // Filter out weird responses
        .slice(0, 20); // Pull 20 items instead of 10

      console.log('🤖 Groq recommended:', recommendedTitles);

      // Search TMDB for these titles
      const recommendations = await this.searchTMDBForTitles(recommendedTitles, mediaType);
      
      // Increment the API call counter only on successful Groq API call
      await apiRateLimitManager.incrementCallCount(mediaType);
      console.log(`✅ Groq API call successful for ${mediaType}. Call count incremented.`);
      
      // Cache the results (expire after 1 hour)
      setTimeout(() => this.cache.delete(cacheKey), 60 * 60 * 1000);
      this.cache.set(cacheKey, recommendations);
      
      return recommendations;
      
    } catch (error) {
      console.error('❌ Groq recommendation error:', error);
      throw error;
    }
  }

  async searchTMDBForTitles(titles, mediaType = 'movie') {
    const endpoint = mediaType === 'movie' ? 'search/movie' : 'search/tv';
    
    const searchPromises = titles.map(async (title) => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&include_adult=false`
        );
        const data = await response.json();
        const item = data.results?.[0];
        
        if (item && item.poster_path) {
          return {
            ...item,
            title: mediaType === 'movie' ? item.title : item.name,
            mediaType: mediaType,
            isAIRecommendation: true,
            aiConfidence: this.calculateConfidence(title, item.title || item.name)
          };
        }
        return null;
      } catch (error) {
        console.error(`❌ TMDB search error for "${title}":`, error);
        return null;
      }
    });

    const results = await Promise.all(searchPromises);
    return results
      .filter(Boolean)
      .sort((a, b) => b.aiConfidence - a.aiConfidence) // Sort by match confidence
      .slice(0, 20); // Return up to 20 items
  }

  calculateConfidence(originalTitle, foundTitle) {
    const original = originalTitle.toLowerCase();
    const found = foundTitle.toLowerCase();
    
    if (original === found) return 1.0;
    if (found.includes(original) || original.includes(found)) return 0.8;
    
    // Simple word overlap score
    const originalWords = original.split(' ');
    const foundWords = found.split(' ');
    const commonWords = originalWords.filter(word => foundWords.includes(word));
    
    return commonWords.length / Math.max(originalWords.length, foundWords.length);
  }

  // Helper method to filter out movies user has already seen
  filterUnseenContent(recommendations, seenList, unseenList) {
    return recommendations.filter(rec => 
      !seenList.some(seen => seen.id === rec.id) &&
      !unseenList.some(unseen => unseen.id === rec.id)
    );
  }
}

// Export singleton instance
export const aiRecommendationService = new AIRecommendationService();

// Export individual functions for easier use
export const getAIRecommendations = async (userMovies, mediaType, seenList, unseenList) => {
  try {
    const recommendations = await aiRecommendationService.getGroqRecommendations(userMovies, mediaType);
    return aiRecommendationService.filterUnseenContent(recommendations, seenList, unseenList);
  } catch (error) {
    console.error('AI recommendations failed:', error);
    return [];
  }
};

export default aiRecommendationService;