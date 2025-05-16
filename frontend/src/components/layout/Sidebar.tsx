'use client';

import { useState } from 'react';
import { 
  NavLink, 
  Stack,
  Text,
  Box
} from '@mantine/core';
import { 
  IconHome, 
  IconUsers, 
  IconSchool, 
  IconSettings, 
  IconReportAnalytics,
  IconUserCircle
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  icon: typeof IconHome;
  label: string;
  href: string;
  requiredRoles?: ('admin' | 'teacher')[];
}

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const isAdmin = user?.is_admin;
  const isTeacher = user?.is_teacher;

  const navItems: NavItem[] = [
    { icon: IconHome, label: 'Trang chủ', href: '/dashboard' },
    { icon: IconSchool, label: 'Học sinh', href: '/dashboard/students' },
    { icon: IconUsers, label: 'Giáo viên', href: '/dashboard/teachers' },
    { 
      icon: IconReportAnalytics, 
      label: 'Báo cáo', 
      href: '/dashboard/reports', 
      requiredRoles: ['admin'] 
    },
    { 
      icon: IconSettings, 
      label: 'Cài đặt hệ thống', 
      href: '/dashboard/settings', 
      requiredRoles: ['admin'] 
    },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return true;
    }
    
    return item.requiredRoles.some(role => {
      if (role === 'admin') return isAdmin;
      if (role === 'teacher') return isTeacher;
      return false;
    });
  });

  return (
    <Stack gap="xs">
      {filteredNavItems.map((item) => (
        <NavLink
          key={item.href}
          component={Link}
          href={item.href}
          label={item.label}
          leftSection={<item.icon size="1rem" stroke={1.5} />}
          active={pathname === item.href}
          variant="light"
        />
      ))}
    </Stack>
  );
} 