'use client';

import { useEffect, useState } from 'react';
import { Card, SimpleGrid, Text, rem, Group, Title, Button, LoadingOverlay, Grid, Paper, Divider, Flex, Box, Badge, Stack, Tabs } from '@mantine/core';
import { IconAdjustments, IconDatabaseSearch, IconUsers, IconSchool, IconChartBar, IconCircleCheck, IconCircleX, IconCurrencyDollar, IconUsersGroup, IconCalendarStats, IconChartPie, IconClockHour4 } from '@tabler/icons-react';
import Link from 'next/link';
import { studentApi, TokenService } from '@/api/apiService';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setTeachers } from '@/store/slices/teachersSlice';
import dynamic from 'next/dynamic';
import { teacherApi } from '@/api/apiService';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { Student } from '@/types';
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement);

// Navigation feature cards
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
    title: 'Chấm công giáo viên',
    description: 'Chấm công, tính lương giáo viên hàng tháng',
    icon: IconCalendarStats,
    link: '/dashboard/attendance',
  },
];

// Stats card component
const StatsCard = ({ icon: Icon, title, value, color = 'blue', subtitle, diff }: { icon: any, title: string, value: string, color?: string, subtitle?: string, diff?: number }) => (
  <Paper withBorder p="md" radius="md">
    <Group justify="space-between">
      <Text size="xs" c="dimmed" fw={700} tt="uppercase">
        {title}
      </Text>
      <Icon size={22} color={`var(--mantine-color-${color}-6)`} stroke={1.5} />
    </Group>
    <Group align="flex-end" gap="xs" mt={25}>
      <Text fw={700} fz="xl">{value}</Text>
      {diff !== undefined && (
        <Text c={diff > 0 ? 'teal' : 'red'} fz="sm" fw={500}>
          {diff > 0 ? '+' : ''}{diff}%
        </Text>
      )}
    </Group>
    {subtitle && <Text fz="xs" c="dimmed" mt={7}>{subtitle}</Text>}
  </Paper>
);

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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const teachers = useSelector((state: RootState) => state.teachers.teachers);
  const [activeTab, setActiveTab] = useState<string | null>('general');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState([]);
  const [fees, setFees] = useState<FeesData>({
    paymentPercentage: 0,
    paymentStatus: [],
  });
  const [finance, setFinance] = useState<FinanceData | null>(null);
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // On component mount, load data and ensure auth flags are set
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const teacherRes = await teacherApi.getAllTeachers(1, 100);
        dispatch(setTeachers(teacherRes.results || []));
        const studentRes = await studentApi.getAllStudents(1, 100);
        setStudents(studentRes.data || []);
        // Mock dữ liệu doanh thu, lương, trạng thái học phí
        setFinance({
          revenue: 120000000,
          monthlyRevenue: [
            { month: '01/2024', revenue: 100000000 },
            { month: '02/2024', revenue: 120000000 },
            { month: '03/2024', revenue: 110000000 },
          ],
        });
        setFees({
          paymentPercentage: 90,
          paymentStatus: [
            { name: 'Đã đóng', value: 90, color: '#4CAF50' },
            { name: 'Chưa đóng', value: 10, color: '#F44336' },
          ],
        });
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);
  
  // Feature navigation cards
  const navigationCards = features.map((feature) => (
    <Link href={feature.link} key={feature.title} style={{ textDecoration: 'none' }}>
      <Card shadow="md" radius="md" className="mantine-hover-card" padding="xl">
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
    labels: finance?.monthlyRevenue.map(item => item.month) || [],
    datasets: [
      {
        label: 'Doanh thu',
        data: finance?.monthlyRevenue.map(item => item.revenue) || [],
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
      
      <Group align="center" mb={30}>
        <div>
          <Title order={1}>MẦM NON ĐỘC LẬP MONKIDS</Title>
          <Text c="dimmed" size="lg">Hệ thống quản lý trường mầm non</Text>
        </div>
      </Group>
      
      {/* Stats Overview */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb={30}>
        <StatsCard 
          icon={IconUsers} 
          title="Tổng số học sinh" 
          value={students.length.toString()} 
          color="blue" 
          subtitle="So với tháng trước" 
          diff={5}
        />
        <StatsCard 
          icon={IconSchool} 
          title="Giáo viên" 
          value={teachers.length.toString()} 
          color="green" 
          subtitle="2 giáo viên mới" 
          diff={20}
        />
        <StatsCard 
          icon={IconCurrencyDollar} 
          title="Doanh thu tháng" 
          value={formatCurrency(finance?.revenue || 0)} 
          color="yellow" 
          subtitle="So với tháng trước" 
          diff={3}
        />
      </SimpleGrid>
      
      {/* Navigation Cards */}
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="xl" mb={30}>
        {navigationCards}
      </SimpleGrid>
      
      {/* Data Visualization Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="teachers" leftSection={<IconSchool size={16} />}>
            Giáo viên
          </Tabs.Tab>
          <Tabs.Tab value="students" leftSection={<IconUsers size={16} />}>
            Học sinh
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="teachers" pt="xs">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {/* Student Distribution by Class */}
            <Paper withBorder p="md" radius="md" h={400}>
              <Title order={3} mb="md">Phân bổ giáo viên theo chức vụ</Title>
              {/* Chart removed */}
            </Paper>
            
            {/* Monthly Revenue */}
            <Paper withBorder p="md" radius="md" h={400}>
              <Title order={3} mb="md">Tiền lương theo tháng</Title>
              {/* Chart removed */}
            </Paper>
            
            {/* Fee Payment Status */}
            <Paper withBorder p="md" radius="md" h={400}>
              <Title order={3} mb="md">Chấm công giáo viên</Title>
              {/* Chart removed */}
            </Paper>
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="students" pt="xs">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {/* Student Distribution by Class */}
            <Paper withBorder p="md" radius="md" h={400}>
              <Title order={3} mb="md">Phân bổ học sinh theo lớp</Title>
              {/* Chart removed */}
            </Paper>
            
            {/* Fee Payment Status */}
            <Paper withBorder p="md" radius="md" h={400}>
              <Title order={3} mb="md">Trạng thái đóng học phí</Title>
              {/* Chart removed */}
            </Paper>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
} 