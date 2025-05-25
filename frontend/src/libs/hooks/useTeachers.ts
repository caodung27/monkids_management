import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';
import { Teacher, CreateTeacherDto, UpdateTeacherDto } from '../../models/teacher';
import { cacheKeys } from '@/libs/cache';
import { useLogger } from './useLogger';

const TEACHERS_QUERY_KEY = 'teachers';

async function fetchTeachers(): Promise<Teacher[]> {
  const response = await fetch('/api/teachers');
  if (!response.ok) {
    throw new Error('Failed to fetch teachers');
  }
  return response.json();
}

export function useTeachers() {
  const logger = useLogger('useTeachers');

  return useQuery({
    queryKey: cacheKeys.teachers.lists(),
    queryFn: async () => {
      logger.logDebug('Fetching teachers');
      const teachers = await fetchTeachers();
      logger.logInfo(`Fetched ${teachers.length} teachers`);
      return teachers;
    },
  });
}

export const useTeacher = (id: string) => {
  return useQuery<Teacher>({
    queryKey: [TEACHERS_QUERY_KEY, id],
    queryFn: () => apiClient.get<Teacher>(`/teachers/${id}`),
    enabled: !!id,
  });
};

export const useCreateTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation<Teacher, Error, CreateTeacherDto>({
    mutationFn: (data) => apiClient.post<Teacher>('/teachers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEACHERS_QUERY_KEY] });
    },
  });
};

export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation<Teacher, Error, { id: string; data: UpdateTeacherDto }>({
    mutationFn: ({ id, data }) => apiClient.patch<Teacher>(`/teachers/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [TEACHERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [TEACHERS_QUERY_KEY, id] });
    },
  });
};

export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete(`/teachers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEACHERS_QUERY_KEY] });
    },
  });
}; 