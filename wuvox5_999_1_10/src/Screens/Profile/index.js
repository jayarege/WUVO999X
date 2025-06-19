import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMediaType } from '../../Navigation/TabNavigator';
import { ThemedHeader } from '../../Styles/headerStyles';
import theme from '../../utils/Theme';

const { width } = Dimensions.get('window');
const POSTER_SIZE = (width - 60) / 3; // 3 columns with spacing

const ProfileScreen = ({ seen = [], unseen = [], isDarkMode }) => {
  const { mediaType } = useMediaType();
  const [selectedTab, setSelectedTab] = useState('posts');

  // Filter content by current media type
  const currentSeen = useMemo(() => {
    return seen.filter(item => (item.mediaType || 'movie') === mediaType);
  }, [seen, mediaType]);

  const currentUnseen = useMemo(() => {
    return unseen.filter(item => (item.mediaType || 'movie') === mediaType);
  }, [unseen, mediaType]);

  // Get top rated content for display
  const topRatedContent = useMemo(() => {
    return currentSeen
      .filter(item => item.userRating >= 7)
      .sort((a, b) => b.userRating - a.userRating)
      .slice(0, 9);
  }, [currentSeen]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalRated = currentSeen.length;
    const averageRating = totalRated > 0 
      ? currentSeen.reduce((sum, item) => sum + (item.userRating || 0), 0) / totalRated 
      : 0;
    const watchlistSize = currentUnseen.length;

    return {
      posts: totalRated,
      followers: Math.round(averageRating * 100), // Creative use of average rating
      following: watchlistSize
    };
  }, [currentSeen, currentUnseen]);

  const getPosterUrl = (path) => {
    return path 
      ? `https://image.tmdb.org/t/p/w342${path}`
      : 'https://via.placeholder.com/342x513/333/fff?text=No+Poster';
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'posts':
        return (
          <View style={styles.postsGrid}>
            {topRatedContent.map((item, index) => (
              <TouchableOpacity key={item.id} style={styles.posterContainer}>
                <Image
                  source={{ uri: getPosterUrl(item.poster_path || item.poster) }}
                  style={styles.posterImage}
                  resizeMode="cover"
                />
                <View style={styles.ratingOverlay}>
                  <Text style={styles.ratingText}>{item.userRating?.toFixed(1)}</Text>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Fill empty spots if less than 9 items */}
            {Array.from({ length: Math.max(0, 9 - topRatedContent.length) }).map((_, index) => (
              <View key={`empty-${index}`} style={[styles.posterContainer, styles.emptyPoster]}>
                <Ionicons name="add" size={40} color="#666" />
              </View>
            ))}
          </View>
        );
      
      case 'reels':
        return (
          <View style={styles.comingSoonContainer}>
            <Ionicons name="film-outline" size={48} color="#666" />
            <Text style={styles.comingSoonText}>Movie Clips Coming Soon</Text>
          </View>
        );
      
      case 'tagged':
        return (
          <View style={styles.comingSoonContainer}>
            <Ionicons name="bookmark-outline" size={48} color="#666" />
            <Text style={styles.comingSoonText}>Recommendations Coming Soon</Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ThemedHeader isDarkMode={isDarkMode} theme={theme}>
        <Text style={styles.headerTitle}>Profile</Text>
      </ThemedHeader>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/*-style Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="lock-closed" size={16} color="#fff" />
            <Text style={styles.username}>your.movie.profile</Text>
            <Ionicons name="chevron-down" size={16} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.posts}</Text>
                <Text style={styles.statLabel}>rated</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.followers}</Text>
                <Text style={styles.statLabel}>score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.following}</Text>
                <Text style={styles.statLabel}>watchlist</Text>
              </View>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>Movie Enthusiast</Text>
            <Text style={styles.location}>Los Angeles</Text>
            <Text style={styles.bio}>
              "What's your favorite {mediaType === 'movie' ? 'movie' : 'TV show'}?"
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Text style={styles.shareButtonText}>Share profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.discoverButton}>
              <Ionicons name="person-add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, selectedTab === 'posts' && styles.activeTab]}
            onPress={() => setSelectedTab('posts')}
          >
            <Ionicons 
              name="grid" 
              size={24} 
              color={selectedTab === 'posts' ? '#fff' : '#666'} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, selectedTab === 'reels' && styles.activeTab]}
            onPress={() => setSelectedTab('reels')}
          >
            <Ionicons 
              name="play-circle" 
              size={24} 
              color={selectedTab === 'reels' ? '#fff' : '#666'} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, selectedTab === 'tagged' && styles.activeTab]}
            onPress={() => setSelectedTab('tagged')}
          >
            <Ionicons 
              name="bookmark" 
              size={24} 
              color={selectedTab === 'tagged' ? '#fff' : '#666'} 
            />
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
    backgroundColor: '#000',
  },
  
 
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
    padding: 4,
  },
  
  // Profile Section
  profileSection: {
    paddingHorizontal: 16,
    backgroundColor: '#000',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  // Avatar Section
  avatarContainer: {
    position: 'relative',
    marginRight: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#262626',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0095f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  
  // Stats Section
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#999',
    fontSize: 14,
    marginTop: 2,
  },
  
  // Profile Info Section
  profileInfo: {
    marginBottom: 16,
  },
  displayName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  location: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  bio: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
  },
  
  // Action Buttons Section
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#262626',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#262626',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  discoverButton: {
    backgroundColor: '#262626',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  
  // Tab Navigation Section
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    backgroundColor: '#000',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#fff',
  },
  
  // Posts Grid Section
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  posterContainer: {
    width: POSTER_SIZE,
    height: POSTER_SIZE * 1.5,
    marginBottom: 4,
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  ratingOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  ratingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyPoster: {
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  
  // Coming Soon Section
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#000',
  },
  comingSoonText: {
    color: '#999',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});
export default ProfileScreen;