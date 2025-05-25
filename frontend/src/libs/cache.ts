import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const cacheKeys = {
  teachers: {
    all: ['teachers'] as const,
    lists: () => [...cacheKeys.teachers.all, 'list'] as const,
    list: (filters: string) => [...cacheKeys.teachers.lists(), { filters }] as const,
    details: () => [...cacheKeys.teachers.all, 'detail'] as const,
    detail: (id: string) => [...cacheKeys.teachers.details(), id] as const,
  },
} as const; 