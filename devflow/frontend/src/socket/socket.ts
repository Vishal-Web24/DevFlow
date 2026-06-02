import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(window.location.origin, {
    auth: { token },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => console.log('Socket connected:', socket?.id));
  socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

  const socketUrl = typeof window !== 'undefined' ? window.location.origin : '';
socket = io(socketUrl, {
    auth: { token },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => console.log('🔌 Socket connected:', socket?.id));
  socket.on('disconnect', (reason) => console.log('🔌 Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('🔌 Socket error:', err.message));

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};

export const joinProject = (projectId: string): void => {
  socket?.emit('join:project', projectId);
};

export const leaveProject = (projectId: string): void => {
  socket?.emit('leave:project', projectId);
};

export const emitTypingStart = (projectId: string, taskId: string): void => {
  socket?.emit('typing:start', { projectId, taskId });
};

export const emitTypingStop = (projectId: string, taskId: string): void => {
  socket?.emit('typing:stop', { projectId, taskId });
};
