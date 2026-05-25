import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  res.json(notifications);
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const notificationId = req.params.notificationId as string;
  const notification = await prisma.notification.updateMany({
    where: { id: notificationId, userId: req.userId },
    data: { read: true },
  });
  res.json({ updated: notification.count });
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { userId: req.userId, read: false },
    data: { read: true },
  });
  res.json({ message: 'All notifications marked as read' });
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  const count = await prisma.notification.count({
    where: { userId: req.userId, read: false },
  });
  res.json({ count });
};