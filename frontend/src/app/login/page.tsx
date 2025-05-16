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
import { TokenService } from '@/api/apiService';

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

  // Redirect if already authenticated
  useEffect(() => {
    // Check for any authentication flags or tokens
    const hasTokens = TokenService.hasAnyToken();
    const hasAuthFlags = typeof window !== 'undefined' && (
      localStorage.getItem('auth_successful') === 'true' ||
      sessionStorage.getItem('auth_successful') === 'true' ||
      localStorage.getItem('block_auth_redirect') === 'true'
    );
    
    // Log authentication state
    console.log('Login page: Authentication check', { hasTokens, hasAuthFlags });
    
    // If already authenticated, redirect to dashboard
    if (hasTokens || hasAuthFlags) {
      console.log('Login page: User appears to be authenticated, redirecting to dashboard');
      router.replace('/dashboard');
    }
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
      await login(values.email, values.password);
    } catch (error) {
      console.error('Login error:', error);
      // Error notifications are handled in the AuthContext
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
      
      // Build the Google OAuth URL with proper parameters
      const backendUrl = process.env.NEXT_PUBLIC_API_URL ? 
        process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : 
        'http://localhost:8000';
      
      // Use the standard OAuth path with redirect preference
      const authUrl = `${backendUrl}/oauth/login/google-oauth2/?redirect_to=dashboard`;
      
      console.log('Login: Initiating Google OAuth login', { authUrl });
      
      // Redirect to the OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login: Error initiating Google OAuth', error);
      // Handle error (could display a notification here)
    }
  };

  const isLoading = authLoading;

  if (isLoading) {
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
        <Button
          fullWidth
          variant="outline"
          leftSection={<IconBrandGoogle />}
          onClick={handleGoogleLoginClick}
          mb="md"
        >
          Đăng nhập với Google
        </Button>

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