'use client';

import { useState } from 'react';
import { 
  Container, 
  Paper, 
  Title, 
  TextInput, 
  PasswordInput, 
  Button, 
  Text,
  Alert
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { IconAlertCircle } from '@tabler/icons-react';
import Logger from '@/libs/logger';
import { authApi } from '@/api/apiService';

export default function ResetPassword() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      oldPassword: (value) => {
        if (!value) {
          return 'Vui lòng nhập mật khẩu hiện tại';
        }
        return null;
      },
      newPassword: (value, values) => {
        if (value === values.oldPassword) {
          return 'Mật khẩu mới không được trùng với mật khẩu hiện tại';
        }
        if (value.length < 8) {
          return 'Mật khẩu phải có ít nhất 8 ký tự';
        }
        if (!/[A-Z]/.test(value)) {
          return 'Mật khẩu phải chứa ít nhất một chữ hoa';
        }
        if (!/[a-z]/.test(value)) {
          return 'Mật khẩu phải chứa ít nhất một chữ thường';
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
          return 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt';
        }
        return null;
      },
      confirmPassword: (value, values) => {
        if (value !== values.newPassword) {
          return 'Mật khẩu xác nhận không khớp';
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);
      setError(null);

      await authApi.updatePassword(values.oldPassword, values.newPassword);
      router.push('/dashboard');
    } catch (err) {
      Logger.error('Password reset error:', err);
      setError('Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} mb="md" ta="center">
          Đổi mật khẩu
        </Title>

        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} color="red" mb="md">
            {error}
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <PasswordInput
            label="Mật khẩu hiện tại"
            placeholder="Nhập mật khẩu hiện tại"
            required
            mb="md"
            {...form.getInputProps('oldPassword')}
          />

          <PasswordInput
            label="Mật khẩu mới"
            placeholder="Nhập mật khẩu mới"
            required
            mb="md"
            {...form.getInputProps('newPassword')}
          />

          <PasswordInput
            label="Xác nhận mật khẩu mới"
            placeholder="Nhập lại mật khẩu mới"
            required
            mb="xl"
            {...form.getInputProps('confirmPassword')}
          />

          <Text size="sm" c="dimmed" mb="md">
            Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và ký tự đặc biệt.
          </Text>

          <Button type="submit" fullWidth loading={loading}>
            Đổi mật khẩu
          </Button>
        </form>
      </Paper>
    </Container>
  );
} 