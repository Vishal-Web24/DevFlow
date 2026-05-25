import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Project } from '../../types';

interface ProjectState {
  items: Project[];
  current: Project | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectState = { items: [], current: null, loading: false, error: null };

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/projects');
    return data as Project[];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch projects');
  }
});

export const fetchProject = createAsyncThunk('projects/fetchOne', async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/projects/${id}`);
    return data as Project;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch project');
  }
});

export const createProject = createAsyncThunk('projects/create', async (payload: { name: string; description?: string; color?: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/projects', payload);
    return data as Project;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to create project');
  }
});

export const updateProject = createAsyncThunk('projects/update', async ({ id, ...payload }: Partial<Project> & { id: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/projects/${id}`, payload);
    return data as Project;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to update project');
  }
});

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrent: (state, action: PayloadAction<Project | null>) => { state.current = action.payload; },
    updateCurrentProject: (state, action: PayloadAction<Partial<Project>>) => {
      if (state.current) state.current = { ...state.current, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchProjects.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(fetchProject.pending, (state) => { state.loading = true; })
      .addCase(fetchProject.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchProject.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(createProject.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(updateProject.fulfilled, (state, action) => {
        const idx = state.items.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.current?.id === action.payload.id) state.current = action.payload;
      });
  },
});

export const { setCurrent, updateCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;
