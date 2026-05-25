import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createTask } from '../../store/slices/taskSlice';
import { setCreateTaskModal } from '../../store/slices/uiSlice';
import { Priority } from '../../types';
import toast from 'react-hot-toast';

export default function CreateTaskModal() {
  const dispatch = useAppDispatch();
  const { createTaskModal } = useAppSelector(s => s.ui);
  const project = useAppSelector(s => s.projects.current);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM' as Priority, dueDate: '', storyPoints: '' });
  const [loading, setLoading] = useState(false);

  if (!createTaskModal || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await dispatch(createTask({
        projectId: project.id,
        title: form.title.trim(),
        description: form.description || undefined,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        storyPoints: form.storyPoints ? parseInt(form.storyPoints) : undefined,
      }));
      dispatch(setCreateTaskModal(false));
      setForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', storyPoints: '' });
      toast.success('Task created!');
    } catch {
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => dispatch(setCreateTaskModal(false))}>
      <div className="card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create task</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" placeholder="What needs to be done?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="Optional details..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                {(['LOW','MEDIUM','HIGH','CRITICAL'] as Priority[]).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Story points</label>
              <input type="number" className="input" placeholder="0" min="0" max="100" value={form.storyPoints} onChange={e => setForm(f => ({ ...f, storyPoints: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Due date</label>
            <input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => dispatch(setCreateTaskModal(false))} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading || !form.title.trim()} className="btn-primary flex-1 justify-center">
              {loading ? 'Creating...' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
