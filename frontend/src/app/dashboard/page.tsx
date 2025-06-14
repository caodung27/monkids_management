'use client';

import { useEffect, useState } from 'react';
import { SimpleGrid, Title, Container } from '@mantine/core';
import { IconUsers, IconSchool, IconCurrencyDollar } from '@tabler/icons-react';
import { studentApi, teacherApi, statsApi } from '@/api/apiService';
import { StatsCard } from '@/components/StatsCard';
import Logger from '@/libs/logger';

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
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
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
    </Container>
  );
} 