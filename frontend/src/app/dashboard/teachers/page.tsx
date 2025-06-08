'use client';

import { useState, useRef } from 'react';
import { Container, Title, Table, TextInput, Group, Button, ActionIcon, Menu, Text, Badge, Select, Checkbox, Modal, ScrollArea, Box } from '@mantine/core';
import { IconSearch, IconPlus, IconDotsVertical, IconEdit, IconTrash, IconChevronLeft, IconChevronRight, IconPrinter, IconFileExport } from '@tabler/icons-react';
import Link from 'next/link';
import { useTeachers, useDeleteTeacher } from '@/api/hooks/useTeachers';
import { Pagination } from '@/components/Pagination';
import { notifications } from '@mantine/notifications';
import { teacherApi, exportApi } from '@/api/apiService';
import { useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/usePermissions';
import Logger from '@/libs/logger';

// Simple formatter for Vietnamese currency
const formatVND = (value: string | number) => {
  return Number(value).toLocaleString('vi-VN') + ' đ';
};

interface RoleOption {
  value: string;
  label: string;
  color: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'Quản lý', label: 'Quản lý', color: 'blue' },
  { value: 'Giáo viên', label: 'Giáo viên', color: 'green' },
  { value: 'Đầu bếp', label: 'Đầu bếp', color: 'orange' },
];

