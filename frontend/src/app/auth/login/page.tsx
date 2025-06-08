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
  Paper,
  Container,
  Loader,
  Center
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, TokenService } from '@/api/apiService';
import { notifications } from '@mantine/notifications';

interface LoginResponse {
  access_token: string;
  redirectTo?: string;
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
      await login(values.email, values.password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
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
          Đăng nhập trang quản lý
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

        <Text ta="center" mt="md">
          Chưa có tài khoản?{' '}
          <Anchor href="/auth/register" fw={700}>
            Đăng ký
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
} 
