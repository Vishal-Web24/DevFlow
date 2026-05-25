// ─── User ─────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt?: string;
}

// ─── Project 
export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
  sprints?: Sprint[];
  _count?: { tasks: number };
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  user: Pick<User, 'id' | 'name' | 'avatar' | 'email'>;
}

// ─── Task ─────────────────────────────────────────────────
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  position: number;
  dueDate?: string;
  storyPoints?: number;
  labels: string[];
  projectId: string;
  assigneeId?: string;
  assignee?: Pick<User, 'id' | 'name' | 'avatar'>;
  creator?: Pick<User, 'id' | 'name' | 'avatar'>;
  sprintId?: string;
  sprint?: Pick<Sprint, 'id' | 'name'>;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

// ─── Sprint 
export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  projectId: string;
  createdAt: string;
}

// ─── Comment ──────────────────────────────────────────────
export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author: Pick<User, 'id' | 'name' | 'avatar'>;
  createdAt: string;
  updatedAt: string;
}

// ─── Notification 
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ─── Activity 
export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
}

// ─── AI Types ─────────────────────────────────────────────
export interface AISubtask {
  title: string;
  description: string;
  estimateHours: number;
  priority: Priority;
}

export interface AIBreakdownResult {
  subtasks: AISubtask[];
  totalEstimatedHours: number;
  suggestedSprint: string;
}

export interface AIMilestone {
  week: number;
  title: string;
  description: string;
  deliverables: string[];
  tasks: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AIRoadmapResult {
  projectName: string;
  overview: string;
  milestones: AIMilestone[];
  totalEstimatedEffort: string;
  criticalPath: string[];
  successMetrics: string[];
}

// ─── Analytics ────────────────────────────────────────────
export interface Analytics {
  tasksByStatus: Array<{ status: TaskStatus; _count: number }>;
  tasksByPriority: Array<{ priority: Priority; _count: number }>;
  tasksByMember: Array<{ assigneeId: string | null; _count: number }>;
  recentActivity: number;
}

// ─── API ──────────────────────────────────────────────────
export interface ApiError {
  error: string;
  code?: string;
}
