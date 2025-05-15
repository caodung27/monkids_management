'use client';

import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import { teacherApi } from '@/api/apiService';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/store/slices/uiSlice';
import { 
  setTeachers, 
  setSelectedTeacher, 
  setLoading, 
  setError,
  addTeacher,
  updateTeacher,
  deleteTeacher as deleteTeacherAction
} from '@/store/slices/teachersSlice';
import { Teacher } from '@/store/slices/teachersSlice';

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
  const dispatch = useDispatch();

  return useQuery({
    queryKey: teacherKeys.lists(),
    queryFn: async () => {
      dispatch(setLoading(true));
      try {
        const data = await teacherApi.getAllTeachers();
        dispatch(setTeachers(data));
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi khi tải danh sách giáo viên';
        dispatch(setError(errorMessage));
        dispatch(addNotification({
          title: 'Lỗi',
          message: 'Không thể tải danh sách giáo viên. Vui lòng thử lại sau.',
          type: 'error',
        }));
        throw new Error(errorMessage);
      }
    },
  });
};

/**
 * Hook to fetch a single teacher by ID
 */
export const useTeacher = (id: string) => {
  const dispatch = useDispatch();
  
  return useQuery({
    queryKey: teacherKeys.detail(id),
    queryFn: async () => {
      dispatch(setLoading(true));
      try {
        const data = await teacherApi.getTeacherById(id);
        dispatch(setSelectedTeacher(data));
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi khi tải thông tin giáo viên';
        dispatch(setError(errorMessage));
        dispatch(addNotification({
          title: 'Lỗi',
          message: 'Không thể tải thông tin giáo viên. Vui lòng thử lại sau.',
          type: 'error',
        }));
        throw new Error(errorMessage);
      }
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a new teacher
 */
export const useCreateTeacher = (queryClient: QueryClient) => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (formData: Teacher) => {
      return await teacherApi.createTeacher(formData);
    },
    onSuccess: (data) => {
      dispatch(addTeacher(data));
      dispatch(addNotification({
        title: 'Thành công',
        message: 'Giáo viên mới đã được thêm thành công!',
        type: 'success',
      }));
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi thêm giáo viên';
      dispatch(setError(errorMessage));
      dispatch(addNotification({
        title: 'Lỗi',
        message: 'Có lỗi xảy ra khi thêm giáo viên. Vui lòng thử lại.',
        type: 'error',
      }));
    },
  });
};

/**
 * Hook to update an existing teacher
 */
export const useUpdateTeacher = (queryClient: QueryClient) => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async ({ 
      id, 
      formData 
    }: { 
      id: string; 
      formData: Teacher 
    }) => {
      return await teacherApi.updateTeacher(id, formData);
    },
    onSuccess: (data) => {
      dispatch(updateTeacher(data));
      dispatch(addNotification({
        title: 'Thành công',
        message: 'Thông tin giáo viên đã được cập nhật thành công!',
        type: 'success',
      }));
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teacherKeys.details() });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi cập nhật giáo viên';
      dispatch(setError(errorMessage));
      dispatch(addNotification({
        title: 'Lỗi',
        message: 'Có lỗi khi lưu thông tin giáo viên. Vui lòng thử lại sau.',
        type: 'error',
      }));
    },
  });
};

/**
 * Hook to delete a teacher
 */
export const useDeleteTeacher = (queryClient: QueryClient) => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (teacherId: string) => teacherApi.deleteTeacher(teacherId),
    onSuccess: (_, teacherId) => {
      dispatch(deleteTeacherAction(teacherId));
      dispatch(addNotification({
        title: 'Thành công',
        message: 'Đã xóa giáo viên thành công!',
        type: 'success',
      }));
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi xóa giáo viên';
      dispatch(setError(errorMessage));
      dispatch(addNotification({
        title: 'Lỗi',
        message: 'Có lỗi khi xóa giáo viên. Vui lòng thử lại sau.',
        type: 'error',
      }));
    },
  });
}; 