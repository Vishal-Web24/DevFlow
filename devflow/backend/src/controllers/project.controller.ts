import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { cacheGet, cacheSet, cacheDel, cachePattern } from '../config/redis';
import { emitActivityFeed } from '../services/socket.service';

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, color } = req.body;
  if (!name) { res.status(400).json({ error: 'Project name is required' }); return; }

  const project = await prisma.project.create({
    data: {
      name, description, color: color || '#3B82F6',
      members: { create: { userId: req.userId!, role: 'OWNER' } },
    },
    include: { members: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
  });

  await cachePattern(`projects:${req.userId}*`);
  res.status(201).json(project);
};

export const getMyProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  const cacheKey = `projects:${req.userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) { res.json(cached); return; }

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: req.userId } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  await cacheSet(cacheKey, projects, 120);
  res.json(projects);
};

export const getProject = async (req: AuthRequest, res: Response): Promise<void> => {
  const projectId = req.params.projectId as string;
  const cacheKey = `project:${projectId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) { res.json(cached); return; }

  const project = await prisma.project.findFirst({
    where: { id: projectId, members: { some: { userId: req.userId } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
      sprints: { orderBy: { createdAt: 'desc' } },
      _count: { select: { tasks: true } },
    },
  });

  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  await cacheSet(cacheKey, project, 60);
  res.json(project);
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  const projectId = req.params.projectId as string;
  const { name, description, color, status } = req.body;

  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId: req.userId, role: { in: ['OWNER', 'ADMIN'] } },
  });
  if (!member) { res.status(403).json({ error: 'Insufficient permissions' }); return; }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(color && { color }),
      ...(status && { status }),
    },
  });

  await cacheDel(`project:${projectId}`, `projects:${req.userId}`);
  res.json(project);
};

export const inviteMember = async (req: AuthRequest, res: Response): Promise<void> => {
  const projectId = req.params.projectId as string;
  const { email, role = 'MEMBER' } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) { res.status(404).json({ error: 'User not found with that email' }); return; }

  const exists = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });
  if (exists) { res.status(409).json({ error: 'User is already a member' }); return; }

  const membership = await prisma.projectMember.create({
    data: { userId: user.id, projectId, role },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });

  await cacheDel(`project:${projectId}`);
  res.status(201).json(membership);
};

export const getProjectActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  const projectId = req.params.projectId as string;
  const cacheKey = `activity:${projectId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) { res.json(cached); return; }

  const logs = await prisma.activityLog.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  await cacheSet(cacheKey, logs, 30);
  res.json(logs);
};

export const getProjectAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  const projectId = req.params.projectId as string;
  const cacheKey = `analytics:${projectId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) { res.json(cached); return; }

  const [tasksByStatus, tasksByPriority, tasksByMember, recentActivity] = await Promise.all([
    prisma.task.groupBy({ by: ['status'], where: { projectId }, _count: true }),
    prisma.task.groupBy({ by: ['priority'], where: { projectId }, _count: true }),
    prisma.task.groupBy({ by: ['assigneeId'], where: { projectId }, _count: true }),
    prisma.activityLog.count({
      where: { projectId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const analytics = { tasksByStatus, tasksByPriority, tasksByMember, recentActivity };
  await cacheSet(cacheKey, analytics, 60);
  res.json(analytics);
};