import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middlewares/auth.middleware';
import {
  breakdownTask, planSprint, explainBug,
  summarizeMeeting, generateRoadmap, suggestTasks,
} from '../controllers/ai.controller';

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'AI rate limit exceeded, please wait.' }
});


const aiTimeout = (req: Request, res: Response, next: NextFunction) => {
  res.setTimeout(60000, () => {
    res.status(408).json({ error: 'AI request timed out. Please try again.' });
  });
  next();
};

router.use(authenticate, aiLimiter, aiTimeout);

router.post('/breakdown', breakdownTask);
router.post('/sprint-plan', planSprint);
router.post('/explain-bug', explainBug);
router.post('/summarize-meeting', summarizeMeeting);
router.post('/roadmap', generateRoadmap);
router.post('/suggest-tasks', suggestTasks);

export default router;