'use client';

import { 
  NavLink, 
  Stack,
} from '@mantine/core';
import { 
  IconHome, 
  IconUsers, 
  IconSchool, 
  IconClockCheck,
  IconUserCog
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  icon: any;
  label: string;
  href: string;
  roles?: string[];
}

const allNavItems: NavItem[] = [
  { 
    icon: IconHome, 
    label: 'Trang chủ', 
    href: '/dashboard',
    roles: ['ADMIN']
  },
  { 
    icon: IconSchool, 
    label: 'Học sinh', 
    href: '/dashboard/students',
    roles: ['ADMIN', 'USER']
  },
  { 
    icon: IconUsers, 
    label: 'Giáo viên', 
    href: '/dashboard/teachers',
    roles: ['ADMIN', 'TEACHER']
  },
  { 
    icon: IconClockCheck, 
    label: 'Chấm công GV', 
    href: '/dashboard/attendance',
    roles: ['ADMIN']
  },
  { 
    icon: IconUserCog, 
    label: 'Quản lý tài khoản', 
    href: '/dashboard/accounts',
    roles: ['ADMIN']
  },
];

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Filter navigation items based on user role
  const navItems = allNavItems.filter(item => {
    if (!item.roles) return true; // If no roles specified, show to all
    if (!user?.role) return false; // If no user role, don't show restricted items
    return item.roles.includes(user.role);
  });

  // Debug log
  console.log('Sidebar: User role:', user?.role);
  console.log('Sidebar: Filtered nav items:', navItems);

  return (
    <Stack gap="xs">
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          component={Link}
          href={item.href}
          label={item.label}
          leftSection={<item.icon size="1rem" stroke={1.5} />}
          active={pathname === item.href}
          variant="light"
          className="mantine-hover-card font-bold"
          prefetch
        />
      ))}
    </Stack>
  );
} 