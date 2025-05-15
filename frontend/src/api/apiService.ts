import axios from 'axios';

// Use environment variables with fallback to default URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Log API URL to help with debugging
console.log('API URL:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Student API
export const studentApi = {
  getAllStudents: async () => {
    const response = await apiClient.get('/students/');
    return response.data;
  },
  getStudentById: async (id: string) => {
    const response = await apiClient.get(`/students/${id}/`);
    return response.data;
  },
  createStudent: async (data: any) => {
    const response = await apiClient.post('/students/', data);
    return response.data;
  },
  updateStudent: async (id: string, data: any) => {
    const response = await apiClient.put(`/students/${id}/`, data);
    return response.data;
  },
  deleteStudent: async (id: string) => {
    const response = await apiClient.delete(`/students/${id}/`);
    return response.data;
  },
};

// Teacher API
export const teacherApi = {
  getAllTeachers: async () => {
    const response = await apiClient.get('/teachers/');
    return response.data;
  },
  getTeacherById: async (id: string) => {
    const response = await apiClient.get(`/teachers/${id}/`);
    return response.data;
  },
  createTeacher: async (data: any) => {
    const response = await apiClient.post('/teachers/', data);
    return response.data;
  },
  updateTeacher: async (id: string, data: any) => {
    const response = await apiClient.put(`/teachers/${id}/`, data);
    return response.data;
  },
  deleteTeacher: async (id: string) => {
    const response = await apiClient.delete(`/teachers/${id}/`);
    return response.data;
  },
}; 