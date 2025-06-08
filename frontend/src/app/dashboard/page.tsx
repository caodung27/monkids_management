'use client';

import { useEffect, useState } from 'react';
import { Card, SimpleGrid, Text, rem, Group, Title, Button, LoadingOverlay, Grid, Paper, Divider, Flex, Box, Badge, Stack, Tabs, Container } from '@mantine/core';
import { IconAdjustments, IconDatabaseSearch, IconUsers, IconSchool, IconChartBar, IconCircleCheck, IconCircleX, IconCurrencyDollar, IconUsersGroup, IconCalendarStats, IconChartPie, IconClockHour4 } from '@tabler/icons-react';
import Link from 'next/link';
import { studentApi, teacherApi, statsApi } from '@/api/apiService';
import { useTeachers } from '@/api/hooks/useTeachers';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { Student } from '@/types';
import { StatsCard } from '@/components/StatsCard';
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement);

// Navigation feature cards
const features = [
  {
    title: 'Quản lý học sinh',
    description: 'Danh sách học sinh, thông tin cá nhân, học phí',
    icon: IconSchool,
    link: '/dashboard/students',
  },
  {
    title: 'Quản lý giáo viên',
    description: 'Danh sách giáo viên, thông tin chấm công, lương',
    icon: IconUsers,
    link: '/dashboard/teachers',
  },
  {
    title: 'Chấm công giáo viên',
    description: 'Chấm công, tính lương giáo viên hàng tháng',
    icon: IconCalendarStats,
    link: '/dashboard/attendance',
  },
];

interface PaymentStatus {
  name: string;
  value: number;
  color: string;
}

interface FeesData {
  paymentPercentage: number;
  paymentStatus: PaymentStatus[];
}

interface FinanceData {
  revenue: number;
  monthlyRevenue: { month: string; revenue: number }[];
}

interface MonthlyStats {
  current: {
    totalStudents: number;
    totalTeachers: number;
    totalFees: number;
    totalSalaries: number;
  };
  previous: {
    totalStudents: number;
    totalTeachers: number;
    totalFees: number;
    totalSalaries: number;
  };
  diff: {
    totalStudents: number;
    totalTeachers: number;
    totalFees: number;
    totalSalaries: number;
  };
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const { teachers: initialTeachers, loading: teachersLoading } = useTeachers();
  const [activeTab, setActiveTab] = useState<string | null>('general');
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState([]);
  const [fees, setFees] = useState<FeesData>({
    paymentPercentage: 0,
    paymentStatus: [],
  });
  const [finance, setFinance] = useState<any>(null);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };
  
  // On component mount, load data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentsRes, teachersRes] = await Promise.all([
          studentApi.getAllStudents(1, 1000),
          teacherApi.getAllTeachers(1, 1000),
          statsApi.getMonthlyStats()
        ]);

        if (studentsRes?.data) setStudents(studentsRes.data);
        if (teachersRes?.data) setTeachers(teachersRes.data);
      } catch (error) {
        Logger.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsApi.getMonthlyStats();
        setStats(data);
      } catch (error) {
        Logger.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);
  
  // Feature navigation cards
  const navigationCards = features.map((feature) => (
    <Link href={feature.link} key={feature.title} style={{ textDecoration: 'none' }}>
      <Card shadow="md" radius="md" className="mantine-hover-card" padding="xl" h={200}>
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

  const classStats = [
    { name: 'MON 1', value: students.filter(s => s.classroom === 'MON 1').length },
    { name: 'MON 2', value: students.filter(s => s.classroom === 'MON 2').length },
    { name: 'MON 3', value: students.filter(s => s.classroom === 'MON 3').length },
    { name: 'MON 4', value: students.filter(s => s.classroom === 'MON 4').length },
  ];
  const pieData = {
    labels: classStats.map(c => c.name),
    datasets: [{
      data: classStats.map(c => c.value),
      backgroundColor: ['#4CAF50', '#2196F3', '#FFC107', '#F44336'],
    }]
  };

  const lineData = {
    labels: finance?.monthlyRevenue.map((item: { month: string }) => item.month) || [],
    datasets: [
      {
        label: 'Doanh thu',
        data: finance?.monthlyRevenue.map((item: { revenue: number }) => item.revenue) || [],
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const getCurrentMonthStats = (items: any[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return items.filter(item => {
      const createdDate = new Date(item.created_at);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;
  };

  const newStudentsCount = getCurrentMonthStats(students);
  const newTeachersCount = getCurrentMonthStats(teachers);

  return (
    <Container size="lg" mt="md">
      <Title order={2} mb="md">Tổng quan</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb={30}>
        <StatsCard 
          icon={IconSchool} 
          title="Tổng số học sinh" 
          value={stats?.current.totalStudents.toString() || '0'} 
          color="blue" 
          subtitle={`${stats?.diff.totalStudents || 0} học sinh mới trong tháng`} 
          diff={stats?.diff.totalStudents || 0}
        />
        <StatsCard 
          icon={IconUsers} 
          title="Giáo viên" 
          value={stats?.current.totalTeachers.toString() || '0'} 
          color="green" 
          subtitle={`${stats?.diff.totalTeachers || 0} giáo viên mới trong tháng`} 
          diff={stats?.diff.totalTeachers || 0}
        />
        <StatsCard 
          icon={IconCurrencyDollar} 
          title="Tổng học phí" 
          value={formatCurrency(stats?.current.totalFees || 0)} 
          color="yellow" 
          subtitle="So với tháng trước" 
          diff={stats?.diff.totalFees || 0}
        />
        <StatsCard 
          icon={IconCurrencyDollar} 
          title="Tổng lương" 
          value={formatCurrency(stats?.current.totalSalaries || 0)} 
          color="red" 
          subtitle="So với tháng trước" 
          diff={stats?.diff.totalSalaries || 0}
        />
      </SimpleGrid>
      
      {/* Navigation Cards */}
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="xl" mb={30}>
        {navigationCards}
      </SimpleGrid>
    </Container>
  );
} 