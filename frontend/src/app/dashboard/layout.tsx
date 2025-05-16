'use client';

import { useState, useEffect, useRef } from 'react';
import { AppShell, useMantineTheme, Center, Loader, Text, Button } from '@mantine/core';
import Header from '@/components/layout/Header';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import { TokenService } from '@/api/apiService';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const redirectBlocker = useRef(false);
  
  const toggleNav = () => setOpened((o) => !o);

  // Phát hiện và chặn các redirect không mong muốn
  useEffect(() => {
    // Cơ chế chặn redirect
    const preventUnwantedRedirect = () => {
      if (redirectBlocker.current) return;
      
      // Check for recent oauth login
      const isRecentOAuth = typeof window !== 'undefined' && (
        localStorage.getItem('auth_successful') === 'true' ||
        sessionStorage.getItem('auth_successful') === 'true' ||
        document.cookie.includes('auth_redirect=true')
      );
      
      // Chặn redirect trong 5 giây sau khi đăng nhập OAuth
      if (isRecentOAuth) {
        console.log('Dashboard: Blocking unwanted redirects for 5 seconds');
        redirectBlocker.current = true;
        
        // Đặt cờ vào localStorage để chặn redirect trên trang mới
        localStorage.setItem('block_auth_redirect', 'true');
        localStorage.setItem('block_until', (Date.now() + 5000).toString());
        
        // Khôi phục sau 5 giây
        setTimeout(() => {
          redirectBlocker.current = false;
          localStorage.removeItem('block_auth_redirect');
        }, 5000);
      }
    };
    
    // Chạy ngay và sau mỗi lần trang tải xong
    preventUnwantedRedirect();
    window.addEventListener('load', preventUnwantedRedirect);
    
    return () => window.removeEventListener('load', preventUnwantedRedirect);
  }, []);

  // Extra check to verify tokens are present
  useEffect(() => {
    // Skip if already checked
    if (hasCheckedStorage) return;
    
    const checkTokens = async () => {
      try {
        // Use the comprehensive token check function
        const tokensExist = TokenService.checkTokensExist();
        
        // Check if coming from auth callback or has auth flags
        const isFromAuthCallback = typeof window !== 'undefined' && (
          sessionStorage.getItem('auth_successful') === 'true' || 
          localStorage.getItem('auth_successful') === 'true' ||
          sessionStorage.getItem('auth_redirect_pending') === 'true' ||
          sessionStorage.getItem('oauth_initiated') !== null
        );
        
        // Check blocking flags
        const blockRedirect = localStorage.getItem('block_auth_redirect') === 'true';
        const blockUntil = parseInt(localStorage.getItem('block_until') || '0');
        const shouldBlock = blockRedirect && blockUntil > Date.now();
        
        console.log('Dashboard Layout: Checking tokens', {
          tokensExist,
          isFromAuthCallback,
          blockRedirect,
          shouldBlock,
          localStorage: {
            accessToken: localStorage.getItem('accessToken'),
            refreshToken: localStorage.getItem('refreshToken'),
            auth_successful: localStorage.getItem('auth_successful')
          }
        });
        
        // Clear the pending redirect flag
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('auth_redirect_pending');
        }
        
        // If we have tokens or just came from auth callback, allow access
        if (tokensExist || isFromAuthCallback || shouldBlock) {
          console.log('Dashboard Layout: Authentication verified or redirects blocked');
          
          // Force auth success to prevent future redirects
          TokenService.forceAuthSuccess();
          
          setLoading(false);
          setHasCheckedStorage(true);
        } else {
          // Wait longer (3 seconds) and check again before redirecting
          setTimeout(() => {
            // Use the comprehensive token check function again
            const retryTokensExist = TokenService.checkTokensExist();
            
            // Recehck all flags
            const retryAuth = typeof window !== 'undefined' && (
              sessionStorage.getItem('auth_successful') === 'true' || 
              localStorage.getItem('auth_successful') === 'true'
            );
            const retryBlockRedirect = localStorage.getItem('block_auth_redirect') === 'true';
            const retryBlockUntil = parseInt(localStorage.getItem('block_until') || '0');
            const retryShouldBlock = retryBlockRedirect && retryBlockUntil > Date.now();
            
            if (retryTokensExist || retryAuth || retryShouldBlock) {
              console.log('Dashboard Layout: Tokens found on retry or redirects blocked');
              
              // Force auth success flags to prevent future redirects
              TokenService.forceAuthSuccess();
              
              setLoading(false);
              setHasCheckedStorage(true);
            } else {
              console.log('Dashboard Layout: No tokens found after retry, redirecting to login');
              router.replace('/login');
            }
          }, 3000); // Increased from 1500ms to 3000ms
        }
      } catch (error) {
        console.error('Dashboard Layout: Error checking tokens', error);
        setLoading(false);
        setHasCheckedStorage(true);
      }
    };
    
    checkTokens();
  }, [router, hasCheckedStorage]);

  // Handle manual navigation to dashboard if loading takes too long
  const handleManualContinue = () => {
    setLoading(false);
    setHasCheckedStorage(true);
    
    // Set cờ chặn redirects
    localStorage.setItem('block_auth_redirect', 'true');
    localStorage.setItem('block_until', (Date.now() + 10000).toString());
  };

  if (loading) {
    return (
      <Center style={{ height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size="xl" />
          <Text mt="md">Đang tải trang...</Text>
          <Button 
            onClick={handleManualContinue} 
            style={{ marginTop: '20px' }}
            variant="light"
          >
            Tiếp tục vào trang chính
          </Button>
        </div>
      </Center>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        <Header opened={opened} toggle={toggleNav} />
        <AppShell.Navbar p="md">
          <Sidebar />
        </AppShell.Navbar>
        
        <AppShell.Main>
          {children}
        </AppShell.Main>
      </AppShell>
    </ProtectedRoute>
  );
} 