'use client';

import { Container, Title, Grid, Paper, Text, Group } from '@mantine/core';
import { IconUsers, IconUser, IconReceipt, IconSchool } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { studentApi, teacherApi } from '@/api/apiService';

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
  });

  useEffect(() => {
    // Fetch actual data from API
    const fetchStats = async () => {
      try {
        // Use apiService to fetch data
        const studentsData = await studentApi.getAllStudents();
        const teachersData = await teacherApi.getAllTeachers();
        
        // Update stats with actual counts
        setStats({
          students: studentsData.length || 0,
          teachers: teachersData.length || 0,
        });
        
        console.log('Dashboard stats updated:', {
          students: studentsData.length,
          teachers: teachersData.length
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <Container size="lg" mt="md">
      <Title order={2} mb="lg">Dashboard</Title>
      
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md">
            <Group>
              <IconSchool size={28} color="#228be6" />
              <div>
                <Text size="xs" c="dimmed">Học sinh</Text>
                <Text fw={700} size="xl">{stats.students}</Text>
              </div>
            </Group>
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md">
            <Group>
              <IconUsers size={28} color="#40c057" />
              <div>
                <Text size="xs" c="dimmed">Giáo viên</Text>
                <Text fw={700} size="xl">{stats.teachers}</Text>
              </div>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>

      <Paper withBorder p="lg" mt="xl">
        <Title order={3} mb="md">Thông tin hệ thống</Title>
        <Text>Chào mừng đến với Hệ thống quản lý Mầm Non MonKids. Từ đây, bạn có thể quản lý danh sách học sinh, giáo viên và xem biên lai học phí.</Text>
      </Paper>
    </Container>
  );
} 