'use client';

import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import { studentApi } from '@/api/apiService';
import { StudentFormValues, StudentApiPayload } from '@/validations/studentSchema';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { Student } from '@/types';

// Query keys
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters: string) => [...studentKeys.lists(), { filters }] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};

/**
 * Hook to fetch all students
 */
export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStudents = async (page: number, pageSize: number = itemsPerPage) => {
    setLoading(true);
    try {
      const response = await studentApi.getAllStudents(page, pageSize);
      
      if (response && response.data) {
        setStudents(response.data);
        setTotalStudents(response.totalElements || 0);
        setCurrentPage(response.currentPage || page);
        setTotalPages(response.totalPages || Math.ceil((response.totalElements || 0) / pageSize));
      } else {
        setStudents([]);
        setTotalStudents(0);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
      setTotalStudents(0);
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể tải danh sách học sinh. Vui lòng thử lại sau.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(1, itemsPerPage);
  }, [itemsPerPage]);

  const handlePageChange = (page: number) => {
    fetchStudents(page, itemsPerPage);
    window.scrollTo(0, 0);
  };

  const handlePageSizeChange = (value: string | null) => {
    if (value) {
      const newSize = parseInt(value);
      setItemsPerPage(newSize);
      setCurrentPage(1);
    }
  };

  return {
    students,
    loading,
    currentPage,
    totalStudents,
    itemsPerPage,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    fetchStudents
  };
};

/**
 * Hook to fetch a single student by ID
 */
export const useStudent = (id: string) => {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: async () => {
      const data = await studentApi.getStudent(id);
      return data;
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a new student
 */
export const useCreateStudent = (queryClient: QueryClient) => {
  return useMutation({
    mutationFn: async (formData: StudentFormValues) => {
      const apiPayload = formData as unknown as StudentApiPayload;
      return await studentApi.createStudent(apiPayload);
    },
    onSuccess: () => {
      notifications.show({
        title: 'Thành công',
        message: 'Học sinh mới đã được thêm thành công!',
        color: 'green'
      });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
    onError: (error) => {
      notifications.show({
        title: 'Lỗi',
        message: 'Có lỗi xảy ra khi thêm học sinh. Vui lòng thử lại.',
        color: 'red'
      });
    },
  });
};

/**
 * Hook to update an existing student
 */
export const useUpdateStudent = (queryClient: QueryClient) => {
  return useMutation({
    mutationFn: async ({ 
      sequentialNumber, 
      formData 
    }: { 
      sequentialNumber: string; 
      formData: StudentFormValues 
    }) => {
      const apiPayload = formData as unknown as StudentApiPayload;
      return await studentApi.updateStudent(sequentialNumber, apiPayload);
    },
    onSuccess: () => {
      notifications.show({
        title: 'Thành công',
        message: 'Thông tin học sinh đã được cập nhật thành công!',
        color: 'green'
      });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.details() });
    },
    onError: (error) => {
      notifications.show({
        title: 'Lỗi',
        message: 'Có lỗi khi lưu thông tin học sinh. Vui lòng thử lại sau.',
        color: 'red'
      });
    },
  });
};

/**
 * Hook to delete a student
 */
export const useDeleteStudent = (queryClient: QueryClient) => {
  return useMutation({
    mutationFn: (sequentialNumber: string) => studentApi.deleteStudent(sequentialNumber),
    onSuccess: () => {
      notifications.show({
        title: 'Thành công',
        message: 'Đã xóa học sinh thành công!',
        color: 'green'
      });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
    onError: (error) => {
      notifications.show({
        title: 'Lỗi',
        message: 'Có lỗi khi xóa học sinh. Vui lòng thử lại sau.',
        color: 'red'
      });
    },
  });
}; 