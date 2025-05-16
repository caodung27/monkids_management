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
  Stack
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

// Form validation schema
const schema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ'),
  first_name: z
    .string()
    .min(1, 'Tên không được để trống'),
  last_name: z
    .string()
    .min(1, 'Họ không được để trống'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  password_confirm: z
    .string()
    .min(1, 'Xác nhận mật khẩu không được để trống')
}).refine((data) => data.password === data.password_confirm, {
  message: "Mật khẩu không khớp",
  path: ["password_confirm"],
});

// Form values type
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Form setup
  const form = useForm<FormValues>({
    initialValues: {
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      password_confirm: '',
    },
    validate: zodResolver(schema),
  });

  // Handle form submission
  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      await register(values);
    } catch (error) {
      console.error('Registration error:', error);
      // Error notifications are handled in the AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Container size="xs" my="xl">
      <Paper radius="md" p="xl" withBorder>
        <Title ta="center" order={2} mt="md" mb="md">
          Đăng ký tài khoản
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="you@example.com"
              required
              {...form.getInputProps('email')}
            />

            <TextInput
              label="Họ"
              placeholder="Nguyễn"
              required
              {...form.getInputProps('last_name')}
            />

            <TextInput
              label="Tên"
              placeholder="Văn A"
              required
              {...form.getInputProps('first_name')}
            />

            <PasswordInput
              label="Mật khẩu"
              placeholder="Mật khẩu của bạn"
              required
              {...form.getInputProps('password')}
            />

            <PasswordInput
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              required
              {...form.getInputProps('password_confirm')}
            />

            <Button 
              fullWidth 
              mt="xl" 
              type="submit" 
              loading={isSubmitting}
            >
              Đăng ký
            </Button>
          </Stack>
        </form>

        <Text ta="center" mt="md">
          Đã có tài khoản?{' '}
          <Anchor href="/login" fw={700}>
            Đăng nhập
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
} 