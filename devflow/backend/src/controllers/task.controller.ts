import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { cacheGet, cacheSet, cacheDel, cachePattern } from '../config/redis';
import { emitTaskUpdate, emitActivityFeed, emitNotification } from '../services/socket.service';

const taskInclude = {
  assignee: { select: { id: true, name: true, avatar: true } },
  creator: { select: { id: true, name: true, avatar: true } },
  comments: {
    include: { author: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  sprint: { select: { id: true, name: true } },
};

export const getProjectTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  const projectId = req.params.projectId as string;
  const { status, priority, assigneeId, sprintId } = req.query;
  const cacheKey = `tasks:${projectId}:${JSON.stringify(req.query)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) { res.json(cached); return; }
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      ...(status && { status: status as any }),
      ...(priority && { priority: priority as any }),
      ...(assigneeId && { assigneeId: assigneeId as string }),
      ...(sprintId && { sprintId: sprintId as string }),
    },
    include: taskInclude,
    orderBy: [{ status: 'asc' }, { position: 'asc' }],
  });
  await cacheSet(cacheKey, tasks, 30);
  res.json(tasks);
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const projectId = req.params.projectId as string;
  const { title, description, priority, assigneeId, dueDate, storyPoints, labels, sprintId } = req.body;
  if (!title) { res.status(400).json({ error: 'Task title is required' }); return; }
  const maxPos = await prisma.task.aggregate({
    where: { projectId, status: 'TODO' },
    _max: { position: true },
  });
  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority: priority || 'MEDIUM',
      assigneeId: assigneeId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      storyPoints: storyPoints || null,
      labels: labels || [],
      sprintId: sprintId || null,
      position: ((maxPos._max?.position) ?? 0) + 1,
      projectId,
      creatorId: req.userId!,
    },
    include: taskInclude,
  });
  await cachePattern(`tasks:${projectId}*`);
  emitTaskUpdate(projectId, { type: 'TASK_CREATED', task });
  await logActivity(projectId, req.userId!, 'TASK_CREATED', 'Task', task.id, { title });
  emitActivityFeed(projectId, { action: 'TASK_CREATED', task, userId: req.userId });
  if (assigneeId && assigneeId !== req.userId) {
    const notification = await prisma.notification.create({
      data: {
        userId: assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'New task assigned',
        message: `You were assigned to "${title}"`,
        data: { taskId: task.id, projectId },
      },
    });
    emitNotification(assigneeId, notification);
  }
  res.status(201).json(task);
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const taskId = req.params.taskId as string;
  const { title, description, status, priority, assigneeId, dueDate, storyPoints, labels, position, sprintId } = req.body;
  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) { res.status(404).json({ error: 'Task not found' }); return; }
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(storyPoints !== undefined && { storyPoints }),
      ...(labels !== undefined && { labels }),
      ...(position !== undefined && { position }),
      ...(sprintId !== undefined && { sprintId: sprintId || null }),
    },
    include: taskInclude,
  });
  await cachePattern(`tasks:${task.projectId}*`);
  emitTaskUpdate(task.projectId, { type: 'TASK_UPDATED', task });
  if (status && status !== existing.status) {
    await logActivity(task.projectId, req.userId!, 'TASK_STATUS_CHANGED', 'Task', taskId, {
      from: existing.status, to: status, title: task.title,
    });
    emitActivityFeed(task.projectId, { action: 'TASK_STATUS_CHANGED', task, userId: req.userId });
  }
  res.json(task);
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const taskId = req.params.taskId as string;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
  await prisma.task.delete({ where: { id: taskId } });
  await cachePattern(`tasks:${task.projectId}*`);
  emitTaskUpdate(task.projectId, { type: 'TASK_DELETED', taskId });
  await logActivity(task.projectId, req.userId!, 'TASK_DELETED', 'Task', taskId, { title: task.title });
  res.json({ message: 'Task deleted successfully' });
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const taskId = req.params.taskId as string;
  const { content } = req.body;
  if (!content?.trim()) { res.status(400).json({ error: 'Comment content is required' }); return; }
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
  const comment = await prisma.comment.create({
    data: { content: content.trim(), taskId, authorId: req.userId! },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });
  await cachePattern(`tasks:${task.projectId}*`);
  emitTaskUpdate(task.projectId, { type: 'COMMENT_ADDED', taskId, comment });
  res.status(201).json(comment);
};

export const createSprint = async (req: AuthRequest, res: Response): Promise<void> => {
  const projectId = req.params.projectId as string;
  const { name, goal, startDate, endDate } = req.body;
  const sprint = await prisma.sprint.create({
    data: { name, goal, startDate: new Date(startDate), endDate: new Date(endDate), projectId },
  });
  await cacheDel(`project:${projectId}`);
  res.status(201).json(sprint);
};

const logActivity = async (
  projectId: string, userId: string, action: string,
  entity: string, entityId: string, metadata?: object
) => {
  await prisma.activityLog.create({
    data: { projectId, userId, action, entity, entityId, metadata },
  });
  await cachePattern(`activity:${projectId}`);
};