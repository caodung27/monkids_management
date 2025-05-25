'use client';

import { 
  NavLink, 
  Stack,
} from '@mantine/core';
import { 
  IconHome, 
  IconUsers, 
  IconSchool, 
  IconClockCheck
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  icon: typeof IconHome;
  label: string;
  href: string;
  requiredRoles?: ('ADMIN' | 'USER')[];
}

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { icon: IconHome, label: 'Trang chủ', href: '/dashboard' },
    { icon: IconSchool, label: 'Học sinh', href: '/dashboard/students' },
    { icon: IconUsers, label: 'Giáo viên', href: '/dashboard/teachers' },
    { icon: IconClockCheck, label: 'Chấm công GV', href: '/dashboard/attendance' },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return true;
    }
    
    return item.requiredRoles.some(role => user?.role === role);
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
          className="mantine-hover-card font-bold"
          prefetch
        />
      ))}
    </Stack>
  );
} 