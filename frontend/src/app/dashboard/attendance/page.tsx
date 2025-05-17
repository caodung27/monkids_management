'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Paper, Group, Text, Button, Table, ScrollArea, Flex, Box, ActionIcon, Select, useMantineTheme, useMantineColorScheme, LoadingOverlay, Checkbox } from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { teacherApi } from '@/api/apiService';
import { setTeachers, updateTeacher } from '@/store/slices/teachersSlice';
import { IconChevronLeft, IconChevronRight, IconCheck, IconX, IconClock, IconDeviceFloppy, IconUsers, IconUserExclamation } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

// Attendance status types
enum AttendanceStatus {
  FULL_DAY = 'FULL_DAY',
  HALF_DAY = 'HALF_DAY',
  ABSENT = 'ABSENT',
  NOT_SET = 'NOT_SET'
}

// Status colors function for theme awareness
const getStatusColors = (colorScheme: 'light' | 'dark') => ({
  [AttendanceStatus.FULL_DAY]: colorScheme === 'dark' ? '#69db7c' : '#4CAF50', // Brighter green for dark mode
  [AttendanceStatus.HALF_DAY]: colorScheme === 'dark' ? '#ffd43b' : '#FFC107', // Brighter yellow for dark mode
  [AttendanceStatus.ABSENT]: colorScheme === 'dark' ? '#ff6b6b' : '#F44336',   // Brighter red for dark mode
  [AttendanceStatus.NOT_SET]: 'transparent'  // Transparent instead of white
});

// Status icons
const statusIcons = {
  [AttendanceStatus.FULL_DAY]: <IconCheck size={16} stroke={1.5} />,
  [AttendanceStatus.HALF_DAY]: <IconClock size={16} stroke={1.5} />,
  [AttendanceStatus.ABSENT]: <IconX size={16} stroke={1.5} />,
  [AttendanceStatus.NOT_SET]: null
};

