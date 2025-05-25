'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification, UiState, NotificationType } from '@/types';

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