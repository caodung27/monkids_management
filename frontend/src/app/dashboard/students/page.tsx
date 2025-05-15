'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Table, TextInput, Group, Button, ActionIcon, Menu, Text, Badge } from '@mantine/core';
import { IconSearch, IconPlus, IconDotsVertical, IconEdit, IconTrash, IconPrinter, IconEye } from '@tabler/icons-react';
import Link from 'next/link';
import { studentApi } from '@/api/apiService';
import { formatVND } from '@/utils/formatters';
import { Student } from '@/types';
import { notifications } from '@mantine/notifications';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentApi.getAllStudents();
      console.log('Fetched students data:', data);
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]); // Clear students or handle error appropriately
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDeleteStudent = async (sequentialNumber: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa học sinh này không?')) {
      try {
        await studentApi.deleteStudent(sequentialNumber);
        setStudents(prevStudents => prevStudents.filter(s => s.sequential_number !== sequentialNumber));
        notifications.show({
          title: 'Thành công',
          message: 'Học sinh đã được xóa thành công!',
          color: 'green',
        });
      } catch (error) {
        console.error('Error deleting student:', error);
        notifications.show({
          title: 'Lỗi',
          message: 'Có lỗi khi xóa học sinh. Vui lòng thử lại sau.',
          color: 'red',
        });
      }
    }
  };

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.classroom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(student.student_id).includes(searchTerm)
  );

  return (
    <Container size="lg" mt="md">
      <Group justify="space-between" mb="md">
        <Title order={2}>Danh sách học sinh</Title>
        <Link href="/dashboard/students/new" style={{ textDecoration: 'none' }}>
          <Button leftSection={<IconPlus size={16} />}>
            Thêm học sinh
          </Button>
        </Link>
      </Group>

      <TextInput
        placeholder="Tìm kiếm theo tên, lớp, ID..."
        leftSection={<IconSearch size={16} />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        mb="md"
      />

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Tên</Table.Th>
            <Table.Th>Lớp</Table.Th>
            <Table.Th>Ngày sinh</Table.Th>
            <Table.Th>Tổng học phí</Table.Th>
            <Table.Th>Đã đóng</Table.Th>
            <Table.Th>Còn lại</Table.Th>
            <Table.Th style={{ width: 80 }}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={7} align="center">Đang tải...</Table.Td>
            </Table.Tr>
          ) : filteredStudents.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={7} align="center">Không tìm thấy học sinh nào</Table.Td>
            </Table.Tr>
          ) : (
            filteredStudents.map((student) => (
              <Table.Tr key={student.sequential_number}>
                <Table.Td>{student.student_id}</Table.Td>
                <Table.Td>{student.name}</Table.Td>
                <Table.Td>
                  <Badge color={
                    student.classroom === 'Mon1' ? 'blue' : 
                    student.classroom === 'Mon2' ? 'green' :
                    student.classroom === 'Mon3' ? 'orange' :
                    'gray'
                  }>
                    {student.classroom}
                  </Badge>
                </Table.Td>
                <Table.Td>{student.birthdate}</Table.Td>
                <Table.Td>
                  {formatVND(student.total_fee)}
                </Table.Td>
                <Table.Td>
                  {formatVND(student.paid_amount)}
                </Table.Td>
                <Table.Td>
                  <Text c={student.remaining_amount > 0 ? 'red' : 'green'}>
                    {formatVND(student.remaining_amount)}
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
                      <Link href={`/dashboard/students/${student.sequential_number}/edit`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Menu.Item leftSection={<IconEdit size={14} />}>
                          Chỉnh sửa
                        </Menu.Item>
                      </Link>
                      <Link href={`/dashboard/students/${student.sequential_number}/receipt`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Menu.Item leftSection={<IconPrinter size={14} />}>
                          In biên lai
                        </Menu.Item>
                      </Link>
                      <Menu.Item 
                        leftSection={<IconTrash size={14} />}
                        color="red"
                        onClick={() => handleDeleteStudent(student.sequential_number)}
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