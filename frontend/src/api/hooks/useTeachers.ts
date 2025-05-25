'use client';

import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import { teacherApi } from '@/api/apiService';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { Teacher } from '@/types';
import { createTeacherApiSchema, TeacherFormValues, teacherApiSchema } from '@/validations/teacherSchema';

// Query keys
export const teacherKeys = {
  all: ['teachers'] as const,
  lists: () => [...teacherKeys.all, 'list'] as const,
  list: (filters: string) => [...teacherKeys.lists(), { filters }] as const,
  details: () => [...teacherKeys.all, 'detail'] as const,
  detail: (id: string) => [...teacherKeys.details(), id] as const,
};

/**
 * Hook to fetch all teachers
 */
export const useTeachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTeachers = async (page: number, pageSize: number = itemsPerPage) => {
    setLoading(true);
    try {
      const response = await teacherApi.getAllTeachers(page, pageSize);
      
      if (response && response.data) {
        setTeachers(response.data);
        setTotalTeachers(response.totalElements);
        setCurrentPage(response.currentPage);
        setTotalPages(response.totalPages);
      } else {
        setTeachers([]);
        setTotalTeachers(0);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
      setTotalTeachers(0);
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể tải danh sách giáo viên. Vui lòng thử lại sau.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers(1, itemsPerPage);
  }, [itemsPerPage]);

  const handlePageChange = (page: number) => {
    fetchTeachers(page, itemsPerPage);
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
    teachers,
    loading,
    currentPage,
    totalTeachers,
    itemsPerPage,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    fetchTeachers
  };
};

/**
 * Hook to fetch a single teacher by ID
 */
export const useTeacher = (id: string) => {
  return useQuery({
    queryKey: teacherKeys.detail(id),
    queryFn: async () => {
      const data = await teacherApi.getTeacher(id);
      return data;
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a new teacher
 */
export const useCreateTeacher = (queryClient: QueryClient) => {
  return useMutation({
    mutationFn: async (formData: TeacherFormValues) => {
      const apiPayload = createTeacherApiSchema.parse(formData);
      return await teacherApi.createTeacher(apiPayload);
    },
    onSuccess: () => {
      notifications.show({
        title: 'Thành công',
        message: 'Giáo viên mới đã được thêm thành công!',
        color: 'green'
      });
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
    onError: (error) => {
      notifications.show({
        title: 'Lỗi',
        message: 'Có lỗi xảy ra khi thêm giáo viên. Vui lòng thử lại.',
        color: 'red'
      });
    },
  });
};

/**
 * Hook to update an existing teacher
 */
export const useUpdateTeacher = (queryClient: QueryClient) => {
  return useMutation({
    mutationFn: async ({
      id,
      formData
    }: {
      id: string;
      formData: TeacherFormValues
    }) => {
      const apiPayload = teacherApiSchema.parse(formData);
      return await teacherApi.updateTeacher(id, apiPayload);
    },
    onSuccess: () => {
      notifications.show({
        title: 'Thành công',
        message: 'Thông tin giáo viên đã được cập nhật thành công!',
        color: 'green'
      });
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teacherKeys.details() });
    },
    onError: (error) => {
      notifications.show({
        title: 'Lỗi',
        message: 'Có lỗi khi lưu thông tin giáo viên. Vui lòng thử lại sau.',
        color: 'red'
      });
    },
  });
};

/**
 * Hook to delete a teacher
 */
export const useDeleteTeacher = (queryClient: QueryClient) => {
  return useMutation({
    mutationFn: (teacherId: string) => teacherApi.deleteTeacher(teacherId),
    onSuccess: () => {
      notifications.show({
        title: 'Thành công',
        message: 'Đã xóa giáo viên thành công!',
        color: 'green'
      });
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
    onError: (error) => {
      notifications.show({
        title: 'Lỗi',
        message: 'Có lỗi khi xóa giáo viên. Vui lòng thử lại sau.',
        color: 'red'
      });
    },
  });
}; 