export default function TeacherAttendancePage() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const dispatch = useDispatch();
  const teachers = useSelector((state: RootState) => state.teachers.teachers);
  const [loading, setLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, AttendanceStatus>>>({});
  const [selectedTeachers, setSelectedTeachers] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  
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
  
  // Load all teachers without pagination
  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        // Set a very large pageSize to get all teachers at once
        const response = await teacherApi.getAllTeachers(1, 1000);
        dispatch(setTeachers(response.results || []));
        
        // Initialize selected teachers
        const initialSelectedTeachers: Record<string, boolean> = {};
        response.results?.forEach((teacher: any) => {
          initialSelectedTeachers[teacher.id] = false;
        });
        setSelectedTeachers(initialSelectedTeachers);
        
      } catch (error) {
        console.error('Failed to fetch teachers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeachers();
  }, [dispatch]);
  
  // Initialize attendance data
  useEffect(() => {
    // Create empty attendance data structure
    const newAttendanceData: Record<string, Record<string, AttendanceStatus>> = {};
    
    teachers.forEach(teacher => {
      newAttendanceData[teacher.id] = {};
      daysInMonth.forEach(day => {
        const dateStr = day.toISOString().split('T')[0];
        newAttendanceData[teacher.id][dateStr] = AttendanceStatus.NOT_SET;
      });
    });
    
    setAttendanceData(newAttendanceData);
    // In a real app, you would fetch actual attendance data from API here
  }, [teachers, currentMonth]);
  
  // Navigate to previous month
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  // Handle attendance status change
  const handleAttendanceChange = (teacherId: string, dateStr: string) => {
    setAttendanceData(prev => {
      const newData = JSON.parse(JSON.stringify(prev)); // Deep clone to ensure state update
      const currentStatus = newData[teacherId]?.[dateStr] || AttendanceStatus.NOT_SET;
      
      // Cycle through statuses
      let newStatus: AttendanceStatus;
      switch (currentStatus) {
        case AttendanceStatus.NOT_SET:
          newStatus = AttendanceStatus.FULL_DAY;
          break;
        case AttendanceStatus.FULL_DAY:
          newStatus = AttendanceStatus.HALF_DAY;
          break;
        case AttendanceStatus.HALF_DAY:
          newStatus = AttendanceStatus.ABSENT;
          break;
        case AttendanceStatus.ABSENT:
          newStatus = AttendanceStatus.NOT_SET;
          break;
        default:
          newStatus = AttendanceStatus.NOT_SET;
      }
      
      if (!newData[teacherId]) {
        newData[teacherId] = {};
      }
      
      newData[teacherId][dateStr] = newStatus;
      
      // In a real app, you would send this update to an API here
      return newData;
    });
  };
  
  // Calculate attendance metrics for a teacher
  const calculateAttendanceMetrics = (teacherId: string) => {
    const teacherAttendance = attendanceData[teacherId] || {};
    let teachingDays = 0;
    let absenceDays = 0;
    let extraTeachingDays = 0;
    let halfDayCount = 0;
    
    Object.entries(teacherAttendance).forEach(([dateStr, status]) => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // Monday to Friday (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        if (status === AttendanceStatus.FULL_DAY) {
          teachingDays += 1;
        } else if (status === AttendanceStatus.HALF_DAY) {
          teachingDays += 0.5;
          halfDayCount += 1;
        } else if (status === AttendanceStatus.ABSENT) {
          absenceDays += 1;
        }
      } 
      // Saturday (6)
      else if (dayOfWeek === 6) {
        if (status === AttendanceStatus.FULL_DAY) {
          extraTeachingDays += 1;
        } else if (status === AttendanceStatus.HALF_DAY) {
          extraTeachingDays += 0.5;
        }
      }
    });
    
    return {
      teachingDays: Math.floor(teachingDays), // Convert to integer
      absenceDays: Math.floor(absenceDays),   // Convert to integer
      extraTeachingDays: Math.floor(extraTeachingDays) // Convert to integer
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
    
    // Calculate received salary using the new formula
    // If teaching_days + absence_days is 0, use 1 to avoid division by zero
    const totalWorkDays = metrics.teachingDays + metrics.absenceDays;
    const receivedSalary = totalWorkDays > 0 
      ? (baseSalary / totalWorkDays) * metrics.teachingDays 
      : 0;
    
    // Calculate extra salary as fixed rate per day
    const EXTRA_DAY_RATE = 150000; // Fixed rate per extra teaching day
    const extraSalary = metrics.extraTeachingDays * EXTRA_DAY_RATE;
    
    // Calculate total salary
    const totalSalary = 
      receivedSalary + 
      extraSalary + 
      insuranceSupport +
      responsibilitySupport +
      breakfastSupport +
      skillSalary +
      englishSalary -
      paidAmount;
    
    return {
      receivedSalary: receivedSalary.toFixed(2),
      extraSalary: extraSalary.toFixed(2),
      totalSalary: totalSalary.toFixed(2)
    };
  };
  
  // Save attendance data for all teachers
  const handleSaveAttendance = async () => {
    await saveTeachersAttendance(teachers);
  };
  
  // Save attendance data for selected teachers only
  const handleSaveSelectedAttendance = async () => {
    // Filter out selected teachers
    const teachersToUpdate = teachers.filter(teacher => selectedTeachers[teacher.id]);
    
    if (teachersToUpdate.length === 0) {
      notifications.show({
        title: 'Chú ý',
        message: 'Vui lòng chọn ít nhất một giáo viên để cập nhật',
        color: 'yellow'
      });
      return;
    }
    
    await saveTeachersAttendance(teachersToUpdate);
  };
  
  // Shared function to save attendance for a list of teachers
  const saveTeachersAttendance = async (teachersToUpdate: any[]) => {
    setSavingAttendance(true);
    const results: { success: boolean; teacher: any; error?: any }[] = [];
    
    try {
      // Create update data for all teachers first
      const updateData = teachersToUpdate.map(teacher => {
        // Calculate attendance metrics
        const metrics = calculateAttendanceMetrics(teacher.id);
        
        // Calculate salary components
        const salary = calculateSalary(teacher, metrics);
        
        // Prepare update data
        return {
          teacherId: teacher.id,
          teacherName: teacher.name,
          updateData: {
            ...teacher,
            teaching_days: metrics.teachingDays,
            absence_days: metrics.absenceDays,
            extra_teaching_days: metrics.extraTeachingDays,
            received_salary: salary.receivedSalary,
            extra_salary: salary.extraSalary,
            total_salary: salary.totalSalary
          }
        };
      });
      
      // Create all API call promises but don't wait for them yet
      const updatePromises = updateData.map(async ({ teacherId, teacherName, updateData }) => {
        try {
          // Call API to update teacher
          const updatedTeacher = await teacherApi.updateTeacher(teacherId, updateData);
          
          // Return success result
          return { 
            success: true, 
            teacher: updatedTeacher 
          };
        } catch (error) {
          console.error(`Failed to update teacher ${teacherName}:`, error);
          
          // Return failure result but don't throw (to let other promises continue)
          return { 
            success: false, 
            teacher: { id: teacherId, name: teacherName },
            error 
          };
        }
      });
      
      // Execute all API calls concurrently
      results.push(...await Promise.all(updatePromises));
      
      // After all promises have settled, update Redux store for successful updates
      results.forEach(result => {
        if (result.success) {
          dispatch(updateTeacher(result.teacher));
        }
      });
      
      // Count successes and failures
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      // Show notification with results
      notifications.show({
        title: 'Cập nhật thành công',
        message: `Đã cập nhật ${successCount} giáo viên. ${errorCount > 0 ? `${errorCount} lỗi.` : ''}`,
        color: errorCount > 0 ? 'orange' : 'green'
      });
      
      // If any errors occurred, log them to console
      if (errorCount > 0) {
        console.error('Errors updating teachers:', results.filter(r => !r.success));
      }
    } catch (error) {
      console.error('Unexpected error saving attendance data:', error);
      notifications.show({
        title: 'Lỗi cập nhật',
        message: 'Đã xảy ra lỗi khi cập nhật dữ liệu chấm công.',
        color: 'red'
      });
    } finally {
      setSavingAttendance(false);
    }
  };
  
  // Cell border color based on theme
  const cellBorderColor = colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];
  
  return (
    <Container fluid>
      <LoadingOverlay 
        visible={savingAttendance} 
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

      {loading ? (
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
                      const status = attendanceData[teacher.id]?.[dateStr] || AttendanceStatus.NOT_SET;
                      const dayOfWeek = day.getDay(); // 0 = Sunday, 1-5 = Mon-Fri, 6 = Saturday
                      
                      // Highlight background for Saturdays and Sundays
                      const isSaturday = dayOfWeek === 6;
                      const isSunday = dayOfWeek === 0;
                      
                      // Different background colors for different days
                      let bgColor = undefined;
                      if (isSaturday) {
                        bgColor = colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[1];
                      } else if (isSunday) {
                        bgColor = colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[3];
                      }
                      
                      return (
                        <Table.Td 
                          key={dateStr} 
                          style={{ 
                            backgroundColor: status !== AttendanceStatus.NOT_SET 
                              ? statusColors[status] 
                              : bgColor,
                            cursor: dayOfWeek === 0 ? 'not-allowed' : 'pointer',
                            textAlign: 'center',
                            border: status === AttendanceStatus.NOT_SET ? `1px solid ${cellBorderColor}` : 'none',
                            height: '40px',
                            padding: '0',
                            opacity: dayOfWeek === 0 ? 0.6 : 1,
                            background: dayOfWeek === 0 ? 
                              `repeating-linear-gradient(
                                -45deg,
                                ${colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[3]},
                                ${colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[3]} 5px,
                                ${colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2]} 5px,
                                ${colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2]} 10px
                              )` : undefined
                          }}
                          onClick={() => dayOfWeek !== 0 && handleAttendanceChange(teacher.id, dateStr)}
                        >
                          <Flex align="center" justify="center" h="100%">
                            {statusIcons[status]}
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
                leftSection={<IconUserExclamation size={16} />}
                onClick={handleSaveSelectedAttendance}
                loading={savingAttendance}
                disabled={loading || selectedTeachersCount === 0}
                variant="light"
              >
                Lưu {selectedTeachersCount > 0 ? `${selectedTeachersCount} GV đã chọn` : 'GV đã chọn'}
              </Button>
              
              <Button 
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={handleSaveAttendance}
                loading={savingAttendance}
                disabled={loading}
                color="blue"
              >
                Lưu và Tính Lương Tất Cả
              </Button>
            </Flex>
          </Paper>
        </Paper>
      )}
    </Container>
  );
} 