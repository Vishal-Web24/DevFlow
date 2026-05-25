import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProjects, createProject } from '../store/slices/projectSlice';
import { setCreateProjectModal } from '../store/slices/uiSlice';
import { format } from 'date-fns';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);
  const { items: projects, loading } = useAppSelector(s => s.projects);

  useEffect(() => { dispatch(fetchProjects()); }, [dispatch]);

  const totalTasks = projects.reduce((sum, p) => sum + (p._count?.tasks || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active Projects', value: projects.filter(p => p.status === 'ACTIVE').length, icon: '📁', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Total Tasks', value: totalTasks, icon: '✓', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
          { label: 'Team Members', value: [...new Set(projects.flatMap(p => p.members?.map(m => m.userId) || []))].length, icon: '👥', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
        ].map(stat => (
          <div key={stat.label} className="card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Projects grid */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Projects</h2>
        <button onClick={() => dispatch(setCreateProjectModal(true))} className="btn-primary">+ New Project</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="card p-5 h-32 animate-pulse bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-4xl">📁</span>
          <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-white">No projects yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1 mb-4">Create your first project to get started</p>
          <button onClick={() => dispatch(setCreateProjectModal(true))} className="btn-primary mx-auto">Create project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)}
              className="card p-5 cursor-pointer hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{project.name}</h3>
                </div>
                <span className={`badge ${project.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600'}`}>
                  {project.status}
                </span>
              </div>
              {project.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{project.description}</p>}
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{project._count?.tasks || 0} tasks</span>
                <div className="flex -space-x-2">
                  {project.members?.slice(0, 3).map(m => (
                    <img key={m.id} src={m.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user.name)}&size=24&background=3B82F6&color=fff`}
                      className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900" alt={m.user.name} title={m.user.name} />
                  ))}
                  {(project.members?.length || 0) > 3 && <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs border-2 border-white dark:border-gray-900">+{project.members.length - 3}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateProjectModal />
    </div>
  );
}

function CreateProjectModal() {
  const dispatch = useAppDispatch();
  const { createProjectModal } = useAppSelector(s => s.ui);
  const [form, setForm] = useState({ name: '', description: '', color: '#3B82F6' });
  const [loading, setLoading] = useState(false);

  const COLORS = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#EC4899','#06B6D4','#84CC16'];

  if (!createProjectModal) return null;

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    await dispatch(createProject(form));
    setLoading(false);
    dispatch(setCreateProjectModal(false));
    setForm({ name: '', description: '', color: '#3B82F6' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => dispatch(setCreateProjectModal(false))}>
      <div className="card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create new project</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Project name *</label>
            <input className="input" placeholder="My awesome project" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} placeholder="What is this project about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-primary-600 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => dispatch(setCreateProjectModal(false))} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleCreate} disabled={loading || !form.name.trim()} className="btn-primary flex-1 justify-center">
            {loading ? 'Creating...' : 'Create project'}
          </button>
        </div>
      </div>
    </div>
  );
}
