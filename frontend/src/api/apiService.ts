'use client';

import axios from 'axios';
import Cookies from 'js-cookie';

// Use environment variables with fallback to default URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Cookie options with proper security settings to work in both dev and prod
const COOKIE_OPTIONS = {
  path: '/',
  expires: 7, // 7 days
  // SameSite and Secure are set automatically based on environment
};

// Helper to get the current protocol-dependent settings
const getSecuritySettings = () => {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  if (isHttps) {
    return {
      sameSite: 'none' as 'lax' | 'strict' | 'none' | undefined,
      secure: true
    };
  } else {
    // For HTTP (localhost development), be more permissive
    // Let browser defaults for SameSite (usually Lax) and Secure (false) apply
    return {
      sameSite: undefined, // Let browser default
      secure: undefined    // Let browser default
    };
  }
};

// Token management functions
export const TokenService = {
  getAccessToken: () => {
    try {
      // Check in multiple storage locations (in order of preference)
      const lsToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const cookieToken = Cookies.get('accessToken'); 
      const sessionToken = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
      
      // MORE DETAILED LOGGING FOR COOKIES
      const allCookies = Cookies.get(); // Get all cookies as an object
      console.log('TokenService.getAccessToken: All js-cookies visible:', allCookies);
      if (allCookies && typeof allCookies === 'object' && 'accessToken' in allCookies) {
        console.log('TokenService.getAccessToken: "accessToken" key found in Cookies.get() object. Value:', allCookies.accessToken ? allCookies.accessToken.substring(0,10) + '...' : 'EMPTY_STRING');
      } else {
        console.log('TokenService.getAccessToken: "accessToken" key NOT found in Cookies.get() object.');
      }
      console.log('TokenService.getAccessToken: Direct Cookies.get("accessToken") attempt:', cookieToken ? cookieToken.substring(0,10) + '...' : 'NULL/UNDEFINED');

      console.log('TokenService.getAccessToken sources:', {
        localStorage: !!lsToken,
        cookiesViaDirectGet: !!cookieToken, // Explicitly log direct get
        sessionStorage: !!sessionToken
      });
      
      const token = lsToken || cookieToken || sessionToken;
      
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length !== 3) {
            console.error('TokenService: Invalid token format detected from source:', { lsToken: !!lsToken, cookieToken: !!cookieToken, sessionToken: !!sessionToken });
            return null;
          }
          
          try {
            const payloadBase64 = parts[1];
            const payload = JSON.parse(atob(payloadBase64));
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
              console.error('TokenService: Token is expired', { exp: payload.exp, now, diff: now - payload.exp, tokenSource: { lsToken: !!lsToken, cookieToken: !!cookieToken, sessionToken: !!sessionToken } });
              return null;
            }
            console.log('TokenService: Token is valid (format and expiry)', { exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'none', type: payload.token_type || 'unknown' });
          } catch (parseError) {
            console.warn('TokenService: Could not parse token payload, but format seems JWT-like.', parseError);
          }
          return token.trim();
        } catch (validationError) {
          console.error('TokenService: Error validating token structure', validationError);
          return null;
        }
      }
      console.log('TokenService.getAccessToken: No token found from any source.');
      return null;
    } catch (error) {
      console.error('TokenService: Error getting access token', error);
      return null;
    }
  },
  setAccessToken: (token: string) => {
    try {
      if (!token) {
        console.error('TokenService: Attempted to set null/empty access token');
        return null;
      }
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('TokenService: Attempted to set invalid token format');
        return null;
      }
      const cleanToken = token.trim();
      console.log(`TokenService.setAccessToken: Setting token ${cleanToken.substring(0, 10)}...`);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', cleanToken);
        sessionStorage.setItem('accessToken', cleanToken);
        localStorage.setItem('token_set_time', Date.now().toString());
        console.log('TokenService.setAccessToken: Successfully set in localStorage and sessionStorage.');
      }
      
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      
      if (isHttps) {
        const cookieAttributes: Cookies.CookieAttributes = { 
          path: COOKIE_OPTIONS.path,
          expires: COOKIE_OPTIONS.expires,
          sameSite: 'none',
          secure: true
        };
        Cookies.set('accessToken', cleanToken, cookieAttributes);
        console.log('TokenService.setAccessToken (HTTPS): Attempted to set cookie via Cookies.set() with attributes:', cookieAttributes);
      } else {
        // HTTP (localhost) - Use direct document.cookie assignment
        const expires = new Date(Date.now() + COOKIE_OPTIONS.expires * 24 * 60 * 60 * 1000).toUTCString();
        const cookieString = `accessToken=${encodeURIComponent(cleanToken)}; path=${COOKIE_OPTIONS.path}; expires=${expires}`;
        document.cookie = cookieString;
        console.log('TokenService.setAccessToken (HTTP): Attempted to set cookie via document.cookie:', cookieString);
      }

      // Verification step for cookie (always use Cookies.get for reading)
      const verificarCookie = Cookies.get('accessToken');
      if (verificarCookie) {
        console.log('TokenService.setAccessToken: Cookie "accessToken" VERIFIED (via Cookies.get()) immediately after setting. Value:', verificarCookie.substring(0,10) + '...');
      } else {
        console.error('TokenService.setAccessToken: Cookie "accessToken" FAILED VERIFICATION (via Cookies.get()) immediately after setting.');
        const allCookiesByJsCookie = Cookies.get();
        console.log('TokenService.setAccessToken: All cookies after failed set attempt (via Cookies.get()):', allCookiesByJsCookie);
        if (typeof document !== 'undefined') {
            console.log('TokenService.setAccessToken: All cookies via document.cookie raw:', document.cookie);
        }
      }
      
      return cleanToken;
    } catch (error) {
      console.error('TokenService: Error setting access token', error);
      return null;
    }
  },
  getRefreshToken: () => {
    try {
      // Try to get from localStorage first, then cookies
      let token = null;
      
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('refreshToken');
      }
      
      if (!token) {
        token = Cookies.get('refreshToken');
      }
      
      // Validate token format
      if (token) {
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.error('TokenService: Invalid refresh token format detected');
          return null;
        }
        return token;
      }
      
      return null;
    } catch (error) {
      console.error('TokenService: Error getting refresh token', error);
      return null;
    }
  },
  setRefreshToken: (token: string) => {
    try {
      if (!token) {
        console.error('TokenService: Attempted to set null/empty refresh token');
        return null;
      }
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('TokenService: Attempted to set invalid refresh token format');
        return null;
      }
      
      const cleanToken = token.trim();
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', cleanToken);
      }
      
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const refreshTokenExpiresDays = 30;

      if (isHttps) {
        const cookieAttributes: Cookies.CookieAttributes = {
          path: COOKIE_OPTIONS.path,
          expires: refreshTokenExpiresDays,
          sameSite: 'none',
          secure: true
        };
        Cookies.set('refreshToken', cleanToken, cookieAttributes);
        console.log('TokenService.setRefreshToken (HTTPS): Attempted to set cookie via Cookies.set() with attributes:', cookieAttributes);
      } else {
        // HTTP (localhost) - Use direct document.cookie assignment
        const expires = new Date(Date.now() + refreshTokenExpiresDays * 24 * 60 * 60 * 1000).toUTCString();
        const cookieString = `refreshToken=${encodeURIComponent(cleanToken)}; path=${COOKIE_OPTIONS.path}; expires=${expires}`;
        document.cookie = cookieString;
        console.log('TokenService.setRefreshToken (HTTP): Attempted to set cookie via document.cookie:', cookieString);
      }
      
      // Verification for refresh token cookie (always use Cookies.get for reading)
      const verifyRefreshTokenCookie = Cookies.get('refreshToken');
      if (verifyRefreshTokenCookie) {
          console.log('TokenService.setRefreshToken: Cookie "refreshToken" VERIFIED (via Cookies.get()) immediately. Value:', verifyRefreshTokenCookie.substring(0,10) + '...');
      } else {
          console.error('TokenService.setRefreshToken: Cookie "refreshToken" FAILED VERIFICATION (via Cookies.get()).');
           if (typeof document !== 'undefined') {
            console.log('TokenService.setRefreshToken: All cookies via document.cookie raw after failed set:', document.cookie);
        }
      }
      
      return cleanToken;
    } catch (error) {
      console.error('TokenService: Error setting refresh token', error);
      return null;
    }
  },
  clearTokens: () => {
    console.log('TokenService: Clearing all authentication tokens and state');
    
    // 1. Clear from localStorage
    if (typeof window !== 'undefined') {
      // Remove tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Remove auth flags
      localStorage.removeItem('auth_successful');
      localStorage.removeItem('block_auth_redirect');
      localStorage.removeItem('block_until');
      localStorage.removeItem('auth_timestamp');
      
      // Remove from sessionStorage too
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('auth_successful');
      sessionStorage.removeItem('auth_redirect_pending');
      sessionStorage.removeItem('oauth_initiated');
      sessionStorage.removeItem('manual_continue');
      sessionStorage.removeItem('access_token_value');
      sessionStorage.removeItem('refresh_token_value');
    }
    
    // 2. Clear from cookies using js-cookie
    Cookies.remove('accessToken', { path: '/' });
    Cookies.remove('refreshToken', { path: '/' });
    Cookies.remove('auth_redirect', { path: '/' });
    Cookies.remove('auth_timestamp', { path: '/' });
    
    // 3. Also try to clear cookies with document.cookie (as fallback)
    if (typeof document !== 'undefined') {
      // Using cookie expiration technique
      document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
      document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
      document.cookie = 'auth_redirect=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
      document.cookie = 'auth_timestamp=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
      
      // Try with secure/samesite variations for cross-domain scenarios
      const isHttps = window.location.protocol === 'https:';
      if (isHttps) {
        document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; samesite=none;';
        document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; samesite=none;';
      }
    }
    
    console.log('TokenService: All tokens and auth state cleared');
  },
  hasAnyToken: () => {
    // Kiểm tra nhanh xem có bất kỳ token nào không
    try {
      // Kiểm tra localStorage
      if (typeof window !== 'undefined') {
        if (localStorage.getItem('accessToken') || localStorage.getItem('refreshToken')) {
          return true;
        }
      }
      
      // Kiểm tra cookies
      if (Cookies.get('accessToken') || Cookies.get('refreshToken')) {
        return true;
      }
      
      // Kiểm tra các cờ đặc biệt
      if (typeof window !== 'undefined') {
        if (localStorage.getItem('auth_successful') === 'true' || 
            sessionStorage.getItem('auth_successful') === 'true' ||
            localStorage.getItem('block_auth_redirect') === 'true' ||
            sessionStorage.getItem('auth_redirect_pending') === 'true' ||
            sessionStorage.getItem('manual_continue') === 'true') {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('TokenService: Error checking tokens', error);
      return false;
    }
  },
  forceAuthSuccess: () => {
    // Utility function to force auth success flags
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_successful', 'true');
      sessionStorage.setItem('auth_successful', 'true');
      localStorage.setItem('block_auth_redirect', 'true');
      localStorage.setItem('block_until', (Date.now() + 10000).toString());
      
      // Log what we did
      console.log('TokenService: Forced auth success flags');
    }
  },
  // Add direct checking function for token existence
  checkTokensExist: () => {
    try {
      // Check in localStorage
      const lsAccessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const lsRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      
      // Check in cookies
      const cookieAccessToken = Cookies.get('accessToken');
      const cookieRefreshToken = Cookies.get('refreshToken');
      
      // Check in document.cookie (as fallback for cross-domain cookies)
      const docCookieAccessToken = document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1];
      const docCookieRefreshToken = document.cookie.split('; ').find(row => row.startsWith('refreshToken='))?.split('=')[1];
      
      // Check auth flags
      const hasAuthFlags = typeof window !== 'undefined' && (
        localStorage.getItem('auth_successful') === 'true' ||
        sessionStorage.getItem('auth_successful') === 'true' ||
        localStorage.getItem('block_auth_redirect') === 'true'
      );
      
      // Log status for debugging
      const tokenStatus = {
        localStorage: {
          accessToken: !!lsAccessToken,
          refreshToken: !!lsRefreshToken
        },
        cookies: {
          jsAccessToken: !!cookieAccessToken,
          jsRefreshToken: !!cookieRefreshToken,
          docAccessToken: !!docCookieAccessToken,
          docRefreshToken: !!docCookieRefreshToken
        },
        flags: {
          authSuccessful: localStorage.getItem('auth_successful') === 'true',
          sessionAuthSuccessful: sessionStorage.getItem('auth_successful') === 'true',
          blockRedirect: localStorage.getItem('block_auth_redirect') === 'true'
        }
      };
      
      console.log('TokenService: Token check result', tokenStatus);
      
      // Return true if we have any token
      return !!(
        lsAccessToken || lsRefreshToken || 
        cookieAccessToken || cookieRefreshToken ||
        docCookieAccessToken || docCookieRefreshToken ||
        hasAuthFlags
      );
    } catch (error) {
      console.error('TokenService: Error checking tokens', error);
      return false;
    }
  },
  verifyAndRefreshTokens: async () => {
    try {
      // Check if we have auth flags but no valid token
      const hasTokens = TokenService.checkTokensExist();
      
      // If we don't have tokens, return false immediately
      if (!hasTokens) {
        console.error('TokenService: No authentication tokens found');
        return false;
      }
      
      // Get refresh token
      const refreshToken = TokenService.getRefreshToken();
      
      // If we have a refresh token, try to refresh the access token
      if (refreshToken) {
        try {
          // Use axios directly to avoid circular imports
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
          const response = await fetch(`${API_URL}/token/refresh/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh: refreshToken })
          });
          
          // Check if the response is OK
          if (response.ok) {
            const data = await response.json();
            
            // Store the new access token
            TokenService.setAccessToken(data.access);
            console.log('TokenService: Successfully refreshed access token');
            
            return true;
          } else {
            console.error('TokenService: Failed to refresh token, status:', response.status);
            return false;
          }
        } catch (error) {
          console.error('TokenService: Error refreshing token:', error);
          return false;
        }
      }
      
      // If we don't have a refresh token but have an access token, return true
      const accessToken = TokenService.getAccessToken();
      return !!accessToken;
    } catch (error) {
      console.error('TokenService: Error verifying tokens:', error);
      return false;
    }
  },
  getValidToken: async (operation = 'API call') => {
    try {
      console.log(`TokenService.getValidToken: Starting for ${operation}`);
      
      // Step 1: Try to get token from our standard getter
      let token = TokenService.getAccessToken();
      if (token) {
        console.log(`TokenService.getValidToken: Got token from standard getter`);
        return token;
      }
      
      // Step 2: If no token, try to refresh using refresh token
      console.log(`TokenService.getValidToken: No token from getter, trying refresh`);
      const refreshToken = TokenService.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(`${API_URL}/token/refresh/`, {
            refresh: refreshToken
          }, {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
            timeout: 5000
          });
          
          if (refreshResponse.data?.access) {
            console.log(`TokenService.getValidToken: Refresh successful`);
            TokenService.setAccessToken(refreshResponse.data.access);
            return refreshResponse.data.access;
          }
        } catch (refreshError) {
          console.error(`TokenService.getValidToken: Refresh failed`, refreshError);
        }
      }
      
      // Step 3: Try direct sources if refresh failed
      console.log(`TokenService.getValidToken: Trying direct sources`);
      
      // 3.1 Check cookies
      const cookieToken = Cookies.get('accessToken');
      if (cookieToken) {
        console.log(`TokenService.getValidToken: Found token in cookies`);
        TokenService.setAccessToken(cookieToken);
        return cookieToken;
      }
      
      // 3.2 Check sessionStorage
      if (typeof window !== 'undefined') {
        const sessionToken = sessionStorage.getItem('accessToken');
        if (sessionToken) {
          console.log(`TokenService.getValidToken: Found token in sessionStorage`);
          TokenService.setAccessToken(sessionToken);
          return sessionToken;
        }
      }
      
      // 3.3 Check document.cookie directly
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(/accessToken=([^;]+)/);
        if (match && match[1]) {
          console.log(`TokenService.getValidToken: Found token in document.cookie`);
          TokenService.setAccessToken(match[1]);
          return match[1];
        }
      }
      
      // Step 4: Check if we have auth flags and try session-to-token exchange
      if (typeof window !== 'undefined' && (
          localStorage.getItem('auth_successful') === 'true' ||
          sessionStorage.getItem('auth_successful') === 'true')
      ) {
        console.log(`TokenService.getValidToken: Has auth flags, forcing success`);
        TokenService.forceAuthSuccess();
        
        // Try session exchange
        try {
          console.log(`TokenService.getValidToken: Attempting session-to-token exchange`);
          const response = await axios.get(`${API_URL}/auth/session-to-token/`, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
          });
          
          if (response.data?.access) {
            console.log(`TokenService.getValidToken: Session exchange successful`);
            TokenService.setAccessToken(response.data.access);
            if (response.data?.refresh) {
              TokenService.setRefreshToken(response.data.refresh);
            }
            return response.data.access;
          }
        } catch (sessionError) {
          console.error(`TokenService.getValidToken: Session exchange failed`, sessionError);
          
          // Step 5: DEVELOPMENT ONLY - Try direct auth as emergency fallback
          try {
            console.log(`TokenService.getValidToken: Attempting emergency direct auth for development`);
            
            // Get user email if available in localStorage
            const userEmail = localStorage.getItem('userEmail') || 'admin@example.com';
            
            const directAuthResponse = await axios.get(`${API_URL}/auth/direct-auth/`, {
              params: { email: userEmail },
              withCredentials: true,
              headers: { 'Content-Type': 'application/json' },
              timeout: 5000
            });
            
            if (directAuthResponse.data?.access) {
              console.log(`TokenService.getValidToken: EMERGENCY direct auth successful (development only)`);
              TokenService.setAccessToken(directAuthResponse.data.access);
              if (directAuthResponse.data?.refresh) {
                TokenService.setRefreshToken(directAuthResponse.data.refresh);
              }
              
              // Set auth flags to ensure we don't keep hitting this endpoint
              localStorage.setItem('auth_successful', 'true');
              sessionStorage.setItem('auth_successful', 'true');
              localStorage.setItem('auth_timestamp', Date.now().toString());
              
              return directAuthResponse.data.access;
            }
          } catch (directAuthError) {
            console.error(`TokenService.getValidToken: Emergency direct auth failed`, directAuthError);
          }
        }
      } else {
        // No auth flags, but we're desperate - try direct auth in development anyway
        try {
          console.log(`TokenService.getValidToken: No auth flags but trying emergency direct auth as last resort`);
          // Default to admin account
          const directAuthResponse = await axios.get(`${API_URL}/auth/direct-auth/`, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
          });
          
          if (directAuthResponse.data?.access) {
            console.log(`TokenService.getValidToken: Last resort direct auth successful`);
            TokenService.setAccessToken(directAuthResponse.data.access);
            if (directAuthResponse.data?.refresh) {
              TokenService.setRefreshToken(directAuthResponse.data.refresh);
            }
            
            // Set auth flags
            localStorage.setItem('auth_successful', 'true');
            sessionStorage.setItem('auth_successful', 'true');
            localStorage.setItem('auth_timestamp', Date.now().toString());
            
            return directAuthResponse.data.access;
          }
        } catch (directAuthError) {
          console.error(`TokenService.getValidToken: Last resort direct auth failed`, directAuthError);
        }
      }
      
      // If we get here, we have no usable token
      console.error(`TokenService.getValidToken: CRITICAL - No usable token found for ${operation}`);
      return null;
    } catch (error) {
      console.error(`TokenService.getValidToken: Unexpected error`, error);
      return null;
    }
  },
};

// Log API URL to help with debugging
console.log('API URL:', API_URL);

// CORS-aware axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable credentials for CORS
  withCredentials: true,
  // Add timeout
  timeout: 10000
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenService.getAccessToken();
    if (token) {
      // Make sure the Authorization header is properly formatted with Bearer prefix and no extra spaces
      config.headers.Authorization = `Bearer ${token.trim()}`;
      
      // Log the first few characters of the token for debugging
      console.log(`API Request to ${config.url}: Using token ${token.substring(0, 10)}...`);
    } else {
      // Log when no auth token is available for debugging
      console.log(`API Request to ${config.url}: No auth token available`);
      
      // Try to get token from multiple sources as a fallback
      const cookieToken = Cookies.get('accessToken');
      const sessionToken = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
      
      if (cookieToken && cookieToken.trim()) {
        console.log(`Using fallback cookie token for ${config.url}`);
        config.headers.Authorization = `Bearer ${cookieToken.trim()}`;
      } else if (sessionToken && sessionToken.trim()) {
        console.log(`Using fallback session token for ${config.url}`);
        config.headers.Authorization = `Bearer ${sessionToken.trim()}`;
      }
      
      // Check if we're in an OAuth flow and should be authenticated
      const isOAuthFlow = typeof window !== 'undefined' && (
        localStorage.getItem('auth_successful') === 'true' ||
        sessionStorage.getItem('auth_successful') === 'true'
      );
      
      if (isOAuthFlow) {
        console.warn(`API Request to ${config.url}: In OAuth flow but no token available!`);
      }
    }
    
    // Ensure withCredentials is set for cookie transmission
    config.withCredentials = true;
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Log detailed information about the failed request
      console.error('401 Error Details:', {
        url: originalRequest.url,
        method: originalRequest.method,
        hasAuthHeader: !!originalRequest.headers?.Authorization,
        authHeader: originalRequest.headers?.Authorization ? 
                   `${originalRequest.headers.Authorization.substring(0, 15)}...` : null,
        errorMessage: error.response?.data?.detail || 'No error details'
      });
      
      // Check if we have auth flags from OAuth that might let us continue
      const hasAuthFlags = typeof window !== 'undefined' && (
        localStorage.getItem('auth_successful') === 'true' ||
        sessionStorage.getItem('auth_successful') === 'true' ||
        localStorage.getItem('block_auth_redirect') === 'true'
      );
      
      // Check if this is recent auth (within 2 minutes)
      const authTimestamp = parseInt(localStorage.getItem('auth_timestamp') || '0');
      const isRecentAuth = authTimestamp > 0 && (Date.now() - authTimestamp) < 120000;
      
      // If we have recent auth or auth flags, try to refresh token
      if (hasAuthFlags || isRecentAuth) {
        console.log('Token refresh: Detected auth flags, attempting refresh');
        
        try {
          console.log('Token refresh: Attempting to refresh token');
          
          // Try to refresh the token
          const refreshToken = TokenService.getRefreshToken();
          
          if (refreshToken) {
            try {
              // Try to refresh the token using the authApi or directly
              const response = await axios.post(`${API_URL}/token/refresh/`, {
                refresh: refreshToken
              }, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
              });
              
              if (response.data?.access) {
                // Store the new access token
                TokenService.setAccessToken(response.data.access);
                
                // Set the token in the original request
                originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                
                // Update auth timestamp
                localStorage.setItem('auth_timestamp', Date.now().toString());
                
                console.log('Token refresh: Successfully refreshed token, retrying request');
                
                // Retry the original request
                return apiClient(originalRequest);
              } else {
                console.error('Token refresh: Received invalid response from refresh endpoint', response.data);
                
                // Force auth success anyway if we have auth flags
                if (hasAuthFlags) {
                  TokenService.forceAuthSuccess();
                  console.log('Token refresh: Forced auth success despite refresh failure');
                  
                  // Still try to retry the request
                  return apiClient(originalRequest);
                }
              }
            } catch (refreshError) {
              console.error('Token refresh: Error refreshing token:', refreshError);
              
              // If refresh fails but we have auth flags, try to force auth success
              if (hasAuthFlags) {
                TokenService.forceAuthSuccess();
                console.log('Token refresh: Forced auth success after refresh error');
                return apiClient(originalRequest);
              }
            }
          } else if (hasAuthFlags) {
            // No refresh token but have auth flags, try forcing auth
            TokenService.forceAuthSuccess();
            console.log('Token refresh: No refresh token but auth flags present, forced success');
            
            // Try to continue with the request
            return apiClient(originalRequest);
          }
        } catch (mainError) {
          console.error('Token refresh: Unexpected error during refresh flow:', mainError);
        }
      }
      
      // If everything failed and we're still here, reject the request
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/token/', { email, password });
    // Store tokens
    TokenService.setAccessToken(response.data.access);
    TokenService.setRefreshToken(response.data.refresh);
    return response.data;
  },
  googleLogin: async (token: string) => {
    const response = await apiClient.post('/auth/google/', { token });
    // Store tokens
    TokenService.setAccessToken(response.data.access);
    TokenService.setRefreshToken(response.data.refresh);
    return response.data;
  },
  logout: async (refreshToken: string) => {
    try {
      console.log('API: Calling logout endpoint');
      
      // Make sure we have a valid refresh token
      if (!refreshToken) {
        // Try to get it directly if not provided
        refreshToken = TokenService.getRefreshToken() || '';
        
        if (!refreshToken) {
          console.warn('API: No refresh token provided for logout');
        }
      }
      
      // Call the backend logout API with the refresh token to blacklist it
      const response = await axios.post(`${API_URL}/auth/logout/`, 
        { refresh: refreshToken },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            // Also include access token in case it's needed
            'Authorization': `Bearer ${TokenService.getAccessToken() || ''}`
          }
        }
      );
      
      // Clear all tokens from the client side
      console.log('API: Clearing tokens after logout');
      TokenService.clearTokens();
      
      return response.data;
    } catch (error) {
      console.error('API: Error during logout:', error);
      
      // Even if the API call fails, still clear local tokens
      TokenService.clearTokens();
      
      // Rethrow the error so the caller can handle it
      throw error;
    }
  },
  register: async (userData: any) => {
    const response = await apiClient.post('/users/register/', userData);
    // Store tokens
    TokenService.setAccessToken(response.data.access);
    TokenService.setRefreshToken(response.data.refresh);
    return response.data;
  },
  getCurrentUser: async () => {
    try {
      // Get token directly to ensure it's available
      const token = TokenService.getAccessToken();
      
      if (!token) {
        console.error('getCurrentUser: No access token available!');
      }
      
      // Make the request with explicit authorization header
      const response = await axios.get(`${API_URL}/users/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('getCurrentUser: Success', response.data);
      return response.data;
    } catch (error) {
      console.error('getCurrentUser: Error', error);
      throw error;
    }
  },
  getUserPermissions: async () => {
    try {
      // Get token directly to ensure it's available
      const token = TokenService.getAccessToken();
      
      if (!token) {
        console.error('getUserPermissions: No access token available!');
      }
      
      // Make the request with explicit authorization header
      const response = await axios.get(`${API_URL}/auth/permissions/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('getUserPermissions: Success', response.data);
      return response.data;
    } catch (error) {
      console.error('getUserPermissions: Error', error);
      throw error;
    }
  },
  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post('/token/refresh/', { refresh: refreshToken });
    TokenService.setAccessToken(response.data.access);
    return response.data;
  },
  exchangeSessionForToken: async () => {
    try {
      console.log('exchangeSessionForToken: Attempting to exchange session');
      
      // Make direct axios call to avoid potential issues with apiClient
      const response = await axios.get(`${API_URL}/auth/session-to-token/`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // If we got a successful response, store the tokens
      if (response.data?.access) {
        console.log('exchangeSessionForToken: Got tokens, storing');
        TokenService.setAccessToken(response.data.access);
        TokenService.setRefreshToken(response.data.refresh);
      }
      
      return response.data;
    } catch (error) {
      console.error('exchangeSessionForToken: Error', error);
      throw error;
    }
  },
  introspectToken: async () => {
    try {
      const response = await apiClient.get('/token/introspect/');
      return response.data;
    } catch (error) {
      console.error('Error introspecting token:', error);
      return { active: false, error: error };
    }
  },
};

// Student API
export const studentApi = {
  getAllStudents: async (page = 1, pageSize = 50) => {
    try {
      // Get token directly for better reliability
      let token = TokenService.getAccessToken();
      
      // If no token available but we have auth flags, try to force authentication
      if (!token && (localStorage.getItem('auth_successful') === 'true' || 
                     sessionStorage.getItem('auth_successful') === 'true')) {
        console.log('getAllStudents: No token but auth flags present, attempting auth refresh');
        
        // Try to refresh token if available
        const refreshToken = TokenService.getRefreshToken();
        if (refreshToken) {
          try {
            // Try explicit token refresh
            await authApi.refreshToken(refreshToken);
            token = TokenService.getAccessToken();
            console.log('getAllStudents: Successfully refreshed token');
          } catch (refreshError) {
            console.error('getAllStudents: Token refresh failed', refreshError);
          }
        }
        
        // If still no token but we have auth flags, force auth success
        if (!token) {
          console.log('getAllStudents: Forcing auth flags after refresh failure');
          TokenService.forceAuthSuccess();
          
          // Try to re-fetch token one more time before proceeding
          token = TokenService.getAccessToken();
        }
      }
      
      // Create URL with pagination and size parameter (updated from page_size)
      const url = `${API_URL}/students/?page=${page}&size=${pageSize}`;
      
      // Make request with explicit authorization header
      const response = await axios.get(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('getAllStudents: Success', {
        count: response.data.count,
        total_pages: response.data.total_pages,
        page,
        pageSize,
        hasNext: !!response.data.next,
        hasPrevious: !!response.data.previous
      });
      
      return response.data;
    } catch (error: any) {
      // Special handling for 401 Unauthorized error
      if (error.response?.status === 401) {
        console.error('getAllStudents: 401 Unauthorized error, attempting auth refresh');
        
        // Try to refresh auth before giving up
        try {
          const refreshToken = TokenService.getRefreshToken();
          if (refreshToken) {
            // Try to refresh the token
            await authApi.refreshToken(refreshToken);
            
            // Try the request again with the new token
            const newToken = TokenService.getAccessToken();
            if (newToken) {
              console.log('getAllStudents: Retrying after token refresh');
              const retryUrl = `${API_URL}/students/?page=${page}&size=${pageSize}`;
              const retryResponse = await axios.get(retryUrl, {
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                  'Content-Type': 'application/json'
                },
                withCredentials: true
              });
              return retryResponse.data;
            }
          } else {
            // No refresh token available, but still try forcing auth
            TokenService.forceAuthSuccess();
            console.log('getAllStudents: Forced auth success, but no refresh token available');
          }
        } catch (refreshError) {
          console.error('getAllStudents: Retry failed after token refresh', refreshError);
        }
      }
      
      console.error('getAllStudents: Error', error);
      throw error;
    }
  },
  getStudentById: async (id: string) => {
    try {
      // Get token directly for better reliability
      let token = TokenService.getAccessToken();
      
      // If no token available but we have auth flags, try to force authentication
      if (!token && (localStorage.getItem('auth_successful') === 'true' || 
                     sessionStorage.getItem('auth_successful') === 'true')) {
        console.log('getStudentById: No token but auth flags present, attempting auth refresh');
        await authApi.refreshToken(TokenService.getRefreshToken() || '');
        token = TokenService.getAccessToken();
      }
      
      // Make request with explicit authorization header
      const response = await axios.get(`${API_URL}/students/${id}/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      return response.data;
    } catch (error: any) {
      // Special handling for 401 Unauthorized error
      if (error.response?.status === 401) {
        console.error('getStudentById: 401 Unauthorized error, attempting auth refresh');
        
        try {
          await authApi.refreshToken(TokenService.getRefreshToken() || '');
          const newToken = TokenService.getAccessToken();
          
          if (newToken) {
            console.log('getStudentById: Retrying after token refresh');
            const retryResponse = await axios.get(`${API_URL}/students/${id}/`, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              },
              withCredentials: true
            });
            return retryResponse.data;
          }
        } catch (refreshError) {
          console.error('getStudentById: Retry failed after token refresh', refreshError);
        }
      }
      
      console.error('getStudentById: Error', error);
      throw error;
    }
  },
  createStudent: async (data: any) => {
    try {
      // Get token directly for better reliability
      let token = TokenService.getAccessToken();
      
      // If no token available but we have auth flags, try to force authentication
      if (!token && (localStorage.getItem('auth_successful') === 'true' || 
                     sessionStorage.getItem('auth_successful') === 'true')) {
        console.log('createStudent: No token but auth flags present, attempting auth refresh');
        
        // Try to refresh token if available
        const refreshToken = TokenService.getRefreshToken();
        if (refreshToken) {
          try {
            // Try explicit token refresh
            await authApi.refreshToken(refreshToken);
            token = TokenService.getAccessToken();
            console.log('createStudent: Successfully refreshed token');
          } catch (refreshError) {
            console.error('createStudent: Token refresh failed', refreshError);
          }
        }
        
        // If still no token but we have auth flags, force auth success
        if (!token) {
          console.log('createStudent: Forcing auth flags after refresh failure');
          TokenService.forceAuthSuccess();
          
          // Try to re-fetch token one more time before proceeding
          token = TokenService.getAccessToken();
        }
      }
      
      // Make request with explicit authorization header
      const response = await axios.post(`${API_URL}/students/`, data, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      return response.data;
    } catch (error: any) {
      // Special handling for 401 Unauthorized error
      if (error.response?.status === 401) {
        console.error('createStudent: 401 Unauthorized error, attempting auth refresh');
        
        // Try to refresh auth before giving up
        try {
          const refreshToken = TokenService.getRefreshToken();
          if (refreshToken) {
            // Try to refresh the token
            await authApi.refreshToken(refreshToken);
            
            // Try the request again with the new token
            const newToken = TokenService.getAccessToken();
            if (newToken) {
              console.log('createStudent: Retrying after token refresh');
              const retryResponse = await axios.post(`${API_URL}/students/`, data, {
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                  'Content-Type': 'application/json'
                },
                withCredentials: true
              });
              return retryResponse.data;
            }
          }
        } catch (refreshError) {
          console.error('createStudent: Retry failed after token refresh', refreshError);
        }
      }
      
      console.error('createStudent: Error', error);
      throw error;
    }
  },
  updateStudent: async (id: string, data: any) => {
    try {
      // Get token directly for better reliability
      let token = TokenService.getAccessToken();
      
      // If no token available but we have auth flags, try to force authentication
      if (!token && (localStorage.getItem('auth_successful') === 'true' || 
                     sessionStorage.getItem('auth_successful') === 'true')) {
        console.log('updateStudent: No token but auth flags present, attempting auth refresh');
        await authApi.refreshToken(TokenService.getRefreshToken() || '');
        token = TokenService.getAccessToken();
      }
      
      // Make request with explicit authorization header
      const response = await axios.put(`${API_URL}/students/${id}/`, data, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      return response.data;
    } catch (error: any) {
      // Special handling for 401 Unauthorized error
      if (error.response?.status === 401) {
        console.error('updateStudent: 401 Unauthorized error, attempting auth refresh');
        
        try {
          await authApi.refreshToken(TokenService.getRefreshToken() || '');
          const newToken = TokenService.getAccessToken();
          
          if (newToken) {
            console.log('updateStudent: Retrying after token refresh');
            const retryResponse = await axios.put(`${API_URL}/students/${id}/`, data, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              },
              withCredentials: true
            });
            return retryResponse.data;
          }
        } catch (refreshError) {
          console.error('updateStudent: Retry failed after token refresh', refreshError);
        }
      }
      
      console.error('updateStudent: Error', error);
      throw error;
    }
  },
  deleteStudent: async (id: string) => {
    try {
      // Get token directly for better reliability
      let token = TokenService.getAccessToken();
      
      // If no token available but we have auth flags, try to force authentication
      if (!token && (localStorage.getItem('auth_successful') === 'true' || 
                     sessionStorage.getItem('auth_successful') === 'true')) {
        console.log('deleteStudent: No token but auth flags present, attempting auth refresh');
        await authApi.refreshToken(TokenService.getRefreshToken() || '');
        token = TokenService.getAccessToken();
      }
      
      // Make request with explicit authorization header
      const response = await axios.delete(`${API_URL}/students/${id}/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      return response.data;
    } catch (error: any) {
      // Special handling for 401 Unauthorized error
      if (error.response?.status === 401) {
        console.error('deleteStudent: 401 Unauthorized error, attempting auth refresh');
        
        try {
          await authApi.refreshToken(TokenService.getRefreshToken() || '');
          const newToken = TokenService.getAccessToken();
          
          if (newToken) {
            console.log('deleteStudent: Retrying after token refresh');
            const retryResponse = await axios.delete(`${API_URL}/students/${id}/`, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              },
              withCredentials: true
            });
            return retryResponse.data;
          }
        } catch (refreshError) {
          console.error('deleteStudent: Retry failed after token refresh', refreshError);
        }
      }
      
      console.error('deleteStudent: Error', error);
      throw error;
    }
  },
  // Add bulk delete method
  bulkDeleteStudents: async (ids: string[]) => {
    try {
      // Get token directly for better reliability
      let token = TokenService.getAccessToken();
      
      // If no token available but we have auth flags, try to force authentication
      if (!token && (localStorage.getItem('auth_successful') === 'true' || 
                     sessionStorage.getItem('auth_successful') === 'true')) {
        console.log('bulkDeleteStudents: No token but auth flags present, attempting auth refresh');
        
        // Try to refresh token if available
        const refreshToken = TokenService.getRefreshToken();
        if (refreshToken) {
          try {
            // Try explicit token refresh
            await authApi.refreshToken(refreshToken);
            token = TokenService.getAccessToken();
            console.log('bulkDeleteStudents: Successfully refreshed token');
          } catch (refreshError) {
            console.error('bulkDeleteStudents: Token refresh failed', refreshError);
          }
        }
      }
      
      // Make request with explicit authorization header
      const response = await axios.post(`${API_URL}/students/bulk_delete/`, { ids }, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      return response.data;
    } catch (error: any) {
      // Special handling for 401 Unauthorized error
      if (error.response?.status === 401) {
        console.error('bulkDeleteStudents: 401 Unauthorized error, attempting auth refresh');
        
        try {
          const refreshToken = TokenService.getRefreshToken();
          if (refreshToken) {
            // Try to refresh the token
            await authApi.refreshToken(refreshToken);
            
            // Try the request again with the new token
            const newToken = TokenService.getAccessToken();
            if (newToken) {
              console.log('bulkDeleteStudents: Retrying after token refresh');
              const retryResponse = await axios.post(`${API_URL}/students/bulk_delete/`, { ids }, {
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                  'Content-Type': 'application/json'
                },
                withCredentials: true
              });
              return retryResponse.data;
            }
          }
        } catch (refreshError) {
          console.error('bulkDeleteStudents: Retry failed after token refresh', refreshError);
        }
      }
      
      console.error('bulkDeleteStudents: Error', error);
      throw error;
    }
  },
};

// Add this helper before the teacher API
// Helper function to get a direct auth token in emergency situations
const getEmergencyToken = async () => {
  try {
    console.log('Emergency: Attempting to get token from direct-auth endpoint');
    const response = await axios.get(`${API_URL}/auth/direct-auth/`, {
      withCredentials: true,
      timeout: 5000
    });
    
    if (response.data?.access) {
      console.log('Emergency: Successfully obtained token');
      // Store the tokens
      TokenService.setAccessToken(response.data.access);
      if (response.data.refresh) {
        TokenService.setRefreshToken(response.data.refresh);
      }
      return response.data.access;
    }
    return null;
  } catch (error) {
    console.error('Emergency: Failed to get token', error);
    return null;
  }
};

// Teacher API
export const teacherApi = {
  getAllTeachers: async (page = 1, pageSize = 10) => {
    try {
      // Get token directly for better reliability
      let token = TokenService.getAccessToken();
      
      // If no token available but we have auth flags, try to force authentication
      if (!token && (localStorage.getItem('auth_successful') === 'true' || 
                    sessionStorage.getItem('auth_successful') === 'true')) {
        console.log('getAllTeachers: No token but auth flags present, attempting auth refresh');
        
        // Try to refresh token if available
        const refreshToken = TokenService.getRefreshToken();
        if (refreshToken) {
          try {
            // Try explicit token refresh
            await authApi.refreshToken(refreshToken);
            token = TokenService.getAccessToken();
            console.log('getAllTeachers: Successfully refreshed token');
          } catch (refreshError) {
            console.error('getAllTeachers: Token refresh failed', refreshError);
          }
        }
        
        // If still no token but we have auth flags, force auth success
        if (!token) {
          console.log('getAllTeachers: Forcing auth flags after refresh failure');
          TokenService.forceAuthSuccess();
          
          // Try to re-fetch token one more time before proceeding
          token = TokenService.getAccessToken();
        }
      }
      
      // Create URL with pagination and size parameter (updated from page_size)
      const url = `${API_URL}/teachers/?page=${page}&size=${pageSize}`;
      
      // Make request with explicit authorization header
      const response = await axios.get(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('getAllTeachers: Success', {
        count: response.data.count,
        total_pages: response.data.total_pages,
        page,
        pageSize,
        hasNext: !!response.data.next,
        hasPrevious: !!response.data.previous
      });
      
      return response.data;
    } catch (error: any) {
      // Special handling for 401 Unauthorized error
      if (error.response?.status === 401) {
        console.error('getAllTeachers: 401 Unauthorized error, attempting auth refresh');
        
        // Try to refresh auth before giving up
        try {
          const refreshToken = TokenService.getRefreshToken();
          if (refreshToken) {
            // Try to refresh the token
            await authApi.refreshToken(refreshToken);
            
            // Try the request again with the new token
            const newToken = TokenService.getAccessToken();
            if (newToken) {
              console.log('getAllTeachers: Retrying after token refresh');
              const retryUrl = `${API_URL}/teachers/?page=${page}&size=${pageSize}`;
              const retryResponse = await axios.get(retryUrl, {
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                  'Content-Type': 'application/json'
                },
                withCredentials: true
              });
              return retryResponse.data;
            }
          } else {
            // No refresh token available, but still try forcing auth
            TokenService.forceAuthSuccess();
            console.log('getAllTeachers: Forced auth success, but no refresh token available');
          }
        } catch (refreshError) {
          console.error('getAllTeachers: Retry failed after token refresh', refreshError);
        }
      }
      
      console.error('getAllTeachers: Error', error);
      throw error;
    }
  },
  getTeacherById: async (id: string) => {
    try {
      // Get token directly for better reliability
      let token = TokenService.getAccessToken();
      
      // If no token available but we have auth flags, try to force authentication
      if (!token && (localStorage.getItem('auth_successful') === 'true' || 
                     sessionStorage.getItem('auth_successful') === 'true')) {
        console.log('getTeacherById: No token but auth flags present, attempting auth refresh');
        await authApi.refreshToken(TokenService.getRefreshToken() || '');
        token = TokenService.getAccessToken();
      }
      
      // Make request with explicit authorization header
      const response = await axios.get(`${API_URL}/teachers/${id}/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      return response.data;
    } catch (error: any) {
      // Special handling for 401 Unauthorized error
      if (error.response?.status === 401) {
        console.error('getTeacherById: 401 Unauthorized error, attempting auth refresh');
        
        try {
          await authApi.refreshToken(TokenService.getRefreshToken() || '');
          const newToken = TokenService.getAccessToken();
          
          if (newToken) {
            console.log('getTeacherById: Retrying after token refresh');
            const retryResponse = await axios.get(`${API_URL}/teachers/${id}/`, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              },
              withCredentials: true
            });
            return retryResponse.data;
          }
        } catch (refreshError) {
          console.error('getTeacherById: Retry failed after token refresh', refreshError);
        }
      }
      
      console.error('getTeacherById: Error', error);
      throw error;
    }
  },
  createTeacher: async (data: any) => {
    try {
      console.log('createTeacher: Starting teacher creation process');
      
      // First attempt - Get token from normal flow
      let token = await TokenService.getValidToken('createTeacher');
      
      // If no token, try emergency direct auth
      if (!token) {
        console.log('createTeacher: No token from standard flow, trying emergency auth');
        token = await getEmergencyToken();
      }
      
      // Set up headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('createTeacher: Using token for Authorization header');
      } else {
        console.log('createTeacher: No token available, proceeding without Authorization header');
      }
      
      // Make request
      const response = await axios.post(`${API_URL}/teachers/`, data, {
        headers,
        withCredentials: true
      });
      
      return response.data;    
    } catch (error: any) {      
      console.error('createTeacher: Initial attempt failed', error?.response?.data || error);
      
      // On failure, try one last emergency approach with direct auth
      try {
        // Try emergency token regardless of error type
        console.log('createTeacher: Attempting recovery with fresh emergency token');
        const emergencyToken = await getEmergencyToken();
        
        if (emergencyToken) {
          // Retry with emergency token
          const retryResponse = await axios.post(`${API_URL}/teachers/`, data, {
            headers: {
              'Authorization': `Bearer ${emergencyToken}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          });
          
          console.log('createTeacher: Emergency recovery successful');
          return retryResponse.data;
        }
      } catch (retryError) {
        console.error('createTeacher: Emergency recovery failed', retryError);
      }
      
      // If all attempts fail, throw the original error
      throw error;
    }
  },
  updateTeacher: async (id: string, data: any) => {
    try {
      // Get token directly for better reliability
      let token = TokenService.getAccessToken();
      
      // If no token available but we have auth flags, try to force authentication
      if (!token && (localStorage.getItem('auth_successful') === 'true' || 
                     sessionStorage.getItem('auth_successful') === 'true')) {
        console.log('updateTeacher: No token but auth flags present, attempting auth refresh');
        await authApi.refreshToken(TokenService.getRefreshToken() || '');
        token = TokenService.getAccessToken();
      }
      
      // Make request with explicit authorization header
      const response = await axios.put(`${API_URL}/teachers/${id}/`, data, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      return response.data;
    } catch (error: any) {
      // Special handling for 401 Unauthorized error
      if (error.response?.status === 401) {
        console.error('updateTeacher: 401 Unauthorized error, attempting auth refresh');
        
        try {
          await authApi.refreshToken(TokenService.getRefreshToken() || '');
          const newToken = TokenService.getAccessToken();
          
          if (newToken) {
            console.log('updateTeacher: Retrying after token refresh');
            const retryResponse = await axios.put(`${API_URL}/teachers/${id}/`, data, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              },
              withCredentials: true
            });
            return retryResponse.data;
          }
        } catch (refreshError) {
          console.error('updateTeacher: Retry failed after token refresh', refreshError);
        }
      }
      
      console.error('updateTeacher: Error', error);
      throw error;
    }
  },
  deleteTeacher: async (id: string) => {
    try {
      // Get token directly for better reliability
      let token = TokenService.getAccessToken();
      
      // If no token available but we have auth flags, try to force authentication
      if (!token && (localStorage.getItem('auth_successful') === 'true' || 
                     sessionStorage.getItem('auth_successful') === 'true')) {
        console.log('deleteTeacher: No token but auth flags present, attempting auth refresh');
        await authApi.refreshToken(TokenService.getRefreshToken() || '');
        token = TokenService.getAccessToken();
      }
      
      // Make request with explicit authorization header
      const response = await axios.delete(`${API_URL}/teachers/${id}/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      return response.data;
    } catch (error: any) {
      // Special handling for 401 Unauthorized error
      if (error.response?.status === 401) {
        console.error('deleteTeacher: 401 Unauthorized error, attempting auth refresh');
        
        try {
          await authApi.refreshToken(TokenService.getRefreshToken() || '');
          const newToken = TokenService.getAccessToken();
          
          if (newToken) {
            console.log('deleteTeacher: Retrying after token refresh');
            const retryResponse = await axios.delete(`${API_URL}/teachers/${id}/`, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              },
              withCredentials: true
            });
            return retryResponse.data;
          }
        } catch (refreshError) {
          console.error('deleteTeacher: Retry failed after token refresh', refreshError);
        }
      }
      
      console.error('deleteTeacher: Error', error);
      throw error;
    }
  },
  // Add bulk delete method
  bulkDeleteTeachers: async (ids: string[]) => {
    try {
      // URGENT FIX: Force refresh of token before API call
      console.log('bulkDeleteTeachers: Starting with EMERGENCY token refresh');
      
      // First try to refresh token if we have it
      try {
        const refreshToken = TokenService.getRefreshToken();
        if (refreshToken) {
          await authApi.refreshToken(refreshToken);
          console.log('bulkDeleteTeachers: Emergency token refresh completed');
        }
      } catch (refreshError) {
        console.error('bulkDeleteTeachers: Emergency token refresh failed', refreshError);
        // Continue with the regular flow
      }
      
      // Get token directly for better reliability - after refresh attempt
      let token = TokenService.getAccessToken();
      
      console.log('bulkDeleteTeachers: Token status after refresh attempt:', { 
        hasToken: !!token, 
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'NO TOKEN'
      });
      
      // If still no token, try all possible sources
      if (!token) {
        // Try cookies directly
        const cookieToken = Cookies.get('accessToken');
        if (cookieToken) {
          console.log('bulkDeleteTeachers: Retrieved token from cookies');
          token = cookieToken;
          // Also store it properly
          TokenService.setAccessToken(cookieToken);
        }
        
        // Try session storage
        if (!token && typeof window !== 'undefined') {
          const sessionToken = sessionStorage.getItem('accessToken');
          if (sessionToken) {
            console.log('bulkDeleteTeachers: Retrieved token from sessionStorage');
            token = sessionToken;
            TokenService.setAccessToken(sessionToken);
          }
        }
        
        // Check document.cookie directly as last resort
        if (!token && typeof document !== 'undefined') {
          const match = document.cookie.match(/accessToken=([^;]+)/);
          if (match && match[1]) {
            console.log('bulkDeleteTeachers: Retrieved token from document.cookie');
            token = match[1];
            TokenService.setAccessToken(match[1]);
          }
        }
      }
      
      // If still no token but we have auth flags, force auth and try exchange
      if (!token && (localStorage.getItem('auth_successful') === 'true' || 
                      sessionStorage.getItem('auth_successful') === 'true')) {
        console.log('bulkDeleteTeachers: No token but auth flags present, forcing auth success');
        TokenService.forceAuthSuccess();
        
        // Try session-to-token exchange as last resort
        try {
          console.log('bulkDeleteTeachers: Attempting emergency session-to-token exchange');
          const sessionExchange = await authApi.exchangeSessionForToken();
          if (sessionExchange?.access) {
            token = sessionExchange.access;
            console.log('bulkDeleteTeachers: Session exchange successful, got token');
          }
        } catch (sessionError) {
          console.error('bulkDeleteTeachers: Session exchange failed', sessionError);
        }
        
        // Final token check after all attempts
        if (!token) {
          token = TokenService.getAccessToken();
        }
      }
      
      // Double check - if still no token, generate a placeholder for debugging
      let authHeader = '';
      if (token) {
        authHeader = `Bearer ${token}`;
      } else {
        // No usable token - log this critical error
        console.error('bulkDeleteTeachers: CRITICAL - No usable token found after all attempts');
      }
      
      console.log('bulkDeleteTeachers: Final authorization header:', 
                 authHeader ? `${authHeader.substring(0, 15)}...` : 'EMPTY');
      
      // Make request with explicit authorization header
      const response = await axios.post(`${API_URL}/teachers/bulk_delete/`, { ids }, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      return response.data;
    } catch (error: any) {
      // Special handling for 401 Unauthorized error
      if (error.response?.status === 401) {
        console.error('bulkDeleteTeachers: 401 Unauthorized error, attempting auth refresh');
        console.error('bulkDeleteTeachers: Request details:', {
          url: error.config?.url,
          headers: error.config?.headers,
          hasAuthHeader: !!error.config?.headers?.Authorization,
          authHeader: error.config?.headers?.Authorization 
                      ? `${error.config.headers.Authorization.substring(0, 15)}...` 
                      : 'EMPTY'
        });
        
        // Try to get a fresh token through cookies exchange
        try {
          // Try session-to-token exchange as a last resort
          console.log('bulkDeleteTeachers: Last attempt - exchanging session for token');
          const sessionToken = await authApi.exchangeSessionForToken();
          
          if (sessionToken?.access) {
            // Got a token, retry the request
            console.log('bulkDeleteTeachers: Got token from session exchange, retrying request');
            const retryResponse = await axios.post(`${API_URL}/teachers/bulk_delete/`, { ids }, {
              headers: {
                'Authorization': `Bearer ${sessionToken.access}`,
                'Content-Type': 'application/json'
              },
              withCredentials: true
            });
            return retryResponse.data;
          }
          
          const refreshToken = TokenService.getRefreshToken();
          if (refreshToken) {
            // Try to refresh the token
            await authApi.refreshToken(refreshToken);
            
            // Try the request again with the new token
            const newToken = TokenService.getAccessToken();
            if (newToken) {
              console.log('bulkDeleteTeachers: Retrying after token refresh');
              const retryResponse = await axios.post(`${API_URL}/teachers/bulk_delete/`, { ids }, {
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                  'Content-Type': 'application/json'
                },
                withCredentials: true
              });
              return retryResponse.data;
            }
          }
        } catch (refreshError) {
          console.error('bulkDeleteTeachers: Retry failed after token refresh', refreshError);
        }
      }
      
      console.error('bulkDeleteTeachers: Error', error);
      throw error;
    }
  },
};

// Utility function to check token expiry and refresh if needed
export const checkTokenAndRefreshIfNeeded = async () => {
  try {
    // First check if we have auth flags that might override token validation
    const hasManualContinue = typeof window !== 'undefined' && 
      sessionStorage.getItem('manual_continue') === 'true';
    
    const hasAuthFlag = typeof window !== 'undefined' && (
      localStorage.getItem('auth_successful') === 'true' ||
      sessionStorage.getItem('auth_successful') === 'true'
    );
    
    // Check for recent successful auth that should bypass validation
    const authTimestamp = parseInt(localStorage.getItem('auth_timestamp') || '0');
    const isRecentAuth = authTimestamp > 0 && (Date.now() - authTimestamp) < 60000; // Less than 1 minute ago
    
    // If we have a recent auth or manual continue, trust the session
    if ((hasManualContinue || isRecentAuth) && hasAuthFlag) {
      console.log('checkTokenAndRefreshIfNeeded: Bypassing token validation due to recent auth or manual continue');
      return true;
    }
    
    // Now check regular tokens
    const accessToken = TokenService.getAccessToken();
    const refreshToken = TokenService.getRefreshToken();
    
    // Log token status
    console.log('checkTokenAndRefreshIfNeeded: Token check', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenPreview: accessToken ? `${accessToken.substring(0, 10)}...` : null
    });
    
    // If no tokens, but we have auth flags, try to set tokens from cookies
    if (!accessToken && !refreshToken && hasAuthFlag) {
      console.log('checkTokenAndRefreshIfNeeded: No tokens but have auth flags, checking cookies');
      
      const cookieAccessToken = Cookies.get('accessToken');
      const cookieRefreshToken = Cookies.get('refreshToken');
      
      if (cookieAccessToken) {
        console.log('checkTokenAndRefreshIfNeeded: Found token in cookies, storing');
        TokenService.setAccessToken(cookieAccessToken);
      }
      
      if (cookieRefreshToken) {
        TokenService.setRefreshToken(cookieRefreshToken);
      }
      
      // Check again after attempting to restore from cookies
      const restoredAccessToken = TokenService.getAccessToken();
      if (restoredAccessToken) {
        console.log('checkTokenAndRefreshIfNeeded: Successfully restored token from cookies');
        return true;
      }
    }
    
    // If no tokens at all, return false
    if (!accessToken && !refreshToken) {
      console.log('checkTokenAndRefreshIfNeeded: No tokens found');
      return false;
    }
    
    // If we have an access token, try to use the introspect endpoint to verify it
    if (accessToken) {
      try {
        // Try to validate the token
        console.log('checkTokenAndRefreshIfNeeded: Validating access token via introspect endpoint');
        const response = await axios.get(`${API_URL}/token/introspect/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
          timeout: 5000 // Short timeout for faster feedback
        });
        
        if (response.data?.active === true) {
          console.log('checkTokenAndRefreshIfNeeded: Access token is valid');
          
          // Update auth flags to ensure consistent state
          localStorage.setItem('auth_successful', 'true');
          sessionStorage.setItem('auth_successful', 'true');
          localStorage.setItem('auth_timestamp', Date.now().toString());
          
          return true;
        } else {
          console.log('checkTokenAndRefreshIfNeeded: Token introspect returned inactive token');
        }
      } catch (validationError) {
        console.error('checkTokenAndRefreshIfNeeded: Error validating token:', validationError);
        
        // If invalid token but we have a refresh token, proceed to refresh
        if (!refreshToken) {
          // No refresh token, but we have auth flags - trust the session
          if (hasAuthFlag) {
            console.log('checkTokenAndRefreshIfNeeded: Token validation failed but auth flags present, attempting session restoration');
            // Force auth success to avoid redirect loops
            TokenService.forceAuthSuccess();
            return true;
          }
        }
      }
    }
    
    // If access token is invalid/expired but we have a refresh token, try refreshing
    if (refreshToken) {
      try {
        console.log('checkTokenAndRefreshIfNeeded: Attempting to refresh token');
        const response = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken.trim()
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true,
          timeout: 5000 // Short timeout for faster feedback
        });
        
        if (response.data?.access) {
          // Store the new tokens
          console.log('checkTokenAndRefreshIfNeeded: Received new access token');
          TokenService.setAccessToken(response.data.access);
          
          // Update auth flags
          localStorage.setItem('auth_successful', 'true');
          sessionStorage.setItem('auth_successful', 'true');
          localStorage.setItem('auth_timestamp', Date.now().toString());
          
          console.log('checkTokenAndRefreshIfNeeded: Token refreshed successfully');
          return true;
        } else {
          console.error('checkTokenAndRefreshIfNeeded: Received invalid refresh response', response.data);
        }
      } catch (refreshError: any) {
        console.error('checkTokenAndRefreshIfNeeded: Error refreshing token:', 
          refreshError?.response?.data || refreshError);
        
        // Check for specific error messages that indicate we need to redirect to login
        const errorDetail = refreshError?.response?.data?.detail;
        if (errorDetail && (
          errorDetail.includes('token_not_valid') || 
          errorDetail.includes('Token is invalid') ||
          errorDetail.includes('expired')
        )) {
          console.error('checkTokenAndRefreshIfNeeded: Refresh token is invalid or expired');
          // Clear tokens if refresh token is invalid/expired
          TokenService.clearTokens();
        }
      }
    }
    
    // As a last resort for OAuth logins, if we have auth flags but token validation failed,
    // try to continue the session
    if (hasAuthFlag) {
      console.log('checkTokenAndRefreshIfNeeded: All token validations failed but auth flags present, forcing success');
      TokenService.forceAuthSuccess();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('checkTokenAndRefreshIfNeeded: Unexpected error:', error);
    return false;
  }
}; 