'use client';

import { useEffect, useState, useRef } from 'react';
import { Container, Paper, Title, Text, Table, Button, Grid, Group, Box } from '@mantine/core';
import { useParams } from 'next/navigation';
import { IconPrinter, IconArrowLeft } from '@tabler/icons-react';
import { useReactToPrint } from 'react-to-print';
import { formatVND } from '@/utils/formatters';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useTeacher } from '@/api/hooks/useTeachers';

// Add print-specific styling
const printStyles = `
  @media print {
    @page {
      size: A4;
      margin: 10mm;
    }
    body {
      font-size: 12px !important;
    }
    .printable-receipt {
      width: 100% !important;
      max-width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      box-shadow: none !important;
      border: none !important;
    }
    .no-print {
      display: none !important;
    }
    table {
      font-size: 10px !important;
    }
    td, th {
      padding: 4px 8px !important;
    }
  }
`;

export default function TeacherReceipt() {
  const params = useParams();
  const teacherId = params.id as string;
  const [currentDate, setCurrentDate] = useState('');
  const [nextMonthYear, setNextMonthYear] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

  // Use the custom hook to fetch teacher data
  const { data: teacher, isLoading, error } = useTeacher(teacherId);

  useEffect(() => {
    // Set current date for receipt
    const date = new Date();
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    setCurrentDate(formattedDate);

    // Set next month and current year
    const nextMonth = date.getMonth() + 2; // +2 because months are 0-indexed
    const year = date.getFullYear();
    // Handling December (11) + 1 = January (0) of next year
    const displayMonth = nextMonth > 12 ? nextMonth - 12 : nextMonth;
    const displayYear = nextMonth > 12 ? year + 1 : year;
    setNextMonthYear(`Tháng ${displayMonth} Năm ${displayYear}`);
  }, []);

  if (isLoading) {
    return (
      <Container size="lg" mt="md">
        <Text>Đang tải...</Text>
      </Container>
    );
  }

  if (error || !teacher) {
    return (
      <Container size="lg" mt="md">
        <Group>
          <Link href="/dashboard/teachers" style={{ textDecoration: 'none' }}>
            <Button variant="subtle" leftSection={<IconArrowLeft size={16} />}>
              Quay lại
            </Button>
          </Link>
          <Text>Không tìm thấy thông tin giáo viên</Text>
        </Group>
      </Container>
    );
  }

  return (
    <Container size="lg" mt="md">
      <style>{printStyles}</style>
      <Group justify="space-between" mb="md" className="no-print">
        <Group>
          <Link href="/dashboard/teachers" style={{ textDecoration: 'none' }}>
            <Button variant="subtle" leftSection={<IconArrowLeft size={16} />}>
              Quay lại
            </Button>
          </Link>
          <Title order={2}>Phiếu lương giáo viên</Title>
        </Group>
        <Button 
          leftSection={<IconPrinter size={16} />}
          onClick={handlePrint}
        >
          In phiếu lương
        </Button>
      </Group>

      <Paper ref={receiptRef} p="sm" withBorder className="printable-receipt" style={{ maxWidth: "210mm" }}>
        <Grid justify="space-between" align="center" gutter="xs" mb={5}>
          <Grid.Col span={6}>
            <Text fw={700} size="sm">MẦM NON MONKIDS</Text>
          </Grid.Col>
          <Grid.Col span={6} style={{ textAlign: 'right' }}>
            <Text fw={700} size="sm">SỐ: </Text>
          </Grid.Col>
        </Grid>

        <Text ta="center" fw={700} size="md" mb={5}>PHIẾU LƯƠNG GIÁO VIÊN</Text>
        <Text ta="center" size="sm" mb={10}>{nextMonthYear}</Text>

        <Table mb={10} withTableBorder withColumnBorders style={{ fontSize: 'sm' }}>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td style={{ width: '15%', padding: '3px 8px' }}><Text fw={500}>Họ tên:</Text></Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{teacher.name}</Table.Td>
              <Table.Td style={{ width: '15%', padding: '3px 8px' }}><Text fw={500}>Chức vụ:</Text></Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{teacher.role}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }}><Text fw={500}>SĐT:</Text></Table.Td>
              <Table.Td colSpan={3} style={{ padding: '3px 8px' }}>{teacher.phone}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

        <Table withTableBorder withColumnBorders style={{ fontSize: 'sm' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ padding: '3px 8px', width: '25%' }}>Nội dung</Table.Th>
              <Table.Th style={{ padding: '3px 8px', width: '50%' }}>Chi tiết</Table.Th>
              <Table.Th style={{ padding: '3px 8px', width: '25%' }}>Thành tiền</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td rowSpan={4} style={{ padding: '3px 8px' }}>Mức lương cơ bản</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>Lương cơ bản</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{formatVND(teacher.base_salary)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }}>Số ngày dạy</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{teacher.teaching_days}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }}>Số ngày nghỉ</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{teacher.absence_days}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }}>Lương nhận được</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{formatVND(teacher.received_salary)}</Table.Td>
            </Table.Tr>
            
            <Table.Tr>
              <Table.Td rowSpan={2} style={{ padding: '3px 8px' }}>Mức lương dạy thêm</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>Số ngày dạy thêm</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{teacher.extra_teaching_days}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }}>Lương dạy thêm</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{formatVND(teacher.extra_salary)}</Table.Td>
            </Table.Tr>
            
            <Table.Tr>
              <Table.Td rowSpan={3} style={{ padding: '3px 8px' }}>Phụ cấp</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>Hỗ trợ bảo hiểm</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{formatVND(teacher.insurance_support)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }}>Hỗ trợ trách nhiệm</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{formatVND(teacher.responsibility_support)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }}>Hỗ trợ xăng xe</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{formatVND(teacher.breakfast_support)}</Table.Td>
            </Table.Tr>
          
            <Table.Tr>
              <Table.Td rowSpan={2} style={{ padding: '3px 8px' }}>Dạy KNS</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>Số buổi dạy</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{teacher.skill_sessions}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }}>Tiền dạy</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{formatVND(teacher.skill_salary)}</Table.Td>
            </Table.Tr>
          
            <Table.Tr>
              <Table.Td rowSpan={2} style={{ padding: '3px 8px' }}>Dạy TA</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>Số buổi dạy</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{teacher.english_sessions}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }}>Tiền dạy</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{formatVND(teacher.english_salary)}</Table.Td>
            </Table.Tr>
          
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }}>Thưởng HS đi môi</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}></Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{formatVND(teacher.new_students_list)}</Table.Td>
            </Table.Tr>
          
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }}>Đã ứng</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}></Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}>{formatVND(teacher.paid_amount)}</Table.Td>
            </Table.Tr>
            
            <Table.Tr>
              <Table.Td colSpan={2} fw={700} style={{ padding: '3px 8px' }}>Tổng lương</Table.Td>
              <Table.Td fw={700} style={{ padding: '3px 8px' }}>{formatVND(teacher.total_salary)}</Table.Td>
            </Table.Tr>
            
            {teacher.note && (
              <Table.Tr>
                <Table.Td style={{ padding: '3px 8px' }}>Ghi chú</Table.Td>
                <Table.Td colSpan={2} style={{ padding: '3px 8px' }}>{teacher.note}</Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <Box mt={10}>
          <Text ta="right" size="xs">Vĩnh Yên, ngày ... tháng ... năm ...</Text>
          <Text ta="center" size="xs" mt={5}>GV có 25 ngày công vào tháng 03/2025.</Text>
          <Text ta="center" size="xs">Nếu dạy nhiều hơn 25 ngày công sẽ được tính 150.000 / 1 ngày dạy thêm.</Text>
        </Box>
      </Paper>
    </Container>
  );
} 