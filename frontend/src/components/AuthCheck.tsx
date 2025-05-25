'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkTokenAndRefreshIfNeeded, TokenService, authApi } from '@/api/apiService';
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
  const router = useRouter();
  const pathname = usePathname();
  
  // Skip auth check for public paths
  const isPublicPath = publicPaths.some(path => pathname?.startsWith(path));
  
  useEffect(() => {
    const verifyAuth = async () => {
      if (isPublicPath) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      try {
        // First check for tokens directly
        const hasToken = TokenService.checkTokensExist();
          
        if (!hasToken) {
          console.log('AuthCheck: No tokens found');
          setIsAuthorized(false);
          setIsChecking(false);
          // Only redirect if not already on login page
          if (!pathname?.startsWith('/login')) {
            router.push('/login');
          }
          return;
        }
        
        // If we have tokens, verify with backend
        const tokenStatus = await authApi.introspectToken();
        
        const isValid = tokenStatus.active;
        setIsAuthorized(isValid);
        setIsChecking(false);
        
        if (!isValid) {
          console.log('AuthCheck: Token invalid');
          TokenService.clearTokens();
          // Only redirect if not already on login page
          if (!pathname?.startsWith('/login')) {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('AuthCheck: Error checking authorization', error);
        setIsAuthorized(false);
        setIsChecking(false);
      }
    };
    
    verifyAuth();
  }, [pathname, isPublicPath, router]);
  
  // Show loading while checking authorization
  if (isChecking && !isPublicPath) {
    return (
      <Center style={{ height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size="xl" />
        </div>
      </Center>
    );
  }
  
  // If not authorized and not on a public path
  if (isAuthorized === false && !isPublicPath) {
    return (
      <Center style={{ height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Text size="xl" mb="md">Authentication Failed</Text>
          <Text mb="xl">Your session appears to be invalid or expired.</Text>
          <Button onClick={() => {
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