'use client';

import { useState, useEffect, useRef } from 'react';
import { AppShell, useMantineTheme, Center, Loader, Text, Button } from '@mantine/core';
import Header from '@/components/layout/Header';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import { TokenService } from '@/api/apiService';
import { useRouter, usePathname } from 'next/navigation';

declare global {
  interface Window {
    __TEMP_EMAIL?: string;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const redirectBlocker = useRef(false);
  
  const toggleNav = () => setOpened((o) => !o);

  // Detect and block unwanted redirects
  useEffect(() => {
    // Redirect blocking mechanism
    const preventUnwantedRedirect = () => {
      if (redirectBlocker.current) return;
      
      // Check for force profile redirect flag
      if (typeof window !== 'undefined' && localStorage.getItem('FORCE_PROFILE_REDIRECT') === 'true') {
        console.log('Dashboard: Force redirect to profile creation detected');
        
        // Add timestamp check to prevent redirect loops
        const redirectTimestamp = parseInt(localStorage.getItem('profile_redirect_timestamp') || '0');
        const currentTime = Date.now();
        
        // Only redirect if it's been more than 2 seconds since last redirect attempt
        if (currentTime - redirectTimestamp > 2000) {
          localStorage.setItem('profile_redirect_timestamp', currentTime.toString());
          router.replace('/profile/new');
        } else {
          console.log('Dashboard: Skipping redirect - too soon after last redirect attempt');
        }
        return;
      }
      
      // Check for recent oauth login
      const isRecentOAuth = typeof window !== 'undefined' && (
        localStorage.getItem('auth_successful') === 'true' ||
        sessionStorage.getItem('auth_successful') === 'true' ||
        document.cookie.includes('auth_redirect=true')
      );
      
      // Check if user is new - if so, we should NOT block redirects
      const isNewUser = typeof window !== 'undefined' && 
        (localStorage.getItem('isNewUser') === 'true' || 
         localStorage.getItem('rawIsNewUserValue') === 'true');
      
      // If user is new, we should redirect to profile creation with timestamp check
      if (isNewUser) {
        console.log('Dashboard: User is new, redirecting to profile creation');
        
        // Set a stronger flag that won't be overridden
        localStorage.setItem('FORCE_PROFILE_REDIRECT', 'true');
        
        // Add timestamp check to prevent redirect loops
        const redirectTimestamp = parseInt(localStorage.getItem('profile_redirect_timestamp') || '0');
        const currentTime = Date.now();
        
        if (currentTime - redirectTimestamp > 2000) { 
          localStorage.setItem('profile_redirect_timestamp', currentTime.toString());
          // Prevent any interference
          localStorage.removeItem('block_auth_redirect');
          localStorage.removeItem('block_until');
          router.replace('/profile/new');
        } else {
          console.log('Dashboard: Skipping redirect - too soon after last redirect attempt');
        }
        return;
      }
      
      // Block redirects for 5 seconds after OAuth login
      if (isRecentOAuth) {
        console.log('Dashboard: Blocking unwanted redirects for 5 seconds');
        redirectBlocker.current = true;
        
        // Set flag in localStorage to block redirects on new page
        localStorage.setItem('block_auth_redirect', 'true');
        localStorage.setItem('block_until', (Date.now() + 5000).toString());
        
        // Restore after 5 seconds
        setTimeout(() => {
          redirectBlocker.current = false;
          localStorage.removeItem('block_auth_redirect');
        }, 5000);
      }
    };
    
    // Run immediately and after each page load
    preventUnwantedRedirect();
    window.addEventListener('load', preventUnwantedRedirect);
    
    return () => window.removeEventListener('load', preventUnwantedRedirect);
  }, [router]);

  // Extra check to verify tokens are present
  useEffect(() => {
    // Skip if already checked or on public paths
    if (hasCheckedStorage || 
        pathname?.startsWith('/auth/')) {
      setLoading(false);
      return;
    }
    
    // Add automatic timeout to prevent indefinite loading
    const autoTimeoutId = setTimeout(() => {
      if (loading) {
        console.log('Dashboard Layout: Auto-timeout triggered, forcing loading to false after 10 seconds');
        setLoading(false);
        setHasCheckedStorage(true);
      }
    }, 10000);
    
    const checkTokensAndUserStatus = async () => {
      try {
        // Check for tokens immediately
        const hasAccessToken = TokenService.getAccessToken();
        const hasRefreshToken = TokenService.getRefreshToken();
        
        console.log('Dashboard Layout: Checking tokens:', { 
          hasAccessToken: !!hasAccessToken,
          hasRefreshToken: !!hasRefreshToken,
        });
        
        // If we have tokens, allow access
        if (hasAccessToken || hasRefreshToken) {
          console.log('Dashboard Layout: Tokens found, allowing access');
          setLoading(false);
          setHasCheckedStorage(true);
          return;
        }
        
        // If no tokens, redirect to login
        console.log('Dashboard Layout: No tokens, redirecting to login');
        router.replace('/login');
      } catch (error) {
        console.error('Dashboard Layout: Error checking tokens', error);
        setLoading(false);
        setHasCheckedStorage(true);
      }
    };
    
    checkTokensAndUserStatus();
    
    return () => {
      clearTimeout(autoTimeoutId);
    };
  }, [hasCheckedStorage, router, loading, pathname]);

  // Manual continue function for error recovery
  const handleManualContinue = () => {
    setLoading(false);
    setHasCheckedStorage(true);
  };

  return (
    <ProtectedRoute>
      <AppShell
        padding="md"
        navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        header={{ height: 60 }}
      >
        <AppShell.Header>
          <Header opened={opened} toggle={toggleNav} />
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <Sidebar />
        </AppShell.Navbar>

        <AppShell.Main>
          {loading ? (
            <Center style={{ height: '80vh', flexDirection: 'column' }}>
              <Loader size="xl" variant="dots" />
              <Text mt="md">Đang kiểm tra xác thực...</Text>
              <Button 
                onClick={handleManualContinue} 
                variant="light" 
                mt="xl"
              >
                Tiếp tục tới trang chủ
              </Button>
            </Center>
          ) : (
            children
          )}
        </AppShell.Main>
      </AppShell>
    </ProtectedRoute>
  );
}