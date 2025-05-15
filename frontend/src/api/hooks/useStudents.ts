'use client';

import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import { studentApi } from '@/api/apiService';
import { useDispatch } from 'react-redux';
import { 
  setStudents, 
  setSelectedStudent, 
  setLoading, 
  setError,
  addStudent,
  updateStudent,
  deleteStudent
} from '@/store/slices/studentsSlice';
import { StudentFormValues, StudentApiPayload } from '@/validations/studentSchema';
import { addNotification } from '@/store/slices/uiSlice';

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
  const dispatch = useDispatch();

  return useQuery({
    queryKey: studentKeys.lists(),
    queryFn: async () => {
      dispatch(setLoading(true));
      try {
        const data = await studentApi.getAllStudents();
        dispatch(setStudents(data));
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi khi tải danh sách học sinh';
        dispatch(setError(errorMessage));
        throw error;
      }
    },
  });
};

/**
 * Hook to fetch a single student by ID
 */
export const useStudent = (id: string) => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: async () => {
      dispatch(setLoading(true));
      try {
        const data = await studentApi.getStudentById(id);
        dispatch(setSelectedStudent(data));
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi khi tải thông tin học sinh';
        dispatch(setError(errorMessage));
        throw error;
      }
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a new student
 */
export const useCreateStudent = (queryClient: QueryClient) => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (formData: StudentFormValues) => {
      const apiPayload = formData as unknown as StudentApiPayload;
      return await studentApi.createStudent(apiPayload);
    },
    onSuccess: (data) => {
      dispatch(addStudent(data));
      dispatch(addNotification({
        title: 'Thành công',
        message: 'Học sinh mới đã được thêm thành công!',
        type: 'success',
      }));
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi thêm học sinh';
      dispatch(setError(errorMessage));
      dispatch(addNotification({
        title: 'Lỗi',
        message: 'Có lỗi xảy ra khi thêm học sinh. Vui lòng thử lại.',
        type: 'error',
      }));
    },
  });
};

/**
 * Hook to update an existing student
 */
export const useUpdateStudent = (queryClient: QueryClient) => {
  const dispatch = useDispatch();

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
    onSuccess: (data) => {
      dispatch(updateStudent(data));
      dispatch(addNotification({
        title: 'Thành công',
        message: 'Thông tin học sinh đã được cập nhật thành công!',
        type: 'success',
      }));
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.details() });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi cập nhật học sinh';
      dispatch(setError(errorMessage));
      dispatch(addNotification({
        title: 'Lỗi',
        message: 'Có lỗi khi lưu thông tin học sinh. Vui lòng thử lại sau.',
        type: 'error',
      }));
    },
  });
};

/**
 * Hook to delete a student
 */
export const useDeleteStudent = (queryClient: QueryClient) => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (sequentialNumber: string) => studentApi.deleteStudent(sequentialNumber),
    onSuccess: (_, sequentialNumber) => {
      dispatch(deleteStudent(sequentialNumber));
      dispatch(addNotification({
        title: 'Thành công',
        message: 'Đã xóa học sinh thành công!',
        type: 'success',
      }));
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi xóa học sinh';
      dispatch(setError(errorMessage));
      dispatch(addNotification({
        title: 'Lỗi',
        message: 'Có lỗi khi xóa học sinh. Vui lòng thử lại sau.',
        type: 'error',
      }));
    },
  });
}; 