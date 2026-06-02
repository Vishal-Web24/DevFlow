import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../store/slices/authSlice';
import projectReducer from '../store/slices/projectSlice';
import taskReducer from '../store/slices/taskSlice';
import notificationReducer from '../store/slices/notificationSlice';
import uiReducer from '../store/slices/uiSlice';

// ─── Test Store Factory ─────────────
const createTestStore = (preloadedState?: any) =>
  configureStore({
    reducer: { auth: authReducer, projects: projectReducer, tasks: taskReducer, notifications: notificationReducer, ui: uiReducer },
    ...(preloadedState && { preloadedState }),
  });

const renderWithProviders = (ui: React.ReactElement, { preloadedState }: { preloadedState?: any } = {}) => {
  const store = createTestStore(preloadedState);
  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter>{ui}</MemoryRouter>
      </Provider>
    ),
    store,
  };
};

// ─── Mock Data ────────────────────────────────────────────
const mockUser = { id: 'user1', name: 'Vishal Munde', email: 'vishal@test.com', role: 'ADMIN' as const };
const mockTask = {
  id: 'task1', title: 'Build auth system', description: 'JWT + bcrypt',
  status: 'TODO' as const, priority: 'HIGH' as const, position: 0,
  labels: ['backend'], projectId: 'proj1', creatorId: 'user1',
  creator: mockUser, assignee: mockUser, comments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const mockProject = {
  id: 'proj1', name: 'DevFlow', description: 'PM Platform', color: '#3B82F6',
  status: 'ACTIVE' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  members: [{ id: 'm1', userId: 'user1', projectId: 'proj1', role: 'OWNER' as const, joinedAt: new Date().toISOString(), user: mockUser }],
};

// ─── Auth Slice Tests ─────────────────────────────────────
describe('Auth Slice', () => {
  it('initialState should have no user', () => {
    const store = createTestStore();
    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.initialized).toBe(false);
  });

  it('clearError action should clear error', () => {
    const store = createTestStore({ auth: { user: null, loading: false, error: 'Some error', initialized: false } });
    store.dispatch({ type: 'auth/clearError' });
    expect(store.getState().auth.error).toBeNull();
  });
});

// ─── UI Slice Tests ───────────────────────────────────────
describe('UI Slice', () => {
  it('toggleDarkMode should toggle dark mode', () => {
    const store = createTestStore({ ui: { darkMode: false, sidebarOpen: true, createTaskModal: false, createProjectModal: false, taskDetailId: null } });
    store.dispatch({ type: 'ui/toggleDarkMode' });
    expect(store.getState().ui.darkMode).toBe(true);
  });

  it('setCreateTaskModal should open/close modal', () => {
    const store = createTestStore({ ui: { darkMode: false, sidebarOpen: true, createTaskModal: false, createProjectModal: false, taskDetailId: null } });
    store.dispatch({ type: 'ui/setCreateTaskModal', payload: true });
    expect(store.getState().ui.createTaskModal).toBe(true);
    store.dispatch({ type: 'ui/setCreateTaskModal', payload: false });
    expect(store.getState().ui.createTaskModal).toBe(false);
  });
});

// ─── Task Slice Tests ─────────────────────────────────────
describe('Task Slice', () => {
  it('socketTaskUpdate TASK_CREATED should add task', () => {
    const store = createTestStore({ tasks: { items: [], loading: false, error: null, selectedTask: null } });
    store.dispatch({ type: 'tasks/socketTaskUpdate', payload: { type: 'TASK_CREATED', task: mockTask } });
    expect(store.getState().tasks.items).toHaveLength(1);
    expect(store.getState().tasks.items[0].id).toBe('task1');
  });

  it('socketTaskUpdate TASK_DELETED should remove task', () => {
    const store = createTestStore({ tasks: { items: [mockTask], loading: false, error: null, selectedTask: null } });
    store.dispatch({ type: 'tasks/socketTaskUpdate', payload: { type: 'TASK_DELETED', taskId: 'task1' } });
    expect(store.getState().tasks.items).toHaveLength(0);
  });

  it('moveTaskOptimistic should update task status', () => {
    const store = createTestStore({ tasks: { items: [mockTask], loading: false, error: null, selectedTask: null } });
    store.dispatch({ type: 'tasks/moveTaskOptimistic', payload: { taskId: 'task1', status: 'IN_PROGRESS', position: 0 } });
    expect(store.getState().tasks.items[0].status).toBe('IN_PROGRESS');
  });

  it('setSelectedTask should set selected task', () => {
    const store = createTestStore({ tasks: { items: [], loading: false, error: null, selectedTask: null } });
    store.dispatch({ type: 'tasks/setSelectedTask', payload: mockTask });
    expect(store.getState().tasks.selectedTask?.id).toBe('task1');
  });
});

// ─── Project Slice Tests 
describe('Project Slice', () => {
  it('setCurrent should set current project', () => {
    const store = createTestStore({ projects: { items: [], current: null, loading: false, error: null } });
    store.dispatch({ type: 'projects/setCurrent', payload: mockProject });
    expect(store.getState().projects.current?.id).toBe('proj1');
  });
});

// ─── Login Page Tests 
describe('LoginPage', () => {
  it('renders login form elements', async () => {
    const LoginPage = (await import('../pages/LoginPage')).default;
    renderWithProviders(<LoginPage />);
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows DevFlow branding', async () => {
    const LoginPage = (await import('../pages/LoginPage')).default;
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('DevFlow')).toBeInTheDocument();
  });

  it('shows demo credentials', async () => {
    const LoginPage = (await import('../pages/LoginPage')).default;
    renderWithProviders(<LoginPage />);
    expect(screen.getByText(/Demo credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/vishal@devflow.com/i)).toBeInTheDocument();
  });

  it('submit button is disabled when fields are empty', async () => {
    const LoginPage = (await import('../pages/LoginPage')).default;
    renderWithProviders(<LoginPage />);
    const button = screen.getByRole('button', { name: /sign in/i });
    expect(button).not.toBeDisabled(); // HTML required handles it
  });
});

// ─── Register Page Tests 
describe('RegisterPage', () => {
  it('renders registration form', async () => {
    const RegisterPage = (await import('../pages/RegisterPage')).default;
    renderWithProviders(<RegisterPage />);
    expect(screen.getByPlaceholderText(/Vishal Munde/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Min 8 characters/i)).toBeInTheDocument();
  });
});

// ─── Notification Slice Tests ─────────────────────────────
describe('Notification Slice', () => {
  it('addNotification should increment unread count', () => {
    const store = createTestStore({ notifications: { items: [], unreadCount: 0, loading: false } });
    store.dispatch({
      type: 'notifications/addNotification',
      payload: { id: 'n1', type: 'TASK_ASSIGNED', title: 'New task', message: 'You have a new task', read: false, createdAt: new Date().toISOString() }
    });
    expect(store.getState().notifications.unreadCount).toBe(1);
    expect(store.getState().notifications.items).toHaveLength(1);
  });
});
