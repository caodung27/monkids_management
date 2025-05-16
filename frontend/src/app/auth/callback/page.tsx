'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TokenService } from '@/api/apiService';
import { Center, Loader, Container, Text, Title, Code, Button, Paper } from '@mantine/core';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [redirectTriggered, setRedirectTriggered] = useState(false);
  const [tokensSaved, setTokensSaved] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('Auth callback: Starting token processing');
        
        // Get tokens directly from URL
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const userId = searchParams.get('user_id');
        const email = searchParams.get('email');
        const timestamp = searchParams.get('timestamp');

        setDebugInfo({
          tokens: { 
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            accessTokenPreview: accessToken ? `${accessToken.substring(0, 15)}...` : null,
            userId,
            email,
            timestamp
          },
          url: window.location.href
        });

        console.log('Auth callback: Retrieved tokens from URL', { 
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          userId,
          email
        });

        if (accessToken && refreshToken) {
          console.log('Auth callback: Storing tokens');
          
          try {
            // STEP 0: Reset auth check counter to prevent redirect loops
            sessionStorage.setItem('auth_check_count', '0');
            
            // STEP 1: Clear any existing tokens first to ensure a clean state
            // This is important if the callback is hit multiple times or with stale data.
            TokenService.clearTokens();
            console.log('Auth callback: Cleared old tokens');
            
            // STEP 2: Set critical auth flags BEFORE storing tokens
            // This helps prevent race conditions where validation might occur before storage completes.
            if (typeof window !== 'undefined') {
              localStorage.setItem('auth_successful', 'true');
              sessionStorage.setItem('auth_successful', 'true'); // For good measure
              localStorage.setItem('auth_timestamp', Date.now().toString());
              // Block auth redirect checks temporarily to give time for this page to complete.
              localStorage.setItem('block_auth_redirect', 'true');
              localStorage.setItem('block_until', (Date.now() + 15000).toString()); // Block for 15 seconds
              console.log('Auth callback: Set auth flags to prevent redirect loops and allow token processing');
            }
            
            // STEP 3: Use TokenService to set tokens. This is the canonical way.
            // TokenService handles localStorage, sessionStorage, and js-cookie with consistent security settings.
            console.log('Auth callback: Setting tokens with TokenService...');
            const storedAccessToken = TokenService.setAccessToken(accessToken);
            const storedRefreshToken = TokenService.setRefreshToken(refreshToken);

            // Log document.cookie immediately after TokenService calls
            if (typeof document !== 'undefined') {
              console.log('Auth callback: document.cookie AFTER TokenService.setTokens:', document.cookie);
            }

            if (storedAccessToken && storedRefreshToken) {
                console.log('Auth callback: TokenService successfully set tokens.');
            } else {
                console.error('Auth callback: TokenService FAILED to set tokens. This is critical.');
                // Fallback: Try to set them directly in localStorage if TokenService failed.
                if (typeof window !== 'undefined') {
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);
                    console.warn('Auth callback: Used direct localStorage as TokenService fallback.');
                }
            }
            
            // Also store user info if available
            if (typeof window !== 'undefined') {
                if (userId) localStorage.setItem('userId', userId);
                if (email) localStorage.setItem('userEmail', email);
            }
            
            // STEP 4: Short delay to ensure asynchronous operations can settle.
            // Especially if TokenService or underlying cookie/storage mechanisms have async aspects.
            await new Promise(resolve => setTimeout(resolve, 300)); // Reduced delay
            
            // STEP 5: Verify tokens were actually stored by TokenService's getter
            const verifiedAccessToken = TokenService.getAccessToken();
            const verifiedRefreshToken = TokenService.getRefreshToken();
            
            console.log('Auth callback: Tokens storage verification (via TokenService.getAccessToken):', {
              hasVerifiedAccessToken: !!verifiedAccessToken,
              hasVerifiedRefreshToken: !!verifiedRefreshToken,
              verifiedAccessTokenPreview: verifiedAccessToken ? `${verifiedAccessToken.substring(0, 10)}...` : 'MISSING',
              originalAccessTokenPreview: accessToken ? `${accessToken.substring(0,10)}...` : 'N/A'
            });
            
            if (!verifiedAccessToken) {
              console.warn('Auth callback: Access Token storage verification FAILED. The token might not be available for API calls.');
              // As an emergency measure, ensure auth flags are strongly set.
              TokenService.forceAuthSuccess(); 
              setError('Token storage verification failed. Please try logging in again. If the issue persists, contact support.');
              // Do not proceed to redirect if tokens couldn't be verified.
              // Let user see the error and debug info.
              setIsProcessing(false); 
              return; 
            }
            
            // Update debug info with verification results
            setDebugInfo(prev => ({ 
              ...prev, 
              storage: { 
                localStorage: {
                  accessToken: localStorage.getItem('accessToken')?.substring(0, 10) + '...',
                  refreshToken: localStorage.getItem('refreshToken')?.substring(0, 10) + '...',
                  authSuccessful: localStorage.getItem('auth_successful'),
                  authTimestamp: localStorage.getItem('auth_timestamp')
                },
                sessionStorage: {
                  accessToken: sessionStorage.getItem('accessToken')?.substring(0, 10) + '...',
                  refreshToken: sessionStorage.getItem('refreshToken')?.substring(0, 10) + '...'
                },
                cookies: {
                  accessToken: Cookies.get('accessToken')?.substring(0, 10) + '...',
                  refreshToken: Cookies.get('refreshToken')?.substring(0, 10) + '...',
                  authSuccessful: Cookies.get('auth_successful')
                },
                tokenService: {
                  accessToken: !!verifiedAccessToken,
                  refreshToken: !!verifiedRefreshToken
                }
              }
            }));
            
            // STEP 6: Mark tokens as successfully saved
            setTokensSaved(true);
            setIsProcessing(false);
            console.log('Auth callback: Token handling complete, preparing redirect to /dashboard');
            
            // STEP 9: Redirect to dashboard after all token handling is done
            // Use a slightly longer delay to ensure storage is complete and any UI updates render.
            setTimeout(() => {
              if (!redirectTriggered) { // Prevent multiple redirects
                console.log('Auth callback: Redirecting to dashboard now...');
                setRedirectTriggered(true);
                // Before redirect, ensure auth redirect block is lifted or will expire soon
                localStorage.removeItem('block_auth_redirect'); 
                localStorage.removeItem('block_until');
                window.location.href = '/dashboard'; // Full page navigation
              }
            }, 1000); // Reduced delay a bit
          } catch (error) {
            console.error('Auth callback: Error storing tokens:', error);
            setError('Error storing tokens: ' + String(error));
            setIsProcessing(false);
            
            // Force auth flags anyway
            TokenService.forceAuthSuccess();
          }
        } else {
          console.error('Auth callback: Missing token data');
          setError('Missing token data in URL');
          setIsProcessing(false);
          
          // Check if we have tokens in cookies or localStorage already
          const existingAccessToken = TokenService.getAccessToken();
          if (existingAccessToken) {
            console.log('Auth callback: Found existing tokens, redirecting to dashboard');
            // Force auth flags to prevent redirect issues
            TokenService.forceAuthSuccess();
            setTimeout(() => window.location.replace('/dashboard'), 1000);
          }
        }
      } catch (mainError) {
        console.error('Auth callback: Main process error:', mainError);
        setError('Main process error: ' + String(mainError));
        setIsProcessing(false);
        
        // Try to force auth flags even if there was an error
        try {
          TokenService.forceAuthSuccess();
        } catch (e) {
          console.error('Auth callback: Failed to force auth flags:', e);
        }
      }
    };

    // Execute immediately
    processCallback();
  }, [searchParams]);

  const handleManualRedirect = () => {
    // Force auth flags before redirecting
    TokenService.forceAuthSuccess();
    
    // Reset auth check counter 
    sessionStorage.setItem('auth_check_count', '0');
    
    // Use more direct approaches to set the most vital information
    try {
      // Get tokens from URL again just in case
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        console.log('Manual redirect: Setting tokens directly');
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        sessionStorage.setItem('accessToken', accessToken);
        document.cookie = `accessToken=${accessToken}; path=/; max-age=86400`;
      }
    } catch (e) {
      console.error('Error in manual redirect:', e);
    }
    
    window.location.href = '/dashboard';
  };

  return (
    <Container size="md" my="xl">
      <Center style={{ flexDirection: 'column', minHeight: '70vh' }}>
        <Paper shadow="md" p="xl" radius="md" withBorder style={{ width: '100%', maxWidth: 500 }}>
          <Title order={3} mb="md">Đang xử lý đăng nhập...</Title>
          {isProcessing ? (
            <Center>
              <Loader size="lg" />
            </Center>
          ) : error ? (
            <>
              <Text color="red" mb="md">Lỗi: {error}</Text>
              <Button onClick={handleManualRedirect} mt="md" fullWidth>
                Thử chuyển hướng thủ công đến Dashboard
              </Button>
            </>
          ) : (
            <>
              <Text color="green" mb="md" ta="center">Xác thực thành công! {tokensSaved ? '✓ Đã lưu token' : ''}</Text>
              {redirectTriggered ? (
                <Loader size="sm" m="auto" />
              ) : (
                <Button onClick={handleManualRedirect} mt="md" fullWidth>
                  Nhấn vào đây nếu không tự động chuyển hướng
                </Button>
              )}
            </>
          )}
          
          <Text mt="md" ta="center" size="sm" c="dimmed">
            Vui lòng đợi trong khi chúng tôi xác thực thông tin.
          </Text>
        </Paper>
        
        {/* Debug information */}
        <Container mt={50} style={{ maxWidth: '100%' }}>
          <Title order={5} mb="sm">Thông tin gỡ lỗi:</Title>
          <Code block style={{ maxHeight: '300px', overflow: 'auto' }}>
            {JSON.stringify(debugInfo, null, 2)}
          </Code>
        </Container>
      </Center>
    </Container>
  );
} 