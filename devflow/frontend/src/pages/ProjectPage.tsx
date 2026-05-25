import { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProject } from '../store/slices/projectSlice';
import { fetchTasks, clearTasks } from '../store/slices/taskSlice';
import { setCreateTaskModal } from '../store/slices/uiSlice';
import { useProjectSocket } from '../hooks/useSocket';
import KanbanBoard from '../components/kanban/KanbanBoard';
import TaskDetailModal from '../components/kanban/TaskDetailModal';
import CreateTaskModal from '../components/ui/CreateTaskModal';
import ActivityFeed from '../components/dashboard/ActivityFeed';

type Tab = 'board' | 'members' | 'activity';

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useAppDispatch();
  const { current: project, loading: projectLoading } = useAppSelector(s => s.projects);
  const { items: tasks, loading: tasksLoading } = useAppSelector(s => s.tasks);
  const selectedTask = useAppSelector(s => s.tasks.selectedTask);
  const [tab, setTab] = useState<Tab>('board');

  // Connect Socket.io to this project room
  useProjectSocket(projectId);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProject(projectId));
      dispatch(fetchTasks(projectId));
    }
    return () => { dispatch(clearTasks()); };
  }, [projectId, dispatch]);

  if (projectLoading || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const doneTasks = tasks.filter(t => t.status === 'DONE').length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <div className="px-6 pt-5 pb-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              {project.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{project.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Member avatars */}
            <div className="flex -space-x-2 mr-2">
              {project.members?.slice(0, 4).map(m => (
                <img key={m.id} src={m.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user.name)}&size=28&background=3B82F6&color=fff`}
                  className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-900" alt={m.user.name} title={m.user.name} />
              ))}
            </div>
            <NavLink to={`/projects/${projectId}/analytics`} className="btn-secondary text-sm">📊 Analytics</NavLink>
            <button onClick={() => dispatch(setCreateTaskModal(true))} className="btn-primary text-sm">+ Add task</button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{doneTasks}/{tasks.length} done ({progress}%)</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {([['board','Board'],['members','Members'],['activity','Activity']] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === id ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'board' && (
          tasksLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <KanbanBoard projectId={projectId!} />
          )
        )}
        {tab === 'members' && <MembersTab project={project} />}
        {tab === 'activity' && <ActivityFeed projectId={projectId!} />}
      </div>

      {selectedTask && <TaskDetailModal />}
      <CreateTaskModal />
    </div>
  );
}

function MembersTab({ project }: { project: any }) {
  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Members ({project.members?.length || 0})</h2>
      <div className="space-y-3">
        {project.members?.map((m: any) => (
          <div key={m.id} className="card p-4 flex items-center gap-3">
            <img src={m.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user.name)}&size=40&background=3B82F6&color=fff`}
              className="w-10 h-10 rounded-full" alt={m.user.name} />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{m.user.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{m.user.email}</p>
            </div>
            <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">{m.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
