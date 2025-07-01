import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { getUserPreferenceInsights, clearUserPreferences } from '../utils/AIRecommendations';

const SettingsScreen = ({ navigation, isDarkMode }) => {
  const { handleLogout, userInfo } = useAuth();
  const { 
    toggleTheme, 
    resetAllUserData,
    onboardingComplete 
  } = useAsyncStorage();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [preferenceInsights, setPreferenceInsights] = useState(null);

  // Load preference insights
  React.useEffect(() => {
    const loadInsights = async () => {
      try {
        const insights = await getUserPreferenceInsights('movie');
        setPreferenceInsights(insights);
      } catch (error) {
        console.error('Failed to load preference insights:', error);
      }
    };
    loadInsights();
  }, []);

  const handleLogoutPress = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout? This will clear all your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await handleLogout();
              // Navigation will be handled automatically by App.js auth state change
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your ratings, watchlist, and preferences. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAllUserData();
              Alert.alert('Success', 'All data has been reset.');
            } catch (error) {
              console.error('Reset error:', error);
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleClearPreferences = () => {
    Alert.alert(
      'Clear AI Preferences',
      'This will clear all your movie preferences, "not interested" selections, and recommendation history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await clearUserPreferences();
              if (success) {
                setPreferenceInsights(null);
                Alert.alert('Success', 'All preferences have been cleared. Recommendations will reset.');
              } else {
                Alert.alert('Error', 'Failed to clear preferences. Please try again.');
              }
            } catch (error) {
              console.error('Clear preferences error:', error);
              Alert.alert('Error', 'Failed to clear preferences. Please try again.');
            }
          }
        }
      ]
    );
  };

  const SettingsSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const SettingsItem = ({ title, subtitle, onPress, icon, color = '#fff' }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.itemContent}>
        <Ionicons name={icon} size={20} color={color} />
        <View style={styles.itemText}>
          <Text style={[styles.itemTitle, { color }]}>{title}</Text>
          {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#666" />
    </TouchableOpacity>
  );

  const SettingsToggle = ({ title, subtitle, value, onToggle, icon }) => (
    <View style={styles.settingsItem}>
      <View style={styles.itemContent}>
        <Ionicons name={icon} size={20} color="#fff" />
        <View style={styles.itemText}>
          <Text style={styles.itemTitle}>{title}</Text>
          {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#333', true: '#4B0082' }}
        thumbColor={value ? '#FFD700' : '#666'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Account">
          <SettingsItem
            title="Profile"
            subtitle="Edit your profile information"
            icon="person-outline"
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon.')}
          />
        </SettingsSection>

        <SettingsSection title="Preferences">
          <SettingsToggle
            title="Dark Mode"
            subtitle="Toggle between light and dark themes"
            value={isDarkMode}
            onToggle={toggleTheme}
            icon="moon-outline"
          />
          <SettingsToggle
            title="Push Notifications"
            subtitle="Receive notifications about new movies"
            value={notificationsEnabled}
            onToggle={setNotificationsEnabled}
            icon="notifications-outline"
          />
        </SettingsSection>

        <SettingsSection title="AI Recommendations">
          {preferenceInsights && (
            <>
              <SettingsItem
                title="Recommendation Insights"
                subtitle={`${preferenceInsights.totalNotInterested || 0} items marked not interested`}
                icon="analytics-outline"
                onPress={() => {
                  const insights = preferenceInsights;
                  const topGenres = insights.topLikedGenres?.slice(0, 3)
                    .map(g => g.preference).join(', ') || 'None yet';
                  
                  Alert.alert(
                    'Your Preferences',
                    `Top Genres: ${topGenres}\n\nItems Not Interested: ${insights.totalNotInterested || 0}\n\nThe AI learns from your ratings and choices to improve recommendations.`,
                    [{ text: 'OK' }]
                  );
                }}
              />
            </>
          )}
          <SettingsItem
            title="Clear AI Preferences"
            subtitle="Reset recommendation learning and preferences"
            icon="refresh-outline"
            color="#ff9800"
            onPress={handleClearPreferences}
          />
        </SettingsSection>

        <SettingsSection title="Data Management">
          <SettingsItem
            title="Export Data"
            subtitle="Download your ratings and watchlist"
            icon="download-outline"
            onPress={() => Alert.alert('Coming Soon', 'Data export will be available soon.')}
          />
          <SettingsItem
            title="Reset All Data"
            subtitle="Clear all ratings, watchlist, and preferences"
            icon="trash-outline"
            color="#ff4444"
            onPress={handleResetData}
          />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsItem
            title="App Version"
            subtitle="1.0.0"
            icon="information-circle-outline"
            onPress={() => {}}
          />
          <SettingsItem
            title="Privacy Policy"
            subtitle="View our privacy policy"
            icon="shield-outline"
            onPress={() => Alert.alert('Coming Soon', 'Privacy policy will be available soon.')}
          />
          <SettingsItem
            title="Terms of Service"
            subtitle="View terms and conditions"
            icon="document-text-outline"
            onPress={() => Alert.alert('Coming Soon', 'Terms of service will be available soon.')}
          />
        </SettingsSection>

        <SettingsSection title="Account Actions">
          <SettingsItem
            title="Logout"
            subtitle="Sign out of your account"
            icon="log-out-outline"
            color="#ff4444"
            onPress={handleLogoutPress}
          />
        </SettingsSection>

        {/* User Info Section */}
        {userInfo && (
          <View style={styles.userInfo}>
            <Text style={styles.userInfoText}>
              Logged in as: {userInfo.name || userInfo.email || 'User'}
            </Text>
            <Text style={styles.userInfoSubtext}>
              User ID: {userInfo.id}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#000',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#111',
    marginBottom: 1,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemText: {
    marginLeft: 16,
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  userInfo: {
    padding: 16,
    backgroundColor: '#111',
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  userInfoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  userInfoSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
});

export default SettingsScreen;