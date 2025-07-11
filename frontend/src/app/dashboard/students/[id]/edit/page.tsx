'use client';

import { useState, useEffect, useRef, FormEvent, KeyboardEvent, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Title, Paper, Button, Group, TextInput, NumberInput, Select, Grid, Text, Divider, Popover } from '@mantine/core';
import { useForm } from '@mantine/form';
import { studentApi } from '@/api/apiService';
import { Student, StudentApiUpdatePayload } from '@/types';
import { IconArrowLeft, IconDeviceFloppy, IconCalendar } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MEAL_FEE_PER_TICKET } from '@/constants/fees';
import 'react-day-picker/dist/style.css';
import Logger from '@/libs/logger';

// StudentEditFormValues now directly uses Student fields, assuming form handles types
// No, we still need birthdate as Date for the form
interface StudentEditFormValues extends Omit<Student, 'birthdate' | 'student_id' | 'sequential_number'> {
  birthdate: Date | null;
  meal_fee_per_ticket: number;
  // All other fee fields will be numbers as in Student type
}

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const idFromParams = params.id as string;
  const [loading, setLoading] = useState(true);
  const studentSequentialNumberRef = useRef<string | null>(null);
  const [calendarOpened, setCalendarOpened] = useState(false);
  
  // REMOVE separate useState for fees
  // const [baseFee, setBaseFee] = useState(0);
  // ... and so on for all other fee states

  const form = useForm<StudentEditFormValues>({
    validate: {
      name: (value) => (!value ? 'Vui lòng nhập tên học sinh' : null),
      classroom: (value) => (!value ? 'Vui lòng chọn lớp' : null),
    }
  });

  // Add computed values for total_fee and remaining_amount
  const computedTotalFee = useMemo(() => {
    const values = form.values;
    return Math.round(
      (values.final_fee || 0) +
      (values.utilities_fee || 0) +
      (values.meal_fee || 0) +
      (values.eng_fee || 0) +
      (values.skill_fee || 0) +
      (values.student_fund || 0) +
      (values.facility_fee || 0)
    );
  }, [
    form.values.final_fee,
    form.values.utilities_fee,
    form.values.meal_fee,
    form.values.eng_fee,
    form.values.skill_fee,
    form.values.student_fund,
    form.values.facility_fee
  ]);

  const computedRemainingAmount = useMemo(() => {
    return Math.round(computedTotalFee - (form.values.paid_amount || 0));
  }, [computedTotalFee, form.values.paid_amount]);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const student: Student = await studentApi.getStudent(idFromParams);
        studentSequentialNumberRef.current = student.sequential_number;

        form.setValues({
          name: student.name,
          classroom: student.classroom,
          birthdate: student.birthdate ? new Date(student.birthdate) : null,
          base_fee: Number(student.base_fee),
          // Ensure discount_percentage from API (0.0-1.0) is correctly set in form
          discount_percentage: Number(student.discount_percentage), 
          final_fee: Number(student.final_fee),
          utilities_fee: Number(student.utilities_fee),
          pt: Number(student.pt),
          pm: Number(student.pm),
          meal_fee: Number(student.meal_fee),
          eng_fee: Number(student.eng_fee),
          skill_fee: Number(student.skill_fee),
          student_fund: Number(student.student_fund),
          facility_fee: Number(student.facility_fee),
          total_fee: Number(student.total_fee),
          paid_amount: Number(student.paid_amount),
          remaining_amount: Number(student.remaining_amount),
          meal_fee_per_ticket: Number(student.meal_fee) / Math.max(1, (Number(student.pm) - Number(student.pt))) || MEAL_FEE_PER_TICKET,
        });
      } catch (error) {
        Logger.error('Failed to fetch student:', error);
        notifications.show({
          title: 'Lỗi',
          message: 'Không thể tải thông tin học sinh. Vui lòng thử lại sau.',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [idFromParams]); // form.setValues removed from deps, form object itself is stable

  useEffect(() => {
    const calculateFees = () => {
      const values = form.values;
      
      // Ensure numeric inputs, defaulting to 0 if undefined/null/empty string
      const baseFee = Number(values.base_fee) || 0;
      const discountPercentage = Number(values.discount_percentage) || 0;
      const utilitiesFee = Number(values.utilities_fee) || 0;
      const pmValue = Number(values.pm) || 0;
      const ptValue = Number(values.pt) || 0;
      const engFee = Number(values.eng_fee) || 0;
      const skillFee = Number(values.skill_fee) || 0;
      const studentFund = Number(values.student_fund) || 0;
      const facilityFee = Number(values.facility_fee) || 0;
      const paidAmount = Number(values.paid_amount) || 0;
      const mealFeePerTicket = Number(values.meal_fee_per_ticket) || MEAL_FEE_PER_TICKET; // Use user input or default

      // Calculate final fee after discount and round to whole number
      const finalFee = Math.round(baseFee * (1 - discountPercentage));
      
      // Calculate meal fee: (pm - pt) * MEAL_FEE_PER_TICKET
      const mealFee = Math.round((pmValue - ptValue) * mealFeePerTicket);
      
      // Calculate total fee: sum of all fees
      const totalFee = Math.round(
        finalFee + 
        utilitiesFee + 
        mealFee + 
        engFee + 
        skillFee + 
        studentFund + 
        facilityFee
      );
                      
      // Calculate remaining amount
      const remainingAmount = Math.round(totalFee - paidAmount);

      // Update all calculated values at once to minimize re-renders
      form.setValues(currentValues => ({
        ...currentValues,
        final_fee: finalFee,
        meal_fee: mealFee,
        total_fee: totalFee,
        remaining_amount: remainingAmount,
      }));
    };

    calculateFees();
  }, [
    form.values.base_fee,
    form.values.discount_percentage,
    form.values.utilities_fee,
    form.values.pt,
    form.values.pm,
    form.values.meal_fee_per_ticket,
    form.values.eng_fee,
    form.values.skill_fee,
    form.values.student_fund,
    form.values.facility_fee,
    form.values.paid_amount
  ]);

  const handleSubmit = async (values: StudentEditFormValues) => {
    try {
      if (!studentSequentialNumberRef.current) {
        Logger.error('Sequential number not found, cannot update.');
        notifications.show({
          title: 'Lỗi',
          message: 'Không tìm thấy mã học sinh duy nhất.',
          color: 'red',
        });
        return;
      }

      // Calculate final fee
      const baseFee = Number(values.base_fee || 0);
      const discountPercentage = Number(values.discount_percentage) || 0;
      const finalFee = Math.round(baseFee * (1 - discountPercentage));

      // Use meal_fee_per_ticket from form values
      const mealFeePerTicket = Number(values.meal_fee_per_ticket || 0);
      const pmValue = Number(values.pm || 0);
      const ptValue = Number(values.pt || 0);
      const mealFee = Math.round((pmValue - ptValue) * mealFeePerTicket);

      const apiPayload: StudentApiUpdatePayload = {
        name: values.name,
        classroom: values.classroom,
        birthdate: values.birthdate ? values.birthdate.toISOString().split('T')[0] : null,
        base_fee: baseFee,
        discount_percentage: discountPercentage,
        final_fee: finalFee,
        utilities_fee: Number(values.utilities_fee || 0),
        pt: Number(values.pt || 0),
        pm: Number(values.pm || 0),
        meal_fee: mealFee,
        eng_fee: Number(values.eng_fee || 0),
        skill_fee: Number(values.skill_fee || 0),
        student_fund: Number(values.student_fund || 0),
        facility_fee: Number(values.facility_fee || 0),
        paid_amount: Number(values.paid_amount || 0),
        total_fee: computedTotalFee,
        remaining_amount: computedRemainingAmount,
      };

      // Use sequential_number instead of UUID for update
      await studentApi.updateStudent(studentSequentialNumberRef.current, apiPayload);
      notifications.show({
        title: 'Thành công',
        message: 'Thông tin học sinh đã được cập nhật thành công!',
        color: 'green',
      });
      router.push('/dashboard/students');
    } catch (error: any) {
      Logger.error('Error saving student:', error);
      
      // Check for authentication errors (401)
      if (error.response && error.response.status === 401) {
        notifications.show({
          title: 'Lỗi xác thực',
          message: 'Bạn cần đăng nhập lại để thực hiện thao tác này.',
          color: 'red',
        });
        return;
      }
      
      // Permission error (403)
      if (error.response && error.response.status === 403) {
        notifications.show({
          title: 'Không có quyền',
          message: 'Bạn không có quyền cập nhật thông tin học sinh.',
          color: 'red',
        });
        return;
      }
      
      // Other errors
      notifications.show({
        title: 'Lỗi',
        message: `Có lỗi xảy ra khi cập nhật thông tin học sinh: ${error.response?.data?.detail || 'Vui lòng thử lại.'}`,
        color: 'red',
      });
    }
  };

  // Prevent form submission when pressing enter in input fields
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLFormElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  // Custom submit handler to ensure form is only submitted with button click
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.onSubmit(handleSubmit)(e);
  };

  // Format number for display (add comma separator)
  const formatNumber = (num: number): string => {
    if (typeof num !== 'number' || isNaN(num)) {
      return "0";
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (loading) {
    return (
      <Container size="lg" mt="md">
        <Text>Đang tải...</Text>
      </Container>
    );
  }

  return (
    <Container size="lg" mt="md">
      <Group mb="xl">
        <Button 
          variant="subtle" 
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          Quay lại
        </Button>
        <Title order={2}>Chỉnh sửa học sinh</Title>
      </Group>

      <Paper withBorder p="md" radius="md">
        <form onSubmit={handleFormSubmit} onKeyDown={handleKeyDown}>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Tên học sinh"
                placeholder="Nhập tên học sinh"
                required
                onKeyDown={handleKeyDown}
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Lớp"
                placeholder="Chọn lớp"
                required
                data={[
                  { value: 'Mon1', label: 'Mon1' },
                  { value: 'Mon2', label: 'Mon2' },
                  { value: 'Mon3', label: 'Mon3' },
                  { value: 'Mon4', label: 'Mon4' },
                  { value: 'Unknown', label: 'Unknown' },
                ]}
                {...form.getInputProps('classroom')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  marginBottom: '5px' 
                }}>
                  Ngày sinh
                </label>
                <Popover opened={calendarOpened} onChange={setCalendarOpened} position="bottom" withinPortal>
                  <Popover.Target>
                    <div 
                      style={{ position: 'relative' }}
                      onClick={() => setCalendarOpened(true)}
                    >
                      <TextInput
                        placeholder="Chọn ngày sinh"
                        value={form.values.birthdate ? format(form.values.birthdate, 'yyyy-MM-dd') : ''}
                        readOnly
                        rightSection={<IconCalendar size={16} />}
                        styles={{
                          input: {
                            cursor: 'pointer',
                          }
                        }}
                      />
                    </div>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <DayPicker
                      mode="single"
                      selected={form.values.birthdate || undefined}
                      onSelect={(date) => {
                        if (date) {
                          // @ts-ignore
                          form.setFieldValue('birthdate', date);
                        } else {
                          form.setFieldValue('birthdate', null);
                        }
                        setCalendarOpened(false);
                      }}
                      locale={vi}
                      footer={
                        <Button 
                          size="xs" 
                          variant="subtle"
                          onClick={() => {
                            form.setFieldValue('birthdate', null);
                            setCalendarOpened(false);
                          }}
                        >
                          Xoá
                        </Button>
                      }
                    />
                  </Popover.Dropdown>
                </Popover>
              </div>
            </Grid.Col>
          </Grid>

          <Divider my="md" label="Học phí" labelPosition="center" />

          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Học phí ban đầu"
                placeholder="Nhập học phí ban đầu"
                value={form.values.base_fee}
                onChange={(val) => form.setFieldValue('base_fee', !val && val !== 0 ? 0 : Number(val))}
                suffix=" ₫"
                thousandSeparator=","
                decimalScale={0}
                min={0}
                onKeyDown={handleKeyDown}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Giảm học phí (%)"
                placeholder="Nhập % giảm học phí"
                value={Math.round(form.values.discount_percentage * 100)}
                onChange={(val) => form.setFieldValue('discount_percentage', (!val && val !== 0 ? 0 : Number(val)) / 100)}
                suffix=" %"
                decimalScale={0}
                min={0}
                max={100}
                onKeyDown={handleKeyDown}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Học phí sau giảm"
                placeholder="Học phí sau giảm"
                readOnly
                value={form.values.final_fee}
                suffix=" ₫"
                thousandSeparator=","
                decimalScale={0}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Phí điện nước"
                placeholder="Nhập phí điện nước"
                value={form.values.utilities_fee}
                onChange={(val) => form.setFieldValue('utilities_fee', !val && val !== 0 ? 0 : Number(val))}
                suffix=" ₫"
                thousandSeparator=","
                decimalScale={0}
                min={0}
                onKeyDown={handleKeyDown}
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" label="Tiền ăn" labelPosition="center" />

          <Grid>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Phiếu tồn"
                placeholder="Nhập số phiếu tồn"
                value={form.values.pt}
                onChange={(val) => form.setFieldValue('pt', !val && val !== 0 ? 0 : Number(val))}
                decimalScale={1}
                min={0}
                onKeyDown={handleKeyDown}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Phiếu mới"
                placeholder="Nhập số phiếu mới"
                value={form.values.pm}
                onChange={(val) => form.setFieldValue('pm', !val && val !== 0 ? 0 : Number(val))}
                decimalScale={1}
                min={0}
                onKeyDown={handleKeyDown}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Tiền ăn 1 buổi"
                placeholder="Nhập tiền ăn 1 buổi"
                value={form.values.meal_fee_per_ticket}
                onChange={(val) => form.setFieldValue('meal_fee_per_ticket', !val && val !== 0 ? MEAL_FEE_PER_TICKET : Number(val))}
                suffix=" ₫"
                thousandSeparator=","
                decimalScale={0}
                min={0}
                onKeyDown={handleKeyDown}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Tổng tiền ăn"
                placeholder="Tổng tiền ăn"
                readOnly
                value={form.values.meal_fee}
                suffix=" ₫"
                thousandSeparator=","
                decimalScale={0}
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" label="Học tự chọn" labelPosition="center" />

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Học phí kỹ năng sống"
                placeholder="Nhập học phí KNS"
                value={form.values.skill_fee}
                onChange={(val) => form.setFieldValue('skill_fee', !val && val !== 0 ? 0 : Number(val))}
                suffix=" ₫"
                thousandSeparator=","
                decimalScale={0}
                min={0}
                onKeyDown={handleKeyDown}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Học phí Tiếng Anh"
                placeholder="Nhập học phí TA"
                value={form.values.eng_fee}
                onChange={(val) => form.setFieldValue('eng_fee', !val && val !== 0 ? 0 : Number(val))}
                suffix=" ₫"
                thousandSeparator=","
                decimalScale={0}
                min={0}
                onKeyDown={handleKeyDown}
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" label="Phí đầu năm" labelPosition="center" />

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Quỹ học sinh"
                placeholder="Nhập quỹ học sinh"
                value={form.values.student_fund}
                onChange={(val) => form.setFieldValue('student_fund', !val && val !== 0 ? 0 : Number(val))}
                suffix=" ₫"
                thousandSeparator=","
                decimalScale={0}
                min={0}
                onKeyDown={handleKeyDown}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Cơ sở vật chất"
                placeholder="Nhập phí CSVC"
                value={form.values.facility_fee}
                onChange={(val) => form.setFieldValue('facility_fee', !val && val !== 0 ? 0 : Number(val))}
                suffix=" ₫"
                thousandSeparator=","
                decimalScale={0}
                min={0}
                onKeyDown={handleKeyDown}
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" label="Thanh toán" labelPosition="center" />

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Số tiền đã đóng"
                placeholder="Nhập số tiền đã đóng"
                value={form.values.paid_amount}
                onChange={(val) => form.setFieldValue('paid_amount', !val && val !== 0 ? 0 : Number(val))}
                suffix=" ₫"
                thousandSeparator=","
                decimalScale={0}
                min={0}
                onKeyDown={handleKeyDown}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Tổng học phí"
                placeholder="Tổng học phí"
                readOnly
                value={computedTotalFee}
                suffix=" ₫"
                thousandSeparator=","
                decimalScale={0}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Số tiền còn lại"
                placeholder="Số tiền còn lại"
                readOnly
                value={computedRemainingAmount}
                suffix=" ₫"
                thousandSeparator=","
                decimalScale={0}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="xl">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              leftSection={<IconDeviceFloppy size={16} />}
            >
              Lưu
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
} 