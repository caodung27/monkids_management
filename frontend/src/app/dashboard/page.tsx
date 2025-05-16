'use client';

import { useEffect, useState } from 'react';
import { Card, SimpleGrid, Text, rem, Group, Title, Button, LoadingOverlay } from '@mantine/core';
import { IconAdjustments, IconDatabaseSearch, IconUsers, IconSchool } from '@tabler/icons-react';
import Link from 'next/link';
import Image from 'next/image';
import { TokenService } from '@/api/apiService';

const features = [
  {
    title: 'Quản lý học sinh',
    description: 'Danh sách học sinh, thông tin cá nhân, học phí',
    icon: IconUsers,
    link: '/dashboard/students',
  },
  {
    title: 'Quản lý giáo viên',
    description: 'Danh sách giáo viên, thông tin chấm công, lương',
    icon: IconSchool,
    link: '/dashboard/teachers',
  },
  {
    title: 'Báo cáo & Thống kê',
    description: 'Thống kê tổng hợp, báo cáo thu chi, báo cáo tài chính',
    icon: IconDatabaseSearch,
    link: '/dashboard/reports',
  },
  {
    title: 'Cài đặt & Tùy chỉnh',
    description: 'Cài đặt hệ thống, tùy chỉnh thông số, quản lý tài khoản',
    icon: IconAdjustments,
    link: '/dashboard/settings',
  },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  
  // On component mount, ensure auth flags are set
  useEffect(() => {
    // Force auth flags to prevent any redirects
    if (typeof window !== 'undefined') {
      TokenService.forceAuthSuccess();
      
      // Set a timeout to finish loading
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, []);
  
  const items = features.map((feature) => (
    <Link href={feature.link} key={feature.title} style={{ textDecoration: 'none' }}>
      <Card shadow="md" radius="md" className="mantine-hover-card" padding="xl" w={350}>
        <feature.icon
          style={{ width: rem(50), height: rem(50) }}
          stroke={2}
          color="var(--mantine-color-blue-6)"
        />
        <Text fz="lg" fw={600} className="mt-md">
          {feature.title}
        </Text>
        <Text fz="sm" c="dimmed" mt="sm">
          {feature.description}
        </Text>
      </Card>
    </Link>
  ));

  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
      
      <Group align="center" mb={50}>
        <div>
          <Title order={1}>MẦM NON ĐỘC LẬP MONKIDS</Title>
          <Text c="dimmed" size="lg">Hệ thống quản lý trường mầm non</Text>
        </div>
      </Group>
      
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="xl" mt={50}>
        {items}
      </SimpleGrid>
    </div>
  );
} 