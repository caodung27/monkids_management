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
  updateUserInfo: () => Promise<void>;
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
  updateUserInfo: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ProfileData | null>(null);
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
      
      // Only refresh token if access token is missing or expired
      if (!accessToken && refreshToken) {
        try {
          await authApi.refreshToken(refreshToken);
          // After refreshing token, get user data only if we don't have it
          if (!user) {
            const userData = await authApi.getCurrentUser();
            setUser(userData);
          }
          setIsLoading(false);
          return true;
        } catch (refreshError) {
          console.error('AuthProvider: Token refresh failed', refreshError);
          setIsLoading(false);
          return false;
        }
      }

      // If we have both tokens and user data, we're good
      if (accessToken && user) {
        setIsLoading(false);
        return true;
      }

      // If we have access token but no user data, get it
      if (accessToken && !user) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
          setIsLoading(false);
          return true;
        } catch (error) {
          console.error('AuthProvider: Failed to get user data', error);
          setIsLoading(false);
          return false;
        }
      }

      setIsLoading(false);
      return !!user;
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
      const response = await authApi.login({ email, password });
      
      if (response.access_token) {
        await updateUserInfo();
        
        notifications.show({
          title: 'Thành công',
          message: 'Đăng nhập thành công',
          color: 'green',
        });
        
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      notifications.show({
        title: 'Lỗi',
        message: error.message || 'Đăng nhập thất bại',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
      
      setUser(null);
      TokenService.clearTokens();
      localStorage.clear();
      sessionStorage.clear();
      
      notifications.show({
        title: 'Thành công',
        message: 'Đăng xuất thành công',
        color: 'green',
      });
      
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      notifications.show({
        title: 'Lỗi',
        message: 'Có lỗi xảy ra khi đăng xuất',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
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

  // Function to fetch and update user info
  const updateUserInfo = async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error updating user info:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      if (!initComplete.current) {
        console.log('AuthProvider: Initializing auth state');
        // Skip auth check if on public paths
        const pathname = window.location.pathname;
        const isPublicPath = ['/auth/login', '/auth/register', '/auth/callback', '/auth/oauth-callback', '/auth/error']
          .some(path => pathname.startsWith(path));
        
        if (!isPublicPath) {
          await checkAndRefreshAuth();
        }
        initComplete.current = true;
      }
    };

    initAuth();

    // Set up periodic token validation with longer interval
    tokenValidationInterval.current = setInterval(() => {
      console.log('AuthProvider: Periodic token validation');
      // Skip validation if on public paths
      const pathname = window.location.pathname;
      const isPublicPath = ['/auth/login', '/auth/register', '/auth/callback', '/auth/oauth-callback', '/auth/error']
        .some(path => pathname.startsWith(path));
      
      if (!isPublicPath) {
        // Only check token validity, don't fetch user data unless necessary
        const accessToken = TokenService.getAccessToken();
        if (!accessToken) {
          checkAndRefreshAuth();
        }
      }
    }, 15 * 60 * 1000); // Check every 15 minutes instead of 5

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
        updateUserInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 