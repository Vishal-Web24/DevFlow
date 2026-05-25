import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';
import { toggleDarkMode, toggleSidebar } from '../../store/slices/uiSlice';
import { fetchProjects } from '../../store/slices/projectSlice';
import { fetchUnreadCount } from '../../store/slices/notificationSlice';
import { useEffect, useState } from 'react';
import CreateProjectModal from '../ui/CreateProjectModal';
import NotificationPanel from '../ui/NotificationPanel';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { to: '/ai', label: 'AI Assistant', icon: '✦' },
];

export default function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);
  const { items: projects } = useAppSelector(s => s.projects);
  const { darkMode, sidebarOpen } = useAppSelector(s => s.ui);
  const { unreadCount } = useAppSelector(s => s.notifications);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-200 overflow-hidden`}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-800 gap-3">
          <span className="text-2xl">⚡</span>
          {sidebarOpen && <span className="font-bold text-lg text-primary-600">DevFlow</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <span className="text-base w-5 text-center">{icon}</span>
              {sidebarOpen && label}
            </NavLink>
          ))}

          {/* Projects */}
          {sidebarOpen && (
            <div className="pt-4">
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Projects</span>
                <button onClick={() => setShowCreateProject(true)} className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-lg leading-none" title="New project">+</button>
              </div>
              {projects.map(p => (
                <NavLink key={p.id} to={`/projects/${p.id}`} className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="truncate">{p.name}</span>
                </NavLink>
              ))}
              {projects.length === 0 && (
                <p className="px-3 text-xs text-gray-400 dark:text-gray-600">No projects yet</p>
              )}
            </div>
          )}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 text-sm transition-colors" title="Logout">⏻</button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center text-gray-400 hover:text-red-500">⏻</button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4">
          <button onClick={() => dispatch(toggleSidebar())} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl" title="Toggle sidebar">☰</button>
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                🔔
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
            </div>
            {/* Dark mode */}
            <button onClick={() => dispatch(toggleDarkMode())}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              {darkMode ? '☀' : '☾'}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {showCreateProject && <CreateProjectModal onClose={() => setShowCreateProject(false)} />}
    </div>
  );
}
