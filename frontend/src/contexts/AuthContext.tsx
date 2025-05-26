'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, profileApi, TokenService } from '@/api/apiService';
import { notifications } from '@mantine/notifications';
import { ProfileData } from '@/types';

// Define user types
export interface UserPermissions {
  is_authenticated: boolean;
  email: string;
  id: string;
  role: 'ADMIN' | 'USER';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  image: string | null;
  role: string;
}

// Auth context interface
interface AuthContextType {
  user: ProfileData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  checkAndRefreshAuth: () => Promise<boolean>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  checkAndRefreshAuth: async () => false,
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const initComplete = useRef(false);
  
  // Add a reference to store the token validation interval
  const tokenValidationInterval = useRef<NodeJS.Timeout | null>(null);

  // Add a new state variable to track the initial authentication check
  const [isInitialCheck, setIsInitialCheck] = useState(true);

  // Function to check and refresh auth state
  const checkAndRefreshAuth = async (): Promise<boolean> => {
    try {
      console.log('AuthProvider: Checking and refreshing auth');

      // Check if we have tokens
      const accessToken = TokenService.getAccessToken();
      const refreshToken = TokenService.getRefreshToken();
      
      if (!accessToken && !refreshToken) {
        console.log('AuthProvider: No tokens found');
        setIsLoading(false);
        return false;
      }
      
      // Try to refresh token with backend if needed
      if (refreshToken && (!user || !accessToken)) {
        try {
          await authApi.refreshToken(refreshToken);
          const userData = await profileApi.getCurrentUser();
          setUser(userData);
          setIsLoading(false);
          return true;
        } catch (refreshError) {
          console.error('AuthProvider: Token refresh failed', refreshError);
          setIsLoading(false);
          return false;
        }
      }

      // If we have a user, we're authenticated
      if (user) {
        setIsLoading(false);
        return true;
      }

      // Try to get user data
      try {
        const userData = await profileApi.getCurrentUser();
        setUser(userData);
        setIsLoading(false);
        return true;
      } catch (error) {
        console.error('AuthProvider: Failed to get user data', error);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('AuthProvider: Error checking auth:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { access_token, user } = await authApi.login(email, password);
      
      if (!access_token || !user) {
        throw new Error('Invalid response from server');
      }
      
      setUser(user);
      setIsLoading(false);
      
      notifications.show({
        title: 'Đăng nhập thành công',
        message: `Chào mừng ${user.name}!`,
        color: 'green',
      });
      
      // Use window.location.href instead of router.push
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
      
      let errorMessage = 'Email hoặc mật khẩu không đúng';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message === 'Network Error') {
        errorMessage = 'Không thể kết nối đến server';
      }
      
      notifications.show({
        title: 'Lỗi đăng nhập',
        message: errorMessage,
        color: 'red',
      });
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      // Call logout API first
      await authApi.logout();
      
      // Clear user state
      setUser(null);
      
      // Clear all tokens
      TokenService.clearTokens();
      
      // Clear all localStorage items
      localStorage.clear();
      
      // Clear all sessionStorage items
      sessionStorage.clear();
      
      notifications.show({
        title: 'Thành công',
        message: 'Đăng xuất thành công',
        color: 'green',
      });
      
      // Reset auth check counters
      if (tokenValidationInterval.current) {
        clearInterval(tokenValidationInterval.current);
        tokenValidationInterval.current = null;
      }
      
      setIsLoading(false);
      
      // Use window.location.href instead of router.replace
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if there's an error, still clear local state and redirect
      setUser(null);
      TokenService.clearTokens();
      localStorage.clear();
      sessionStorage.clear();
      
      notifications.show({
        title: 'Lỗi',
        message: 'Có lỗi xảy ra khi đăng xuất, nhưng bạn đã được đăng xuất',
        color: 'red',
      });
      
      setIsLoading(false);
      window.location.href = '/login';
    }
  };

  // Register function
  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(userData);
      if (response) {
        setUser(response.user);
        setIsLoading(false);
        notifications.show({
          title: 'Thành công',
          message: 'Đăng ký thành công',
          color: 'green',
        });
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      if (!initComplete.current) {
        console.log('AuthProvider: Initializing auth state');
        await checkAndRefreshAuth();
        initComplete.current = true;
      }
    };

    initAuth();

    // Set up periodic token validation
    tokenValidationInterval.current = setInterval(() => {
      console.log('AuthProvider: Periodic token validation');
      checkAndRefreshAuth();
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      if (tokenValidationInterval.current) {
        clearInterval(tokenValidationInterval.current);
        tokenValidationInterval.current = null;
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        checkAndRefreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 