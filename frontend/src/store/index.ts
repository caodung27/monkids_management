import { configureStore } from '@reduxjs/toolkit';
import studentsReducer from './slices/studentsSlice';
import uiReducer from './slices/uiSlice';

/**
 * Configure Redux store with all slices
 */
export const store = configureStore({
  reducer: {
    students: studentsReducer,
    ui: uiReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 