import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config';
import { isDevModeEnabled, getDevUser } from '../utils/DevConfig';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleAuthentication = useCallback(async (userData) => {
    const session = {
      id: userData.id || 'user_' + Date.now(),
      name: userData.name || 'User',
      email: userData.email || '',
      timestamp: new Date().toISOString()
    };
    
    if (!isDevModeEnabled()) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER.SESSION, JSON.stringify(session));
    }
    
    setUserInfo(session);
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(async () => {
    if (!isDevModeEnabled()) {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER.SESSION);
    }
    
    setUserInfo(null);
    setIsAuthenticated(false);
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      if (isDevModeEnabled()) {
        const devUser = getDevUser();
        setUserInfo(devUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      const session = await AsyncStorage.getItem(STORAGE_KEYS.USER.SESSION);
      if (session) {
        setUserInfo(JSON.parse(session));
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error('Auth initialization error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return {
    isAuthenticated,
    userInfo,
    isLoading,
    handleAuthentication,
    handleLogout,
    initializeAuth
  };
};