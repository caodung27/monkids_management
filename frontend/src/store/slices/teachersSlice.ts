'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Teacher {
  id: string;
  name: string;
  role: string;
  phone: string;
  base_salary: string | number;
  teaching_days: string | number;
  absence_days: string | number;
  received_salary: string | number;
  extra_teaching_days: string | number;
  extra_salary: string | number;
  insurance_support: string | number;
  responsibility_support: string | number;
  breakfast_support: string | number;
  skill_sessions: string | number;
  skill_salary: string | number;
  english_sessions: string | number;
  english_salary: string | number;
  new_students_list: string | number;
  paid_amount: string | number;
  total_salary: string | number;
  note?: string;
  [key: string]: any;
}

interface TeachersState {
  teachers: Teacher[];
  selectedTeacher: Teacher | null;
  loading: boolean;
  error: string | null;
}

const initialState: TeachersState = {
  teachers: [],
  selectedTeacher: null,
  loading: false,
  error: null,
};

export const teachersSlice = createSlice({
  name: 'teachers',
  initialState,
  reducers: {
    setTeachers: (state, action: PayloadAction<Teacher[]>) => {
      state.teachers = action.payload;
      state.loading = false;
      state.error = null;
    },
    setSelectedTeacher: (state, action: PayloadAction<Teacher>) => {
      state.selectedTeacher = action.payload;
      state.loading = false;
      state.error = null;
    },
    addTeacher: (state, action: PayloadAction<Teacher>) => {
      state.teachers.push(action.payload);
    },
    updateTeacher: (state, action: PayloadAction<Teacher>) => {
      const index = state.teachers.findIndex(
        (teacher) => teacher.id === action.payload.id
      );
      if (index !== -1) {
        state.teachers[index] = action.payload;
      }
      if (state.selectedTeacher?.id === action.payload.id) {
        state.selectedTeacher = action.payload;
      }
    },
    deleteTeacher: (state, action: PayloadAction<string>) => {
      state.teachers = state.teachers.filter(
        (teacher) => teacher.id !== action.payload
      );
      if (state.selectedTeacher?.id === action.payload) {
        state.selectedTeacher = null;
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
  setTeachers,
  setSelectedTeacher,
  addTeacher,
  updateTeacher,
  deleteTeacher,
  setLoading,
  setError,
  clearError,
} = teachersSlice.actions;

export default teachersSlice.reducer; 