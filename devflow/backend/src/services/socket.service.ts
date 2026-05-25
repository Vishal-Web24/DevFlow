import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server;

interface AuthSocket extends Socket {
  userId?: string;
  userName?: string;
}

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Auth middleware 
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; name?: string };
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection handler 
  io.on('connection', (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`🔌 User connected: ${userId} (socket: ${socket.id})`);

    // Join personal room for direct notifications
    socket.join(`user:${userId}`);

    // ── Project room management ──
    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('user:joined', { userId, socketId: socket.id });
    });

    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('user:left', { userId });
    });

    // ── Typing indicators ──
    socket.on('typing:start', ({ projectId, taskId }: { projectId: string; taskId: string }) => {
      socket.to(`project:${projectId}`).emit('user:typing', { userId, taskId, timestamp: Date.now() });
    });

    socket.on('typing:stop', ({ projectId, taskId }: { projectId: string; taskId: string }) => {
      socket.to(`project:${projectId}`).emit('user:stopped-typing', { userId, taskId });
    });

    // ── Cursor position (collaborative) ──
    socket.on('cursor:move', ({ projectId, position }: { projectId: string; position: { x: number; y: number } }) => {
      socket.to(`project:${projectId}`).emit('cursor:update', { userId, position });
    });

    // ── Disconnect ──
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${userId} (${reason})`);
      // Broadcast to all rooms this user was in
      io.emit('user:offline', { userId });
    });

    // ── Ping/Pong for connection health ──
    socket.on('ping', () => socket.emit('pong', { timestamp: Date.now() }));
  });

  console.log('✅ Socket.io initialized');
  return io;
};

// ─── Emitter Utilities (called from controllers) ──────────

export const emitTaskUpdate = (projectId: string, data: object): void => {
  io?.to(`project:${projectId}`).emit('task:updated', data);
};

export const emitNotification = (userId: string, notification: object): void => {
  io?.to(`user:${userId}`).emit('notification:new', notification);
};

export const emitActivityFeed = (projectId: string, activity: object): void => {
  io?.to(`project:${projectId}`).emit('activity:new', { ...activity, timestamp: Date.now() });
};

export const emitProjectUpdate = (projectId: string, data: object): void => {
  io?.to(`project:${projectId}`).emit('project:updated', data);
};

export const getConnectedUsers = (projectId: string): number => {
  return io?.to(`project:${projectId}`).allSockets().then(s => s.size) as unknown as number || 0;
};

export const getIO = (): Server => io;
