'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Student {
  id: string;
  name: string;
  sequential_number: string;
  date_of_birth: string;
  gender: string;
  class_name: string;
  parent_name: string;
  parent_phone: string;
  address: string;
  discount_percentage: number;
  paid_amount: string;
  is_active: boolean;
  note: string;
  [key: string]: any;
}

interface StudentsState {
  students: Student[];
  selectedStudent: Student | null;
  loading: boolean;
  error: string | null;
}

const initialState: StudentsState = {
  students: [],
  selectedStudent: null,
  loading: false,
  error: null,
};

/**
 * Redux slice for managing students data
 */
export const studentsSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    setStudents: (state, action: PayloadAction<Student[]>) => {
      state.students = action.payload;
      state.loading = false;
      state.error = null;
    },
    setSelectedStudent: (state, action: PayloadAction<Student>) => {
      state.selectedStudent = action.payload;
      state.loading = false;
      state.error = null;
    },
    addStudent: (state, action: PayloadAction<Student>) => {
      state.students.push(action.payload);
    },
    updateStudent: (state, action: PayloadAction<Student>) => {
      const index = state.students.findIndex(
        (student) => student.sequential_number === action.payload.sequential_number
      );
      if (index !== -1) {
        state.students[index] = action.payload;
      }
      if (state.selectedStudent?.sequential_number === action.payload.sequential_number) {
        state.selectedStudent = action.payload;
      }
    },
    deleteStudent: (state, action: PayloadAction<string>) => {
      state.students = state.students.filter(
        (student) => student.sequential_number !== action.payload
      );
      if (state.selectedStudent?.sequential_number === action.payload) {
        state.selectedStudent = null;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setStudents,
  setSelectedStudent,
  addStudent,
  updateStudent,
  deleteStudent,
  setLoading,
  setError,
  clearError,
} = studentsSlice.actions;

export default studentsSlice.reducer; 