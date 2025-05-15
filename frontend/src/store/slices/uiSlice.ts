'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: NotificationType;
  timeout?: number;
}

interface UiState {
  notifications: Notification[];
  isDrawerOpen: boolean;
}

const initialState: UiState = {
  notifications: [],
  isDrawerOpen: false,
};

/**
 * Redux slice for managing UI state
 */
export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    toggleDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
    setDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.isDrawerOpen = action.payload;
    },
  },
});

export const { addNotification, removeNotification, toggleDrawer, setDrawerOpen } = uiSlice.actions;

export default uiSlice.reducer; 