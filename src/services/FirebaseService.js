// Firebase service functions for WUVO social features
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  addDoc,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from '../config/firebase';

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Create a new user account and profile
 */
export const createUserAccount = async (email, password, displayName, username) => {
  try {
    // Check if username is already taken
    const usernameExists = await checkUsernameAvailability(username);
    if (!usernameExists) {
      throw new Error('Username is already taken');
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update the user's display name
    await updateProfile(user, { displayName });

    // Create user profile in Firestore
    const userProfile = {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      username: username.toLowerCase(),
      bio: '',
      profilePicture: null,
      isPublic: true,
      followerCount: 0,
      followingCount: 0,
      ratingCount: 0,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp()
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    return { user, profile: userProfile };
  } catch (error) {
    console.error('Error creating user account:', error);
    throw error;
  }
};

/**
 * Check if username is available
 */
export const checkUsernameAvailability = async (username) => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('username', '==', username.toLowerCase())
    );
    const snapshot = await getDocs(q);
    return snapshot.empty; // true if available, false if taken
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
};

/**
 * Sign in user
 */
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Update last active timestamp
    await updateDoc(doc(db, 'users', userCredential.user.uid), {
      lastActive: serverTimestamp()
    });

    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

/**
 * Sign out user
 */
export const signOutUser = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Get user profile by UID
 */
export const getUserProfile = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('User profile not found');
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (uid, updates) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...updates,
      lastActive: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// ============================================================================
// USER SEARCH
// ============================================================================

/**
 * Search users by name or username
 */
export const searchUsers = async (searchQuery, limitCount = 20) => {
  try {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return [];
    }

    const searchTerm = searchQuery.toLowerCase().trim();
    
    // Search by username (starts with)
    const usernameQuery = query(
      collection(db, 'users'),
      where('username', '>=', searchTerm),
      where('username', '<=', searchTerm + '\uf8ff'),
      where('isPublic', '==', true),
      orderBy('username'),
      limit(limitCount)
    );

    // Search by display name (contains - this is a simplified version)
    const nameQuery = query(
      collection(db, 'users'),
      where('isPublic', '==', true),
      orderBy('displayName'),
      limit(limitCount)
    );

    const [usernameSnapshot, nameSnapshot] = await Promise.all([
      getDocs(usernameQuery),
      getDocs(nameQuery)
    ]);

    const usernameResults = usernameSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter name results by display name containing search term
    const nameResults = nameSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => 
        user.displayName.toLowerCase().includes(searchTerm) &&
        !usernameResults.find(u => u.id === user.id) // Remove duplicates
      );

    return [...usernameResults, ...nameResults].slice(0, limitCount);
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

/**
 * Get recommended users (mutual follows)
 */
export const getRecommendedUsers = async (currentUserId, limitCount = 15) => {
  try {
    // Get users that current user follows
    const followingQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', currentUserId)
    );
    const followingSnapshot = await getDocs(followingQuery);
    const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);

    if (followingIds.length === 0) {
      // If not following anyone, return popular users
      return getPopularUsers(limitCount);
    }

    // Get users followed by people the current user follows
    const mutualFollowsQuery = query(
      collection(db, 'follows'),
      where('followerId', 'in', followingIds)
    );
    const mutualFollowsSnapshot = await getDocs(mutualFollowsQuery);
    
    // Count mutual connections
    const mutualCounts = {};
    mutualFollowsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.followingId !== currentUserId && !followingIds.includes(data.followingId)) {
        mutualCounts[data.followingId] = (mutualCounts[data.followingId] || 0) + 1;
      }
    });

    // Get user profiles for recommendations
    const recommendedUserIds = Object.keys(mutualCounts)
      .sort((a, b) => mutualCounts[b] - mutualCounts[a])
      .slice(0, limitCount);

    const recommendations = await Promise.all(
      recommendedUserIds.map(async (userId) => {
        const profile = await getUserProfile(userId);
        return {
          ...profile,
          mutualFollowCount: mutualCounts[userId]
        };
      })
    );

    return recommendations;
  } catch (error) {
    console.error('Error getting recommended users:', error);
    throw error;
  }
};

/**
 * Get popular users (fallback for recommendations)
 */
