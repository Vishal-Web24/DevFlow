import { useEffect, useState } from 'react';
import api from '../../services/api';
import { ActivityLog } from '../../types';
import { format } from 'date-fns';

const ACTION_ICONS: Record<string, string> = {
  TASK_CREATED: '✅', TASK_STATUS_CHANGED: '🔄', TASK_DELETED: '🗑️',
  COMMENT_ADDED: '💬', MEMBER_JOINED: '👋', SPRINT_STARTED: '🚀', DEFAULT: '📋',
};

export default function ActivityFeed({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/projects/${projectId}/activity`)
      .then(r => setLogs(r.data))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="p-6 flex justify-center"><div className="w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Feed</h2>
      {logs.length === 0 ? (
        <p className="text-sm text-gray-400">No activity yet</p>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="flex gap-3">
              <img src={log.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(log.user.name)}&size=32&background=3B82F6&color=fff`}
                className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5" alt={log.user.name} />
              <div className="flex-1 card p-3">
                <div className="flex items-start justify-between">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-white">{log.user.name}</span>
                    {' '}{ACTION_ICONS[log.action] || ACTION_ICONS.DEFAULT}{' '}
                    {log.action.replace(/_/g, ' ').toLowerCase()}
                    {(log.metadata as any)?.title && <span className="font-medium"> "{(log.metadata as any).title}"</span>}
                  </p>
                  <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{format(new Date(log.createdAt), 'MMM d, h:mm a')}</span>
                </div>
                {(log.metadata as any)?.from && (
                  <p className="text-xs text-gray-400 mt-1">{(log.metadata as any).from} → {(log.metadata as any).to}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
