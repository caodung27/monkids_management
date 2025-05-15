'use client';

import { configureStore } from '@reduxjs/toolkit';
import studentsReducer from './slices/studentsSlice';
import teachersReducer from './slices/teachersSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    students: studentsReducer,
    teachers: teachersReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 