'use client';

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Title, Paper, Button, Group, TextInput, NumberInput, Select, Grid, Text, Divider, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { teacherApi } from '@/api/apiService';
import { Teacher, TeacherApiPayload } from '@/types';
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { formatVND } from '@/utils/formatters';
import { notifications } from '@mantine/notifications';

interface TeacherFormValues {
  name: string;
  role: string;
  phone: string;
  base_salary: number;
  teaching_days: number;
  absence_days: number;
  received_salary: number;
  extra_teaching_days: number;
  extra_salary: number;
  probation_days: number;
  probation_salary: number;
  insurance_support: number;
  responsibility_support: number;
  breakfast_support: number;
  skill_sessions: number;
  skill_salary: number;
  english_sessions: number;
  english_salary: number;
  new_students_list: string;
  paid_amount: number;
  total_salary: number;
  note: string;
}

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

export default function NewTeacherPage() {
  const router = useRouter();
  
  const form = useForm<TeacherFormValues>({
    validate: {
      name: (value) => (!value ? 'Vui lòng nhập tên giáo viên' : null),
      role: (value) => (!value ? 'Vui lòng chọn vai trò' : null),
    },
  });

  useEffect(() => {
    // Destructure all relevant values from form.values
    const {
      base_salary: v_base_salary,
      teaching_days: v_teaching_days,
      absence_days: v_absence_days,
      extra_teaching_days: v_extra_teaching_days,
      probation_days: v_probation_days,
      skill_sessions: v_skill_sessions,
      english_sessions: v_english_sessions,
      paid_amount: v_paid_amount,
      new_students_list: v_new_students_list,
      extra_salary: v_current_extra_salary,
      probation_salary: v_current_probation_salary,
      skill_salary: v_current_skill_salary,
      english_salary: v_current_english_salary,
      received_salary: v_current_received_salary,
      total_salary: v_current_total_salary
    } = form.values;

    // Ensure numeric inputs, defaulting to 0 if undefined/null/empty string
    const base_salary = Number(v_base_salary) || 0;
    const teaching_days = Number(v_teaching_days) || 0;
    const absence_days = Number(v_absence_days) || 0;
    const extra_teaching_days_val = Number(v_extra_teaching_days) || 0;
    const probation_days_val = Number(v_probation_days) || 0;
    const skill_sessions_val = Number(v_skill_sessions) || 0;
    const english_sessions_val = Number(v_english_sessions) || 0;
    const paid_amount = Number(v_paid_amount) || 0;
    const new_students_list = Number(v_new_students_list) || 0;

    // Calculate received salary using the updated formula
    const totalWorkDaysAndAbsence = teaching_days + absence_days;
    const calculated_received_salary =
      totalWorkDaysAndAbsence > 0
        ? Math.round((base_salary / totalWorkDaysAndAbsence) * teaching_days)
        : 0;

    // Calculate extra salary using the updated formula
    const final_extra_salary = totalWorkDaysAndAbsence > 0
      ? Math.round((base_salary / totalWorkDaysAndAbsence) * extra_teaching_days_val)
      : 0;

    // Calculate probation salary
    const final_probation_salary = probation_days_val * 200000;

    // Calculate skill salary
    const final_skill_salary = skill_sessions_val * 125000;

    // Calculate english salary
    const final_english_salary = english_sessions_val * 150000;

    // Add insurance and other supports to calculation
    const insurance_support = Number(form.values.insurance_support) || 0;
    const responsibility_support = Number(form.values.responsibility_support) || 0;
    const breakfast_support = Number(form.values.breakfast_support) || 0;
    
    // Calculate total salary
    const calculated_total_salary =
      calculated_received_salary +
      final_extra_salary +
      final_probation_salary +
      final_skill_salary +
      final_english_salary +
      insurance_support +
      responsibility_support +
      breakfast_support +
      new_students_list -
      paid_amount;

    // Update form values
    form.setValues(currentValues => ({
      ...currentValues,
      received_salary: calculated_received_salary,
      extra_salary: final_extra_salary,
      probation_salary: final_probation_salary,
      skill_salary: final_skill_salary,
      english_salary: final_english_salary,
      total_salary: calculated_total_salary,
    }));
  }, [
    form.values.base_salary,
    form.values.teaching_days,
    form.values.absence_days,
    form.values.extra_teaching_days,
    form.values.probation_days,
    form.values.skill_sessions,
    form.values.english_sessions,
    form.values.paid_amount,
    form.values.new_students_list,
    form.values.insurance_support,
    form.values.responsibility_support,
    form.values.breakfast_support,
  ]);

  const handleSubmit = async (values: TeacherFormValues) => {
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

      const apiPayload: TeacherApiPayload = {
        ...values,
        role: values.role,
        phone: values.phone === '' ? null : values.phone,
        base_salary: (Number(values.base_salary) || 0).toFixed(2),
        teaching_days: Number(values.teaching_days) || 0,
        absence_days: Number(values.absence_days) || 0,
        received_salary: (Number(values.received_salary) || 0).toFixed(2),
        extra_teaching_days: Number(values.extra_teaching_days) || 0,
        probation_days: Number(values.probation_days) || 0,
        extra_salary: (Number(values.extra_salary) || 0).toFixed(2),
        probation_salary: (Number(values.probation_salary) || 0).toFixed(2),
        insurance_support: (Number(values.insurance_support) || 0).toFixed(2),
        responsibility_support: (Number(values.responsibility_support) || 0).toFixed(2),
        breakfast_support: (Number(values.breakfast_support) || 0).toFixed(2),
        skill_sessions: Number(values.skill_sessions) || 0,
        skill_salary: (Number(values.skill_salary) || 0).toFixed(2),
        english_sessions: Number(values.english_sessions) || 0,
        english_salary: (Number(values.english_salary) || 0).toFixed(2),
        new_students_list: String(Number(values.new_students_list) || 0),
        paid_amount: (Number(values.paid_amount) || 0).toFixed(2),
        total_salary: (Number(values.total_salary) || 0).toFixed(2),
        note: values.note === '' ? null : values.note,
      };

      await teacherApi.createTeacher(apiPayload);
      notifications.show({
        title: 'Thành công',
        message: 'Thông tin giáo viên đã được tạo thành công!',
        color: 'green',
      });
      router.push('/dashboard/teachers');
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      
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
          message: 'Bạn không có quyền thêm giáo viên. Chỉ quản trị viên mới có quyền này.',
          color: 'red',
        });
        return;
      }
      
      notifications.show({
        title: 'Lỗi',
        message: `Có lỗi khi tạo giáo viên mới: ${error.response?.data?.detail || 'Vui lòng thử lại sau.'}`,
        color: 'red',
      });
    }
  };

  // Prevent form submission when pressing enter in input fields
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLFormElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
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
        <Title order={2}>Thêm giáo viên mới</Title>
      </Group>

      <Paper withBorder p="md" radius="md">
        <form onSubmit={handleFormSubmit} onKeyDown={handleKeyDown}>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Tên giáo viên"
                placeholder="Nhập tên giáo viên"
                required
                onKeyDown={handleKeyDown}
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Vai trò"
                placeholder="Chọn vai trò"
                required
                data={ROLE_OPTIONS}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('role')}
                styles={{
                  input: {
                    minHeight: '36px',
                  },
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Số điện thoại"
                placeholder="Nhập số điện thoại"
                onKeyDown={handleKeyDown}
                {...form.getInputProps('phone')}
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" label="Lương cơ bản" labelPosition="center" />

          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Lương cơ bản"
                placeholder="Nhập lương cơ bản"
                suffix=" ₫"
                thousandSeparator=","
                decimalScale={0}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('base_salary')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Số ngày dạy trong tháng"
                placeholder="Nhập số ngày dạy"
                min={0}
                max={31}
                decimalScale={1}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('teaching_days')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Số ngày vắng"
                placeholder="Nhập số ngày vắng"
                min={0}
                max={31}
                decimalScale={1}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('absence_days')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Lương thực nhận (cơ bản)"
                placeholder="Lương thực nhận từ lương cơ bản"
                suffix=" ₫"
                thousandSeparator=","
                readOnly
                decimalScale={0}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('received_salary')}
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" label="Lương thử việc" labelPosition="center" />

          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Số ngày thử việc"
                placeholder="Nhập số ngày thử việc"
                min={0}
                decimalScale={1}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('probation_days')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Lương thử việc (tính tự động)"
                placeholder="Lương thử việc"
                suffix=" ₫"
                thousandSeparator=","
                min={0}
                readOnly
                decimalScale={0}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('probation_salary')}
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" label="Lương thêm" labelPosition="center" />

          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Số ngày dạy thêm"
                placeholder="Nhập số ngày dạy thêm"
                min={0}
                decimalScale={1}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('extra_teaching_days')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Lương dạy thêm (tính tự động)"
                placeholder="Lương dạy thêm"
                suffix=" ₫"
                thousandSeparator=","
                min={0}
                readOnly
                decimalScale={0}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('extra_salary')}
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" label="Hỗ trợ" labelPosition="center" />
          
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Hỗ trợ bảo hiểm"
                placeholder="Nhập hỗ trợ bảo hiểm"
                suffix=" ₫"
                thousandSeparator=","
                min={0}
                decimalScale={0}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('insurance_support')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Phụ cấp trách nhiệm"
                placeholder="Nhập phụ cấp trách nhiệm"
                suffix=" ₫"
                thousandSeparator=","
                min={0}
                decimalScale={0}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('responsibility_support')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Hỗ trợ xăng xe"
                placeholder="Nhập hỗ trợ xăng xe"
                suffix=" ₫"
                thousandSeparator=","
                min={0}
                decimalScale={0}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('breakfast_support')}
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" label="Dạy môn tự chọn" labelPosition="center" />

          <Grid>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Số buổi dạy KNS"
                placeholder="Nhập số buổi KNS"
                min={0}
                decimalScale={1}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('skill_sessions')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Lương dạy KNS (tính tự động)"
                placeholder="Nhập lương dạy KNS"
                suffix=" ₫"
                thousandSeparator=","
                min={0}
                readOnly
                decimalScale={0}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('skill_salary')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Số buổi dạy Tiếng Anh"
                placeholder="Nhập số buổi TA"
                min={0}
                decimalScale={1}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('english_sessions')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Lương dạy Tiếng Anh (tính tự động)"
                placeholder="Nhập lương dạy TA"
                suffix=" ₫"
                thousandSeparator=","
                min={0}
                readOnly
                decimalScale={0}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('english_salary')}
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" label="Thanh toán" labelPosition="center" />

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Số tiền đã ứng"
                placeholder="Nhập số tiền đã ứng"
                suffix=" ₫"
                thousandSeparator=","
                min={0}
                decimalScale={0}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('paid_amount')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Thưởng học sinh mới"
                placeholder="Nhập thưởng HS mới (100.000đ/HS)"
                suffix=" ₫"
                thousandSeparator=","
                min={0}
                decimalScale={0}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('new_students_list')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 12 }}>
              <NumberInput
                label="Tổng lương nhận (tạm tính)"
                placeholder="Tổng lương sau khi trừ số tiền đã ứng"
                suffix=" ₫"
                thousandSeparator=","
                readOnly
                fw={700}
                size="lg"
                styles={{ input: { textAlign: 'right', fontWeight: 'bold' } }}
                decimalScale={0}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('total_salary')}
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" label="Ghi chú" labelPosition="center" />

          <Grid>
            <Grid.Col span={12}>
              <Textarea
                label="Ghi chú"
                placeholder="Nhập ghi chú nếu có"
                autosize
                minRows={3}
                maxRows={6}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('note')}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="xl">
            <Button
              variant="outline"
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