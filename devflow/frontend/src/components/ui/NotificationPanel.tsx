import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchNotifications, markAllRead } from '../../store/slices/notificationSlice';
import { format } from 'date-fns';

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { items } = useAppSelector(s => s.notifications);

  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  const ICONS: Record<string, string> = {
    TASK_ASSIGNED: '📋', TASK_UPDATED: '✏️', COMMENT_ADDED: '💬',
    MEMBER_JOINED: '👋', SPRINT_STARTED: '🚀', DEFAULT: '🔔',
  };

  return (
    <div className="absolute right-0 top-10 w-80 card shadow-xl z-50 overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</h3>
        <button onClick={() => dispatch(markAllRead())} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">Mark all read</button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">No notifications</div>
        ) : (
          items.map(n => (
            <div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
              <span className="text-base mt-0.5">{ICONS[n.type] || ICONS.DEFAULT}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{n.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">{format(new Date(n.createdAt), 'MMM d, h:mm a')}</p>
              </div>
              {!n.read && <span className="w-2 h-2 bg-primary-600 rounded-full mt-1.5 flex-shrink-0" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
