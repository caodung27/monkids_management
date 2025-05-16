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
  googleLogin: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  handleSocialAuthCallback: (authData: { access: string; refresh: string; user: User }) => void;
  checkAndRefreshAuth: () => Promise<boolean>;
  forceAuthenticated: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  googleLogin: async () => {},
  logout: async () => {},
  register: async () => {},
  handleSocialAuthCallback: () => {},
  checkAndRefreshAuth: async () => false,
  forceAuthenticated: () => {},
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

  // Function to force the authenticated state without checking with the server
  const forceAuthenticated = () => {
    console.log('AuthContext: Forcing authenticated state');
    // Set authentication flags
    TokenService.forceAuthSuccess();
    
    // If we don't have a user object yet, create a minimal one
    if (!user) {
      // Create a minimal user object with default permissions
      const placeholderUser: User = {
        id: 'placeholder',
        email: 'authenticated@user.com',
        first_name: 'Authenticated',
        last_name: 'User',
        profile_picture: null,
        is_teacher: false,
        is_admin: false
      };
      
      setUser(placeholderUser);
      console.log('AuthContext: Created placeholder user until API call succeeds');
      
      // Try to fetch the real user in the background
      authApi.getCurrentUser()
        .then(userData => {
          console.log('AuthContext: Retrieved actual user data', userData);
          setUser(userData);
        })
        .catch(error => {
          console.error('AuthContext: Failed to get user data after forcing auth', error);
          // Keep the placeholder user - don't revert to unauthenticated
        });
    }
  };

  // New function to check and refresh auth state
  const checkAndRefreshAuth = async (): Promise<boolean> => {
    try {
      console.log('AuthProvider: Checking and refreshing auth');

      // Check if we have tokens
      const accessToken = TokenService.getAccessToken();
      const refreshToken = TokenService.getRefreshToken();
      
      if (!accessToken && !refreshToken) {
        console.log('AuthProvider: No tokens found');
        
        // One last check for auth flags before failing
        const isOAuthSuccess = typeof window !== 'undefined' && (
          localStorage.getItem('auth_successful') === 'true' ||
          sessionStorage.getItem('auth_successful') === 'true' ||
          sessionStorage.getItem('auth_redirect_pending') === 'true' ||
          document.cookie.includes('auth_redirect=true')
        );
        
        if (isOAuthSuccess) {
          console.log('AuthProvider: No tokens but OAuth flags found, allowing access');
          TokenService.forceAuthSuccess();
          return true;
        }
        
        return false;
      }

      // Check localStorage for special OAuth flags
      const isFromOAuth = typeof window !== 'undefined' && 
        (sessionStorage.getItem('auth_successful') === 'true' ||
         localStorage.getItem('auth_successful') === 'true' ||
         document.cookie.includes('auth_redirect=true'));
         
      console.log('AuthProvider: Token check', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken, isFromOAuth });
      
      if (isFromOAuth) {
        console.log('AuthProvider: OAuth flow detected, allowing access');
        // Get current user if we don't have user data yet
        if (!user) {
          try {
            const userData = await authApi.getCurrentUser();
            setUser(userData);
            return true;
          } catch (error) {
            console.error('AuthProvider: Failed to get user data after OAuth', error);
            // Still return true to allow access to protected pages
            return true;
          }
        }
        return true;
      }
      
      // Try to refresh token with backend if needed
      if (refreshToken && (!user || !accessToken)) {
        try {
          await authApi.refreshToken(refreshToken);
          const userData = await authApi.getCurrentUser();
          setUser(userData);
          return true;
        } catch (refreshError) {
          console.error('AuthProvider: Token refresh failed', refreshError);
          
          // Check if we should still allow access because of OAuth flags
          if (typeof window !== 'undefined' && (
              localStorage.getItem('auth_successful') === 'true' || 
              localStorage.getItem('block_auth_redirect') === 'true'
          )) {
            console.log('AuthProvider: Token refresh failed but OAuth flags found, allowing access');
            return true;
          }
          
          return false;
        }
      }

      return !!user || !!accessToken || !!refreshToken;
    } catch (error) {
      console.error('AuthProvider: Error checking auth', error);
      return false;
    }
  };

  // Check if the user is authenticated on component mount
  useEffect(() => {
    const initAuth = async () => {
      // Skip if already initialized
      if (initComplete.current) {
        return;
      }
      
      try {
        // First check cookies and localStorage
        const accessToken = TokenService.getAccessToken();
        const refreshToken = TokenService.getRefreshToken();
        
        console.log('AuthProvider: Initial auth check', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken,
          localStorage: typeof window !== 'undefined' ? {
            accessToken: localStorage.getItem('accessToken'),
            refreshToken: localStorage.getItem('refreshToken'),
            authSuccess: localStorage.getItem('auth_successful')
          } : null,
          sessionStorage: typeof window !== 'undefined' ? {
            authSuccess: sessionStorage.getItem('auth_successful')
          } : null
        });
        
        // Check for OAuth flags
        const isOAuthSuccess = typeof window !== 'undefined' && (
          localStorage.getItem('auth_successful') === 'true' ||
          sessionStorage.getItem('auth_successful') === 'true' ||
          sessionStorage.getItem('auth_redirect_pending') === 'true' ||
          document.cookie.includes('auth_redirect=true')
        );
        
        // Create placeholder user if we have auth flags but API calls might fail
        const createPlaceholderUser = () => {
          // Create a minimal user object with default permissions
          const placeholderUser: User = {
            id: 'placeholder-' + Date.now(),
            email: localStorage.getItem('userEmail') || 'authenticated@user.com',
            first_name: 'Authenticated',
            last_name: 'User',
            profile_picture: null,
            is_teacher: false,
            is_admin: false
          };
          
          console.log('AuthProvider: Created placeholder user until API call succeeds');
          return placeholderUser;
        };
        
        // Skip further checks if no tokens found and not in OAuth flow
        if (!accessToken && !refreshToken && !isOAuthSuccess) {
          setIsLoading(false);
          initComplete.current = true;
          return;
        }
        
        // If coming from OAuth flow, consider authenticated
        const isFromOAuth = typeof window !== 'undefined' && 
          (sessionStorage.getItem('auth_successful') === 'true' ||
           localStorage.getItem('auth_successful') === 'true');
           
        if (isFromOAuth) {
          console.log('AuthProvider: OAuth flow detected, fetching user data');
          // Force authentication flags
          TokenService.forceAuthSuccess();
          
          // Set a placeholder user immediately to ensure UI shows authenticated state
          setUser(createPlaceholderUser());
          
          // Get user data
          try {
            const userData = await authApi.getCurrentUser();
            setUser(userData);
          } catch (error) {
            console.error('AuthProvider: Failed to get user data after OAuth', error);
            // Don't clear tokens yet - might be temporary issue
            // Keep the placeholder user to maintain authenticated state
          }
          setIsLoading(false);
          initComplete.current = true;
          return;
        }

        // Regular flow - get current user
        try {
          const userData = await authApi.getCurrentUser();
          
          // Get user permissions
          try {
            const permissions = await authApi.getUserPermissions();
            userData.permissions = permissions;
          } catch (permError) {
            console.error('AuthProvider: Failed to get user permissions', permError);
          }
          
          setUser(userData);
        } catch (error) {
          console.error('AuthProvider: Authentication error', error);
          
          // Check if we should still maintain authenticated state
          if (isOAuthSuccess || isFromOAuth || localStorage.getItem('block_auth_redirect') === 'true') {
            console.log('AuthProvider: API check failed but in OAuth flow, forcing authenticated state');
            // Set a placeholder user to maintain authenticated state
            setUser(createPlaceholderUser());
            // Force authentication
            TokenService.forceAuthSuccess();
          } else {
            // Only clear tokens if not from OAuth flow
            TokenService.clearTokens();
          }
        }
      } finally {
        setIsLoading(false);
        initComplete.current = true;
      }
    };

    initAuth();
  }, []);

  // Set up token validation interval
  useEffect(() => {
    // Only start the interval if user is authenticated
    if (user) {
      console.log('AuthContext: Setting up token validation interval');
      
      // Run initial validation
      validateToken();
      
      // Set up interval to run every 60 seconds (1 minute)
      tokenValidationInterval.current = setInterval(() => {
        validateToken();
      }, 60 * 1000);
    }
    
    // Cleanup function to clear the interval when component unmounts or user logs out
    return () => {
      if (tokenValidationInterval.current) {
        console.log('AuthContext: Clearing token validation interval');
        clearInterval(tokenValidationInterval.current);
        tokenValidationInterval.current = null;
      }
    };
  }, [user]); // Dependency on user ensures interval starts/stops with authentication state

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(email, password);
      
      // Store tokens is handled in the API service
      
      // Get user profile
      const userData = await authApi.getCurrentUser();
      
      // Get user permissions
      try {
        const permissions = await authApi.getUserPermissions();
        userData.permissions = permissions;
      } catch (error) {
        console.error('Failed to get user permissions:', error);
      }
      
      setUser(userData);
      
      notifications.show({
        title: 'Đăng nhập thành công',
        message: `Chào mừng ${userData.first_name || userData.email}!`,
        color: 'green',
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      notifications.show({
        title: 'Đăng nhập thất bại',
        message: error.response?.data?.detail || 'Email hoặc mật khẩu không chính xác',
        color: 'red',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Google login function
  const googleLogin = async (token: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.googleLogin(token);
      
      // Store tokens is handled in the API service
      
      setUser(response.user);
      
      notifications.show({
        title: 'Đăng nhập thành công',
        message: `Chào mừng ${response.user.first_name || response.user.email}!`,
        color: 'green',
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google login error:', error);
      
      notifications.show({
        title: 'Đăng nhập thất bại',
        message: error.response?.data?.detail || 'Lỗi xác thực Google',
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
      
      // 1. Get the refresh token if it exists
      const refreshToken = TokenService.getRefreshToken();
      
      // 2. Call the backend logout API, if we have a refresh token
      if (refreshToken) {
        console.log('AuthContext: Calling backend logout API');
        await authApi.logout(refreshToken);
      } else {
        console.log('AuthContext: No refresh token found, skipping backend logout call');
      }
      
      // 3. Clear all authentication state on the frontend
      console.log('AuthContext: Clearing all frontend auth state');
      
      // 3.1 Clear the user object in React state
      setUser(null);
      
      // 3.2 Clear all tokens from localStorage and cookies
      TokenService.clearTokens();
      
      // 3.3 Clear all auth-related flags in localStorage and sessionStorage
      if (typeof window !== 'undefined') {
        // Clear localStorage flags
        localStorage.removeItem('auth_successful');
        localStorage.removeItem('block_auth_redirect');
        localStorage.removeItem('block_until');
        localStorage.removeItem('auth_timestamp');
        
        // Clear sessionStorage flags
        sessionStorage.removeItem('auth_successful');
        sessionStorage.removeItem('auth_redirect_pending');
        sessionStorage.removeItem('page_reloaded');
        sessionStorage.removeItem('auth_refresh_attempt');
        sessionStorage.removeItem('manual_continue');
        sessionStorage.removeItem('oauth_initiated');
        sessionStorage.removeItem('access_token_value');
        sessionStorage.removeItem('refresh_token_value');
        
        // Clear auth check counter to prevent future auth check loops
        sessionStorage.removeItem('auth_check_count');
      }
      
      // 4. Manually clear document.cookie as extra precaution
      if (typeof document !== 'undefined') {
        // Set cookies with expired date to clear them
        document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
        document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
        document.cookie = 'auth_redirect=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
        document.cookie = 'auth_timestamp=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
      }
      
      // 5. Show success notification
      notifications.show({
        title: 'Đã đăng xuất',
        message: 'Bạn đã đăng xuất thành công.',
        color: 'blue',
      });
      
      // 6. Redirect to login page
      console.log('AuthContext: Redirecting to login page');
      
      // Reset any auth check counters to prevent loops
      sessionStorage.setItem('auth_check_count', '0');
      
      // Use router.push to navigate to login page
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if there's an error, still clear all local state and redirect
      setUser(null);
      TokenService.clearTokens();
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_successful');
        sessionStorage.removeItem('auth_successful');
        // Clear all other auth-related flags...
      }
      
      // Show error notification
      notifications.show({
        title: 'Đăng xuất có lỗi',
        message: 'Đã có lỗi khi đăng xuất, nhưng bạn đã được đăng xuất khỏi thiết bị này.',
        color: 'yellow',
      });
      
      // Still redirect to login
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(userData);
      
      // Token storage is handled in the API service
      
      setUser(response.user);
      
      notifications.show({
        title: 'Đăng ký thành công',
        message: 'Tài khoản đã được tạo. Đang đăng nhập...',
        color: 'green',
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Show specific validation errors if available
      const errorMessage = error.response?.data?.email 
        ? `Email: ${error.response.data.email[0]}` 
        : error.response?.data?.password 
          ? `Mật khẩu: ${error.response.data.password[0]}`
          : 'Đăng ký thất bại. Vui lòng thử lại.';
      
      notifications.show({
        title: 'Đăng ký thất bại',
        message: errorMessage,
        color: 'red',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // New function to handle social auth callback
  const handleSocialAuthCallback = (authData: { access: string; refresh: string; user: User }) => {
    console.log('AuthContext: handleSocialAuthCallback called', {
      hasAccessToken: !!authData.access,
      hasRefreshToken: !!authData.refresh,
      hasUserData: !!authData.user
    });
    
    setIsLoading(true);
    try {
      // Set auth flags
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_successful', 'true');
        sessionStorage.setItem('auth_successful', 'true');
      }
      
      // The tokens are already set in the callback page, but we'll set them again to be sure
      console.log('AuthContext: Setting tokens');
      TokenService.setAccessToken(authData.access);
      TokenService.setRefreshToken(authData.refresh);
      
      console.log('AuthContext: Updating user state');
      setUser(authData.user);
      
      console.log('AuthContext: Showing success notification');
      notifications.show({
        title: 'Đăng nhập thành công',
        message: `Chào mừng ${authData.user.first_name || authData.user.email}!`,
        color: 'green',
      });
      
      console.log('AuthContext: Redirecting to dashboard');
      
      // Use window.location.replace for consistent redirect
      window.location.replace('/dashboard');
    } catch (error) {
      console.error('AuthContext: Error handling social auth callback:', error);
      notifications.show({
        title: 'Xác thực thất bại',
        message: 'Không thể hoàn tất xác thực. Vui lòng thử lại.',
        color: 'red',
      });
      router.push('/login');
    } finally {
      setTimeout(() => {
        console.log('AuthContext: Finishing loading state');
        setIsLoading(false);
      }, 1000);
    }
  };

  // Function for token introspection
  const validateToken = async () => {
    // Internal logout function to avoid circular references
    const handleTokenValidationFailure = () => {
      // Check if we have auth flags from OAuth before logging out
      const hasAuthFlags = typeof window !== 'undefined' && (
        localStorage.getItem('auth_successful') === 'true' ||
        sessionStorage.getItem('auth_successful') === 'true') ||
        document.cookie.includes('auth_successful=true');
      
      // Check if there's a block on logout redirects
      const blockRedirect = typeof window !== 'undefined' && 
        localStorage.getItem('block_auth_redirect') === 'true';
        
      // Check if this is a recent authentication (within 2 minutes)
      const authTimestamp = parseInt(localStorage.getItem('auth_timestamp') || '0');
      const isRecentAuth = authTimestamp > 0 && 
        (Date.now() - authTimestamp) < 120000; // 2 minutes
      
      // Check for too many auth checks - prevent causing a loop
      const authCheckCount = parseInt(sessionStorage.getItem('auth_check_count') || '0');
      const tooManyChecks = authCheckCount > 3;
      
      console.log('AuthContext: Token validation check before logout', { 
        hasAuthFlags, 
        blockRedirect, 
        isRecentAuth,
        authTimestamp,
        authCheckCount,
        tooManyChecks,
        timeSinceAuth: authTimestamp ? (Date.now() - authTimestamp) / 1000 + ' seconds' : 'N/A'
      });
      
      // Do not log out if we have auth flags from OAuth or if there's a block or too many checks
      if (hasAuthFlags || blockRedirect || isRecentAuth || tooManyChecks) {
        console.log('AuthContext: Skipping logout due to OAuth flags, recent auth, or too many checks');
        
        // In case of too many checks, reset the counter and force auth success
        if (tooManyChecks) {
          console.log('AuthContext: Too many auth checks detected, resetting counter and forcing auth success');
          sessionStorage.setItem('auth_check_count', '0');
          TokenService.forceAuthSuccess();
        }
        
        // If the user data is missing, try to get it again
        if (!user) {
          // Try to fetch user data
          authApi.getCurrentUser()
            .then(userData => {
              setUser(userData);
              console.log('AuthContext: Retrieved user data after validation check');
            })
            .catch(error => {
              console.error('AuthContext: Failed to get user data after validation check', error);
            });
        }
        
        return;
      }
      
      console.error('AuthContext: Token validation failed, logging out user');
      
      // Only clear tokens if no OAuth flags and no recent authentication
      TokenService.clearTokens();
      
      // Clear user state
      setUser(null);
      
      // Clear interval
      if (tokenValidationInterval.current) {
        console.log('AuthContext: Clearing token validation interval');
        clearInterval(tokenValidationInterval.current);
        tokenValidationInterval.current = null;
      }
      
      // Show notification to user
      notifications.show({
        title: 'Phiên đăng nhập hết hạn',
        message: 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.',
        color: 'orange',
      });
      
      // Redirect to login page
      setTimeout(() => {
        router.push('/login');
      }, 500);
    };
    
    try {
      // Skip validation if not authenticated
      if (!user) return;
      
      // Skip validation for recent authentications (within 30 seconds)
      const authTimestamp = parseInt(localStorage.getItem('auth_timestamp') || '0');
      const isVeryRecentAuth = authTimestamp > 0 && 
        (Date.now() - authTimestamp) < 30000; // 30 seconds
        
      if (isVeryRecentAuth) {
        console.log('AuthContext: Skipping token validation for very recent authentication');
        return;
      }
      
      console.log('AuthContext: Running token validation check');
      const accessToken = TokenService.getAccessToken();
      
      if (!accessToken) {
        console.warn('AuthContext: No access token found during validation check');
        
        // Try to refresh using refresh token
        const refreshToken = TokenService.getRefreshToken();
        if (refreshToken) {
          try {
            console.log('AuthContext: No access token, attempting refresh');
            await authApi.refreshToken(refreshToken);
            console.log('AuthContext: Token refreshed successfully');
            return;
          } catch (refreshError) {
            console.error('AuthContext: Failed to refresh token during validation check', refreshError);
            // If refresh fails, check auth flags before logout
            handleTokenValidationFailure();
            return;
          }
        } else {
          // Check for OAuth auth flags before logging out
          const hasAuthFlags = typeof window !== 'undefined' && (
            localStorage.getItem('auth_successful') === 'true' ||
            sessionStorage.getItem('auth_successful') === 'true');
            
          if (hasAuthFlags) {
            console.log('AuthContext: No tokens but OAuth flags present, skipping logout');
            return;
          }
          
          console.error('AuthContext: No refresh token available, logging out');
          handleTokenValidationFailure();
          return;
        }
      }
      
      // Introspect token validity
      const introspectionResult = await authApi.introspectToken();
      
      if (introspectionResult.active) {
        console.log('AuthContext: Token is valid, expires in', introspectionResult.remaining_seconds, 'seconds');
        
        // Update auth timestamp to indicate recent validation
        localStorage.setItem('auth_timestamp', Date.now().toString());
        
        // If token is about to expire (less than 5 minutes), refresh it
        if (introspectionResult.remaining_seconds < 300) {
          console.log('AuthContext: Token expiring soon, refreshing');
          
          const refreshToken = TokenService.getRefreshToken();
          if (refreshToken) {
            try {
              await authApi.refreshToken(refreshToken);
              console.log('AuthContext: Token refreshed successfully');
            } catch (refreshError) {
              console.error('AuthContext: Failed to refresh token', refreshError);
              handleTokenValidationFailure();
            }
          } else {
            console.error('AuthContext: No refresh token available for refresh');
            handleTokenValidationFailure();
          }
        }
      } else {
        console.warn('AuthContext: Token is invalid, attempting refresh');
        
        // Try to refresh the token
        const refreshToken = TokenService.getRefreshToken();
        if (refreshToken) {
          try {
            await authApi.refreshToken(refreshToken);
            console.log('AuthContext: Token refreshed successfully after validation failure');
          } catch (refreshError) {
            console.error('AuthContext: Failed to refresh token after validation failure', refreshError);
            handleTokenValidationFailure();
          }
        } else {
          // Check for OAuth auth flags before logging out
          const hasAuthFlags = typeof window !== 'undefined' && (
            localStorage.getItem('auth_successful') === 'true' ||
            sessionStorage.getItem('auth_successful') === 'true');
            
          if (hasAuthFlags) {
            console.log('AuthContext: No tokens but OAuth flags present, skipping logout');
            return;
          }
          
          console.error('AuthContext: No refresh token available, logging out');
          handleTokenValidationFailure();
        }
      }
    } catch (error) {
      console.error('AuthContext: Token validation error', error);
      // Don't automatically logout on validation error - might be temporary
    }
  };

  // Context value
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    googleLogin,
    logout,
    register,
    handleSocialAuthCallback,
    checkAndRefreshAuth,
    forceAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 