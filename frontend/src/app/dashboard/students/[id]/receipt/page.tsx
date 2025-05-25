'use client';

import { useEffect, useState, useRef } from 'react';
import { Container, Paper, Title, Text, Table, Button, Grid, Group, Box } from '@mantine/core';
import { useParams } from 'next/navigation';
import { IconPrinter, IconArrowLeft } from '@tabler/icons-react';
import { useReactToPrint } from 'react-to-print';
import { formatVND } from '@/utils/formatters';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useStudent } from '@/api/hooks/useStudents';

export default function StudentReceipt() {
  const params = useParams();
  const studentId = params.id as string;
  const [currentDate, setCurrentDate] = useState('');
  const [nextMonthYear, setNextMonthYear] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

  // Use the custom hook to fetch student data
  const { data: student, isLoading, error } = useStudent(studentId);

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

  if (error || !student) {
    return (
      <Container size="lg" mt="md">
        <Group>
          <Link href="/dashboard/students" style={{ textDecoration: 'none' }}>
            <Button variant="subtle" leftSection={<IconArrowLeft size={16} />}>
              Quay lại
            </Button>
          </Link>
          <Text>Không tìm thấy thông tin học sinh</Text>
        </Group>
      </Container>
    );
  }

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  return (
    <Container size="lg" mt="md">
      <Group justify="space-between" mb="md" className="no-print">
        <Title order={2}>Biên lai thu tiền</Title>
        <Button
          leftSection={<IconPrinter size={16} />}
          onClick={handlePrint}
          className="no-print"
        >
          In biên lai
        </Button>
      </Group>

      <Paper ref={receiptRef} p="md" withBorder className="printable-receipt">
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
            .printable-receipt table,
            .printable-receipt th,
            .printable-receipt td,
            .printable-receipt thead,
            .printable-receipt tbody,
            .printable-receipt tr {
              border: 1px solid black !important;
              border-collapse: collapse !important;
            }
            .printable-receipt .mantine-Table-th,
            .printable-receipt .mantine-Table-td {
              padding: 4px 8px;
              font-size: 9px;
              border: 1px solid black !important;
              border-collapse: collapse !important;
            }
            .printable-receipt .mantine-Title {
              font-size: 14px !important;
              margin-bottom: 8px !important;
            }
            .printable-receipt .mantine-Text {
              font-size: 9px !important;
              margin-bottom: 4px !important;
            }
            .qr-code-container img {
              width: 250px !important;
              height: auto !important;
              margin: 15px 0 !important;
            }
          }
        `}</style>
        <Grid justify="space-between" align="center" mb="xs">
          <Grid.Col span={6}>
            <Text fw={700} size="xs">MẦM NON MONKIDS</Text>
          </Grid.Col>
          <Grid.Col span={6} style={{ textAlign: 'right' }}>
            <Text fw={700} size="xs">SỐ: {student.student_id}</Text>
          </Grid.Col>
        </Grid>

        <Text ta="center" fw={700} size="md" mt="sm" mb="md">BIÊN LAI THU TIỀN</Text>
        <Text ta="center" size="xs" mb="lg">{nextMonthYear}</Text>

        <Table mb="md"fz="xs">
          <Table.Tbody>
            <Table.Tr>
              <Table.Td py="xs"><Text fw={500} fz="xs">Họ tên:</Text></Table.Td>
              <Table.Td py="xs" fz="xs">{student.name}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td py="xs"><Text fw={500} fz="xs">Ngày sinh:</Text></Table.Td>
              <Table.Td py="xs" fz="xs">{formatDate(student.birthdate)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td py="xs"><Text fw={500} fz="xs">Lớp:</Text></Table.Td>
              <Table.Td py="xs" fz="xs">{student.classroom}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

        <Table mb="md" fz="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th fz="xs">Nội dung</Table.Th>
              <Table.Th fz="xs">Chi tiết</Table.Th>
              <Table.Th fz="xs">Thành tiền</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td py="xs" fz="xs">Học phí ban đầu</Table.Td>
              <Table.Td py="xs" fz="xs">{formatVND(student.base_fee)} - Giảm: {student.discount_percentage * 100}%</Table.Td>
              <Table.Td py="xs" fz="xs">{formatVND(student.final_fee)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td py="xs" fz="xs">Tiền ăn (30,000/1 ngày)</Table.Td>
              <Table.Td py="xs" fz="xs">PM: {parseFloat(student.pm.toString())} - PT: {parseFloat(student.pt.toString())}</Table.Td>
              <Table.Td py="xs" fz="xs">{formatVND(student.meal_fee)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td py="xs" fz="xs">Điện nước</Table.Td>
              <Table.Td py="xs" fz="xs"></Table.Td>
              <Table.Td py="xs" fz="xs">{formatVND(student.utilities_fee)}</Table.Td>
            </Table.Tr>
              <Table.Tr>
                <Table.Td rowSpan={2} py="xs" fz="xs">Học tự chọn</Table.Td>
                <Table.Td py="xs" fz="xs">KNS</Table.Td>
                <Table.Td py="xs" fz="xs">{formatVND(student.skill_fee)}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td py="xs" fz="xs">TA</Table.Td>
                <Table.Td py="xs" fz="xs">{formatVND(student.eng_fee)}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td rowSpan={2} py="xs" fz="xs">Phí đầu năm</Table.Td>
                <Table.Td py="xs" fz="xs">Quỹ HS</Table.Td>
                <Table.Td py="xs" fz="xs">{formatVND(student.student_fund)}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td py="xs" fz="xs">CSVC</Table.Td>
                <Table.Td py="xs" fz="xs">{formatVND(student.facility_fee)}</Table.Td>
              </Table.Tr>
            <Table.Tr>
              <Table.Td colSpan={2} fw={700} py="xs" fz="xs">Tổng thu</Table.Td>
              <Table.Td fw={700} py="xs" fz="xs">{formatVND(student.total_fee)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td colSpan={2} fw={500} py="xs" fz="xs">Đã đóng</Table.Td>
              <Table.Td py="xs" fz="xs">{formatVND(student.paid_amount)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td colSpan={2} fw={700} py="xs" fz="xs">Còn lại</Table.Td>
              <Table.Td fw={700} py="xs" fz="xs">{formatVND(student.remaining_amount)}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

        <Text ta="right" mt="lg" fz="xs">Vĩnh Yên, ngày ... tháng ... năm ...</Text>
        <div className="qr-code-container" style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <img
            src="/qr.png"
            alt="QR Code thanh toán"
            width={300}
            height={180}
            style={{ border: '1px solid #e9ecef', padding: '5px' }}
          />
        </div>

        <Text ta="center" size="xs" mt="md">Phụ huynh thanh toán từ ngày 05 đến 10 hàng tháng</Text>
        <Text ta="center" size="xs">Phụ huynh thanh toán ghi rõ họ tên và lớp của con</Text>

      </Paper>
    </Container>
  );
} 