'use client';

import { useState, useEffect, FormEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Title, Paper, Button, Group, TextInput, NumberInput, Select, Grid, Divider, Popover } from '@mantine/core';
import { useForm } from '@mantine/form';
import { studentApi } from '@/api/apiService';
import { Student } from '@/types';
import { IconArrowLeft, IconDeviceFloppy, IconCalendar } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MEAL_FEE_PER_TICKET } from '@/constants/fees';
import 'react-day-picker/dist/style.css';

// Extend form type to include meal_fee_per_ticket
type NewStudentFormValues = Omit<Student, 'student_id' | 'sequential_number'> & { 
  birthdate: Date | null;
  meal_fee_per_ticket: number;
};

export default function NewStudentPage() {
  const router = useRouter();
  const [calendarOpened, setCalendarOpened] = useState(false);
  
  const form = useForm<Omit<Student, 'student_id' | 'sequential_number'> & { birthdate: Date | null; meal_fee_per_ticket: number }>({
    validate: {
      name: (value) => (!value ? 'Vui lòng nhập tên học sinh' : null),
      classroom: (value) => (!value ? 'Vui lòng chọn lớp' : null),
    },
  });

  // Prevent form submission when pressing enter in input fields
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLFormElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  // Calculate total fee and meal fee
  useEffect(() => {
    const calculateFees = () => {
      const values = form.values;
      
      // Ensure numeric inputs, defaulting to 0 if undefined/null/empty string
      const baseFee = Number(values.base_fee) || 0;
      // discount_percentage is stored as 0.0-1.0 in form, input is 0-100
      const discountPercentage = Number(values.discount_percentage) || 0;
      const utilitiesFee = Number(values.utilities_fee) || 0;
      const pmValue = Number(values.pm) || 0;
      const ptValue = Number(values.pt) || 0;
      const engFee = Number(values.eng_fee) || 0;
      const skillFee = Number(values.skill_fee) || 0;
      const studentFund = Number(values.student_fund) || 0;
      const facilityFee = Number(values.facility_fee) || 0;
      const paidAmount = Number(values.paid_amount) || 0;
      // Use custom meal fee per ticket value
      const mealFeePerTicket = Number(values.meal_fee_per_ticket) || MEAL_FEE_PER_TICKET;

      // Calculate final fee after discount and round to whole number
      const finalFee = Math.round(baseFee * (1 - discountPercentage));
      
      // Calculate meal fee with custom meal fee per ticket
      const mealFee = Math.round((pmValue - ptValue) * mealFeePerTicket);
      
      // Calculate total fee: sum of all fees
      // Further ensure all values are valid before calculation
      const safeUtilitiesFee = Number(utilitiesFee) || 0;
      const safeMealFee = Number(mealFee) || 0;
      const safeEngFee = Number(engFee) || 0;
      const safeSkillFee = Number(skillFee) || 0;
      const safeStudentFund = Number(studentFund) || 0;
      const safeFacilityFee = Number(facilityFee) || 0;
      
      const totalFee = Math.round(
        finalFee + 
        safeUtilitiesFee + 
        safeMealFee + 
        safeEngFee + 
        safeSkillFee + 
        safeStudentFund + 
        safeFacilityFee
      );
                      
      // Calculate remaining amount
      const safePaidAmount = Number(paidAmount) || 0;
      const remainingAmount = Math.round(totalFee - safePaidAmount);

      // Check if calculated values have changed before setting them to prevent infinite loops
      if (
        form.values.final_fee !== finalFee ||
        form.values.meal_fee !== mealFee ||
        form.values.total_fee !== totalFee ||
        form.values.remaining_amount !== remainingAmount
      ) {
        form.setValues(currentValues => ({
          ...currentValues,
          final_fee: finalFee,
          meal_fee: mealFee,
          total_fee: totalFee,
          remaining_amount: remainingAmount,
        }));
      }
    };

    calculateFees();
  }, [
    form.values.base_fee,
    form.values.discount_percentage,
    form.values.utilities_fee,
    form.values.pt,
    form.values.pm,
    form.values.meal_fee_per_ticket, // Add dependency on meal_fee_per_ticket
    form.values.eng_fee,
    form.values.skill_fee,
    form.values.student_fund,
    form.values.facility_fee,
    form.values.paid_amount,
    form.values.final_fee, 
    form.values.meal_fee, 
    form.values.total_fee, 
    form.values.remaining_amount
  ]);

  const handleSubmit = async (formValues: NewStudentFormValues) => {
    try {
      // Verify authentication first
      const { TokenService } = await import('@/api/apiService');
      const isAuthenticated = TokenService.checkTokensExist();
      
      if (!isAuthenticated) {
        notifications.show({
          title: 'Lỗi xác thực',
          message: 'Bạn cần đăng nhập lại để thực hiện thao tác này.',
          color: 'red',
        });
        return;
      }

      // Calculate final fee
      const baseFee = Number(formValues.base_fee || 0);
      const discountPercentage = Number(formValues.discount_percentage) || 0;
      const finalFee = Math.round(baseFee * (1 - discountPercentage));

      // Use custom meal fee per ticket value for API payload calculation
      const mealFeePerTicket = Number(formValues.meal_fee_per_ticket || MEAL_FEE_PER_TICKET);
      const pmValue = Number(formValues.pm || 0);
      const ptValue = Number(formValues.pt || 0);
      const mealFee = Math.round((pmValue - ptValue) * mealFeePerTicket);
      
      const apiPayload = {
        name: formValues.name,
        classroom: formValues.classroom,
        birthdate: formValues.birthdate ? formValues.birthdate.toISOString().split('T')[0] : null,
        base_fee: baseFee,
        discount_percentage: discountPercentage,
        final_fee: finalFee,
        utilities_fee: Number(formValues.utilities_fee || 0),
        pt: Number(formValues.pt || 0),
        pm: Number(formValues.pm || 0),
        meal_fee: mealFee, // Use calculated meal fee
        eng_fee: Number(formValues.eng_fee || 0),
        skill_fee: Number(formValues.skill_fee || 0),
        student_fund: Number(formValues.student_fund || 0),
        facility_fee: Number(formValues.facility_fee || 0),
        total_fee: Number(formValues.total_fee || 0),
        paid_amount: Number(formValues.paid_amount || 0),
        remaining_amount: Number(formValues.remaining_amount || 0),
        // Add meal_fee_per_ticket if your API supports it
        // meal_fee_per_ticket: mealFeePerTicket,
      };
      
      console.log('Authentication check before creating student:', {
        hasAccessToken: !!localStorage.getItem('accessToken'),
        hasRefreshToken: !!localStorage.getItem('refreshToken'),
        authSuccess: localStorage.getItem('auth_successful')
      });
      
      await studentApi.createStudent(apiPayload);
      notifications.show({
        title: 'Thành công',
        message: 'Học sinh mới đã được thêm thành công!',
        color: 'green',
      });
      router.push('/dashboard/students');
    } catch (error: any) {
      console.error('Error saving student:', error);
      
      // Error handling remains the same
      if (error.response && error.response.status === 401) {
        notifications.show({
          title: 'Lỗi xác thực',
          message: 'Bạn cần đăng nhập lại để thực hiện thao tác này.',
          color: 'red',
        });
        return;
      }
      
      if (error.response && error.response.status === 403) {
        notifications.show({
          title: 'Không có quyền',
          message: 'Bạn không có quyền thêm học sinh. Chỉ giáo viên và quản trị viên mới có quyền này.',
          color: 'red',
        });
        return;
      }
      
      notifications.show({
        title: 'Lỗi',
        message: `Có lỗi xảy ra khi thêm học sinh: ${error.response?.data?.detail || 'Vui lòng thử lại.'}`,
        color: 'red',
      });
    }
  };

  // Custom submit handler to ensure form is only submitted with button click
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.onSubmit(handleSubmit)(e);
  };

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
        <Title order={2}>Thêm học sinh mới</Title>
      </Group>

      <Paper withBorder p="md" radius="md">
        <form 
          onSubmit={handleFormSubmit}
          onKeyDown={handleKeyDown}
        >
          {/* Personal information section - unchanged */}
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
            {/* Birthday picker - unchanged */}
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

          {/* Fee section - unchanged */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Học phí ban đầu"
                placeholder="Nhập học phí ban đầu"
                suffix=" ₫"
                thousandSeparator=","
                onKeyDown={handleKeyDown}
                {...form.getInputProps('base_fee')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Giảm học phí (%)"
                placeholder="Nhập % giảm học phí"
                suffix=" %"
                min={0}
                max={100}
                onKeyDown={handleKeyDown}
                value={Math.round((form.values.discount_percentage || 0) * 100)}
                onChange={(value) => {
                  const numValue = Number(value) || 0;
                  form.setFieldValue('discount_percentage', numValue / 100);
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Học phí sau giảm"
                placeholder="Học phí sau giảm"
                suffix=" ₫"
                thousandSeparator=","
                readOnly
                {...form.getInputProps('final_fee')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Phí điện nước"
                placeholder="Nhập phí điện nước"
                suffix=" ₫"
                thousandSeparator=","
                onKeyDown={handleKeyDown}
                {...form.getInputProps('utilities_fee')}
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" label="Tiền ăn" labelPosition="center" />

          {/* Meal fee section - UPDATED with meal_fee_per_ticket */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Phiếu tồn"
                placeholder="Nhập số phiếu tồn"
                onKeyDown={handleKeyDown}
                {...form.getInputProps('pt')}
                min={0}
                decimalScale={1}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Phiếu mới"
                placeholder="Nhập số phiếu mới"
                onKeyDown={handleKeyDown}
                {...form.getInputProps('pm')}
                min={0}
                decimalScale={1}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Tiền ăn 1 buổi"
                placeholder="Nhập tiền ăn 1 buổi"
                suffix=" ₫"
                thousandSeparator=","
                onKeyDown={handleKeyDown}
                decimalScale={0}
                min={0}
                {...form.getInputProps('meal_fee_per_ticket')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Tổng tiền ăn"
                placeholder="Tổng tiền ăn"
                suffix=" ₫"
                thousandSeparator=","
                {...form.getInputProps('meal_fee')}
                min={0}
                readOnly
              />
            </Grid.Col>
          </Grid>

          {/* The rest of the form remains unchanged */}
          <Divider my="md" label="Học tự chọn" labelPosition="center" />

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Học phí kỹ năng sống"
                placeholder="Nhập học phí KNS"
                suffix=" ₫"
                thousandSeparator=","
                onKeyDown={handleKeyDown}
                {...form.getInputProps('skill_fee')}
                min={0}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Học phí Tiếng Anh"
                placeholder="Nhập học phí TA"
                suffix=" ₫"
                thousandSeparator=","
                onKeyDown={handleKeyDown}
                {...form.getInputProps('eng_fee')}
                min={0}
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" label="Phí đầu năm" labelPosition="center" />

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Quỹ học sinh"
                placeholder="Nhập quỹ học sinh"
                suffix=" ₫"
                thousandSeparator=","
                onKeyDown={handleKeyDown}
                {...form.getInputProps('student_fund')}
                min={0}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Cơ sở vật chất"
                placeholder="Nhập phí CSVC"
                suffix=" ₫"
                thousandSeparator=","
                onKeyDown={handleKeyDown}
                {...form.getInputProps('facility_fee')}
                min={0}
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" label="Thanh toán" labelPosition="center" />

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Số tiền đã đóng"
                placeholder="Nhập số tiền đã đóng"
                suffix=" ₫"
                thousandSeparator=","
                onKeyDown={handleKeyDown}
                {...form.getInputProps('paid_amount')}
                min={0}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Tổng học phí"
                placeholder="Tổng học phí"
                suffix=" ₫"
                thousandSeparator=","
                readOnly
                {...form.getInputProps('total_fee')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Số tiền còn lại"
                placeholder="Số tiền còn lại"
                suffix=" ₫"
                thousandSeparator=","
                readOnly
                {...form.getInputProps('remaining_amount')}
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
