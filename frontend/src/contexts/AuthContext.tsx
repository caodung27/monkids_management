'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, profileApi, TokenService } from '@/api/apiService';
import { notifications } from '@mantine/notifications';
import { ProfileData } from '@/types';
import Logger from '@/libs/logger';

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

      // Check if we have tokens
      const accessToken = TokenService.getAccessToken();
      const refreshToken = TokenService.getRefreshToken();
      
      if (!accessToken && !refreshToken) {
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
          Logger.error('AuthProvider: Token refresh failed', refreshError);
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
          setIsLoading(false);
          return false;
        }
      }

      setIsLoading(false);
      return !!user;
    } catch (error) {
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
        // Save tokens
        TokenService.setAccessToken(response.access_token);
        if (response.refresh_token) {
          TokenService.setRefreshToken(response.refresh_token);
        }
        
        // Update user info
        await updateUserInfo();
        
        // Show success notification
        notifications.show({
          title: 'Thành công',
          message: 'Đăng nhập thành công',
          color: 'green',
        });
        
        // Force navigation to dashboard using window.location
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      Logger.error('Login error:', error);
      notifications.show({
        title: 'Lỗi',
        message: error.message || 'Đăng nhập thất bại',
        color: 'red',
      });
      throw error;
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
      Logger.error('Logout error:', error);
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
      Logger.error('Registration error:', error);
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
      Logger.error('Error updating user info:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      if (!initComplete.current) {
        await checkAndRefreshAuth();
        initComplete.current = true;
      }
    };

    initAuth();

    // Set up periodic token validation with longer interval
    tokenValidationInterval.current = setInterval(async () => {
      // Skip validation if on public paths
      const pathname = window.location.pathname;
      const isPublicPath = ['/auth/login', '/auth/register']
        .some(path => pathname.startsWith(path));
      
      if (!isPublicPath) {
        try {
          // Check token validity using introspection
          const introspectResult = await authApi.introspectToken();
          
          if (!introspectResult.active) {
            // Token is not valid, try to refresh
            const refreshToken = TokenService.getRefreshToken();
            if (refreshToken) {
              try {
                await authApi.refreshToken(refreshToken);
                // Update user info after successful refresh
                await updateUserInfo();
              } catch (refreshError) {
                // If refresh fails, redirect to login
                TokenService.clearTokens();
                window.location.href = '/auth/login';
              }
            } else {
              // No refresh token available, redirect to login
              TokenService.clearTokens();
              window.location.href = '/auth/login';
            }
          }
        } catch (error) {
          // Handle any errors during the process
          Logger.error('Token validation failed:', error);
          TokenService.clearTokens();
          window.location.href = '/auth/login';
        }
      }
    }, 60 * 1000); // Check every minute

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