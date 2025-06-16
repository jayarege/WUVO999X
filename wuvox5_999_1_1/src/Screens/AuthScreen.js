import React, { useState } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import these when ready to implement real Google Sign-In
// import * as WebBrowser from 'expo-web-browser';
// import * as Google from 'expo-auth-session/providers/google';

// Initialize WebBrowser for Google auth redirect
// WebBrowser.maybeCompleteAuthSession();

// Your Google client IDs
const IOS_CLIENT_ID = '258138577739-bomfeo1vd1egsktp6m2dqkj7qmb7oc16.apps.googleusercontent.com';
const WEB_CLIENT_ID = '258138577739-bomfeo1vd1egsktp6m2dqkj7qmb7oc16.apps.googleusercontent.com';

function AuthScreen({ onAuthenticate, isDarkMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ------------------------------------------------------------------------
  // REAL GOOGLE AUTHENTICATION CODE (Uncomment when ready to deploy)
  // ------------------------------------------------------------------------
  /*
  // Set up Google Auth Request
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: IOS_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    // Make sure this matches the scheme in your app.json
    redirectUri: 'wuvo://'
  });

  // Monitor for authentication response
  React.useEffect(() => {
    if (response?.type === 'success') {
      // Successfully authenticated with Google
      const { authentication } = response;
      
      // Get user info using the access token
      getUserInfo(authentication.accessToken);
    }
  }, [response]);

  // Function to get user info from Google
  async function getUserInfo(token) {
    try {
      setIsLoading(true);
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const userData = await response.json();
      
      // Pass user data to the app
      onAuthenticate({
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        provider: 'google'
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error getting user info:", error);
      Alert.alert("Authentication Error", "Failed to get Google user information.");
      setIsLoading(false);
    }
  }

  // Real Google Sign-In function
  const handleRealGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await promptAsync();
      // The rest happens in the useEffect above
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      Alert.alert("Sign-In Error", "There was a problem signing in with Google.");
      setIsLoading(false);
    }
  };
  */
  // ------------------------------------------------------------------------
  // END OF REAL GOOGLE AUTHENTICATION CODE
  // ------------------------------------------------------------------------

  // Simple email login for demo
  const handleLogin = () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    
    setIsLoading(true);
    
    // Simulate authentication process
    setTimeout(() => {
      setIsLoading(false);
      onAuthenticate({
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        email: email,
        name: email.split('@')[0]
      });
    }, 1000);
  };

  // Simulation of Google Sign-In for Snack environment
  const handleGoogleSignIn = () => {
    setIsLoading(true);
    
    // Simulate Google authentication process
    setTimeout(() => {
      setIsLoading(false);
      
      // Simulate getting user data from Google
      const googleUserData = {
        id: 'google-' + Math.random().toString(36).substring(2, 9),
        email: 'user@gmail.com',
        name: 'Google User',
        provider: 'google'
      };
      
      onAuthenticate(googleUserData);
    }, 1500);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#1C2526' : '#FFFFFF' }]}>
        <View style={styles.logoContainer}>
          <Text style={[styles.appTitle, { color: isDarkMode ? '#F5F5F5' : '#333' }]}>
            Wuvo
          </Text>
          <Text style={[styles.appTagline, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
            Movies you'll love, ranked your way
          </Text>
        </View>
        
        <View style={styles.formContainer}>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5',
                color: isDarkMode ? '#F5F5F5' : '#333',
                borderColor: isDarkMode ? '#8A2BE2' : '#E0E0E0' 
              }
            ]}
            placeholder="Email"
            placeholderTextColor={isDarkMode ? '#A9A9A9' : '#999'}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDarkMode ? '#4B0082' : '#F5F5F5',
                color: isDarkMode ? '#F5F5F5' : '#333',
                borderColor: isDarkMode ? '#8A2BE2' : '#E0E0E0' 
              }
            ]}
            placeholder="Password"
            placeholderTextColor={isDarkMode ? '#A9A9A9' : '#999'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: isDarkMode ? '#FFD700' : '#4B0082' }
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={[
              styles.loginButtonText,
              { color: isDarkMode ? '#1C2526' : '#FFFFFF' }
            ]}>
              {isLoading ? 'Logging in...' : 'Log In with Email'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.googleButton,
              { borderColor: isDarkMode ? '#8A2BE2' : '#4B0082' }
            ]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Ionicons name="logo-google" size={20} color={isDarkMode ? '#FFD700' : '#4B0082'} style={styles.googleIcon} />
            <Text style={[
              styles.googleButtonText,
              { color: isDarkMode ? '#FFD700' : '#4B0082' }
            ]}>
              Continue with Google
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDarkMode ? '#D3D3D3' : '#666' }]}>
            Rate movies and discover new favorites
          </Text>
          
          <Text style={[styles.footerSubtext, { color: isDarkMode ? '#A9A9A9' : '#999' }]}>
            Demo mode: Authentication is simulated
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  appTagline: {
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AuthScreen;