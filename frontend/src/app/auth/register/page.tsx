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
  Stack,
  Loader,
  Center,
  Textarea
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { authApi, TokenService } from '@/api/apiService';
import { notifications } from '@mantine/notifications';

// Form validation schema
const schema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ'),
  name: z
    .string()
    .min(1, 'Họ và tên không được để trống')
    .min(3, 'Họ và tên phải có ít nhất 3 ký tự'),
  phone: z
    .string()
    .min(1, 'Số điện thoại không được để trống')
    .regex(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số'),
  address: z
    .string()
    .min(1, 'Địa chỉ không được để trống')
    .min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),
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
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const hasToken = TokenService.checkTokensExist();
        if (hasToken) {
          const tokenStatus = await authApi.introspectToken();
          if (tokenStatus.active) {
            router.replace('/dashboard');
            return;
          }
        }
      } catch (error) {
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  // Form setup
  const form = useForm<FormValues>({
    initialValues: {
      email: '',
      name: '',
      phone: '',
      address: '',
      password: '',
      password_confirm: '',
    },
    validate: zodResolver(schema),
  });

  // Handle form submission
  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Call register API directly
      const response = await authApi.register({
        email: values.email,
        name: values.name,
        phone: values.phone,
        address: values.address,
        password: values.password
      });

      if (response) {
        notifications.show({
          title: 'Thành công',
          message: 'Đăng ký tài khoản thành công',
          color: 'green',
        });

        // Redirect to login page after successful registration
        router.push('/auth/login');
      }
    } catch (error: any) {
      notifications.show({
        title: 'Lỗi',
        message: error.message || 'Đăng ký thất bại, vui lòng thử lại',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isChecking) {
    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white'
      }}>
        <Loader size="xl" />
      </div>
    );
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
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              required
              {...form.getInputProps('name')}
            />

            <TextInput
              label="Số điện thoại"
              placeholder="0123456789"
              required
              {...form.getInputProps('phone')}
            />

            <Textarea
              label="Địa chỉ"
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
              required
              minRows={2}
              autosize
              maxRows={4}
              {...form.getInputProps('address')}
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
          <Anchor href="/auth/login" fw={700}>
            Đăng nhập
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
} 