const getRoleColor = (role: string) => {
  const roleOption = ROLE_OPTIONS.find(opt => opt.value === role);
  return roleOption?.color || 'gray';
};

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const {
    teachers,
    loading,
    currentPage,
    totalTeachers,
    itemsPerPage,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    fetchTeachers
  } = useTeachers();

  const deleteTeacherMutation = useDeleteTeacher(queryClient);
  const { canEdit, canDelete, canPrint } = usePermissions();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Add state for selected teachers
  const [selectedTeachers, setSelectedTeachers] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState(false);

  const handleDeleteTeacher = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giáo viên này không?')) {
      try {
        await deleteTeacherMutation.mutateAsync(id);
        notifications.show({
          title: 'Thành công',
          message: 'Đã xóa giáo viên thành công',
          color: 'green',
        });
        // Refresh the teachers list after deletion
        fetchTeachers(currentPage, itemsPerPage);
      } catch (error) {
        Logger.error('Error deleting teacher:', error);
        notifications.show({
          title: 'Lỗi',
          message: 'Có lỗi xảy ra khi xóa giáo viên',
          color: 'red',
        });
      }
    }
  };

  const handleDeleteSelected = async () => {
    setIsConfirmDeleteOpen(true);
  };

  const confirmDeleteSelected = async () => {
    try {
      const result = await teacherApi.bulkDeleteTeachers(selectedRows);
      setSelectedRows([]);
      setIsConfirmDeleteOpen(false);
      
      // Refresh the teachers list after bulk deletion
      fetchTeachers(currentPage, itemsPerPage);
      
      notifications.show({
        title: 'Thành công',
        message: `Đã xóa ${selectedRows.length} giáo viên`,
        color: 'green',
      });
    } catch (error) {
      Logger.error('Error deleting selected teachers:', error);
      notifications.show({
        title: 'Lỗi',
        message: 'Có lỗi xảy ra khi xóa giáo viên. Vui lòng thử lại.',
        color: 'red',
      });
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = teachers.map(teacher => teacher.id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter(teacher => 
    teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) 
      || teacher.role?.toLowerCase().includes(searchTerm.toLowerCase()) 
      || String(teacher.teacher_no).includes(searchTerm)
  );

  const allSelected = filteredTeachers.length > 0 && 
    filteredTeachers.every(teacher => selectedRows.includes(teacher.id));

  // Add handler for bulk export
  const handleBulkExport = async () => {
    const selectedIds = Object.entries(selectedTeachers)
      .filter(([_, selected]) => selected)
      .map(([id]) => id);

    if (selectedIds.length === 0) {
      notifications.show({
        title: 'Chú ý',
        message: 'Vui lòng chọn ít nhất một giáo viên để xuất phiếu lương',
        color: 'yellow',
      });
      return;
    }

    setExporting(true);
    try {
      const data = await exportApi.bulkExport('teacher', selectedIds);
      if (data.success) {
        notifications.show({
          title: 'Thành công',
          message: 'Đã xuất phiếu lương thành công',
          color: 'green',
        });
      } else {
        throw new Error(data.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      Logger.error('Export bulk error:', error);
      notifications.show({
        title: 'Lỗi',
        message: error.message || 'Có lỗi xảy ra khi xuất phiếu lương',
        color: 'red',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Container size="lg" mt="md">
      <Group justify="space-between" mb="md">
        <Title order={2}>Danh sách giáo viên</Title>
        <Group gap="sm">
          {canDelete() && (
            <Button 
              color="red" 
              leftSection={<IconTrash size={16} />}
              disabled={selectedRows.length === 0}
              onClick={handleDeleteSelected}
            >
              Xóa ({selectedRows.length})
            </Button>
          )}
          {canEdit() && (
            <Link href="/dashboard/teachers/new" style={{ textDecoration: 'none' }}>
              <Button leftSection={<IconPlus size={16} />}>
                Thêm giáo viên
              </Button>
            </Link>
          )}
          {canPrint() && (
            <Button
              leftSection={<IconFileExport size={16} />}
              onClick={handleBulkExport}
              loading={exporting}
              disabled={selectedRows.length === 0}
            >
              Xuất bảng lương
            </Button>
          )}
        </Group>
      </Group>

      <Group align="flex-end" mb="md">
        <TextInput
          placeholder="Tìm kiếm theo tên, vai trò, mã số..."
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

      <Box pos="relative">
        <Group justify="space-between" mb="xs">
          <ActionIcon 
            variant="light" 
            onClick={() => {
              if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollLeft -= 200;
              }
            }}
          >
            <IconChevronLeft size={16} />
          </ActionIcon>
          <ActionIcon 
            variant="light"
            onClick={() => {
              if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollLeft += 200;
              }
            }}
          >
            <IconChevronRight size={16} />
          </ActionIcon>
        </Group>

        <ScrollArea scrollbarSize={8} scrollHideDelay={0} viewportRef={scrollAreaRef}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 60 }}>
                  <Checkbox
                    checked={filteredTeachers.length > 0 && filteredTeachers.every(teacher => selectedTeachers[teacher.id])}
                    indeterminate={filteredTeachers.some(teacher => selectedTeachers[teacher.id]) && !filteredTeachers.every(teacher => selectedTeachers[teacher.id])}
                    onChange={(e) => {
                      const checked = e.currentTarget.checked;
                      const newSelected: Record<string, boolean> = { ...selectedTeachers };
                      filteredTeachers.forEach((teacher) => {
                        newSelected[teacher.id] = checked;
                      });
                      setSelectedTeachers(newSelected);
                      setSelectedRows(checked ? filteredTeachers.map(t => t.id) : []);
                    }}
                  />
                </Table.Th>
                <Table.Th style={{ minWidth: 100 }}>Mã số</Table.Th>
                <Table.Th style={{ minWidth: 200 }}>Tên</Table.Th>
                <Table.Th style={{ minWidth: 150 }}>Vai trò</Table.Th>
                <Table.Th style={{ minWidth: 120 }}>Lương cơ bản</Table.Th>
                <Table.Th style={{ minWidth: 100 }}>Ngày dạy</Table.Th>
                <Table.Th style={{ minWidth: 100 }}>Ngày nghỉ</Table.Th>
                <Table.Th style={{ minWidth: 150 }}>Lương nhận được</Table.Th>
                <Table.Th style={{ minWidth: 100 }}>Ngày dạy thêm</Table.Th>
                <Table.Th style={{ minWidth: 100 }}>Lương dạy thêm</Table.Th>
                <Table.Th style={{ minWidth: 120 }}>Phụ cấp</Table.Th>
                <Table.Th style={{ minWidth: 100 }}>Dạy TA</Table.Th>
                <Table.Th style={{ minWidth: 100 }}>Dạy KNS</Table.Th>
                <Table.Th style={{ minWidth: 100 }}>HS đi mới</Table.Th>
                <Table.Th style={{ minWidth: 120 }}>Tổng lương</Table.Th>
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
                    bg={selectedRows.includes(teacher.id) ? "var(--mantine-color-blue-light)" : undefined}
                  >
                    <Table.Td>
                      <Checkbox
                        checked={!!selectedTeachers[teacher.id]}
                        onChange={(event) => {
                          const checked = event.currentTarget.checked;
                          setSelectedTeachers((prev) => ({
                            ...prev,
                            [teacher.id]: checked,
                          }));
                          setSelectedRows((prev) =>
                            checked ? [...prev, teacher.id] : prev.filter((id) => id !== teacher.id)
                          );
                        }}
                      />
                    </Table.Td>
                    <Table.Td>{teacher.teacher_no}</Table.Td>
                    <Table.Td>{teacher.name}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {teacher.role && teacher.role.split(',').map((role: string, index: number) => (
                          <Badge key={index} color={getRoleColor(role.trim())} variant="filled">
                            {role.trim()}
                          </Badge>
                        ))}
                      </Group>
                    </Table.Td>
                    <Table.Td>{formatVND(teacher.base_salary)}</Table.Td>
                    <Table.Td>{teacher.teaching_days}</Table.Td>
                    <Table.Td>{teacher.absence_days}</Table.Td>
                    <Table.Td>{formatVND(teacher.received_salary)}</Table.Td>
                    <Table.Td>{teacher.extra_teaching_days}</Table.Td>
                    <Table.Td>{formatVND(teacher.extra_salary)}</Table.Td>
                    <Table.Td>{formatVND(teacher.insurance_support + teacher.responsibility_support + teacher.breakfast_support)}</Table.Td>
                    <Table.Td>{formatVND(teacher.english_salary)}</Table.Td>
                    <Table.Td>{formatVND(teacher.skill_salary)}</Table.Td>
                    <Table.Td>{formatVND(teacher.new_students_list)}</Table.Td>
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
                          {canEdit() && (
                            <Link href={`/dashboard/teachers/${teacher.id}/edit`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              <Menu.Item leftSection={<IconEdit size={14} />}>
                                Chỉnh sửa
                              </Menu.Item>
                            </Link>
                          )}
                          {canPrint() && (
                            <Link href={`/dashboard/teachers/${teacher.id}/receipt`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              <Menu.Item leftSection={<IconPrinter size={14} />}>
                                In bảng lương
                              </Menu.Item>
                            </Link>
                          )}
                          {canDelete() && (
                            <Menu.Item 
                              leftSection={<IconTrash size={14} />}
                              color="red"
                              onClick={() => handleDeleteTeacher(teacher.id)}
                            >
                              Xóa
                            </Menu.Item>
                          )}
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Box>

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