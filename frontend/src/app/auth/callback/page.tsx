'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { Container, Text, Loader, Center } from '@mantine/core';
import { authApi, TokenService } from '@/api/apiService';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('OAuthCallback: Handling callback');
        
        // Get the authorization code from the URL
        const code = searchParams.get('code');
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const email = searchParams.get('email');
        const isNewUserParam = searchParams.get('is_new_user');
        const allParams = Object.fromEntries(searchParams.entries());

        console.log('[AUTH_CALLBACK_DEBUG] All Raw Query Params:', allParams);
        console.log(`[AUTH_CALLBACK_DEBUG] Raw 'is_new_user' param from URL: '${isNewUserParam}'`);
        
        const isNewUser = isNewUserParam === 'true';
        console.log(`[AUTH_CALLBACK_DEBUG] Parsed 'isNewUser' boolean: ${isNewUser}`);
        
        console.log('OAuthCallback: Essential Derived Params', { 
          hasCode: !!code, 
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          email: email, 
          isNewUserBoolean: isNewUser
        });
        
        if (accessToken && refreshToken) {
          TokenService.setAccessToken(accessToken);
          TokenService.setRefreshToken(refreshToken);
          
          if (email) {
            localStorage.setItem('user_email', email);
            document.cookie = `email=${email};path=/;max-age=86400`;
          }
          
          if (isNewUser) {
            console.log('OAuthCallback: Setting isNewUser flag to true');
            localStorage.setItem('isNewUser', 'true');
            localStorage.setItem('rawIsNewUserValue', 'true');
          } else {
            localStorage.setItem('isNewUser', 'false');
            localStorage.setItem('rawIsNewUserValue', 'false');
          }
          
          TokenService.forceAuthSuccess();
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (isNewUser) {
            console.log('OAuthCallback: Redirecting new user to profile creation via router.push');
            router.push('/profile/new');
          } else {
            console.log('OAuthCallback: Redirecting existing user to dashboard via router.push');
            router.push('/dashboard');
          }
          return;
        }
        
        if (code) {
          console.log('OAuthCallback: Exchanging code for tokens');
          
          try {
            const response = await fetch('/api/auth/google/callback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code }),
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('OAuthCallback: Exchange response', { 
              hasAccessToken: !!data.access_token,
              hasEmail: !!data.email,
              isNewUser: data.is_new_user
            });
            
            TokenService.setAccessToken(data.access_token);
            TokenService.setRefreshToken(data.refresh_token);
            
            if (data.email) {
              localStorage.setItem('user_email', data.email);
              document.cookie = `email=${data.email};path=/;max-age=86400`;
            }
            
            if (data.is_new_user) {
              console.log('OAuthCallback: Setting isNewUser flag to true from API response');
              localStorage.setItem('isNewUser', 'true');
              localStorage.setItem('rawIsNewUserValue', 'true');
            } else {
              localStorage.setItem('isNewUser', 'false');
              localStorage.setItem('rawIsNewUserValue', 'false');
            }
            
            TokenService.forceAuthSuccess();
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (data.is_new_user) {
              console.log('OAuthCallback: Redirecting new user to profile creation via router.push (after code exchange)');
              router.push('/profile/new');
            } else {
              console.log('OAuthCallback: Redirecting existing user to dashboard via router.push (after code exchange)');
              router.push('/dashboard');
            }
            return;
          } catch (exchangeError) {
            console.error('OAuthCallback: Error exchanging code for tokens:', exchangeError);
            setError('Đã xảy ra lỗi khi xử lý đăng nhập. Vui lòng thử lại.');
            router.push('/login');
            return;
          }
        }
        
        console.error('OAuthCallback: No tokens or code found');
        setError('Không tìm thấy mã xác thực. Vui lòng thử lại.');
        router.push('/login');
      } catch (error) {
        console.error('OAuthCallback: Error handling callback:', error);
        setError('Đã xảy ra lỗi khi xử lý đăng nhập. Vui lòng thử lại.');
        router.push('/login');
      } finally {
        setIsProcessing(false);
      }
    };
    
    handleCallback();
  }, [router, searchParams]);
  
  return (
    <Container size="xs" my="xl">
      <Center mt="xl">
        <div style={{ textAlign: 'center' }}>
          <Loader size="lg" />
          <Text mt="md">
            {error || 'Đang xử lý đăng nhập...'}
          </Text>
        </div>
      </Center>
    </Container>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <Container size="xs" my="xl">
        <Center mt="xl">
          <div style={{ textAlign: 'center' }}>
            <Loader size="lg" />
            <Text mt="md">Đang tải...</Text>
          </div>
        </Center>
      </Container>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
} 