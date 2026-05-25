import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';
import { Analytics } from '../types';
import { useAppSelector } from '../hooks/redux';

const STATUS_COLORS: Record<string, string> = {
  TODO: '#94A3B8', IN_PROGRESS: '#3B82F6', IN_REVIEW: '#F59E0B', DONE: '#22C55E',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#94A3B8', MEDIUM: '#3B82F6', HIGH: '#F59E0B', CRITICAL: '#EF4444',
};

export default function AnalyticsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = useAppSelector(s => s.projects.current);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const darkMode = useAppSelector(s => s.ui.darkMode);

  useEffect(() => {
    if (projectId) {
      api.get(`/projects/${projectId}/analytics`)
        .then(r => setAnalytics(r.data))
        .finally(() => setLoading(false));
    }
  }, [projectId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!analytics) return null;

  const statusData = analytics.tasksByStatus.map(s => ({ name: s.status.replace('_', ' '), value: s._count, color: STATUS_COLORS[s.status] || '#6B7280' }));
  const priorityData = analytics.tasksByPriority.map(p => ({ name: p.priority, value: p._count, color: PRIORITY_COLORS[p.priority] || '#6B7280' }));
  const totalTasks = statusData.reduce((s, d) => s + d.value, 0);
  const doneTasks = analytics.tasksByStatus.find(s => s.status === 'DONE')?._count || 0;
  const chartTextColor = darkMode ? '#9CA3AF' : '#6B7280';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/projects/${projectId}`} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">←</Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Analytics — {project?.name}</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Tasks', value: totalTasks, icon: '📋' },
          { label: 'Completed', value: doneTasks, icon: '✅' },
          { label: 'Progress', value: `${totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%`, icon: '📈' },
          { label: 'This Week Activity', value: analytics.recentActivity, icon: '⚡' },
        ].map(kpi => (
          <div key={kpi.label} className="card p-4 text-center">
            <div className="text-2xl mb-1">{kpi.icon}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Status - Bar Chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#F3F4F6'} />
              <XAxis dataKey="name" tick={{ fill: chartTextColor, fontSize: 12 }} />
              <YAxis tick={{ fill: chartTextColor, fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#fff', border: '1px solid #374151', color: darkMode ? '#fff' : '#111' }} />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by Priority - Pie Chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {priorityData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#fff', border: '1px solid #374151', color: darkMode ? '#fff' : '#111' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
