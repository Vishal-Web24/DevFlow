import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { User } from '../../types';
import { connectSocket, disconnectSocket } from '../../socket/socket';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = { user: null, loading: false, error: null, initialized: false };

export const login = createAsyncThunk('auth/login', async (credentials: { email: string; password: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    connectSocket(data.accessToken);
    return data.user as User;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async (payload: { name: string; email: string; password: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    connectSocket(data.accessToken);
    return data.user as User;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Registration failed');
  }
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data as User;
  } catch {
    return rejectWithValue('Not authenticated');
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  try { await api.post('/auth/logout', { refreshToken }); } catch {}
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  disconnectSocket();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => { state.user = action.payload; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending = (state: AuthState) => { state.loading = true; state.error = null; };
    const rejected = (state: AuthState, action: any) => { state.loading = false; state.error = action.payload as string; };

    builder
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; state.initialized = true; })
      .addCase(login.rejected, rejected)

      .addCase(register.pending, pending)
      .addCase(register.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; state.initialized = true; })
      .addCase(register.rejected, rejected)

      .addCase(fetchMe.pending, (state) => { state.loading = true; })
      .addCase(fetchMe.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; state.initialized = true; })
      .addCase(fetchMe.rejected, (state) => { state.loading = false; state.initialized = true; })

      .addCase(logout.fulfilled, (state) => { state.user = null; state.initialized = true; });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
