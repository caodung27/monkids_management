'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  AppShell,
  Avatar, 
  Menu, 
  Group, 
  Text, 
  ActionIcon, 
  rem, 
  useMantineTheme, 
  Burger,
  Button,
  useMantineColorScheme,
  Switch
} from '@mantine/core';
import { 
  IconLogout, 
  IconChevronDown,
  IconUserCircle,
  IconSun,
  IconMoon,
  IconLock
} from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDisclosure, useToggle } from '@mantine/hooks';
import { authApi } from '@/api/apiService';
import { usePathname } from 'next/navigation';
import Logger from '@/libs/logger';

interface HeaderProps {
  opened: boolean;
  toggle: () => void;
}

export default function Header({ opened, toggle }: HeaderProps) {
  const { user, logout, isAuthenticated, updateUserInfo } = useAuth();
  const theme = useMantineTheme();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [themeValue, toggleTheme] = useToggle(['light', 'dark']);
  const profileId = user?.id;
  const pathname = usePathname();
  const prevPathRef = useRef<string>('');

  // Update user info only when returning from profile page to dashboard
  useEffect(() => {
    if (pathname === '/dashboard' && prevPathRef.current.startsWith('/profile/') && isAuthenticated) {
      updateUserInfo();
    }
    prevPathRef.current = pathname;
  }, [pathname, isAuthenticated, updateUserInfo]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Logger.error('Logout error:', error);
    }
  };

  return (
    <AppShell.Header p="md">
      <Group justify="space-between">
        <Group>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text fw={700} size="lg" variant="gradient" component={Link} href="/dashboard">
            Hệ thống quản lý
          </Text>
        </Group>

        <Group>
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <Group gap={7} style={{ cursor: 'pointer' }}>
                  <Avatar
                    src={user?.image || null}
                    alt={user?.name || 'User'}
                    color="blue"
                    radius="xl"
                    size={30}
                  >
                  </Avatar>
                  
                  <Text fw={500} size="sm" mr={3}>
                    {user?.name}
                  </Text>
                  <IconChevronDown size="1rem" />
                </Group>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Tài khoản</Menu.Label>
                <Menu.Item
                  leftSection={<IconUserCircle style={{ width: rem(14), height: rem(14) }} />}
                  component={Link}
                  href={`/profile/${profileId}`}
                >
                  Hồ sơ cá nhân
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconLock style={{ width: rem(14), height: rem(14) }} />}
                  component={Link}
                  href="/auth/reset-password"
                >
                  Đổi mật khẩu
                </Menu.Item>
                
                <Menu.Item leftSection={<IconSun style={{ width: rem(14), height: rem(14) }} />}>
                  <Group justify="space-between">
                    <Text size="sm">Giao diện:</Text>
                    <Switch
                      checked={colorScheme === 'dark'}
                      onChange={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
                      size="md"
                      color="blue"
                    />
                  </Group>
                </Menu.Item>
                
                <Menu.Divider />
                
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                  onClick={handleLogout}
                >
                  Đăng xuất
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          
        </Group>
      </Group>
    </AppShell.Header>
  );
} 