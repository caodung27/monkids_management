'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, TokenService } from '@/api/apiService';
import { notifications } from '@mantine/notifications';

// Define user types
export interface UserPermissions {
  is_authenticated: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_teacher: boolean;
  is_admin: boolean;
  email: string;
  id: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture: string | null;
  is_teacher: boolean;
  is_admin: boolean;
  permissions?: UserPermissions;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
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
          const userData = await authApi.getCurrentUser();
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
        const userData = await authApi.getCurrentUser();
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
      const response = await authApi.login(email, password);
      if (response) {
        await checkAndRefreshAuth();
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      const refreshToken = TokenService.getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
      
      // Clear user state
      setUser(null);
      
      // Clear all tokens
      TokenService.clearTokens();
      
      // Clear all localStorage items
      localStorage.clear();
      
      // Clear all sessionStorage items
      sessionStorage.clear();
      
      // Manually clear cookies as extra precaution
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Show success notification
      notifications.show({
        title: 'Success',
        message: 'Logged out successfully',
        color: 'green',
      });
      
      // Reset auth check counters
      if (tokenValidationInterval.current) {
        clearInterval(tokenValidationInterval.current);
        tokenValidationInterval.current = null;
      }
      
      setIsLoading(false);
      
      // Add a small delay before redirecting to prevent race conditions
      setTimeout(() => {
        window.location.replace('/login');
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if there's an error, still clear local state and redirect
      setUser(null);
      TokenService.clearTokens();
      localStorage.clear();
      sessionStorage.clear();
      
      notifications.show({
        title: 'Error',
        message: 'Error during logout, but you have been logged out',
        color: 'red',
      });
      
      setIsLoading(false);
      window.location.replace('/login');
    }
  };

  // Register function
  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(userData);
      if (response) {
        await checkAndRefreshAuth();
        router.push('/dashboard');
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