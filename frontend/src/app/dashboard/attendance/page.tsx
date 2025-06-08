'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Paper, Group, Text, Button, Table, ScrollArea, Flex, Box, ActionIcon, Select, useMantineTheme, useMantineColorScheme, LoadingOverlay, Checkbox, MantineTheme } from '@mantine/core';
import { useTeachers } from '@/api/hooks/useTeachers';
import { teacherApi, attendanceApi } from '@/api/apiService';
import { IconChevronLeft, IconChevronRight, IconCheck, IconX, IconClock, IconDeviceFloppy, IconUsers, IconUserExclamation } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

// Attendance status types
enum AttendanceStatus {
  FULL_DAY = 1,
  HALF_DAY = 2,
  ABSENT = 3,
  NOT_SET = 0,
  SUNDAY = 4,
}

// Status colors function for theme awareness - Reverted to original state
const getStatusColors = (colorScheme: 'light' | 'dark') => ({
  [AttendanceStatus.FULL_DAY]: colorScheme === 'dark' ? '#69db7c' : '#4CAF50', // Brighter green for dark mode (original)
  [AttendanceStatus.HALF_DAY]: colorScheme === 'dark' ? '#ffd43b' : '#FFC107', // Brighter yellow for dark mode (original)
  [AttendanceStatus.ABSENT]: colorScheme === 'dark' ? '#ff6b6b' : '#F44336',   // Brighter red for dark mode (original)
  [AttendanceStatus.NOT_SET]: 'transparent',
  [AttendanceStatus.SUNDAY]: colorScheme === 'dark' ? '#373A40' : '#dee2e6' // Gray for Sundays
});

// Status icons
const getStatusIcons = (colorScheme: 'light' | 'dark'): Record<AttendanceStatus, JSX.Element | null> => ({
  [AttendanceStatus.FULL_DAY]: <IconCheck size={16} stroke={1.5} color={colorScheme === 'dark' ? '#000' : '#fff'} />,
  [AttendanceStatus.HALF_DAY]: <IconClock size={16} stroke={1.5} color={colorScheme === 'dark' ? '#000' : '#fff'} />,
  [AttendanceStatus.ABSENT]: <IconX size={16} stroke={1.5} color={colorScheme === 'dark' ? '#000' : '#fff'} />,
  [AttendanceStatus.NOT_SET]: null,
  [AttendanceStatus.SUNDAY]: null,
});

