'use client';

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Title, Paper, Button, Group, TextInput, NumberInput, Select, Grid, Text, Divider, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { teacherApi } from '@/api/apiService';
import { Teacher, TeacherApiPayload } from '@/types';
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { formatVND } from '@/utils/formatters';
import { notifications } from '@mantine/notifications';

export default function EditTeacherPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;
  const [loading, setLoading] = useState(true);
  
  // Refs to store initial values of source fields from API
  const initialExtraTeachingDays = useRef<number | null>(null);
  const initialSkillSessions = useRef<number | null>(null);
  const initialEnglishSessions = useRef<number | null>(null);
  
  const form = useForm<Teacher>({
    validate: {
      name: (value) => (!value ? 'Vui lòng nhập tên giáo viên' : null),
      role: (value) => (!value ? 'Vui lòng chọn vai trò' : null),
    },
  });

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const teacher = await teacherApi.getTeacherById(teacherId);
        form.setValues(teacher);

        // Store initial source values after form is populated
        initialExtraTeachingDays.current = teacher.extra_teaching_days;
        initialSkillSessions.current = teacher.skill_sessions;
        initialEnglishSessions.current = teacher.english_sessions;

      } catch (error) {
        console.error('Failed to fetch teacher:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [teacherId, form.setValues]);

  useEffect(() => {
    // Destructure all relevant values from form.values
    const {
      base_salary: v_base_salary,
      teaching_days: v_teaching_days,
      absence_days: v_absence_days,
      extra_teaching_days: v_extra_teaching_days, // Raw value from form input
      skill_sessions: v_skill_sessions,           // Raw value from form input
      english_sessions: v_english_sessions,       // Raw value from form input
      paid_amount: v_paid_amount,
      new_students_list: v_new_students_list,
      extra_salary: v_current_extra_salary,     // Current extra_salary from form (API or last calc)
      skill_salary: v_current_skill_salary,   // Current skill_salary from form
      english_salary: v_current_english_salary, // Current english_salary from form
      // Values needed for the "changed" check below
      received_salary: v_current_received_salary,
      total_salary: v_current_total_salary
    } = form.values;

    // Ensure numeric inputs, defaulting to 0 if undefined/null/empty string
    const base_salary = Number(v_base_salary) || 0;
    const teaching_days = Number(v_teaching_days) || 0;
    const absence_days = Number(v_absence_days) || 0;
    const extra_teaching_days_val = Number(v_extra_teaching_days) || 0; // Defaulted for calculation
    const skill_sessions_val = Number(v_skill_sessions) || 0;         // Defaulted for calculation
    const english_sessions_val = Number(v_english_sessions) || 0;       // Defaulted for calculation
    const paid_amount = Number(v_paid_amount) || 0;
    const new_students_list = Number(v_new_students_list) || 0;

    // Calculate received salary
    const calculated_received_salary =
      teaching_days > 0
        ? Math.round((base_salary / teaching_days) * Math.max(0, teaching_days - absence_days))
        : 0;

    // Determine final_extra_salary
    // Default to current form value (from API/last calc), or 0 if that's not a number
    let final_extra_salary = Number(v_current_extra_salary) || 0;
    // Recalculate if the raw input for extra_teaching_days has changed from its initial API-loaded value
    if (v_extra_teaching_days !== initialExtraTeachingDays.current) {
      final_extra_salary = extra_teaching_days_val * 150000; // Use defaulted numeric value for calculation
    }

    // Determine final_skill_salary
    let final_skill_salary = Number(v_current_skill_salary) || 0;
    if (v_skill_sessions !== initialSkillSessions.current) {
      final_skill_salary = skill_sessions_val * 125000;
    }

    // Determine final_english_salary
    let final_english_salary = Number(v_current_english_salary) || 0;
    if (v_english_sessions !== initialEnglishSessions.current) {
      final_english_salary = english_sessions_val * 150000;
    }

    // Add insurance and other supports to calculation
    const insurance_support = Number(form.values.insurance_support) || 0;
    const responsibility_support = Number(form.values.responsibility_support) || 0;
    const breakfast_support = Number(form.values.breakfast_support) || 0;
    
    // Calculate total salary using robustly defaulted values
    const calculated_total_salary =
      calculated_received_salary +
      final_extra_salary +
      final_skill_salary +
      final_english_salary +
      insurance_support +
      responsibility_support +
      breakfast_support +
      new_students_list -
      paid_amount;

    // Prepare values to set in the form
    const newFormValues = {
      received_salary: calculated_received_salary,
      extra_salary: final_extra_salary,
      skill_salary: final_skill_salary,
      english_salary: final_english_salary,
      total_salary: calculated_total_salary,
    };

    // Update form only if any of the calculated values have actually changed
    // to prevent unnecessary re-renders or potential loops.
    if (
      v_current_received_salary !== newFormValues.received_salary ||
      v_current_extra_salary !== newFormValues.extra_salary ||
      v_current_skill_salary !== newFormValues.skill_salary ||
      v_current_english_salary !== newFormValues.english_salary ||
      v_current_total_salary !== newFormValues.total_salary
    ) {
      form.setValues(currentValues => ({
        ...currentValues,
        ...newFormValues,
      }));
    }
  }, [
    // Dependencies: all values from form.values that are read in this effect.
    // The refs (initialExtraTeachingDays, etc.) are stable and don't need to be dependencies.
    form.values.base_salary,
    form.values.teaching_days,
    form.values.absence_days,
    form.values.extra_teaching_days,
    form.values.skill_sessions,
    form.values.english_sessions,
    form.values.paid_amount,
    form.values.new_students_list,
    form.values.extra_salary, 
    form.values.skill_salary, 
    form.values.english_salary, 
    form.values.received_salary,
    form.values.total_salary,
    form.values.insurance_support,
    form.values.responsibility_support,
    form.values.breakfast_support,
    // form.setValues is stable from useForm, initialXXX refs are stable.
  ]);

  const handleSubmit = async (values: Teacher) => {
    try {
      // Assuming 'id' might be part of the Teacher type from form.values if fetched initially
      // It should not be in the PUT payload body.
      const { id, ...formValues } = values; 

      const apiPayload: TeacherApiPayload = {
        name: formValues.name,
        role: formValues.role,
        phone: formValues.phone === '' ? null : formValues.phone, // Ensure empty string becomes null if appropriate
        base_salary: (Number(formValues.base_salary) || 0).toFixed(2),
        teaching_days: Number(formValues.teaching_days) || 0,
        absence_days: Number(formValues.absence_days) || 0,
        received_salary: (Number(formValues.received_salary) || 0).toFixed(2),
        extra_teaching_days: Number(formValues.extra_teaching_days) || 0,
        extra_salary: (Number(formValues.extra_salary) || 0).toFixed(2),
        insurance_support: (Number(formValues.insurance_support) || 0).toFixed(2),
        responsibility_support: (Number(formValues.responsibility_support) || 0).toFixed(2),
        breakfast_support: (Number(formValues.breakfast_support) || 0).toFixed(2),
        skill_sessions: Number(formValues.skill_sessions) || 0,
        skill_salary: (Number(formValues.skill_salary) || 0).toFixed(2),
        english_sessions: Number(formValues.english_sessions) || 0,
        english_salary: (Number(formValues.english_salary) || 0).toFixed(2),
        new_students_list: String(Number(formValues.new_students_list) || 0),
        paid_amount: (Number(formValues.paid_amount) || 0).toFixed(2),
        total_salary: (Number(formValues.total_salary) || 0).toFixed(2),
        note: formValues.note === '' ? null : formValues.note, // Ensure empty string becomes null
      };

      await teacherApi.updateTeacher(teacherId, apiPayload);
      notifications.show({
        title: 'Thành công',
        message: 'Thông tin giáo viên đã được cập nhật thành công!',
        color: 'green',
      });
      router.push('/dashboard/teachers');
    } catch (error) {
      console.error('Error saving teacher:', error);
      // Consider more specific error feedback if possible, e.g., from error.response.data
      alert('Có lỗi khi lưu thông tin giáo viên. Vui lòng thử lại sau.');
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
        <Title order={2}>Chỉnh sửa giáo viên</Title>
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
                data={[
                  { value: 'GV', label: 'Giáo viên' },
                  { value: 'Quản lý', label: 'Quản lý' },
                  { value: 'Quản lý + GV', label: 'Quản lý + Giáo viên' },
                  { value: 'Đầu bếp', label: 'Đầu bếp' },
                ]}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('role')}
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
                decimalScale={0}
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
                decimalScale={0}
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

          <Divider my="md" label="Lương thêm" labelPosition="center" />

          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Số ngày dạy thêm"
                placeholder="Nhập số ngày dạy thêm"
                min={0}
                decimalScale={0}
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
                decimalScale={0}
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
                decimalScale={0}
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