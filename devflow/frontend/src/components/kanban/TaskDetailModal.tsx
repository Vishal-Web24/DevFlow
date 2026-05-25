import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setSelectedTask, updateTask, deleteTask, addComment } from '../../store/slices/taskSlice';
import { Task, Priority, TaskStatus } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function TaskDetailModal() {
  const dispatch = useAppDispatch();
  const task = useAppSelector(s => s.tasks.selectedTask);
  const projectId = useAppSelector(s => s.projects.current?.id || '');
  const { user } = useAppSelector(s => s.auth);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  if (!task) return null;

  const handleClose = () => dispatch(setSelectedTask(null));

  const handleStatusChange = (status: TaskStatus) => {
    dispatch(updateTask({ taskId: task.id, projectId, status }));
  };

  const handlePriorityChange = (priority: Priority) => {
    dispatch(updateTask({ taskId: task.id, projectId, priority }));
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    dispatch(updateTask({ taskId: task.id, projectId, title: editTitle, description: editDesc }));
    setIsEditing(false);
    toast.success('Task updated');
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    dispatch(deleteTask({ taskId: task.id, projectId }));
    dispatch(setSelectedTask(null));
    toast.success('Task deleted');
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await dispatch(addComment({ taskId: task.id, projectId, content: comment }));
    setComment('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex-1 mr-4">
            {isEditing ? (
              <input className="input text-base font-semibold" value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus />
            ) : (
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{task.title}</h3>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button onClick={handleSaveEdit} className="btn-primary text-xs py-1.5 px-3">Save</button>
                <button onClick={() => setIsEditing(false)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => { setEditTitle(task.title); setEditDesc(task.description || ''); setIsEditing(true); }}
                  className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                <button onClick={handleDelete} className="btn-danger text-xs py-1.5 px-3">Delete</button>
              </>
            )}
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl ml-1">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status + Priority */}
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="label">Status</label>
              <select className="input w-auto" value={task.status} onChange={e => handleStatusChange(e.target.value as TaskStatus)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input w-auto" value={task.priority} onChange={e => handlePriorityChange(e.target.value as Priority)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {task.assignee && (
              <div>
                <label className="label">Assignee</label>
                <div className="flex items-center gap-2 mt-1">
                  <img src={task.assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee.name)}&size=28&background=3B82F6&color=fff`}
                    className="w-7 h-7 rounded-full" alt={task.assignee.name} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{task.assignee.name}</span>
                </div>
              </div>
            )}
            {task.dueDate && (
              <div>
                <label className="label">Due date</label>
                <span className={`text-sm ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {format(new Date(task.dueDate), 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            {isEditing ? (
              <textarea className="input resize-none" rows={4} value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Task description..." />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {task.description || <span className="italic text-gray-400">No description</span>}
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Created {format(new Date(task.createdAt), 'MMM d, yyyy')} by {task.creator?.name}
            {task.sprint && <span> · Sprint: {task.sprint.name}</span>}
            {task.storyPoints && <span> · {task.storyPoints} story points</span>}
          </div>

          {/* Comments */}
          <div>
            <label className="label">Comments ({task.comments?.length || 0})</label>
            <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
              {task.comments?.map(c => (
                <div key={c.id} className="flex gap-3">
                  <img src={c.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author.name)}&size=28&background=3B82F6&color=fff`}
                    className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5" alt={c.author.name} />
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{c.author.name}</span>
                      <span className="text-xs text-gray-400">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
              {(!task.comments || task.comments.length === 0) && (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No comments yet</p>
              )}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-primary-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-1">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 flex gap-2">
                <input className="input flex-1" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} />
                <button type="submit" disabled={!comment.trim()} className="btn-primary px-3">Send</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