export default function TeacherAttendancePage() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const { teachers, loading: teachersLoading, fetchTeachers } = useTeachers();
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<Record<string, { full_days: number[], half_days: number[], absent_days: number[], extra_days: number[] }>>({});
  const [selectedTeachers, setSelectedTeachers] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  
  // Get status colors based on current theme
  const statusColors = getStatusColors(colorScheme === 'dark' ? 'dark' : 'light');
  
  // Get all days in current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
  };
  
  const daysInMonth = getDaysInMonth(currentMonth);
  
  // Count selected teachers
  const selectedTeachersCount = Object.values(selectedTeachers).filter(Boolean).length;
  
  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    
    const newSelectedTeachers: Record<string, boolean> = {};
    teachers.forEach(teacher => {
      newSelectedTeachers[teacher.id] = checked;
    });
    
    setSelectedTeachers(newSelectedTeachers);
  };
  
  // Handle individual teacher selection
  const handleSelectTeacher = (teacherId: string, checked: boolean) => {
    setSelectedTeachers(prev => ({
      ...prev,
      [teacherId]: checked
    }));
    
    // Update selectAll state
    if (!checked) {
      setSelectAll(false);
    } else {
      // Check if all teachers are now selected
      const updatedSelectedTeachers = {
        ...selectedTeachers,
        [teacherId]: checked
      };
      
      const allSelected = teachers.every(teacher => updatedSelectedTeachers[teacher.id]);
      setSelectAll(allSelected);
    }
  };
  
  // Fetch attendance data for the current month and year
  useEffect(() => {
    const fetchAttendance = async () => {
      setAttendanceLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // getMonth() is 0-indexed
      const newAttendanceData: Record<string, { full_days: number[], half_days: number[], absent_days: number[], extra_days: number[] }> = {};

      // Fetch attendance for each teacher
      for (const teacher of teachers) {
        try {
          const attendance = await attendanceApi.getTeacherAttendance(teacher.id, year, month);
          if (attendance) {
            newAttendanceData[teacher.id] = {
              full_days: attendance.full_days || [],
              half_days: attendance.half_days || [],
              absent_days: attendance.absent_days || [],
              extra_days: attendance.extra_days || [],
            };
          } else {
             // Initialize with empty arrays if no record found
            newAttendanceData[teacher.id] = { full_days: [], half_days: [], absent_days: [], extra_days: [] };
          }
        } catch (error) {
          Logger.error(`Failed to fetch attendance for teacher ${teacher.id}:`, error);
           // Initialize with empty arrays on error
          newAttendanceData[teacher.id] = { full_days: [], half_days: [], absent_days: [], extra_days: [] };
        }
      }
      setAttendanceData(newAttendanceData);
      setAttendanceLoading(false);
    };

    if (teachers.length > 0) {
      fetchAttendance();
    }
  }, [teachers, currentMonth]); // Refetch when teachers or month change

  // Initialize selected teachers when teachers data is loaded
   useEffect(() => {
    if (teachers.length > 0) {
      const initialSelectedTeachers: Record<string, boolean> = {};
      teachers.forEach((teacher) => {
        initialSelectedTeachers[teacher.id] = false;
      });
      setSelectedTeachers(initialSelectedTeachers);
    }
  }, [teachers]);
  
  // Navigate to previous month
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  // Helper to get attendance status for a specific day
  const getDayStatus = (teacherId: string, day: number): AttendanceStatus => {
    const teacherAttendance = attendanceData[teacherId];
    if (!teacherAttendance) {
      // Check if it's a Sunday even if no attendance data exists
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      return date.getDay() === 0 ? AttendanceStatus.SUNDAY : AttendanceStatus.NOT_SET;
    }

    if (teacherAttendance.full_days.includes(day)) {
      return AttendanceStatus.FULL_DAY;
    } else if (teacherAttendance.half_days.includes(day)) {
      return AttendanceStatus.HALF_DAY;
    } else if (teacherAttendance.absent_days.includes(day)) {
      return AttendanceStatus.ABSENT;
    } else {
      // Check if it's a Sunday if the day is not in any attendance list
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      return date.getDay() === 0 ? AttendanceStatus.SUNDAY : AttendanceStatus.NOT_SET;
    }
  };

  // Handle attendance status change
  const handleAttendanceChange = (teacherId: string, day: number) => {
    // Prevent changing status for Sundays
    const dayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay();
    if (dayOfWeek === 0) {
        return; // Do nothing for Sundays
    }

    setAttendanceData(prev => {
      const newData = JSON.parse(JSON.stringify(prev)); // Deep clone
      const teacherAttendance = newData[teacherId];

      // Determine current status using the helper function
      const currentStatus: AttendanceStatus = getDayStatus(teacherId, day);

      // Remove day from all lists before adding to the new one
      if (teacherAttendance) {
        teacherAttendance.full_days = teacherAttendance.full_days.filter((d: number) => d !== day);
        teacherAttendance.half_days = teacherAttendance.half_days.filter((d: number) => d !== day);
        teacherAttendance.absent_days = teacherAttendance.absent_days.filter((d: number) => d !== day);
        teacherAttendance.extra_days = teacherAttendance.extra_days.filter((d: number) => d !== day);

        // Determine and add to the new status list (cycle: NOT_SET -> FULL -> HALF -> ABSENT -> NOT_SET)
        let newStatus: AttendanceStatus;
        switch (currentStatus) {
          case AttendanceStatus.NOT_SET:
            newStatus = AttendanceStatus.FULL_DAY;
            teacherAttendance.full_days.push(day);
            break;
          case AttendanceStatus.FULL_DAY:
            newStatus = AttendanceStatus.HALF_DAY;
            teacherAttendance.half_days.push(day);
            break;
          case AttendanceStatus.HALF_DAY:
            newStatus = AttendanceStatus.ABSENT;
            teacherAttendance.absent_days.push(day);
            break;
          case AttendanceStatus.ABSENT:
            newStatus = AttendanceStatus.NOT_SET;
            break;
          default:
            newStatus = AttendanceStatus.NOT_SET; // Should not happen with current logic, but good fallback
        }

        // Sort arrays for consistency (optional but good practice)
        teacherAttendance.full_days.sort((a: number, b: number) => a - b);
        teacherAttendance.half_days.sort((a: number, b: number) => a - b);
        teacherAttendance.absent_days.sort((a: number, b: number) => a - b);
        teacherAttendance.extra_days.sort((a: number, b: number) => a - b);
      }

      return newData;
    });

    // Removed the attendanceApi.createOrUpdateTeacherAttendance call from here
  };
  
  // Calculate attendance metrics for a teacher
  const calculateAttendanceMetrics = (teacherId: string) => {
    const teacherAttendance = attendanceData[teacherId] || {};
    let teachingDays = 0;
    let absenceDays = 0;
    let extraTeachingDays = 0;
    
    // Get all days in the current month
    const days = getDaysInMonth(currentMonth);
    
    days.forEach((date) => {
      const day = date.getDate();
      const dayOfWeek = date.getDay();
      const dayStatus = getDayStatus(teacherId, day);
      
      // Monday to Friday (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        if (dayStatus === AttendanceStatus.FULL_DAY) {
          teachingDays += 1;
        } else if (dayStatus === AttendanceStatus.HALF_DAY) {
          teachingDays += 0.5;
        } else if (dayStatus === AttendanceStatus.ABSENT) {
          absenceDays += 1;
        }
      } 
      // Saturday (6)
      else if (dayOfWeek === 6) {
        if (dayStatus === AttendanceStatus.FULL_DAY) {
          extraTeachingDays += 1;
        } else if (dayStatus === AttendanceStatus.HALF_DAY) {
          extraTeachingDays += 0.5;
        }
      }
    });
    
    return {
      teachingDays,
      absenceDays,
      extraTeachingDays
    };
  };
  
  // Calculate salary components
  const calculateSalary = (teacher: any, metrics: { teachingDays: number, absenceDays: number, extraTeachingDays: number }) => {
    // Parse base values, defaulting to 0 if invalid
    const baseSalary = parseFloat(teacher.base_salary) || 0;
    const insuranceSupport = parseFloat(teacher.insurance_support) || 0;
    const responsibilitySupport = parseFloat(teacher.responsibility_support) || 0;
    const breakfastSupport = parseFloat(teacher.breakfast_support) || 0;
    const skillSalary = parseFloat(teacher.skill_salary) || 0;
    const englishSalary = parseFloat(teacher.english_salary) || 0;
    const paidAmount = parseFloat(teacher.paid_amount) || 0;
    
    // Calculate received salary using the new formula: base_salary / (teaching_days + absence_days) * teaching_days
    const totalWorkDaysAndAbsence = metrics.teachingDays + metrics.absenceDays;
    const receivedSalary = totalWorkDaysAndAbsence > 0
      ? (baseSalary / totalWorkDaysAndAbsence) * metrics.teachingDays
      : 0;

    // Round receivedSalary to the nearest whole number
    const roundedReceivedSalary = Math.round(receivedSalary);

    // Calculate extra salary as fixed rate per day
    const EXTRA_DAY_RATE = 150000; // Fixed rate per extra teaching day
    const extraSalary = metrics.extraTeachingDays * EXTRA_DAY_RATE;

    // Round extraSalary to the nearest whole number
    const roundedExtraSalary = Math.round(extraSalary);

    // Calculate total salary
    const totalSalary = 
      roundedReceivedSalary + // Use rounded value
      roundedExtraSalary + // Use rounded value
      insuranceSupport +
      responsibilitySupport +
      breakfastSupport +
      skillSalary +
      englishSalary -
      paidAmount;
    
     // Round totalSalary to the nearest whole number
    const roundedTotalSalary = Math.round(totalSalary);

    return {
      receivedSalary: roundedReceivedSalary.toFixed(0), // Format rounded whole number as string
      extraSalary: roundedExtraSalary.toFixed(0), // Format rounded whole number as string
      totalSalary: roundedTotalSalary.toFixed(0) // Format rounded whole number as string
    };
  };
  
  // Save attendance data for selected teachers only (modified to also update teacher salary)
  const handleSaveSelectedAttendance = async () => {
    setSavingAttendance(true);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const results: { success: boolean; teacherId: string; teacherName: string; error?: any; step?: 'updateTeacher' | 'saveAttendance'; message?: string }[] = [];

    // Filter for selected teachers
    const selectedTeachersToSave = teachers.filter(teacher => selectedTeachers[teacher.id]);

    if (selectedTeachersToSave.length === 0) {
      notifications.show({
        title: 'Chú ý',
        message: 'Vui lòng chọn ít nhất một giáo viên để lưu chấm công',
        color: 'yellow'
      });
      setSavingAttendance(false);
      return;
    }

    try {
      const savePromises = selectedTeachersToSave.map(async (teacher): Promise<{ success: boolean; teacherId: string; teacherName: string; error?: any; step?: 'updateTeacher' | 'saveAttendance'; message?: string }> => {
        const attendanceRecord = attendanceData[teacher.id];
        
        // --- 1. Save Attendance Data ---
        if (attendanceRecord) { // Only try to save if there is attendance data
          try {
            await attendanceApi.createOrUpdateTeacherAttendance({
              teacherId: teacher.id,
              year,
              month,
              full_days: attendanceRecord.full_days,
              half_days: attendanceRecord.half_days,
              absent_days: attendanceRecord.absent_days,
              extra_days: attendanceRecord.extra_days,
            });
             // If attendance save is successful, proceed to update teacher

            // --- 2. Calculate Metrics and Salary ---
            const metrics = calculateAttendanceMetrics(teacher.id);
            const salary = calculateSalary(teacher, metrics);

            // --- 3. Prepare and Update Teacher Data ---
            const updateData = {
              ...teacher,
              teaching_days: metrics.teachingDays,
              absence_days: metrics.absenceDays,
              extra_teaching_days: metrics.extraTeachingDays,
              received_salary: salary.receivedSalary,
              extra_salary: salary.extraSalary,
              total_salary: salary.totalSalary
            };

            try {
              await teacherApi.updateTeacher(teacher.id, updateData);
              return { success: true, teacherId: teacher.id, teacherName: teacher.name };
            } catch (updateError) {
              Logger.error(`Failed to update teacher ${teacher.name} salary:`, updateError);
              // Return failure for teacher update, but attendance save was successful
               return { success: false, teacherId: teacher.id, teacherName: teacher.name, error: updateError, step: 'updateTeacher' };
            }

          } catch (attendanceError) {
            Logger.error(`Failed to save attendance data for teacher ${teacher.name}:`, attendanceError);
            // Return failure for attendance save
            return { success: false, teacherId: teacher.id, teacherName: teacher.name, error: attendanceError, step: 'saveAttendance' };
          }
        } else {
           // No attendance data to save, but maybe update teacher based on default/empty data?
           // For now, we'll just treat this as success if no attendance data was expected.
           return { success: true, teacherId: teacher.id, teacherName: teacher.name, message: 'No attendance data to save' };
        }
      });

      // Execute all API calls concurrently
      const settledResults = await Promise.all(savePromises);
      results.push(...settledResults);

      const successCount = results.filter(r => r.success).length;
      const errorResults = results.filter(r => !r.success);
      const errorCount = errorResults.length;

      notifications.show({
        title: 'Lưu và Cập nhật',
        message: `Đã xử lý ${results.length} giáo viên đã chọn. Thành công: ${successCount}. Thất bại: ${errorCount}.`,
        color: errorCount > 0 ? 'orange' : 'green'
      });

      if (errorCount > 0) {
        Logger.error('Errors during save and update:', errorResults);
         errorResults.forEach(err => {
           notifications.show({
             title: `Lỗi xử lý ${err.teacherName}`,
             message: `Bước: ${err.step === 'saveAttendance' ? 'Lưu chấm công' : 'Cập nhật lương'}. Chi tiết: ${err.error?.message || 'Lỗi không xác định'}`,
             color: 'red'
           });
         });
      }

       // Refetch teachers data to show updated salaries
      await fetchTeachers(1, 1000);

    } catch (error) {
      Logger.error('Unexpected error during save and update:', error);
      notifications.show({
        title: 'Lỗi hệ thống',
        message: 'Đã xảy ra lỗi không mong muốn khi xử lý chấm công.',
        color: 'red'
      });
    } finally {
      setSavingAttendance(false);
    }
  };
  
  // Cell border color based on theme
  const cellBorderColor = colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];
  
  const statusIcons = getStatusIcons(colorScheme === 'dark' ? 'dark' : 'light');
  
  // Fallback: nếu không có màu, trả về màu mặc định
  const getCellBackground = (dayStatus: AttendanceStatus, colorScheme: string) => {
    return statusColors[dayStatus] || (colorScheme === 'dark' ? '#222' : '#fff');
  };
  
  return (
    <Container fluid>
      <LoadingOverlay 
        visible={savingAttendance || teachersLoading || attendanceLoading} 
        overlayProps={{ blur: 2 }}
      />
      <Title order={2} mb="lg">Chấm công Giáo viên</Title>
      
      <Paper shadow="sm" p="md" withBorder mb="lg">
        <Flex align="center" justify="space-between" mb="md">
          <Group>
            <ActionIcon variant="subtle" onClick={handlePreviousMonth}>
              <IconChevronLeft size={20} />
            </ActionIcon>
            <Text fw={500} size="lg">
              {currentMonth.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}
            </Text>
            <ActionIcon variant="subtle" onClick={handleNextMonth}>
              <IconChevronRight size={20} />
            </ActionIcon>
          </Group>
        </Flex>
      </Paper>

      {teachersLoading ? (
        <Text>Đang tải dữ liệu...</Text>
      ) : teachers.length === 0 ? (
        <Text>Không có dữ liệu giáo viên.</Text>
      ) : (
        <Paper shadow="sm" p="md" withBorder>
          <ScrollArea>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 60 }}>
                    <Checkbox 
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.currentTarget.checked)}
                    />
                  </Table.Th>
                  <Table.Th style={{ width: 60 }}>STT</Table.Th>
                  <Table.Th style={{ minWidth: 200 }}>Tên Giáo viên</Table.Th>
                  {daysInMonth.map((day) => (
                    <Table.Th 
                      key={day.toISOString()} 
                      style={{ 
                        width: 60, 
                        textAlign: 'center',
                        backgroundColor: day.getDay() === 6 ? (colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[1]) : undefined,
                      }}
                    >
                      {day.getDate()}
                      <Box fz="xs" c="dimmed">
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day.getDay()]}
                      </Box>
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {teachers.map((teacher, index) => (
                  <Table.Tr key={teacher.id}>
                    <Table.Td>
                      <Checkbox 
                        checked={!!selectedTeachers[teacher.id]} 
                        onChange={(e) => handleSelectTeacher(teacher.id, e.currentTarget.checked)} 
                        aria-label={`Chọn ${teacher.name}`}
                      />
                    </Table.Td>
                    <Table.Td>{index + 1}</Table.Td>
                    <Table.Td>{teacher.name}</Table.Td>
                    {daysInMonth.map((day) => {
                      const dateStr = day.toISOString().split('T')[0];
                      const dayStatus = getDayStatus(teacher.id, day.getDate());
                      const dayOfWeek = day.getDay();

                      // Determine background color or pattern based on status
                      let cellBackground = undefined;
                      let cellBackgroundColor = undefined;
                      if (dayStatus === AttendanceStatus.SUNDAY) {
                        cellBackground = `repeating-linear-gradient(
                          -45deg,
                          ${colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[3]},
                          ${colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[3]} 5px,
                          ${colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2]} 5px,
                          ${colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2]} 10px
                        )`;
                      } else if (dayStatus !== AttendanceStatus.NOT_SET) {
                        cellBackgroundColor = getCellBackground(dayStatus, colorScheme);
                      } else {
                        cellBackgroundColor = 'transparent';
                      }

                      return (
                        <Table.Td
                          key={dateStr}
                          style={{
                            background: cellBackground,
                            backgroundColor: cellBackgroundColor,
                            cursor: dayOfWeek === 0 ? 'not-allowed' : 'pointer',
                            textAlign: 'center',
                            border: dayStatus === AttendanceStatus.NOT_SET ? `1px solid ${cellBorderColor}` : 'none',
                            height: '40px',
                            padding: '0',
                            opacity: dayStatus === AttendanceStatus.SUNDAY ? 0.6 : 1,
                          }}
                          onClick={() => dayOfWeek !== 0 && handleAttendanceChange(teacher.id, day.getDate())}
                        >
                          <Flex align="center" justify="center" h="100%">
                            {/* Render icon only for statuses other than NOT_SET and SUNDAY */}
                            {dayStatus !== AttendanceStatus.NOT_SET && dayStatus !== AttendanceStatus.SUNDAY
                              ? statusIcons[dayStatus]
                              : null}
                          </Flex>
                        </Table.Td>
                      );
                    })}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          
          <Paper withBorder p="md" mt="lg" radius="md">
            <Title order={4} mb="xs">Chú thích:</Title>
            <Flex align="center" gap="md" wrap="wrap">
              <Group>
                <Box 
                  style={{ 
                    width: 24, 
                    height: 24, 
                    backgroundColor: statusColors[AttendanceStatus.FULL_DAY],
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }} 
                >
                  <IconCheck size={16} stroke={1.5} />
                </Box>
                <Text size="sm">Đi làm cả ngày</Text>
              </Group>
              
              <Group>
                <Box 
                  style={{ 
                    width: 24, 
                    height: 24, 
                    backgroundColor: statusColors[AttendanceStatus.HALF_DAY],
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }} 
                >
                  <IconClock size={16} stroke={1.5} />
                </Box>
                <Text size="sm">Đi làm nửa buổi</Text>
              </Group>
              
              <Group>
                <Box 
                  style={{ 
                    width: 24, 
                    height: 24, 
                    backgroundColor: statusColors[AttendanceStatus.ABSENT],
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }} 
                >
                  <IconX size={16} stroke={1.5} />
                </Box>
                <Text size="sm">Nghỉ</Text>
              </Group>
              
              <Group>
                <Box 
                  style={{ 
                    width: 24, 
                    height: 24, 
                    backgroundColor: statusColors[AttendanceStatus.NOT_SET],
                    border: `1px solid ${cellBorderColor}`,
                    borderRadius: 4
                  }} 
                />
                <Text size="sm">Chưa cập nhật</Text>
              </Group>

              <Group>
                <Box 
                  style={{ 
                    width: 24, 
                    height: 24, 
                    border: `1px solid ${cellBorderColor}`,
                    borderRadius: 4,
                    background: `repeating-linear-gradient(
                      -45deg,
                      ${colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[3]},
                      ${colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[3]} 5px,
                      ${colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2]} 5px,
                      ${colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2]} 10px
                    )`,
                    opacity: 0.6
                  }} 
                />
                <Text size="sm">Chủ Nhật (không tính công)</Text>
              </Group>
            </Flex>
            
            <Text mt="md" mb="md" fz="sm" style={{ fontStyle: 'italic' }}>
              Quy tắc tính công: Thứ 2-6 tính vào số ngày làm việc chính thức, Thứ 7 tính vào ngày làm thêm.
            </Text>
            
            <Flex justify="flex-end" gap="md">
              <Button 
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={handleSaveSelectedAttendance}
                loading={savingAttendance}
                disabled={teachersLoading || selectedTeachersCount === 0}
                color="blue"
              >
                Lưu Chấm công ({selectedTeachersCount})
              </Button>
            </Flex>
          </Paper>
        </Paper>
      )}
    </Container>
  );
} 