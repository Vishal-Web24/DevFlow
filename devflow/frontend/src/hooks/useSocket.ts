import { useEffect } from 'react';
import { getSocket, joinProject, leaveProject } from '../socket/socket';
import { useAppDispatch } from './redux';
import { socketTaskUpdate } from '../store/slices/taskSlice';
import { addNotification } from '../store/slices/notificationSlice';
import toast from 'react-hot-toast';

export const useProjectSocket = (projectId: string | undefined) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!projectId) return;
    const socket = getSocket();
    if (!socket) return;

    joinProject(projectId);

    socket.on('task:updated', (data: any) => {
      dispatch(socketTaskUpdate(data));
    });

    socket.on('notification:new', (notification: any) => {
      dispatch(addNotification(notification));
      toast(notification.message, { icon: '🔔', duration: 4000 });
    });

    socket.on('activity:new', (_activity: any) => {
      
    });

    socket.on('user:joined', ({ userId }: { userId: string }) => {
      console.log('User joined project:', userId);
    });

    return () => {
      leaveProject(projectId);
      socket.off('task:updated');
      socket.off('notification:new');
      socket.off('activity:new');
      socket.off('user:joined');
    };
  }, [projectId, dispatch]);
};