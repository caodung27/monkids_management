'use client';

import { useState } from 'react';
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
  IconMoon
} from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDisclosure, useToggle } from '@mantine/hooks';

interface HeaderProps {
  opened: boolean;
  toggle: () => void;
}

export default function Header({ opened, toggle }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const theme = useMantineTheme();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [themeValue, toggleTheme] = useToggle(['light', 'dark']);

  const handleLogout = async () => {
    await logout();
  };

  const fullName = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user?.email;

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
          {isAuthenticated ? (
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <Group gap={7} style={{ cursor: 'pointer' }}>
                  <Avatar
                    src={user?.profile_picture || null}
                    alt={fullName || 'User'}
                    color="blue"
                    radius="xl"
                    size={30}
                  >
                    {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                  </Avatar>
                  
                  <Text fw={500} size="sm" mr={3}>
                    {fullName}
                  </Text>
                  <IconChevronDown size="1rem" />
                </Group>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Tài khoản</Menu.Label>
                <Menu.Item
                  leftSection={<IconUserCircle style={{ width: rem(14), height: rem(14) }} />}
                  component={Link}
                  href="/profile"
                >
                  Hồ sơ cá nhân
                </Menu.Item>
                
                <Menu.Item leftSection={<IconSun style={{ width: rem(14), height: rem(14) }} />}>
                  <Group justify="space-between">
                    <Text fw={500} size="sm">Giao diện:</Text>
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
          ) : (
            <Group>
              <Button component={Link} href="/login" variant="subtle">
                Login
              </Button>
              <Button component={Link} href="/register">
                Register
              </Button>
            </Group>
          )}
        </Group>
      </Group>
    </AppShell.Header>
  );
} 