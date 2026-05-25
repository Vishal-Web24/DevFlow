import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { AIBreakdownResult, AIRoadmapResult } from '../types';

type AITool = 'breakdown' | 'sprint' | 'bug' | 'meeting' | 'roadmap';

const TOOLS: { id: AITool; label: string; icon: string; desc: string; model: string }[] = [
  { id: 'breakdown', label: 'Task Breakdown', icon: '🔨', desc: 'Break a feature into subtasks', model: 'OpenAI GPT-4o-mini' },
  { id: 'sprint',    label: 'Sprint Planner', icon: '🚀', desc: 'Plan your sprint from tasks', model: 'OpenAI GPT-4o-mini' },
  { id: 'bug',       label: 'Bug Explainer',  icon: '🐛', desc: 'Understand any error log', model: 'Google Gemini Flash' },
  { id: 'meeting',   label: 'Meeting Summary',icon: '📝', desc: 'Summarize meeting notes', model: 'Google Gemini Flash' },
  { id: 'roadmap',   label: 'Roadmap Gen',    icon: '🗺️', desc: 'Generate a project roadmap', model: 'OpenAI GPT-4o-mini' },
];

export default function AIAssistantPage() {
  const [activeTool, setActiveTool] = useState<AITool>('breakdown');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');

  const callAI = async (endpoint: string, payload: object) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post(`/ai/${endpoint}`, payload);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'AI request failed');
      toast.error('AI request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left tool selector */}
      <div className="w-56 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 p-4 space-y-1 bg-white dark:bg-gray-900">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3">AI Tools</p>
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => { setActiveTool(t.id); setResult(null); setError(''); }}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activeTool === t.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <span className="text-base">{t.icon}</span>
            <div>
              <p className="font-medium">{t.label}</p>
              <p className="text-xs opacity-60">{t.model}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col overflow-auto p-6">
        {activeTool === 'breakdown' && <TaskBreakdownTool onRun={callAI} loading={loading} result={result as AIBreakdownResult | null} error={error} />}
        {activeTool === 'sprint'    && <SprintPlannerTool onRun={callAI} loading={loading} result={result} error={error} />}
        {activeTool === 'bug'       && <BugExplainerTool onRun={callAI} loading={loading} result={result as { explanation: string } | null} error={error} />}
        {activeTool === 'meeting'   && <MeetingSummaryTool onRun={callAI} loading={loading} result={result as { summary: string } | null} error={error} />}
        {activeTool === 'roadmap'   && <RoadmapTool onRun={callAI} loading={loading} result={result as AIRoadmapResult | null} error={error} />}
      </div>
    </div>
  );
}

// ─── Tool Components ──────────────────────────────────────

function AICard({ children }: { children: React.ReactNode }) {
  return <div className="card p-5 mt-4 animate-fade-in">{children}</div>;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-3 mt-4 text-gray-500 dark:text-gray-400">
      <div className="w-5 h-5 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm">AI is thinking...</span>
    </div>
  );
}

