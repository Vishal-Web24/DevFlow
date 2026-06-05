import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server;

interface AuthSocket extends Socket {
  userId?: string;
}

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'https://dev-flow-pied.vercel.app',
        'https://dev-flow-git-main-vishals-projects-3d99ee23.vercel.app',
        'http://localhost:3000',
        process.env.FRONTEND_URL || '',
      ].filter(Boolean),
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(
        token, process.env.JWT_SECRET!
      ) as { userId: string };
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`User connected: ${userId}`);

    socket.join(`user:${userId}`);

    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('user:joined', { userId });
    });

    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('user:left', { userId });
    });

    socket.on('typing:start', (data: { projectId: string; taskId: string }) => {
      socket.to(`project:${data.projectId}`).emit('user:typing', {
        userId, taskId: data.taskId,
      });
    });

    socket.on('typing:stop', (data: { projectId: string; taskId: string }) => {
      socket.to(`project:${data.projectId}`).emit('user:stopped-typing', {
        userId, taskId: data.taskId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  console.log('Socket.io initialized');
  return io;
};

export const emitTaskUpdate = (projectId: string, data: object): void => {
  io?.to(`project:${projectId}`).emit('task:updated', data);
};

export const emitNotification = (userId: string, notification: object): void => {
  io?.to(`user:${userId}`).emit('notification:new', notification);
};

export const emitActivityFeed = (projectId: string, activity: object): void => {
  io?.to(`project:${projectId}`).emit('activity:new', {
    ...activity,
    timestamp: Date.now(),
  });
};

export const emitProjectUpdate = (projectId: string, data: object): void => {
  io?.to(`project:${projectId}`).emit('project:updated', data);
};

export const getIO = (): Server => io;