'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Table, TextInput, Group, Button, ActionIcon, Menu, Text, Badge, Select, Checkbox, Modal } from '@mantine/core';
import { IconSearch, IconPlus, IconDotsVertical, IconEdit, IconTrash, IconPrinter } from '@tabler/icons-react';
import Link from 'next/link';
import { studentApi } from '@/api/apiService';
import { Pagination } from '@/components/Pagination';
import { notifications } from '@mantine/notifications';

// Simple formatter for Vietnamese currency
const formatVND = (value: string | number) => {
  return Number(value).toLocaleString('vi-VN') + ' đ';
};

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const fetchStudents = async (page: number, pageSize: number = itemsPerPage) => {
    setLoading(true);
    try {
      const data = await studentApi.getAllStudents(page, pageSize);
      console.log('Fetched students data:', data);
      
      if (data && typeof data === 'object') {
        setStudents(data.results || []);
        setTotalStudents(data.count || 0);
        setCurrentPage(page);
        setTotalPages(Math.ceil((data.count || 0) / pageSize));
        // Clear selection when fetching new data
        setSelectedRows([]);
      } else {
        console.error('Unexpected API response format:', data);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(1, itemsPerPage);
  }, [itemsPerPage]);

  const handlePageChange = (page: number) => {
    fetchStudents(page, itemsPerPage);
    window.scrollTo(0, 0); // Scroll to top when changing page
  };

  const handlePageSizeChange = (value: string | null) => {
    if (value) {
      const newSize = parseInt(value);
      setItemsPerPage(newSize);
      setCurrentPage(1); // Reset to first page when changing page size
    }
  };

  const handleDeleteStudent = async (sequentialNumber: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa học sinh này không?')) {
      try {
        await studentApi.deleteStudent(sequentialNumber);
        setStudents(prevStudents => prevStudents.filter(s => s.sequential_number !== sequentialNumber));
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
  };

  const handleDeleteSelected = async () => {
    setIsConfirmDeleteOpen(true);
  };

  const confirmDeleteSelected = async () => {
    try {
      // Use the new bulk delete API endpoint
      const result = await studentApi.bulkDeleteStudents(selectedRows);
      
      // Clear selection and update UI
      setStudents(prevStudents => 
        prevStudents.filter(s => !selectedRows.includes(s.sequential_number))
      );
      setSelectedRows([]);
      setIsConfirmDeleteOpen(false);
      
      // Show success notification
      notifications.show({
        title: 'Thành công',
        message: `Đã xóa ${result.deleted} học sinh`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error deleting selected students:', error);
      
      // Show error notification
      notifications.show({
        title: 'Lỗi',
        message: 'Có lỗi xảy ra khi xóa học sinh. Vui lòng thử lại.',
        color: 'red',
      });
    }
  };

  const handleSelectRow = (sequentialNumber: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, sequentialNumber]);
    } else {
      setSelectedRows(prev => prev.filter(id => id !== sequentialNumber));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredStudents.map(student => student.sequential_number);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };

  const filteredStudents = Array.isArray(students) 
    ? students.filter(student => 
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.classroom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(student.student_id).includes(searchTerm)
      ) 
    : [];

  const allSelected = filteredStudents.length > 0 && 
    filteredStudents.every(student => selectedRows.includes(student.sequential_number));

  return (
    <Container size="lg" mt="md">
      <Group justify="space-between" mb="md">
        <Title order={2}>Danh sách học sinh</Title>
        <Group gap="sm">
          <Button 
            color="red" 
            leftSection={<IconTrash size={16} />}
            disabled={selectedRows.length === 0}
            onClick={handleDeleteSelected}
          >
            Xóa ({selectedRows.length})
          </Button>
          <Link href="/dashboard/students/new" style={{ textDecoration: 'none' }}>
            <Button leftSection={<IconPlus size={16} />}>
              Thêm học sinh
            </Button>
          </Link>
        </Group>
      </Group>

      <Group align="flex-end" mb="md">
        <TextInput
          placeholder="Tìm kiếm theo tên, lớp, ID..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flexGrow: 1 }}
          label="Tìm kiếm"
        />
        <Select
          value={itemsPerPage.toString()}
          onChange={handlePageSizeChange}
          data={[
            { value: '10', label: '10 hàng' },
            { value: '50', label: '50 hàng' },
            { value: '100', label: '100 hàng' },
            { value: '1000', label: '1000 hàng' }
          ]}
          label="Số hàng mỗi trang"
          style={{ width: 130 }}
        />
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 40 }}>
              <Checkbox 
                checked={allSelected} 
                indeterminate={selectedRows.length > 0 && !allSelected}
                onChange={(event) => handleSelectAll(event.currentTarget.checked)} 
              />
            </Table.Th>
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
              <Table.Td colSpan={9} align="center">Đang tải...</Table.Td>
            </Table.Tr>
          ) : filteredStudents.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={9} align="center">Không tìm thấy học sinh nào</Table.Td>
            </Table.Tr>
          ) : (
            filteredStudents.map((student) => (
              <Table.Tr 
                key={student.sequential_number}
                bg={selectedRows.includes(student.sequential_number) ? "var(--mantine-color-blue-light)" : undefined}
              >
                <Table.Td>
                  <Checkbox 
                    checked={selectedRows.includes(student.sequential_number)}
                    onChange={(event) => handleSelectRow(student.sequential_number, event.currentTarget.checked)}
                  />
                </Table.Td>
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

      {/* Pagination footer */}
      {!loading && totalStudents > 0 && (
        <div className="mt-4">
          <Pagination 
            totalItems={totalStudents}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
          <Text ta="center" size="sm" c="dimmed" mt="sm">
            Hiển thị {Math.min(itemsPerPage, filteredStudents.length)} trong tổng số {totalStudents} học sinh | Trang {currentPage}/{totalPages}
          </Text>
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        opened={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Xác nhận xóa"
        centered
      >
        <Text mb="lg">Bạn có chắc chắn muốn xóa {selectedRows.length} học sinh đã chọn không?</Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>Hủy</Button>
          <Button color="red" onClick={confirmDeleteSelected}>Xóa</Button>
        </Group>
      </Modal>
    </Container>
  );
} 