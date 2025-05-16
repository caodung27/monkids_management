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
  Button
} from '@mantine/core';
import { 
  IconLogout, 
  IconSettings, 
  IconChevronDown,
  IconUserCircle
} from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDisclosure } from '@mantine/hooks';

interface HeaderProps {
  opened: boolean;
  toggle: () => void;
}

export default function Header({ opened, toggle }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const theme = useMantineTheme();

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
            Management System
          </Text>
        </Group>

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
              
              <Menu.Item
                leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
                component={Link}
                href="/settings"
              >
                Cài đặt
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
              Đăng nhập
            </Button>
            <Button component={Link} href="/register">
              Đăng ký
            </Button>
          </Group>
        )}
      </Group>
    </AppShell.Header>
  );
} 