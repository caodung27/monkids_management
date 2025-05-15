'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Table, TextInput, Group, Button, ActionIcon, Menu, Badge, Text } from '@mantine/core';
import { IconSearch, IconPlus, IconDotsVertical, IconEdit, IconTrash, IconPrinter, IconEye } from '@tabler/icons-react';
import Link from 'next/link';
import { teacherApi } from '@/api/apiService';
import { formatVND } from '@/utils/formatters';
import { Teacher } from '@/types';
import { notifications } from '@mantine/notifications';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from API
    const fetchTeachers = async () => {
      try {
        const data = await teacherApi.getAllTeachers();
        console.log('Fetched teachers data:', data);
        setTeachers(data);
      } catch (error) {
        console.error('Error fetching teachers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const handleDelete = async (teacherId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giáo viên này không?')) {
      try {
        await teacherApi.deleteTeacher(teacherId);
        setTeachers(prevTeachers => prevTeachers.filter(teacher => teacher.id !== teacherId));
        notifications.show({
          title: 'Thành công',
          message: 'Giáo viên đã được xóa thành công!',
          color: 'green',
        });
      } catch (error) {
        console.error('Error deleting teacher:', error);
        notifications.show({
          title: 'Lỗi',
          message: 'Có lỗi xảy ra khi xóa giáo viên. Vui lòng thử lại.',
          color: 'red',
        });
      }
    }
  };

  const filteredTeachers = teachers.filter(teacher => 
    teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (teacher.phone && teacher.phone.includes(searchTerm))
  );

  return (
    <Container size="lg" mt="md">
      <Group justify="space-between" mb="md">
        <Title order={2}>Danh sách giáo viên</Title>
        <Link href="/dashboard/teachers/new" style={{ textDecoration: 'none' }}>
          <Button leftSection={<IconPlus size={16} />}>
            Thêm giáo viên
          </Button>
        </Link>
      </Group>

      <TextInput
        placeholder="Tìm kiếm theo tên, vai trò, số điện thoại..."
        leftSection={<IconSearch size={16} />}
        value={searchTerm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        mb="md"
      />

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Tên</Table.Th>
            <Table.Th>Chức vụ</Table.Th>
            <Table.Th>SĐT</Table.Th>
            <Table.Th>Lương cơ bản</Table.Th>
            <Table.Th>Lương dạy thêm</Table.Th>
            <Table.Th>Đã ứng</Table.Th>
            <Table.Th>Tổng lương</Table.Th>
            <Table.Th style={{ width: 80 }}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={6} align="center">Đang tải...</Table.Td>
            </Table.Tr>
          ) : filteredTeachers.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={6} align="center">Không tìm thấy giáo viên nào</Table.Td>
            </Table.Tr>
          ) : (
            filteredTeachers.map((teacher) => (
              <Table.Tr key={teacher.id}>
                <Table.Td>{teacher.name}</Table.Td>
                <Table.Td>{teacher.phone}</Table.Td>
                <Table.Td>
                  {teacher.role?.split(',').map((rawRole, index) => {
                    const role = rawRole.trim(); 
                    const color =
                    role === 'Quản lý' ? 'blue' :
                    role === 'GV' ? 'green' :
                    role === 'Bảo mẫu' ? 'orange' :
                    'gray';

                    return (
                      <Badge key={index} color={color} className="flex flex-wrap gap-1">
                        {role}
                      </Badge>
                    );
                  })}
                </Table.Td>
                <Table.Td>
                  {formatVND(teacher.base_salary)}
                </Table.Td>
                <Table.Td>
                  {formatVND(teacher.extra_salary)}
                </Table.Td>
                <Table.Td>
                  {formatVND(teacher.paid_amount)}
                </Table.Td>
                <Table.Td>
                  <Text c={teacher.total_salary > 0 ? 'red' : 'green'}>
                    {formatVND(teacher.total_salary)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Menu position="bottom-end" withArrow>
                    <Menu.Target>
                      <ActionIcon variant="subtle">
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Link href={`/dashboard/teachers/${teacher.id}/edit`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Menu.Item leftSection={<IconEdit size={14} />}>
                          Chỉnh sửa
                        </Menu.Item>
                      </Link>
                      <Link href={`/dashboard/teachers/${teacher.id}/receipt`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Menu.Item leftSection={<IconPrinter size={14} />}>
                          In phiếu lương
                        </Menu.Item>
                      </Link>
                      <Menu.Item 
                        leftSection={<IconTrash size={14} />} 
                        c="red"
                        onClick={() => handleDelete(teacher.id!)}
                      >
                        Xóa
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Container>
  );
} 