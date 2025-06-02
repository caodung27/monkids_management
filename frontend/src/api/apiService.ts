'use client';

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import { notifications } from '@mantine/notifications';
import { ProfileData } from '@/types';
import { QueryClient } from '@tanstack/react-query';

// Token service for managing JWT tokens
export const TokenService = {
  getAccessToken: () => {
    return localStorage.getItem('access_token');
  },
  setAccessToken: (token: string) => {
    localStorage.setItem('access_token', token);
  },
  getRefreshToken: () => {
    return localStorage.getItem('refresh_token');
  },
  setRefreshToken: (token: string) => {
    localStorage.setItem('refresh_token', token);
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
  checkTokensExist: () => {
    return !!(localStorage.getItem('access_token') || localStorage.getItem('refresh_token'));
  },
  hasAnyToken: () => {
    return !!(localStorage.getItem('access_token') || localStorage.getItem('refresh_token'));
  },
  forceAuthSuccess: () => {
    localStorage.setItem('auth_successful', 'true');
    sessionStorage.setItem('auth_successful', 'true');
  }
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.monkids.site';
const FRONTEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://www.monkids.site' 
  : 'http://localhost:3000';

// Create axios instance with default config
export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': FRONTEND_URL,
    'X-Origin': FRONTEND_URL,
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Add request interceptor for error handling
axiosInstance.interceptors.request.use(
  (config) => {
    // Add authorization header if token exists
    const token = TokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ensure Origin headers are set
    config.headers.Origin = FRONTEND_URL;
    config.headers['X-Origin'] = FRONTEND_URL;
    
    // Add Referer header
    if (typeof window !== 'undefined') {
      config.headers.Referer = window.location.href;
      // Also set Origin from window.location if available
      config.headers.Origin = window.location.origin;
      config.headers['X-Origin'] = window.location.origin;
    }
    
    // Log headers for debugging
    console.debug('Request headers:', config.headers);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response headers for debugging
    console.debug('Response headers:', response.headers);
    return response;
  },
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      return Promise.reject({
        message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại sau.',
        originalError: error
      });
    }
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/login';
      return Promise.reject(error);
    }

    return Promise.reject(error?.response?.data || error);
  }
);

// Error handler
export const handleApiError = (error: any, showNotification = true) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const response = axiosError.response;

    if (showNotification) {
      if (response?.status === 401) {
        notifications.show({
          title: 'Lỗi xác thực',
          message: 'Vui lòng đăng nhập lại',
          color: 'red',
        });
      } else if (response?.data && typeof response.data === 'object' && 'detail' in response.data) {
        notifications.show({
          title: 'Lỗi',
          message: (response.data as { detail: string }).detail,
          color: 'red',
        });
      } else {
        notifications.show({
          title: 'Lỗi',
          message: 'Đã xảy ra lỗi không mong muốn',
          color: 'red',
        });
      }
    }
  } else {
    if (showNotification) {
      notifications.show({
        title: 'Lỗi',
        message: 'Đã xảy ra lỗi không mong muốn',
        color: 'red',
      });
    }
  }
  throw error;
};

