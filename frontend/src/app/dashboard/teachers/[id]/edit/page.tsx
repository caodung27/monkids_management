'use client';

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Title, Paper, Button, Group, TextInput, NumberInput, MultiSelect, Grid, Text, Divider, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { teacherApi } from '@/api/apiService';
import { Teacher, TeacherApiPayload } from '@/types';
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import Logger from '@/libs/logger';

interface RoleOption {
  value: string;
  label: string;
  color: string;
}

// Extend Teacher interface to include the new field
interface TeacherWithProbationRate extends Teacher {
  probation_salary_per_session?: number;
}

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'Quản lý', label: 'Quản lý', color: 'blue' },
  { value: 'Giáo viên', label: 'Giáo viên', color: 'green' },
  { value: 'Đầu bếp', label: 'Đầu bếp', color: 'orange' },
];

export default function EditTeacherPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  // Refs to store initial values of source fields from API
  const initialExtraTeachingDays = useRef<number | null>(null);
  const initialSkillSessions = useRef<number | null>(null);
  const initialEnglishSessions = useRef<number | null>(null);
  
  const form = useForm<TeacherWithProbationRate>({
    validate: {
      name: (value) => (!value ? 'Vui lòng nhập tên giáo viên' : null),
      role: (value) => (!value ? 'Vui lòng chọn vai trò' : null),
    },
  });

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const teacher = await teacherApi.getTeacher(teacherId);

        // Set form values with teacher data
        form.setValues({
          ...teacher,
          probation_salary_per_session: 150000, // Default value if not present
        });

        // Split role string into array for MultiSelect
        const roles = teacher.role ? teacher.role.split(', ').filter(Boolean) : [];
        setSelectedRoles(roles);

        // Store initial source values after form is populated
        initialExtraTeachingDays.current = teacher.extra_teaching_days;
        initialSkillSessions.current = teacher.skill_sessions;
        initialEnglishSessions.current = teacher.english_sessions;
      } catch (error) {
        Logger.error('Failed to fetch teacher:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [teacherId, form.setValues]);

  // When selected roles change, update the form's role field as a comma-separated string
  useEffect(() => {
    const rolesString = selectedRoles.join(', ');
    form.setFieldValue('role', rolesString);
  }, [selectedRoles, form]);

  useEffect(() => {
    // Destructure all relevant values from form.values
    const {
      base_salary: v_base_salary,
      teaching_days: v_teaching_days,
      absence_days: v_absence_days,
      extra_teaching_days: v_extra_teaching_days,
      probation_days: v_probation_days,
      probation_salary_per_session: v_probation_salary_per_session, // Get the new field
      skill_sessions: v_skill_sessions,
      english_sessions: v_english_sessions,
      paid_amount: v_paid_amount,
      new_students_list: v_new_students_list,
    } = form.values;

    // Ensure numeric inputs, defaulting to 0 if undefined/null/empty string
    const base_salary = Number(v_base_salary) || 0;
    const teaching_days = Number(v_teaching_days) || 0;
    const absence_days = Number(v_absence_days) || 0;
    const extra_teaching_days_val = Number(v_extra_teaching_days) || 0;
    const probation_days_val = Number(v_probation_days) || 0;
    const probation_salary_per_session = Number(v_probation_salary_per_session) || 150000; // Use the new field with default
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

    // Calculate probation salary using the new field
    const final_probation_salary = probation_days_val * probation_salary_per_session;

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
    // Dependencies remain unchanged
    form.values.base_salary,
    form.values.teaching_days,
    form.values.absence_days,
    form.values.extra_teaching_days,
    form.values.probation_days,
    form.values.probation_salary_per_session, // Add new dependency
    form.values.skill_sessions,
    form.values.english_sessions,
    form.values.paid_amount,
    form.values.new_students_list,
    form.values.extra_salary, 
    form.values.probation_salary, 
    form.values.skill_salary, 
    form.values.english_salary, 
    form.values.received_salary,
    form.values.total_salary,
    form.values.insurance_support,
    form.values.responsibility_support,
    form.values.breakfast_support,
  ]);

  const handleSubmit = async (values: TeacherWithProbationRate) => {
    try {
      const { id, probation_salary_per_session, ...formValues } = values;

      const apiPayload: TeacherApiPayload = {
        name: values.name,
        role: values.role, // Already a comma-separated string from form state
        phone: values.phone,
        base_salary: values.base_salary.toString(),
        teaching_days: Number(values.teaching_days || 0),
        absence_days: Number(values.absence_days || 0),
        received_salary: values.received_salary.toString(),
        extra_teaching_days: Number(values.extra_teaching_days || 0),
        extra_salary: values.extra_salary.toString(),
        probation_days: Number(values.probation_days || 0),
        probation_salary: values.probation_salary.toString(),
        insurance_support: values.insurance_support.toString(),
        responsibility_support: values.responsibility_support.toString(),
        breakfast_support: values.breakfast_support.toString(),
        skill_sessions: Number(values.skill_sessions || 0),
        skill_salary: values.skill_salary.toString(),
        english_sessions: Number(values.english_sessions || 0),
        english_salary: values.english_salary.toString(),
        new_students_list: values.new_students_list.toString(),
        paid_amount: values.paid_amount.toString(),
        total_salary: values.total_salary.toString(),
        note: values.note,
      };

      await teacherApi.updateTeacher(teacherId, apiPayload);
      notifications.show({
        title: 'Thành công',
        message: 'Thông tin giáo viên đã được cập nhật thành công!',
        color: 'green',
      });
      router.push('/dashboard/teachers');
    } catch (error) {
      Logger.error('Error saving teacher:', error);
      notifications.show({
        title: 'Lỗi',
        message: 'Có lỗi khi lưu thông tin giáo viên. Vui lòng thử lại sau.',
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
              <MultiSelect
                label="Vai trò"
                placeholder="Chọn vai trò"
                required
                data={ROLE_OPTIONS}
                value={selectedRoles}
                onChange={setSelectedRoles}
                onKeyDown={handleKeyDown}
                styles={{
                  input: {
                    minHeight: '36px',
                  },
                }}
                clearable
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

          {/* Basic salary section remains unchanged */}
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

          {/* Modified probation section with new field */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Lương thử việc 1 buổi"
                placeholder="Nhập lương thử việc 1 buổi"
                suffix=" ₫"
                thousandSeparator=","
                min={0}
                decimalScale={0}
                onKeyDown={handleKeyDown}
                {...form.getInputProps('probation_salary_per_session')}
              />
            </Grid.Col>
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

          {/* Rest of the form remains unchanged */}
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
