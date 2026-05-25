import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  darkMode: boolean;
  sidebarOpen: boolean;
  createTaskModal: boolean;
  createProjectModal: boolean;
  taskDetailId: string | null;
}

const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
const savedDark = localStorage.getItem('darkMode');

const initialState: UIState = {
  darkMode: savedDark !== null ? savedDark === 'true' : prefersDark,
  sidebarOpen: true,
  createTaskModal: false,
  createProjectModal: false,
  taskDetailId: null,
};

// Apply dark mode to document immediately
if (initialState.darkMode) document.documentElement.classList.add('dark');

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', String(state.darkMode));
      if (state.darkMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
      localStorage.setItem('darkMode', String(action.payload));
      if (action.payload) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    },
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setCreateTaskModal: (state, action: PayloadAction<boolean>) => { state.createTaskModal = action.payload; },
    setCreateProjectModal: (state, action: PayloadAction<boolean>) => { state.createProjectModal = action.payload; },
    setTaskDetailId: (state, action: PayloadAction<string | null>) => { state.taskDetailId = action.payload; },
  },
});

export const { toggleDarkMode, setDarkMode, toggleSidebar, setCreateTaskModal, setCreateProjectModal, setTaskDetailId } = uiSlice.actions;
export default uiSlice.reducer;