// Add this before the authApi export
export const checkTokenAndRefreshIfNeeded = async (): Promise<boolean> => {
  try {
    const refreshToken = TokenService.getRefreshToken();
    if (!refreshToken) return false;

    const response = await authApi.refreshToken(refreshToken);
    return !!response.access_token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

// Authentication API
export const authApi = {
  getCurrentUser: async () => {
    try {
      const response = await axiosInstance.get('/auth/profile');
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  login: async (credentials: { email: string; password: string }) => {
    try {
      console.log('Sending login request to:', `${API_URL}/auth/login`);
      const response = await axiosInstance.post('/auth/login', credentials);
      console.log('Login response:', response);
      
      if (response.data.access_token) {
        TokenService.setAccessToken(response.data.access_token);
      }
      if (response.data.refresh_token) {
        TokenService.setRefreshToken(response.data.refresh_token);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login error details:', {
        error,
        response: error.response,
        request: error.request,
        config: error.config
      });
      throw error?.response?.data || error;
    }
  },

  logout: async () => {
    try {
      const response = await axiosInstance.post('/auth/logout');
      TokenService.clearTokens();
      return response.data;
    } catch (error) {
      TokenService.clearTokens(); // Clear tokens even if API call fails
      handleApiError(error);
      throw error;
    }
  },

  register: async (userData: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    address?: string;
    role?: string;
    account_type?: string;
  }) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  updatePassword: async (oldPassword: string, newPassword: string) => {
    const response = await axiosInstance.patch('/auth/update-password', {
      oldPassword,
      newPassword
    });
    return response.data;
  },

  googleLogin: async () => {
    // window.location.href = `${process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI}`;
    // only for development
    window.location.href = '/auth/google/callback';
  },

  googleCallback: async (code: string) => {
    const response = await axiosInstance.get(`/auth/google/callback?code=${code}`);
    const { access_token, user } = response.data;
    TokenService.setAccessToken(access_token);
    return { access_token, user };
  },

  getUserPermissions: async () => {
    try {
      const response = await axiosInstance.get('/auth/permissions/');
      return response.data;
    } catch (error) {
      console.error('getUserPermissions: Error', error);
      throw error;
    }
  },

  introspectToken: async () => {
    try {
      const response = await axiosInstance.post('/auth/token/introspect');
      return response.data;
    } catch (error) {
      console.error('introspectToken: Error', error);
      return { active: false, error };
    }
  },

  verifyToken: async () => {
    try {
      const response = await axiosInstance.post('/auth/token/verify');
      return response.data;
    } catch (error) {
      console.error('verifyToken: Error', error);
      return { valid: false, error };
    }
  },

  refreshToken: async (refreshToken: string) => {
    try {
      const response = await axiosInstance.post('/auth/token/refresh', { refresh_token: refreshToken });
      const { access_token, user } = response.data;
      
      if (!access_token) {
        throw new Error('Invalid refresh token response');
      }
      
      TokenService.setAccessToken(access_token);
      return { access_token, user };
    } catch (error) {
      console.error('refreshToken: Error', error);
      throw error;
    }
  }
};

// Profile API
export const profileApi = {
  getAllUsers: async () => {
   try {
    const response = await axiosInstance.get('/users');
    return response.data;
   } catch (error) {
    handleApiError(error);
    throw error;
   }
  },
  updateUser: async (id: string, formData: Partial<ProfileData>) => {
    const response = await axiosInstance.patch(`/users/${id}`, formData);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await axiosInstance.delete(`/users/${id}`);
    return response.data;
  },
};

// Teacher API
export const teacherApi = {
  createTeacher: async (teacherData: any) => {
    const response = await axiosInstance.post('/teachers/', teacherData);
    return response.data;
  },
  getTeachers: async () => {
    const response = await axiosInstance.get('/teachers/');
    return response.data;
  },
  getAllTeachers: async (page: number, pageSize: number) => {
    try {
      const response = await axiosInstance.get(`/teachers?page=${page}&limit=${pageSize}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
  getTeacher: async (id: string) => {
    const response = await axiosInstance.get(`/teachers/${id}/`);
    return response.data;
  },
  updateTeacher: async (id: string, teacherData: any) => {
    const response = await axiosInstance.patch(`/teachers/${id}/`, teacherData);
    return response.data;
  },
  deleteTeacher: async (id: string) => {
    const response = await axiosInstance.delete(`/teachers/${id}/`);
    return response.data;
  },
  bulkDeleteTeachers: async (ids: string[]) => {
    const response = await axiosInstance.post('/teachers/bulk-delete/', { ids });
    return response.data;
  }
};

// Student API
export const studentApi = {
  getAllStudents: async (page: number, pageSize: number) => {
    try {
      const response = await axiosInstance.get(`/students?page=${page}&limit=${pageSize}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  getStudent: async (id: string) => {
    try {
      const response = await axiosInstance.get(`/students/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  createStudent: async (formData: any) => {
    try {
      const response = await axiosInstance.post('/students', formData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  updateStudent: async (id: string, formData: any) => {
    try {
      const response = await axiosInstance.patch(`/students/${id}`, formData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  deleteStudent: async (id: string) => {
    try {
      const response = await axiosInstance.delete(`/students/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  bulkDeleteStudents: async (ids: string[]) => {
    try {
      const response = await axiosInstance.post('/students/bulk-delete', { ids });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};

export const statsApi = {
  getMonthlyStats: async (year?: number, month?: number) => {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (month) params.append('month', month.toString());
      
      const response = await axiosInstance.get(`/stats/total?${params.toString()}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
};

// Attendance API
export const attendanceApi = {
  getTeacherAttendance: async (teacherId: string, year: number, month: number) => {
    const response = await axiosInstance.get(`/attendance/${teacherId}/${year}/${month}`);
    return response.data;
  },

  createOrUpdateTeacherAttendance: async ({
    teacherId,
    year,
    month,
    full_days,
    half_days,
    absent_days,
    extra_days,
  }: {
    teacherId: string;
    year: number;
    month: number;
    full_days?: number[];
    half_days?: number[];
    absent_days?: number[];
    extra_days?: number[];
  }) => {
    const response = await axiosInstance.post('/attendance', {
      teacherId,
      year,
      month,
      full_days,
      half_days,
      absent_days,
      extra_days,
    });
    return response.data;
  },

  // Add other API calls related to attendance here
};

// Export API
export const exportApi = {
  bulkExport: async (type: 'student' | 'teacher', ids: string[]) => {
    try {
      const response = await axiosInstance.post('/export/bulk', { type, ids }, {
        responseType: 'blob',
        timeout: 30000, // Increase timeout to 30 seconds for large files
      });

      // Verify that we received a zip file
      if (response.headers['content-type'] !== 'application/zip') {
        throw new Error('Invalid response format');
      }

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: 'application/zip' });

      // Get current month and year for filename
      const currentDate = new Date();
      const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const currentYear = currentDate.getFullYear();
      const fileName = `MONKIDS_T${currentMonth}_${currentYear}.zip`;

      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      return { success: true, message: 'Export completed successfully' };
    } catch (error) {
      // If the error response is a blob, we need to read it
      if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Export failed');
        } catch (e) {
          throw new Error('Failed to process export response');
        }
      }
      handleApiError(error);
      throw error;
    }
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
