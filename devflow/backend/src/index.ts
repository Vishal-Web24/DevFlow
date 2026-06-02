import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import { initSocket } from './services/socket.service';
import { errorHandler, notFound } from './middlewares/error.middleware';

import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import aiRoutes from './routes/ai.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();
const httpServer = createServer(app);

 
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes 
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  env: process.env.NODE_ENV,
}));


app.use(notFound);
app.use(errorHandler);


const PORT = parseInt(process.env.PORT || '5000', 10);

const startServer = async () => {
  try {
    await connectDB();
    connectRedis();
    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`\n🚀 DevFlow backend running on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV}`);
      console.log(` API: http://localhost:${PORT}/api\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
