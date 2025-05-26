'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TextInput, 
  PasswordInput, 
  Button, 
  Title, 
  Text, 
  Anchor, 
  Divider,
  Paper,
  Container,
  Loader,
  Center
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { IconBrandGoogle } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, TokenService } from '@/api/apiService';
import { notifications } from '@mantine/notifications';
import { apiClient } from '@/libs/api';

interface LoginResponse {
  access_token: string;
}

// Form validation schema
const schema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ'),
  password: z
    .string()
    .min(1, 'Mật khẩu không được để trống')
});

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Redirect if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for tokens
        const hasToken = TokenService.checkTokensExist();
        
        if (hasToken) {
          // If we have tokens, redirect to dashboard
          router.replace('/dashboard');
          return;
        }
        
        // No tokens, allow login
        setIsChecking(false);
      } catch (error) {
        console.error('Login page: Error checking auth:', error);
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  // Form setup
  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: zodResolver(schema),
  });

  // Handle form submission
  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      setIsSubmitting(true);
      console.log('Login: Attempting login with email:', values.email);
      
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email: values.email,
        password: values.password
      });
      
      console.log('Login: Login response:', response);
      
      if (response && response.access_token) {
        console.log('Login: Login successful, saving tokens');
        
        // Save tokens
        TokenService.setAccessToken(response.access_token);
        
        // Set auth flags
        localStorage.setItem('auth_successful', 'true');
        sessionStorage.setItem('auth_successful', 'true');
        
        // Show success notification
        notifications.show({
          title: 'Thành công',
          message: 'Đăng nhập thành công',
          color: 'green',
        });
        
        // Force a small delay to ensure tokens are saved
        setTimeout(() => {
          console.log('Login: Executing redirect to dashboard');
          window.location.href = '/dashboard';
        }, 500);
      } else {
        throw new Error('Không nhận được token từ server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      notifications.show({
        title: 'Lỗi',
        message: error.message || 'Đăng nhập thất bại',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLoginClick = () => {
    try {
      // Clear any existing tokens before initiating a new OAuth flow
      TokenService.clearTokens();
      
      // Set a flag indicating we're starting OAuth
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('oauth_initiated', Date.now().toString());
      }
      
      // Use the proxy path for OAuth
      const authUrl = '/api/auth/google';
      
      console.log('Login: Initiating Google OAuth login', { authUrl });
      
      // Redirect to the OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login: Error initiating Google OAuth', error);
      // Handle error (could display a notification here)
    }
  };

  if (isChecking) {
    return (
      <Container size="xs" my="xl">
        <Center mt="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xs" my="xl">
      <Paper radius="md" p="xl" withBorder>
        <Title ta="center" order={2} mt="md" mb="md">
          Đăng nhập vào MONKIDS
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Email"
            placeholder="you@example.com"
            required
            {...form.getInputProps('email')}
            mb="md"
          />

          <PasswordInput
            label="Mật khẩu"
            placeholder="Mật khẩu của bạn"
            required
            {...form.getInputProps('password')}
            mb="md"
          />

          <Button 
            fullWidth 
            mt="xl" 
            type="submit" 
            loading={isSubmitting}
          >
            Đăng nhập
          </Button>
        </form>

        <Divider label="Hoặc tiếp tục với" labelPosition="center" my="lg" />

        {/* Google login button - now navigates to backend */}
        {/* <Button
          fullWidth
          variant="outline"
          leftSection={<IconBrandGoogle />}
          onClick={handleGoogleLoginClick}
          mb="md"
        >
          Đăng nhập với Google
        </Button> */}

        <Text ta="center" mt="md">
          Chưa có tài khoản?{' '}
          <Anchor href="/register" fw={700}>
            Đăng ký
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
} 
