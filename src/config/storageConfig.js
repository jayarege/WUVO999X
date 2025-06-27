export const STORAGE_KEYS = {
  USER: {
    SESSION: 'wuvo_user_session',
    DATA: 'wuvo_user_data',
    PREFERENCES: 'wuvo_user_preferences',
    ONBOARDING_COMPLETE: 'wuvo_onboarding_complete'
  },
  MOVIES: {
    SEEN: 'wuvo_user_seen_movies',
    UNSEEN: 'wuvo_user_unseen_movies',
    COMPARED: 'wuvo_compared_movies',
    BASELINE_COMPLETE: 'wuvo_baseline_complete_movies',
    COMPARISON_COUNT: 'wuvo_comparison_count_movies',
    COMPARISON_PATTERN: 'wuvo_comparison_pattern_movies'
  },
  TV_SHOWS: {
    SEEN: 'wuvo_user_seen_tv_shows',
    UNSEEN: 'wuvo_user_unseen_tv_shows',
    COMPARED: 'wuvo_compared_tv',
    BASELINE_COMPLETE: 'wuvo_baseline_complete_tv',
    COMPARISON_COUNT: 'wuvo_comparison_count_tv',
    COMPARISON_PATTERN: 'wuvo_comparison_pattern_tv'
  },
  CACHE: {
    STREAMING: 'wuvo_streaming_cache',
    RATE_LIMIT: 'groq_api_rate_limit'
  },
  WILDCARD: {
    COMPARED_MOVIES: 'wuvo_compared_movies',
    BASELINE_COMPLETE: 'wuvo_baseline_complete',
    COMPARISON_COUNT: 'wuvo_comparison_count',
    COMPARISON_PATTERN: 'wuvo_comparison_pattern',
    SKIPPED_MOVIES: 'wuvo_skipped_movies'
  }
};

export const CACHE_DURATION = {
  USER_DATA: 1000 * 60 * 60 * 24,
  STREAMING_DATA: 1000 * 60 * 60 * 6,
  API_RATE_LIMIT: 1000 * 60 * 60
};