function TaskBreakdownTool({ onRun, loading, result, error }: any) {
  const [desc, setDesc] = useState('');
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">🔨 Task Breakdown</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Describe a feature and get developer subtasks with time estimates.</p>
      <textarea className="input resize-none w-full" rows={4} placeholder="e.g. Build a user authentication system with JWT, refresh tokens, and Google OAuth" value={desc} onChange={e => setDesc(e.target.value)} />
      <button onClick={() => onRun('breakdown', { description: desc })} disabled={loading || !desc.trim()} className="btn-primary mt-3">
        {loading ? 'Analyzing...' : '✦ Generate Subtasks'}
      </button>
      {loading && <LoadingSpinner />}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      {result && (
        <AICard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Generated Subtasks</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              ~{result.totalEstimatedHours}h total · {result.suggestedSprint}
            </div>
          </div>
          <div className="space-y-3">
            {result.subtasks?.map((t: any, i: number) => (
              <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{t.title}</p>
                    <div className="flex items-center gap-2">
                      <span className={`badge text-xs ${t.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : t.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{t.priority}</span>
                      <span className="text-xs text-gray-400">{t.estimateHours}h</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </AICard>
      )}
    </div>
  );
}

function BugExplainerTool({ onRun, loading, result, error }: any) {
  const [log, setLog] = useState('');
  const [lang, setLang] = useState('TypeScript');
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">🐛 Bug Explainer</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Paste any error log and get root cause + fix + prevention.</p>
      <select className="input mb-3 w-48" value={lang} onChange={e => setLang(e.target.value)}>
        {['TypeScript','JavaScript','Python','Java','Go','Rust','C++'].map(l => <option key={l}>{l}</option>)}
      </select>
      <textarea className="input resize-none w-full font-mono text-xs" rows={6} placeholder={`Paste your error log here...\n\nTypeError: Cannot read property 'id' of undefined\n    at UserController.getUser (user.controller.ts:45:20)`} value={log} onChange={e => setLog(e.target.value)} />
      <button onClick={() => onRun('explain-bug', { errorLog: log, language: lang })} disabled={loading || !log.trim()} className="btn-primary mt-3">
        {loading ? 'Analyzing...' : '✦ Explain Bug'}
      </button>
      {loading && <LoadingSpinner />}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      {result?.explanation && (
        <AICard>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">{result.explanation}</pre>
          </div>
        </AICard>
      )}
    </div>
  );
}

function MeetingSummaryTool({ onRun, loading, result, error }: any) {
  const [notes, setNotes] = useState('');
  const [title, setTitle] = useState('Sprint Planning');
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">📝 Meeting Summarizer</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Paste meeting notes, get decisions, action items, and next steps.</p>
      <input className="input mb-3" placeholder="Meeting title" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea className="input resize-none w-full" rows={7} placeholder="Paste your meeting notes here..." value={notes} onChange={e => setNotes(e.target.value)} />
      <button onClick={() => onRun('summarize-meeting', { notes, meetingTitle: title })} disabled={loading || !notes.trim()} className="btn-primary mt-3">
        {loading ? 'Summarizing...' : '✦ Generate Summary'}
      </button>
      {loading && <LoadingSpinner />}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      {result?.summary && (
        <AICard>
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">{result.summary}</pre>
        </AICard>
      )}
    </div>
  );
}

function SprintPlannerTool({ onRun, loading, result, error }: any) {
  const [tasksText, setTasksText] = useState('');
  const [days, setDays] = useState('14');
  const [team, setTeam] = useState('3');
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">🚀 Sprint Planner</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">List your tasks (one per line) and get an AI-optimized sprint plan.</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="label">Sprint days</label><input type="number" className="input" value={days} onChange={e => setDays(e.target.value)} /></div>
        <div><label className="label">Team size</label><input type="number" className="input" value={team} onChange={e => setTeam(e.target.value)} /></div>
      </div>
      <textarea className="input resize-none w-full" rows={6} placeholder={`One task per line:\nBuild auth system (8h, HIGH)\nCreate Kanban board (12h, HIGH)\nWrite unit tests (4h, MEDIUM)`} value={tasksText} onChange={e => setTasksText(e.target.value)} />
      <button onClick={() => onRun('sprint-plan', { tasks: tasksText.split('\n').filter(Boolean).map((t, i) => ({ id: String(i), title: t })), sprintDays: parseInt(days), teamSize: parseInt(team) })} disabled={loading || !tasksText.trim()} className="btn-primary mt-3">
        {loading ? 'Planning...' : '✦ Plan Sprint'}
      </button>
      {loading && <LoadingSpinner />}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      {result && (
        <AICard>
          <h3 className="font-bold text-gray-900 dark:text-white">{result.sprintName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">{result.sprintGoal}</p>
          <div className="space-y-2">
            {result.prioritizedTasks?.map((t: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center text-xs font-bold">{i+1}</span>
                <span className="flex-1 text-gray-800 dark:text-gray-200">{t.title}</span>
                <span className="text-xs text-gray-400">Day {t.assignedDay}</span>
                <span className={`badge text-xs ${t.risk === 'HIGH' ? 'bg-red-100 text-red-700' : t.risk === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{t.risk}</span>
              </div>
            ))}
          </div>
        </AICard>
      )}
    </div>
  );
}

function RoadmapTool({ onRun, loading, result, error }: any) {
  const [goal, setGoal] = useState('');
  const [weeks, setWeeks] = useState('8');
  const [team, setTeam] = useState('3');
  const [stack, setStack] = useState('React, Node.js, PostgreSQL');
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">🗺️ Roadmap Generator</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Describe your project and get a week-by-week delivery roadmap.</p>
      <textarea className="input resize-none w-full mb-3" rows={3} placeholder="Project goal: Build a full-stack SaaS project management platform with AI features" value={goal} onChange={e => setGoal(e.target.value)} />
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div><label className="label">Weeks</label><input type="number" className="input" value={weeks} onChange={e => setWeeks(e.target.value)} /></div>
        <div><label className="label">Team</label><input type="number" className="input" value={team} onChange={e => setTeam(e.target.value)} /></div>
        <div><label className="label">Tech stack</label><input className="input" value={stack} onChange={e => setStack(e.target.value)} /></div>
      </div>
      <button onClick={() => onRun('roadmap', { projectGoal: goal, weeks: parseInt(weeks), teamSize: parseInt(team), techStack: stack.split(',').map(s => s.trim()) })} disabled={loading || !goal.trim()} className="btn-primary">
        {loading ? 'Generating...' : '✦ Generate Roadmap'}
      </button>
      {loading && <LoadingSpinner />}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      {result && (
        <AICard>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{result.projectName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{result.overview}</p>
          <div className="space-y-3">
            {result.milestones?.map((m: any) => (
              <div key={m.week} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">Week {m.week}: {m.title}</span>
                  <span className={`badge text-xs ${m.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' : m.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{m.riskLevel}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{m.description}</p>
                <div className="flex flex-wrap gap-1">
                  {m.deliverables?.map((d: string, i: number) => (
                    <span key={i} className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 text-xs">✓ {d}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AICard>
      )}
    </div>
  );
}
