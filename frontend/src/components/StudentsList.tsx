import { useState, useEffect } from 'react';
import { Table, Text, Group, Button, Loader, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { studentApi } from '@/api/apiService';
import { Pagination } from './Pagination';
import Logger from '@/libs/logger';

interface Student {
  student_id: number;
  name: string;
  classroom: string;
  birthdate: string | null;
  base_fee: string;
  final_fee: string;
  total_fee: string;
  remaining_amount: string;
  [key: string]: any; // Allow other properties
}

export function StudentsList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const itemsPerPage = 10; // This should match the backend pagination setting

  const fetchStudents = async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await studentApi.getAllStudents(page, itemsPerPage);
      
      setStudents(response.data);
      setTotalStudents(response.totalElements);
      setCurrentPage(response.currentPage);
    } catch (err) {
      setError('Không thể tải danh sách học sinh. Vui lòng thử lại sau.');
      Logger.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchStudents(1);
  }, []);

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchStudents(page);
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="Lỗi" color="red">
        {error}
      </Alert>
    );
  }

  return (
    <div>
      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>Mã HS</th>
            <th>Tên học sinh</th>
            <th>Lớp</th>
            <th>Học phí</th>
            <th>Phí ăn</th>
            <th>Tổng phí</th>
            <th>Còn lại</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.student_id}>
              <td>{student.student_id}</td>
              <td>{student.name}</td>
              <td>{student.classroom}</td>
              <td>{Number(student.final_fee).toLocaleString('vi-VN')} đ</td>
              <td>{Number(student.meal_fee).toLocaleString('vi-VN')} đ</td>
              <td>{Number(student.total_fee).toLocaleString('vi-VN')} đ</td>
              <td>{Number(student.remaining_amount).toLocaleString('vi-VN')} đ</td>
              <td>
                <Group gap="xs">
                  <Button size="xs" variant="outline">
                    Chi tiết
                  </Button>
                  <Button size="xs" variant="outline" color="blue">
                    Sửa
                  </Button>
                </Group>
              </td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={8}>
                <Text ta="center" size="sm" fs="italic" py="md">
                  Không có học sinh nào
                </Text>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      
      {/* Pagination component */}
      <Pagination 
        totalItems={totalStudents}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
      
      <Text color="dimmed" size="sm" mt="md" ta="center">
        Hiển thị {students.length} trong tổng số {totalStudents} học sinh
      </Text>
    </div>
  );
} 