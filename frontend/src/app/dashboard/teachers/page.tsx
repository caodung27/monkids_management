'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Table, TextInput, Group, Button, ActionIcon, Menu, Badge, Text, Select, Checkbox, Modal } from '@mantine/core';
import { IconSearch, IconPlus, IconDotsVertical, IconEdit, IconTrash, IconPrinter, IconEye } from '@tabler/icons-react';
import Link from 'next/link';
import { teacherApi } from '@/api/apiService';
import { formatVND } from '@/utils/formatters';
import { Teacher } from '@/types';
import { notifications } from '@mantine/notifications';
import { Pagination } from '@/components/Pagination';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const fetchTeachers = async (page: number, pageSize: number = itemsPerPage) => {
    setLoading(true);
    try {
      const data = await teacherApi.getAllTeachers(page, pageSize);
      console.log('Fetched teachers data:', data);
      
      if (data && typeof data === 'object') {
        setTeachers(data.results || []);
        setTotalTeachers(data.count || 0);
        setCurrentPage(page);
        setTotalPages(Math.ceil((data.count || 0) / pageSize));
        // Clear selection when fetching new data
        setSelectedRows([]);
      } else {
        console.error('Unexpected API response format:', data);
        setTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers(1, itemsPerPage);
  }, [itemsPerPage]);

  const handlePageChange = (page: number) => {
    fetchTeachers(page, itemsPerPage);
    window.scrollTo(0, 0); // Scroll to top when changing page
  };

  const handlePageSizeChange = (value: string | null) => {
    if (value) {
      const newSize = parseInt(value);
      setItemsPerPage(newSize);
      setCurrentPage(1); // Reset to first page when changing page size
    }
  };

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

  const handleDeleteSelected = () => {
    setIsConfirmDeleteOpen(true);
  };

  const confirmDeleteSelected = async () => {
    try {
      // Use the new bulk delete API endpoint
      const result = await teacherApi.bulkDeleteTeachers(selectedRows);
      
      // Update the list and clear selection
      setTeachers(prevTeachers => 
        prevTeachers.filter(teacher => !selectedRows.includes(teacher.id!))
      );
      setSelectedRows([]);
      setIsConfirmDeleteOpen(false);
      
      notifications.show({
        title: 'Thành công',
        message: `Đã xóa ${result.deleted} giáo viên`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error deleting selected teachers:', error);
      notifications.show({
        title: 'Lỗi',
        message: 'Có lỗi xảy ra khi xóa giáo viên. Vui lòng thử lại.',
        color: 'red',
      });
    }
  };

  const handleSelectRow = (teacherId: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, teacherId]);
    } else {
      setSelectedRows(prev => prev.filter(id => id !== teacherId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredTeachers.map(teacher => teacher.id!);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };

  const filteredTeachers = Array.isArray(teachers) 
    ? teachers.filter(teacher => 
        teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (teacher.phone && teacher.phone.includes(searchTerm))
      ) 
    : [];

  const allSelected = filteredTeachers.length > 0 && 
    filteredTeachers.every(teacher => selectedRows.includes(teacher.id!));

  return (
    <Container size="lg" mt="md">
      <Group justify="space-between" mb="md">
        <Title order={2}>Danh sách giáo viên</Title>
        <Group gap="sm">
          <Button 
            color="red" 
            leftSection={<IconTrash size={16} />}
            disabled={selectedRows.length === 0}
            onClick={handleDeleteSelected}
          >
            Xóa ({selectedRows.length})
          </Button>
          <Link href="/dashboard/teachers/new" style={{ textDecoration: 'none' }}>
            <Button leftSection={<IconPlus size={16} />}>
              Thêm giáo viên
            </Button>
          </Link>
        </Group>
      </Group>

      <Group align="flex-end" mb="md">
        <TextInput
          placeholder="Tìm kiếm theo tên, vai trò, số điện thoại..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
          label="Số dòng mỗi trang"
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
            <Table.Th>Tên</Table.Th>
            <Table.Th>SĐT</Table.Th>
            <Table.Th>Chức vụ</Table.Th>
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
              <Table.Td colSpan={9} align="center">Đang tải...</Table.Td>
            </Table.Tr>
          ) : filteredTeachers.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={9} align="center">Không tìm thấy giáo viên nào</Table.Td>
            </Table.Tr>
          ) : (
            filteredTeachers.map((teacher) => (
              <Table.Tr 
                key={teacher.id}
                bg={selectedRows.includes(teacher.id!) ? "var(--mantine-color-blue-light)" : undefined}
              >
                <Table.Td>
                  <Checkbox 
                    checked={selectedRows.includes(teacher.id!)}
                    onChange={(event) => handleSelectRow(teacher.id!, event.currentTarget.checked)}
                  />
                </Table.Td>
                <Table.Td>{teacher.name}</Table.Td>
                <Table.Td>{teacher.phone}</Table.Td>
                <Table.Td>
                  {teacher.role?.split(',').map((rawRole, index) => {
                    const role = rawRole.trim(); 
                    const color =
                    role === 'Quản lý' ? 'blue' :
                    role === 'GV' ? 'green' :
                    role === 'Đầu bếp' ? 'orange' :
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

      {/* Pagination footer */}
      {!loading && totalTeachers > 0 && (
        <div className="mt-4">
          <Pagination 
            totalItems={totalTeachers}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
          <Text ta="center" size="sm" c="dimmed" mt="sm">
            Hiển thị {Math.min(itemsPerPage, filteredTeachers.length)} trong tổng số {totalTeachers} giáo viên | Trang {currentPage}/{totalPages}
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
        <Text mb="lg">Bạn có chắc chắn muốn xóa {selectedRows.length} giáo viên đã chọn không?</Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>Hủy</Button>
          <Button color="red" onClick={confirmDeleteSelected}>Xóa</Button>
        </Group>
      </Modal>
    </Container>
  );
} 