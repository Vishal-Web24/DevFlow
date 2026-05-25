import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refreshTokenHandler, logout, getMe, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

const strictLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many attempts' } });
const normalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });

router.post('/register', strictLimiter, register);
router.post('/login', strictLimiter, login);
router.post('/refresh', normalLimiter, refreshTokenHandler);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

export default router;
