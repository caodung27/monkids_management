'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Title, Paper, Button, Group, TextInput, NumberInput, Select, Grid, Text, Divider, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { teacherApi } from '@/api/apiService';
import { Teacher } from '@/types';
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { formatVND } from '@/utils/formatters';
import { notifications } from '@mantine/notifications';

export default function NewTeacherPage() {
  const router = useRouter();
  
  const form = useForm<Teacher>({
    validate: {
      name: (value) => (!value ? 'Vui lòng nhập tên giáo viên' : null),
      role: (value) => (!value ? 'Vui lòng chọn vai trò' : null),
    },
  });

  useEffect(() => {
    const {
      base_salary: v_base_salary,
      teaching_days: v_teaching_days,
      absence_days: v_absence_days,
      extra_teaching_days: v_extra_teaching_days,
      skill_sessions: v_skill_sessions,
      english_sessions: v_english_sessions,
      paid_amount: v_paid_amount,
      new_students_list: v_new_students_list,
      received_salary: v_current_received_salary,
      extra_salary: v_current_extra_salary,     
      skill_salary: v_current_skill_salary,   
      english_salary: v_current_english_salary, 
      total_salary: v_current_total_salary
    } = form.values;

    // Ensure numeric inputs, defaulting to 0 if undefined/null/empty string
    const base_salary = Number(v_base_salary) || 0;
    const teaching_days = Number(v_teaching_days) || 0;
    const absence_days = Number(v_absence_days) || 0;
    const extra_teaching_days = Number(v_extra_teaching_days) || 0;
    const skill_sessions = Number(v_skill_sessions) || 0;
    const english_sessions = Number(v_english_sessions) || 0;
    const paid_amount = Number(v_paid_amount) || 0;
    const new_students_list = Number(v_new_students_list) || 0;

    const calculated_received_salary =
      teaching_days > 0
        ? Math.round((base_salary / teaching_days) * Math.max(0, teaching_days - absence_days))
        : 0;

    const calculated_extra_salary = extra_teaching_days * 150000;
    const calculated_skill_salary = skill_sessions * 125000;
    const calculated_english_salary = english_sessions * 150000;

    const calculated_total_salary =
      calculated_received_salary +
      calculated_extra_salary +
      calculated_skill_salary +
      calculated_english_salary +
      new_students_list -
      paid_amount;

    // Prepare updated values
    const newValues = {
      received_salary: calculated_received_salary,
      extra_salary: calculated_extra_salary,
      skill_salary: calculated_skill_salary,
      english_salary: calculated_english_salary,
      total_salary: calculated_total_salary,
    };

    // Check if any calculated values have changed to avoid unnecessary updates and potential loops
    if (
      v_current_received_salary !== newValues.received_salary ||
      v_current_extra_salary !== newValues.extra_salary ||
      v_current_skill_salary !== newValues.skill_salary ||
      v_current_english_salary !== newValues.english_salary ||
      v_current_total_salary !== newValues.total_salary
    ) {
      form.setValues(currentValues => ({
        ...currentValues,
        ...newValues
      }));
    }
  }, [
    form.values.base_salary,
    form.values.teaching_days,
    form.values.absence_days,
    form.values.extra_teaching_days,
    form.values.skill_sessions,
    form.values.english_sessions,
    form.values.paid_amount,
    form.values.new_students_list,
    // Include values that are read for comparison
    form.values.received_salary,
    form.values.extra_salary,
    form.values.skill_salary,
    form.values.english_salary,
    form.values.total_salary,
  ]);

  const handleSubmit = async (values: Teacher) => {
    try {
      // Instead of excluding fields, format them according to API requirements
      const apiPayload = {
        name: values.name,
        role: values.role,
        phone: values.phone === '' ? null : values.phone,
        base_salary: (Number(values.base_salary) || 0).toFixed(2),
        teaching_days: Number(values.teaching_days) || 0,
        absence_days: Number(values.absence_days) || 0,
        received_salary: (Number(values.received_salary) || 0).toFixed(2),
        extra_teaching_days: Number(values.extra_teaching_days) || 0,
        extra_salary: (Number(values.extra_salary) || 0).toFixed(2),
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
        message: 'Giáo viên mới đã được thêm thành công!',
        color: 'green',
      });
      router.push('/dashboard/teachers');
    } catch (error) {
      console.error('Error saving teacher:', error);
      notifications.show({
        title: 'Lỗi',
        message: 'Có lỗi xảy ra khi thêm giáo viên. Vui lòng thử lại.',
        color: 'red',
      });
    }
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
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Tên giáo viên"
                placeholder="Nhập tên giáo viên"
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Vai trò"
                placeholder="Chọn vai trò"
                required
                data={[
                  { value: 'GV', label: 'Giáo viên' },
                  { value: 'Quản lý', label: 'Quản lý' },
                  { value: 'Quản lý + GV', label: 'Quản lý + Giáo viên' },
                  { value: 'Bảo mẫu', label: 'Bảo mẫu' },
                ]}
                {...form.getInputProps('role')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Số điện thoại"
                placeholder="Nhập số điện thoại"
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
                {...form.getInputProps('base_salary')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Số ngày dạy trong tháng"
                placeholder="Nhập số ngày dạy"
                min={0}
                max={31}
                {...form.getInputProps('teaching_days')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Số ngày vắng"
                placeholder="Nhập số ngày vắng"
                min={0}
                max={31}
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
                {...form.getInputProps('received_salary')}
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
                {...form.getInputProps('extra_salary')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Hỗ trợ bảo hiểm"
                placeholder="Nhập hỗ trợ bảo hiểm"
                suffix=" ₫"
                thousandSeparator=","
                min={0}
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
                {...form.getInputProps('skill_salary')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Số buổi dạy Tiếng Anh"
                placeholder="Nhập số buổi TA"
                min={0}
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
                {...form.getInputProps('paid_amount')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Thưởng học sinh mới"
                placeholder="Nhập thưởng HS mới (200.000đ/HS)"
                suffix=" ₫"
                thousandSeparator=","
                min={0}
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