import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Mock user data for Snack compatibility
const mockUsers = [
  { id: 'user1', displayName: 'Alice Cooper', username: 'alice_movie_fan', profilePicture: 'https://via.placeholder.com/50x50?text=AC', followerCount: 1250, ratingCount: 342, mutualFollowCount: 5 },
  { id: 'user2', displayName: 'Bob Smith', username: 'bob_cinephile', profilePicture: 'https://via.placeholder.com/50x50?text=BS', followerCount: 890, ratingCount: 567, mutualFollowCount: 3 },
  { id: 'user3', displayName: 'Carol Davis', username: 'carol_reviews', profilePicture: 'https://via.placeholder.com/50x50?text=CD', followerCount: 2100, ratingCount: 789, mutualFollowCount: 8 },
  { id: 'user4', displayName: 'David Wilson', username: 'david_films', profilePicture: 'https://via.placeholder.com/50x50?text=DW', followerCount: 450, ratingCount: 234, mutualFollowCount: 2 },
  { id: 'user5', displayName: 'Emma Johnson', username: 'emma_movie_buff', profilePicture: 'https://via.placeholder.com/50x50?text=EJ', followerCount: 1680, ratingCount: 456, mutualFollowCount: 7 }
];

// Mock Firebase service functions
const searchUsers = async (query, limit = 20) => {
  // Simulate search delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockUsers.filter(user => 
    user.displayName.toLowerCase().includes(query.toLowerCase()) ||
    user.username.toLowerCase().includes(query.toLowerCase())
  ).slice(0, limit);
};

const getRecommendedUsers = async (currentUserId, limit = 15) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockUsers.slice(0, Math.min(limit, mockUsers.length));
};

const followUser = async (currentUserId, targetUserId) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log(`User ${currentUserId} followed ${targetUserId}`);
};

const unfollowUser = async (currentUserId, targetUserId) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log(`User ${currentUserId} unfollowed ${targetUserId}`);
};

const isFollowing = async (currentUserId, targetUserId) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return Math.random() > 0.5; // Random follow status for demo
};

// Simple debounce function
const debounce = (func, delay) => {
  let timeoutId;
  const debounced = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
};

const { width, height } = Dimensions.get('window');

const UserSearchModal = ({
  visible,
  onClose,
  currentUserId,
  onUserSelect,
  isDarkMode = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [followingStatus, setFollowingStatus] = useState({}); // Track follow status for each user

  const colors = {
    background: isDarkMode ? '#1C2526' : '#FFFFFF',
    card: isDarkMode ? '#4B0082' : '#F8F9FA',
    text: isDarkMode ? '#F5F5F5' : '#333333',
    subText: isDarkMode ? '#D3D3D3' : '#666666',
    accent: isDarkMode ? '#FFD700' : '#4B0082',
    border: isDarkMode ? '#8A2BE2' : '#E0E0E0',
    placeholder: isDarkMode ? '#A9A9A9' : '#999999',
    success: '#4CAF50',
    error: '#F44336'
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const results = await searchUsers(query.trim(), 20);
        
        // Filter out current user from results
        const filteredResults = results.filter(user => user.id !== currentUserId);
        setSearchResults(filteredResults);
        
        // Check follow status for each result
        const followStatuses = {};
        await Promise.all(
          filteredResults.map(async (user) => {
            const following = await isFollowing(currentUserId, user.id);
            followStatuses[user.id] = following;
          })
        );
        setFollowingStatus(prev => ({ ...prev, ...followStatuses }));
        
      } catch (error) {
        console.error('Search error:', error);
        Alert.alert('Search Error', 'Failed to search users. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [currentUserId]
  );

  // Load recommendations when modal opens
  useEffect(() => {
    if (visible && currentUserId) {
      loadRecommendations();
    }
  }, [visible, currentUserId]);

  // Trigger search when query changes
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  const loadRecommendations = async () => {
    try {
      setIsLoadingRecommendations(true);
      const recs = await getRecommendedUsers(currentUserId, 15);
      setRecommendations(recs);
      
      // Check follow status for recommendations
      const followStatuses = {};
      await Promise.all(
        recs.map(async (user) => {
          const following = await isFollowing(currentUserId, user.id);
          followStatuses[user.id] = following;
        })
      );
      setFollowingStatus(prev => ({ ...prev, ...followStatuses }));
      
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      if (followingStatus[userId]) {
        await unfollowUser(currentUserId, userId);
        setFollowingStatus(prev => ({ ...prev, [userId]: false }));
      } else {
        await followUser(currentUserId, userId);
        setFollowingStatus(prev => ({ ...prev, [userId]: true }));
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    }
  };

  const handleUserPress = (user) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
    onClose();
  };

  const renderUserItem = ({ item: user }) => (
    <View style={[styles.userItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={() => handleUserPress(user)}
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri: user.profilePicture || 'https://via.placeholder.com/50x50?text=👤'
          }}
          style={styles.profilePicture}
        />
        
        <View style={styles.userDetails}>
          <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
            {user.displayName}
          </Text>
          <Text style={[styles.username, { color: colors.subText }]} numberOfLines={1}>
            @{user.username}
          </Text>
          {user.mutualFollowCount > 0 && (
            <Text style={[styles.mutualText, { color: colors.accent }]}>
              {user.mutualFollowCount} mutual friend{user.mutualFollowCount > 1 ? 's' : ''}
            </Text>
          )}
          {user.followerCount > 0 && (
            <Text style={[styles.statsText, { color: colors.subText }]}>
              {user.followerCount} followers • {user.ratingCount || 0} ratings
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.followButton,
          { 
            backgroundColor: followingStatus[user.id] ? colors.border : colors.accent,
            borderColor: colors.accent
          }
        ]}
        onPress={() => handleFollow(user.id)}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.followButtonText,
          { color: followingStatus[user.id] ? colors.text : '#FFF' }
        ]}>
          {followingStatus[user.id] ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptySearch = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search" size={48} color={colors.subText} />
      <Text style={[styles.emptyText, { color: colors.subText }]}>
        {searchQuery.length > 0 && searchQuery.length < 2
          ? 'Type at least 2 characters to search'
          : searchQuery.length >= 2
          ? 'No users found'
          : 'Search for users by name or username'
        }
      </Text>
    </View>
  );

  const renderRecommendationsHeader = () => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        You May Know
      </Text>
      {isLoadingRecommendations && (
        <ActivityIndicator size="small" color={colors.accent} />
      )}
    </View>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Search Users
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Search Input */}
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.placeholder} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by name or username..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {isSearching && (
              <ActivityIndicator size="small" color={colors.accent} style={styles.searchLoader} />
            )}
          </View>

          {/* Results */}
          <FlatList
            style={styles.resultsList}
            data={searchQuery.length >= 2 ? searchResults : []}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={searchQuery.length >= 2 ? renderEmptySearch : null}
            ListHeaderComponent={
              searchQuery.length < 2 && recommendations.length > 0 ? renderRecommendationsHeader : null
            }
            ListFooterComponent={
              searchQuery.length < 2 ? (
                <FlatList
                  data={recommendations}
                  renderItem={renderUserItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  ListEmptyComponent={
                    !isLoadingRecommendations ? (
                      <View style={styles.emptyContainer}>
                        <Ionicons name="people" size={48} color={colors.subText} />
                        <Text style={[styles.emptyText, { color: colors.subText }]}>
                          No recommendations available
                        </Text>
                      </View>
                    ) : null
                  }
                />
              ) : null
            }
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchLoader: {
    marginLeft: 8,
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 2,
  },
  mutualText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  statsText: {
    fontSize: 12,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default UserSearchModal;