export const getPopularUsers = async (limitCount = 15) => {
  try {
    const popularQuery = query(
      collection(db, 'users'),
      where('isPublic', '==', true),
      orderBy('followerCount', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(popularQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting popular users:', error);
    throw error;
  }
};

// ============================================================================
// SOCIAL FEATURES (FOLLOW/UNFOLLOW)
// ============================================================================

/**
 * Follow a user
 */
export const followUser = async (currentUserId, targetUserId) => {
  try {
    const batch = writeBatch(db);

    // Add follow relationship
    const followDoc = doc(collection(db, 'follows'));
    batch.set(followDoc, {
      followerId: currentUserId,
      followingId: targetUserId,
      createdAt: serverTimestamp()
    });

    // Update follower count for target user
    const targetUserDoc = doc(db, 'users', targetUserId);
    batch.update(targetUserDoc, {
      followerCount: incrementCount(1)
    });

    // Update following count for current user
    const currentUserDoc = doc(db, 'users', currentUserId);
    batch.update(currentUserDoc, {
      followingCount: incrementCount(1)
    });

    await batch.commit();
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (currentUserId, targetUserId) => {
  try {
    // Find the follow relationship
    const followQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', currentUserId),
      where('followingId', '==', targetUserId)
    );
    const followSnapshot = await getDocs(followQuery);

    if (followSnapshot.empty) {
      throw new Error('Follow relationship not found');
    }

    const batch = writeBatch(db);

    // Remove follow relationship
    followSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Update follower count for target user
    const targetUserDoc = doc(db, 'users', targetUserId);
    batch.update(targetUserDoc, {
      followerCount: incrementCount(-1)
    });

    // Update following count for current user
    const currentUserDoc = doc(db, 'users', currentUserId);
    batch.update(currentUserDoc, {
      followingCount: incrementCount(-1)
    });

    await batch.commit();
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

/**
 * Check if current user is following target user
 */
export const isFollowing = async (currentUserId, targetUserId) => {
  try {
    const followQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', currentUserId),
      where('followingId', '==', targetUserId)
    );
    const followSnapshot = await getDocs(followQuery);
    return !followSnapshot.empty;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

/**
 * Get user's followers
 */
export const getUserFollowers = async (userId, limitCount = 50) => {
  try {
    const followersQuery = query(
      collection(db, 'follows'),
      where('followingId', '==', userId),
      limit(limitCount)
    );
    const snapshot = await getDocs(followersQuery);
    
    const followerIds = snapshot.docs.map(doc => doc.data().followerId);
    const followers = await Promise.all(
      followerIds.map(id => getUserProfile(id))
    );

    return followers;
  } catch (error) {
    console.error('Error getting followers:', error);
    throw error;
  }
};

/**
 * Get users that a user is following
 */
export const getUserFollowing = async (userId, limitCount = 50) => {
  try {
    const followingQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', userId),
      limit(limitCount)
    );
    const snapshot = await getDocs(followingQuery);
    
    const followingIds = snapshot.docs.map(doc => doc.data().followingId);
    const following = await Promise.all(
      followingIds.map(id => getUserProfile(id))
    );

    return following;
  } catch (error) {
    console.error('Error getting following:', error);
    throw error;
  }
};

// ============================================================================
// USER RATINGS (PUBLIC)
// ============================================================================

/**
 * Save a public rating for a user
 */
export const savePublicRating = async (userId, movieData, rating, isPublic = true) => {
  try {
    const ratingDoc = doc(collection(db, 'userRatings'));
    await setDoc(ratingDoc, {
      userId,
      movieId: movieData.id,
      movieTitle: movieData.title || movieData.name,
      moviePoster: movieData.poster_path,
      movieYear: movieData.release_date?.split('-')[0] || movieData.first_air_date?.split('-')[0],
      rating,
      isPublic,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Update user's rating count
    await updateDoc(doc(db, 'users', userId), {
      ratingCount: incrementCount(1)
    });
  } catch (error) {
    console.error('Error saving public rating:', error);
    throw error;
  }
};

/**
 * Get public ratings for a user
 */
export const getUserPublicRatings = async (userId, limitCount = 20) => {
  try {
    const ratingsQuery = query(
      collection(db, 'userRatings'),
      where('userId', '==', userId),
      where('isPublic', '==', true),
      orderBy('rating', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(ratingsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user ratings:', error);
    throw error;
  }
};

// ============================================================================
// AUTH STATE LISTENER
// ============================================================================

/**
 * Listen to authentication state changes
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper function to increment/decrement Firestore numeric fields
 */
const incrementCount = (value) => {
  // This is a simplified version - in real Firestore, use FieldValue.increment()
  return value; // TODO: Replace with proper Firestore increment
};

export default {
  // User management
  createUserAccount,
  checkUsernameAvailability,
  signInUser,
  signOutUser,
  getUserProfile,
  updateUserProfile,
  
  // Search
  searchUsers,
  getRecommendedUsers,
  getPopularUsers,
  
  // Social
  followUser,
  unfollowUser,
  isFollowing,
  getUserFollowers,
  getUserFollowing,
  
  // Ratings
  savePublicRating,
  getUserPublicRatings,
  
  // Auth
  onAuthStateChange
};