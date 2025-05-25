'use client';

import { useEffect, useState } from 'react';
import { TokenService } from '@/api/apiService';
import { useAuth } from '@/contexts/AuthContext';

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * AuthWrapper ensures consistent authentication state across the app
 * It consolidates all auth flags and tokens when mounted
 */
export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { checkAndRefreshAuth } = useAuth();
  const [initialized, setInitialized] = useState(false);

  // On component mount, ensure consistent auth state
  useEffect(() => {
    const ensureAuthState = async () => {
      try {
        // Check for OAuth flags across storage mechanisms
        const hasAccessToken = TokenService.getAccessToken();
        const hasRefreshToken = TokenService.getRefreshToken();
        const hasOAuthFlags = typeof window !== 'undefined' && (
          localStorage.getItem('auth_successful') === 'true' ||
          sessionStorage.getItem('auth_successful') === 'true' ||
          sessionStorage.getItem('auth_redirect_pending') === 'true'
        );
        
        // If we have any tokens or flags, ensure they're consistent
        if (hasAccessToken || hasRefreshToken || hasOAuthFlags) {
          console.log('AuthWrapper: Found auth tokens/flags, ensuring consistency');
          
          // Force auth flags to prevent redirects
          TokenService.forceAuthSuccess();
          
          // Verify with the server if possible
          await checkAndRefreshAuth();
        }
      } catch (error) {
        console.error('AuthWrapper: Error ensuring auth state', error);
      } finally {
        setInitialized(true);
      }
    };
    
    ensureAuthState();
  }, [checkAndRefreshAuth]);

  // Simply render children - the setup happens in the effect
  return <>{children}</>;
} 