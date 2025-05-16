'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkTokenAndRefreshIfNeeded, TokenService } from '@/api/apiService';
import { Loader, Center, Text, Button } from '@mantine/core';

interface AuthCheckProps {
  children: React.ReactNode;
}

// Expanded list of public paths that don't require authentication
const publicPaths = [
  '/login', 
  '/register',
  '/auth/callback', 
  '/auth/oauth-callback', 
  '/auth/error'
];

export default function AuthCheck({ children }: AuthCheckProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [checkCount, setCheckCount] = useState<number>(0);
  const router = useRouter();
  const pathname = usePathname();
  
  // Skip auth check for public paths
  const isPublicPath = publicPaths.some(path => pathname?.startsWith(path));
  
  useEffect(() => {
    // Don't run checks on public paths at all
    if (isPublicPath) {
      setIsAuthorized(true);
      setIsChecking(false);
      return;
    }

    // Global check counter in sessionStorage to persist between component remounts
    const getGlobalCheckCount = () => {
      return parseInt(sessionStorage.getItem('auth_check_count') || '0');
    };
    
    const incrementGlobalCheckCount = () => {
      const count = getGlobalCheckCount() + 1;
      sessionStorage.setItem('auth_check_count', count.toString());
      return count;
    };
    
    const verifyAuth = async () => {
      try {
        // Get the global check count
        const globalCheckCount = getGlobalCheckCount();
        
        // If too many checks globally (5 instead of 3), force failure less aggressively
        if (globalCheckCount > 5) {
          console.error('AuthCheck: Too many auth checks globally, forcing failure');
          
          // Instead of clearing tokens, check if we have auth flags first
          const hasAuthFlags = 
            localStorage.getItem('auth_successful') === 'true' ||
            sessionStorage.getItem('auth_successful') === 'true' ||
            localStorage.getItem('block_auth_redirect') === 'true';
            
          if (hasAuthFlags) {
            // If we have auth flags, force success instead of failure
            console.log('AuthCheck: Has auth flags despite too many checks, forcing success');
            TokenService.forceAuthSuccess();
            setIsAuthorized(true);
            setIsChecking(false);
            
            // Reset the counter to prevent future issues
            sessionStorage.setItem('auth_check_count', '0');
            return;
          }
          
          // Only if no auth flags, consider not authorized
          setIsAuthorized(false);
          setIsChecking(false);
          return;
        }
        
        console.log(`AuthCheck: Verifying auth (attempt ${checkCount + 1}, global: ${globalCheckCount})`);
        setCheckCount(prev => prev + 1);
        incrementGlobalCheckCount();
        
        // First check for tokens directly from all sources
        const hasToken = TokenService.checkTokensExist();
          
        if (!hasToken) {
          console.log('AuthCheck: No tokens found, redirecting to login');
          setIsAuthorized(false);
          setIsChecking(false);
          return;
        }
        
        // If we have tokens, verify and refresh if needed
        const isValid = await checkTokenAndRefreshIfNeeded();
        console.log(`AuthCheck: Token validation result: ${isValid}`);
        
        setIsAuthorized(isValid);
        setIsChecking(false);
        
        if (!isValid) {
          console.log('AuthCheck: Token invalid or refresh failed, redirecting to login');
          // Special check for OAuth flow - if we have auth flags but tokens failed,
          // try forcing success flags one time
          const isOAuthFlow = 
            localStorage.getItem('auth_successful') === 'true' ||
            sessionStorage.getItem('auth_successful') === 'true';
            
          if (isOAuthFlow && checkCount < 1) {
            console.log('AuthCheck: In OAuth flow with invalid token, forcing success flags');
            TokenService.forceAuthSuccess();
            // Force a recheck with a small delay to avoid immediate failure
            setTimeout(() => {
              setIsChecking(true);
            }, 500);
          }
        }
      } catch (error) {
        console.error('AuthCheck: Error checking authorization', error);
        setIsAuthorized(false);
        setIsChecking(false);
      }
    };
    
    if (isChecking) {
      verifyAuth();
    }
  }, [pathname, isPublicPath, checkCount, isChecking]);
  
  // Handle redirect to login if unauthorized
  useEffect(() => {
    if (isAuthorized === false && !isChecking && !isPublicPath) {
      // Check if we should block redirects before clearing tokens
      const shouldBlockRedirect = 
        localStorage.getItem('block_auth_redirect') === 'true' ||
        (localStorage.getItem('block_until') && 
         parseInt(localStorage.getItem('block_until') || '0') > Date.now());
      
      if (shouldBlockRedirect) {
        console.log('AuthCheck: Redirect blocked by auth flags, staying on current page');
        // Force authentication to stay on this page
        TokenService.forceAuthSuccess();
        setIsAuthorized(true);
        return;
      }
      
      // Only clear tokens if not in an OAuth flow
      const isOAuthFlow = 
        localStorage.getItem('auth_successful') === 'true' ||
        sessionStorage.getItem('auth_successful') === 'true';
        
      if (!isOAuthFlow) {
        // Only clear tokens if not in OAuth flow
        TokenService.clearTokens();
      }
      
      console.log('AuthCheck: Redirecting to login page');
      
      // Set a flag to prevent redirect loops
      sessionStorage.setItem('auth_redirect_pending', 'true');
      
      // Reset the check counter before redirecting
      sessionStorage.setItem('auth_check_count', '0');
      
      router.push('/login');
    }
  }, [isAuthorized, isChecking, router, isPublicPath]);
  
  const handleRetry = () => {
    // Try to force auth success and retry
    TokenService.forceAuthSuccess();
    // Reset the global check counter
    sessionStorage.setItem('auth_check_count', '0');
    setIsChecking(true);
  };
  
  // Show loading while checking authorization
  if (isChecking && !isPublicPath) {
    return (
      <Center style={{ height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size="xl" />
          <Text mt="md">Verifying authentication...</Text>
        </div>
      </Center>
    );
  }
  
  // If not authorized and not on a public path and not currently redirecting
  if (isAuthorized === false && !isPublicPath && checkCount > 2) {
    return (
      <Center style={{ height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Text size="xl" mb="md">Authentication Failed</Text>
          <Text mb="xl">Your session appears to be invalid or expired.</Text>
          <Button onClick={handleRetry} mr="md">Retry</Button>
          <Button onClick={() => {
            // Reset counter and clear tokens before redirecting
            sessionStorage.setItem('auth_check_count', '0');
            TokenService.clearTokens();
            router.push('/login');
          }}>Go to Login</Button>
        </div>
      </Center>
    );
  }
  
  // Either show children if authorized or nothing while redirecting
  return <>{children}</>;
} 