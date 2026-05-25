import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middlewares/auth.middleware';
import {
  breakdownTask, planSprint, explainBug,
  summarizeMeeting, generateRoadmap, suggestTasks,
} from '../controllers/ai.controller';

const router = Router();

const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: 'AI rate limit exceeded, please wait.' } });

router.use(authenticate, aiLimiter);

router.post('/breakdown', breakdownTask);
router.post('/sprint-plan', planSprint);
router.post('/explain-bug', explainBug);
router.post('/summarize-meeting', summarizeMeeting);
router.post('/roadmap', generateRoadmap);
router.post('/suggest-tasks', suggestTasks);

export default router;
