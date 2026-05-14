import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/collectible';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImageVersion, setProfileImageVersion] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileImage = () => {
    // Trigger a re-render by updating version number
    setProfileImageVersion(prev => prev + 1);
  };
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulate login API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        isPremium: false,
        settings: {
          notifications: true,
          priceAlerts: true,
          currency: 'USD',
        },
      };

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string): Promise<boolean> => {
    return registerWithPhone(email, password, firstName, lastName);
  };

  const registerWithPhone = async (email: string, password: string, firstName: string, lastName: string, phone?: string): Promise<boolean> => {
    try {
      // Simulate registration API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUser: User = {
        id: Date.now().toString(),
        email,
        name: `${firstName.trim()} ${lastName.trim()}`,
        phone: phone || undefined,
        isPremium: false,
        settings: {
          notifications: true,
          priceAlerts: true,
          currency: 'USD',
        },
      };

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      // Force immediate navigation to welcome screen
      setTimeout(() => {
        require('expo-router').router.replace('/welcome');
      }, 50);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const upgradeToPremiun = async (): Promise<boolean> => {
    try {
      if (!user) return false;

      const updatedUser = {
        ...user,
        isPremium: true,
        subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      };

      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error('Upgrade error:', error);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const users = await AsyncStorage.getItem('registeredUsers');
      const registeredUsers = users ? JSON.parse(users) : [];

      const userExists = registeredUsers.some((u: any) => u.email === email.toLowerCase());

      if (userExists) {
        return {
          success: true,
          message: 'A password reset link has been sent to your email if an account exists with that address.'
        };
      }

      return {
        success: true,
        message: 'A password reset link has been sent to your email if an account exists with that address.'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'An error occurred. Please try again.'
      };
    }
  };

  return {
    user,
    isLoading,
    profileImageVersion,
    updateProfileImage,
    login,
    register: registerWithPhone,
    logout,
    upgradeToPremiun,
    resetPassword,
  };
}