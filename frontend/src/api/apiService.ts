'use client';

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import { notifications } from '@mantine/notifications';
import { ProfileData } from '@/types';

// Use environment variables with fallback to default URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = TokenService.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token
        const response = await authApi.refreshToken(refreshToken);
        const { access_token } = response;

        // Update the token
        TokenService.setAccessToken(access_token);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        TokenService.clearTokens();
        window.location.replace('/login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
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
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { access_token, user } = response.data;
    TokenService.setAccessToken(access_token);
    return { access_token, user };
  },

  logout: async () => {
    try {
      const refreshToken = TokenService.getRefreshToken();
      // Call logout API with refresh token
      await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      // Clear tokens after successful API call
      TokenService.clearTokens();
      // Force redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, still clear tokens and redirect
      TokenService.clearTokens();
      window.location.href = '/login';
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
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  updatePassword: async (oldPassword: string, newPassword: string) => {
    const response = await apiClient.patch('/auth/update-password', {
      oldPassword,
      newPassword
    });
    return response.data;
  },

  googleLogin: async () => {
    window.location.href = `${API_URL}/auth/google`;
  },

  googleCallback: async (code: string) => {
    const response = await apiClient.get(`/auth/google/callback?code=${code}`);
    const { access_token, user } = response.data;
    TokenService.setAccessToken(access_token);
    return { access_token, user };
  },

  getUserPermissions: async () => {
    try {
      const response = await apiClient.get('/auth/permissions/');
      return response.data;
    } catch (error) {
      console.error('getUserPermissions: Error', error);
      throw error;
    }
  },

  introspectToken: async () => {
    try {
      const response = await apiClient.post('/auth/token/introspect');
      return response.data;
    } catch (error) {
      console.error('introspectToken: Error', error);
      return { active: false, error };
    }
  },

  verifyToken: async () => {
    try {
      const response = await apiClient.post('/auth/token/verify');
      return response.data;
    } catch (error) {
      console.error('verifyToken: Error', error);
      return { valid: false, error };
    }
  },

  refreshToken: async (refreshToken: string) => {
    try {
      const response = await apiClient.post('/auth/token/refresh', { refresh_token: refreshToken });
      const { access_token, user } = response.data;
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
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('getCurrentUser: Error:', error);
      return null;
    }
  },
  updateUser: async (id: string, formData: ProfileData) => {
    const response = await apiClient.patch(`/users/${id}`, formData);
    return response.data;
  }
};

// Teacher API
export const teacherApi = {
  createTeacher: async (teacherData: any) => {
    const response = await apiClient.post('/teachers/', teacherData);
    return response.data;
  },
  getTeachers: async () => {
    const response = await apiClient.get('/teachers/');
    return response.data;
  },
  getAllTeachers: async (page: number, pageSize: number) => {
    try {
      const response = await apiClient.get(`/teachers?page=${page}&limit=${pageSize}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
  getTeacher: async (id: string) => {
    const response = await apiClient.get(`/teachers/${id}/`);
    return response.data;
  },
  updateTeacher: async (id: string, teacherData: any) => {
    const response = await apiClient.patch(`/teachers/${id}/`, teacherData);
    return response.data;
  },
  deleteTeacher: async (id: string) => {
    const response = await apiClient.delete(`/teachers/${id}/`);
    return response.data;
  },
  bulkDeleteTeachers: async (ids: string[]) => {
    const response = await apiClient.post('/teachers/bulk-delete/', { ids });
    return response.data;
  }
};

// Student API
export const studentApi = {
  getAllStudents: async (page: number, pageSize: number) => {
    try {
      const response = await apiClient.get(`/students?page=${page}&limit=${pageSize}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  getStudent: async (id: string) => {
    try {
      const response = await apiClient.get(`/students/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  createStudent: async (formData: any) => {
    try {
      const response = await apiClient.post('/students', formData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  updateStudent: async (id: string, formData: any) => {
    try {
      const response = await apiClient.patch(`/students/${id}`, formData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  deleteStudent: async (id: string) => {
    try {
      const response = await apiClient.delete(`/students/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  bulkDeleteStudents: async (ids: string[]) => {
    try {
      const response = await apiClient.post('/students/bulk-delete', { ids });
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
      
      const response = await apiClient.get(`/stats/total?${params.toString()}`);
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
    const response = await apiClient.get(`${API_URL}/attendance/${teacherId}/${year}/${month}`);
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
    const response = await apiClient.post(`${API_URL}/attendance`, {
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
      const response = await apiClient.post('/export/bulk', { type, ids });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
}; 