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

export default function TeacherReceipt() {
  const params = useParams();
  const teacherId = params.id as string;
  const [currentDate, setCurrentDate] = useState('');
  const [nextMonthYear, setNextMonthYear] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  } as any);

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
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-receipt, .printable-receipt * {
              visibility: visible;
            }
            .printable-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 10px;
              font-size: 10px;
            }
            .no-print {
              display: none !important;
            }
            .printable-receipt table {
              border-collapse: collapse !important;
              width: 100% !important;
            }
            .printable-receipt .mantine-Table-th,
            .printable-receipt .mantine-Table-td {
              padding: 4px 8px;
              font-size: 9px;
              border: 1px solid black !important;
              border-collapse: collapse !important;
            }
            .printable-receipt .mantine-Table-tr {
              border: 1px solid black !important;
            }
            .printable-receipt .mantine-Table-thead {
              border: 1px solid black !important;
            }
            .printable-receipt .mantine-Table-tbody {
              border: 1px solid black !important;
            }
            .printable-receipt .mantine-Title {
              font-size: 14px !important;
              margin-bottom: 8px !important;
            }
            .printable-receipt .mantine-Text {
              font-size: 9px !important;
              margin-bottom: 4px !important;
            }
          }
        `}</style>
        <Grid justify="space-between" align="center" gutter="xs" mb={5}>
          <Grid.Col span={6}>
            <Text fw={700} size="xs">MẦM NON MONKIDS</Text>
          </Grid.Col>
          <Grid.Col span={6} style={{ textAlign: 'right' }}>
            <Text fw={700} size="xs">SỐ: {teacher.teacher_no}</Text>
          </Grid.Col>
        </Grid>

        <Text ta="center" fw={700} size="md" mb={5}>PHIẾU LƯƠNG GIÁO VIÊN</Text>
        <Text ta="center" size="xs" mb={10}>{nextMonthYear}</Text>

        <Table mb={10} withTableBorder withColumnBorders fz="xs">
          <Table.Tbody>
            <Table.Tr>
              <Table.Td style={{ width: '30%', padding: '3px 8px' }}><Text fw={500} fz="xs">Họ tên:</Text></Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs" colSpan={2}>{teacher.name}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }}><Text fw={500} fz="xs">Chức vụ:</Text></Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs" colSpan={2}>{teacher.role}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }}><Text fw={500} fz="xs">SĐT:</Text></Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs" colSpan={2}>{teacher.phone}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

        <Table withTableBorder withColumnBorders fz="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ padding: '3px 8px', width: '30%' }} fz="xs">Nội dung</Table.Th>
              <Table.Th style={{ padding: '3px 8px', width: '45%' }} fz="xs">Chi tiết</Table.Th>
              <Table.Th style={{ padding: '3px 8px', width: '25%' }} fz="xs">Thành tiền</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td rowSpan={4} style={{ padding: '3px 8px' }} fz="xs">Mức lương cơ bản</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">Lương cơ bản</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">{formatVND(teacher.base_salary)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">Số ngày dạy</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">{teacher.teaching_days}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">Số ngày nghỉ</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">{teacher.absence_days}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">Lương nhận được</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">{formatVND(teacher.received_salary)}</Table.Td>
            </Table.Tr>
            
            <Table.Tr>
              <Table.Td rowSpan={2} style={{ padding: '3px 8px' }} fz="xs">Mức lương dạy thêm</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">Số ngày dạy thêm</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">{teacher.extra_teaching_days}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">Lương dạy thêm</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">{formatVND(teacher.extra_salary)}</Table.Td>
            </Table.Tr>
            
            <Table.Tr>
              <Table.Td rowSpan={3} style={{ padding: '3px 8px' }} fz="xs">Phụ cấp</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">Hỗ trợ bảo hiểm</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">{formatVND(teacher.insurance_support)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">Hỗ trợ trách nhiệm</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">{formatVND(teacher.responsibility_support)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">Hỗ trợ xăng xe</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">{formatVND(teacher.breakfast_support)}</Table.Td>
            </Table.Tr>
          
            <Table.Tr>
              <Table.Td rowSpan={2} style={{ padding: '3px 8px' }} fz="xs">Dạy KNS</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">Số buổi dạy</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">{teacher.skill_sessions}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">Tiền dạy</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">{formatVND(teacher.skill_salary)}</Table.Td>
            </Table.Tr>
          
            <Table.Tr>
              <Table.Td rowSpan={2} style={{ padding: '3px 8px' }} fz="xs">Dạy TA</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">Số buổi dạy</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">{teacher.english_sessions}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">Tiền dạy</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">{formatVND(teacher.english_salary)}</Table.Td>
            </Table.Tr>
          
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">Thưởng HS đi môi</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}></Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">{formatVND(teacher.new_students_list)}</Table.Td>
            </Table.Tr>
          
            <Table.Tr>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">Đã ứng</Table.Td>
              <Table.Td style={{ padding: '3px 8px' }}></Table.Td>
              <Table.Td style={{ padding: '3px 8px' }} fz="xs">{formatVND(teacher.paid_amount)}</Table.Td>
            </Table.Tr>
            
            <Table.Tr>
              <Table.Td colSpan={2} fw={700} style={{ padding: '3px 8px' }} fz="xs">Tổng lương</Table.Td>
              <Table.Td fw={700} style={{ padding: '3px 8px' }} fz="xs">{formatVND(teacher.total_salary)}</Table.Td>
            </Table.Tr>
            
            {teacher.note && (
              <Table.Tr>
                <Table.Td style={{ padding: '3px 8px' }} fz="xs">Ghi chú</Table.Td>
                <Table.Td colSpan={2} style={{ padding: '3px 8px' }} fz="xs">{teacher.note}</Table.Td>
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