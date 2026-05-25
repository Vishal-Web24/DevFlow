import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Notification } from '../../types';

interface NotificationState { items: Notification[]; unreadCount: number; loading: boolean; }
const initialState: NotificationState = { items: [], unreadCount: 0, loading: false };

export const fetchNotifications = createAsyncThunk('notifications/fetch', async () => {
  const { data } = await api.get('/notifications');
  return data as Notification[];
});
export const fetchUnreadCount = createAsyncThunk('notifications/unreadCount', async () => {
  const { data } = await api.get('/notifications/unread-count');
  return data.count as number;
});
export const markAllRead = createAsyncThunk('notifications/markAllRead', async () => {
  await api.put('/notifications/mark-all-read');
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
    markRead: (state, action: PayloadAction<string>) => {
      const n = state.items.find(n => n.id === action.payload);
      if (n && !n.read) { n.read = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload;
        state.unreadCount = action.payload.filter(n => !n.read).length;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => { state.unreadCount = action.payload; })
      .addCase(markAllRead.fulfilled, (state) => {
        state.items.forEach(n => { n.read = true; });
        state.unreadCount = 0;
      });
  },
});

export const { addNotification, markRead } = notificationSlice.actions;
export default notificationSlice.reducer;
