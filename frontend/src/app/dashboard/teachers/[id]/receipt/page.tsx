'use client';

import { useEffect, useState, useRef } from 'react';
import { Container, Paper, Title, Text, Divider, Table, Button, Grid, Group } from '@mantine/core';
import { useParams } from 'next/navigation';
import { IconPrinter } from '@tabler/icons-react';
import { useReactToPrint } from 'react-to-print';
import { Teacher } from '@/types';
import { formatVND } from '@/utils/formatters';

export default function TeacherSalary() {
  const params = useParams();
  const teacherId = params.id as string;
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

  useEffect(() => {
    // Set current date for receipt
    const date = new Date();
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    setCurrentDate(formattedDate);

    // Fetch teacher data
    const fetchTeacher = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teachers/${teacherId}/`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setTeacher(data);
      } catch (error) {
        console.error('Error fetching teacher:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [teacherId]);

  if (loading) {
    return (
      <Container size="lg" mt="md">
        <Text>Đang tải...</Text>
      </Container>
    );
  }

  if (!teacher) {
    return (
      <Container size="lg" mt="md">
        <Text>Không tìm thấy thông tin giáo viên</Text>
      </Container>
    );
  }

  return (
    <Container size="lg" mt="md">
      <Group justify="space-between" mb="md">
        <Title order={2}>Phiếu lương giáo viên</Title>
        <Button 
          leftSection={<IconPrinter size={16} />}
          onClick={handlePrint}
          className="no-print"
        >
          In phiếu lương
        </Button>
      </Group>

      <Paper ref={receiptRef} p="lg" withBorder className="printable-receipt">
        <Grid>
          <Grid.Col span={8}>
            <Text ta="center" fw={700} size="lg">MẦM NON MONKIDS</Text>
          </Grid.Col>
          <Grid.Col span={4}>
            <Text ta="right" fw={700} size="lg">SỐ: 1</Text>
          </Grid.Col>
        </Grid>

        <Text ta="center" fw={700} size="xl" mt="md" mb="lg">PHIẾU LƯƠNG GIÁO VIÊN</Text>
        <Text ta="center" mb="xl">Tháng 4 Năm 2025</Text>

        <Table mb="lg">
          <Table.Tbody>
            <Table.Tr>
              <Table.Td><Text fw={500}>Họ tên:</Text></Table.Td>
              <Table.Td>{teacher.name}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td><Text fw={500}>Chức vụ:</Text></Table.Td>
              <Table.Td>{teacher.role}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td><Text fw={500}>SĐT:</Text></Table.Td>
              <Table.Td>{teacher.phone || 'Chưa cập nhật'}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nội dung</Table.Th>
              <Table.Th>Chi tiết</Table.Th>
              <Table.Th>Thành tiền</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td rowSpan={4}>Mức lương cơ bản</Table.Td>
              <Table.Td>Lương cơ bản</Table.Td>
              <Table.Td>{formatVND(teacher.base_salary)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Số ngày dạy</Table.Td>
              <Table.Td>{teacher.teaching_days}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Số ngày nghỉ</Table.Td>
              <Table.Td>{teacher.absence_days}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Lương nhận được</Table.Td>
              <Table.Td>{formatVND(teacher.received_salary)}</Table.Td>
            </Table.Tr>
            
            <Table.Tr>
              <Table.Td rowSpan={2}>Mức lương dạy thêm</Table.Td>
              <Table.Td>Số ngày dạy thêm</Table.Td>
              <Table.Td>{teacher.extra_teaching_days}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Lương dạy thêm</Table.Td>
              <Table.Td>{formatVND(teacher.extra_salary)}</Table.Td>
            </Table.Tr>
            
            <Table.Tr>
              <Table.Td rowSpan={3}>Phụ cấp</Table.Td>
              <Table.Td>Hỗ trợ bảo hiểm</Table.Td>
              <Table.Td>{formatVND(teacher.insurance_support)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Hỗ trợ trách nhiệm</Table.Td>
              <Table.Td>{formatVND(teacher.responsibility_support)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Hỗ trợ xăng xe</Table.Td>
              <Table.Td>{formatVND(teacher.breakfast_support)}</Table.Td>
            </Table.Tr>
          
            <Table.Tr>
              <Table.Td rowSpan={2}>Dạy KNS</Table.Td>
              <Table.Td>Số buổi dạy</Table.Td>
              <Table.Td>{teacher.skill_sessions}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Tiền dạy</Table.Td>
              <Table.Td>{formatVND(teacher.skill_salary)}</Table.Td>
            </Table.Tr>
          
            <Table.Tr>
              <Table.Td rowSpan={2}>Dạy TA</Table.Td>
              <Table.Td>Số buổi dạy</Table.Td>
              <Table.Td>{teacher.english_sessions}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Tiền dạy</Table.Td>
              <Table.Td>{formatVND(teacher.english_salary)}</Table.Td>
            </Table.Tr>
          
            <Table.Tr>
              <Table.Td>Thưởng HS đi môi</Table.Td>
              <Table.Td></Table.Td>
              <Table.Td>{formatVND(teacher.new_students_list)}</Table.Td>
            </Table.Tr>
          
            <Table.Tr>
              <Table.Td>Đã ứng</Table.Td>
              <Table.Td></Table.Td>
              <Table.Td>{formatVND(teacher.paid_amount)}</Table.Td>
            </Table.Tr>
            
            <Table.Tr>
              <Table.Td colSpan={2} fw={700}>Tổng lương</Table.Td>
              <Table.Td fw={700}>{formatVND(teacher.total_salary)}</Table.Td>
            </Table.Tr>
            
            {teacher.note && (
              <Table.Tr>
                <Table.Td>Ghi chú</Table.Td>
                <Table.Td colSpan={2}>{teacher.note}</Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <Text ta="right" mt="xl">Vĩnh Yên, ngày.....tháng.....năm......</Text>
        <Text ta="center" size="sm" mt="xl">GV có 25 ngày công vào tháng 03/2025.</Text>
        <Text ta="center" size="sm">Nếu dạy nhiều hơn 25 ngày công sẽ được tính 150.000 / 1 ngày dạy thêm.</Text>
      </Paper>
    </Container>
  );
} 