'use client';

import { ReactNode, useState } from 'react';
import { AppShell as MantineAppShell, Burger, Group, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDashboard, IconUsers, IconUser, IconReceipt, IconLogout, IconSchool } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', icon: IconDashboard, link: '/dashboard' },
  { label: 'Học sinh', icon: IconSchool, link: '/dashboard/students' },
  { label: 'Giáo viên', icon: IconUsers, link: '/dashboard/teachers' },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text size="lg" fw={700}>MẦM NON ĐỘC LẬP MONKIDS</Text>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="md">
        <Text fw={500} mb="xs">Quản lý trường học</Text>
        {navItems.map((item) => (
          <Link href={item.link} key={item.link} style={{ textDecoration: 'none' }}>
            <div>
              <UnstyledButton
                w="100%"
                py="xs"
                px="md"
                mb="xs"
                style={{
                  borderRadius: '4px',
                  backgroundColor: pathname === item.link ? '#f1f3f5' : 'transparent',
                  fontWeight: pathname === item.link ? 600 : 400,
                }}
              >
                <Group>
                  <item.icon size="1.2rem" />
                  <Text>{item.label}</Text>
                </Group>
              </UnstyledButton>
            </div>
          </Link>
        ))}

        <UnstyledButton
          w="100%"
          py="xs"
          px="md"
          mb="xs"
          mt="auto"
          style={{
            borderRadius: '4px',
            marginTop: 'auto',
          }}
        >
          <Group>
            <IconLogout size="1.2rem" />
            <Text>Đăng xuất</Text>
          </Group>
        </UnstyledButton>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  );
} 