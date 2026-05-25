import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Task, TaskStatus } from '../../types';

interface TaskState {
  items: Task[];
  loading: boolean;
  error: string | null;
  selectedTask: Task | null;
}

const initialState: TaskState = { items: [], loading: false, error: null, selectedTask: null };

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (projectId: string, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/projects/${projectId}/tasks`);
    return data as Task[];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch tasks');
  }
});

export const createTask = createAsyncThunk('tasks/create', async ({ projectId, ...payload }: Partial<Task> & { projectId: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projects/${projectId}/tasks`, payload);
    return data as Task;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to create task');
  }
});

export const updateTask = createAsyncThunk('tasks/update', async ({ taskId, projectId, ...payload }: Partial<Task> & { taskId: string; projectId: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/projects/${projectId}/tasks/${taskId}`, payload);
    return data as Task;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to update task');
  }
});

export const deleteTask = createAsyncThunk('tasks/delete', async ({ taskId, projectId }: { taskId: string; projectId: string }, { rejectWithValue }) => {
  try {
    await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    return taskId;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to delete task');
  }
});

export const addComment = createAsyncThunk('tasks/addComment', async ({ taskId, projectId, content }: { taskId: string; projectId: string; content: string }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projects/${projectId}/tasks/${taskId}/comments`, { content });
    return { taskId, comment: data };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to add comment');
  }
});

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setSelectedTask: (state, action: PayloadAction<Task | null>) => { state.selectedTask = action.payload; },
    // Real-time updates from Socket.io
    socketTaskUpdate: (state, action: PayloadAction<{ type: string; task?: Task; taskId?: string; comment?: any }>) => {
      const { type, task, taskId, comment } = action.payload;
      if (type === 'TASK_CREATED' && task) {
        if (!state.items.find(t => t.id === task.id)) state.items.push(task);
      } else if (type === 'TASK_UPDATED' && task) {
        const idx = state.items.findIndex(t => t.id === task.id);
        if (idx !== -1) state.items[idx] = task;
        if (state.selectedTask?.id === task.id) state.selectedTask = task;
      } else if (type === 'TASK_DELETED' && taskId) {
        state.items = state.items.filter(t => t.id !== taskId);
        if (state.selectedTask?.id === taskId) state.selectedTask = null;
      } else if (type === 'COMMENT_ADDED' && taskId && comment) {
        const task = state.items.find(t => t.id === taskId);
        if (task) task.comments = [...(task.comments || []), comment];
      }
    },
    // Optimistic drag-and-drop update
    moveTaskOptimistic: (state, action: PayloadAction<{ taskId: string; status: TaskStatus; position: number }>) => {
      const task = state.items.find(t => t.id === action.payload.taskId);
      if (task) { task.status = action.payload.status; task.position = action.payload.position; }
    },
    clearTasks: (state) => { state.items = []; state.selectedTask = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTasks.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchTasks.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createTask.fulfilled, (state, action) => { state.items.push(action.payload); })
      .addCase(updateTask.fulfilled, (state, action) => {
        const idx = state.items.findIndex(t => t.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.selectedTask?.id === action.payload.id) state.selectedTask = action.payload;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter(t => t.id !== action.payload);
      })
      .addCase(addComment.fulfilled, (state, action) => {
        const task = state.items.find(t => t.id === action.payload.taskId);
        if (task) task.comments = [...(task.comments || []), action.payload.comment];
      });
  },
});

export const { setSelectedTask, socketTaskUpdate, moveTaskOptimistic, clearTasks } = taskSlice.actions;
export default taskSlice.reducer;
