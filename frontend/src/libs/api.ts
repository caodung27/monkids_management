import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const baseURL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await api.get<T>(endpoint);
    return response.data;
  },

  post: async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await api.post<T>(endpoint, data);
    return response.data;
  },

  patch: async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await api.patch<T>(endpoint, data);
    return response.data;
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await api.delete<T>(endpoint);
    return response.data;
  },
}; 