import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  createProject, getMyProjects, getProject,
  updateProject, inviteMember, getProjectActivity, getProjectAnalytics,
} from '../controllers/project.controller';
import taskRouter from './task.routes';

const router = Router();
router.use(authenticate);

router.get('/', getMyProjects);
router.post('/', createProject);
router.get('/:projectId', getProject);
router.put('/:projectId', updateProject);
router.post('/:projectId/invite', inviteMember);
router.get('/:projectId/activity', getProjectActivity);
router.get('/:projectId/analytics', getProjectAnalytics);

// Nest task routes under projects
router.use('/:projectId/tasks', taskRouter);

export default router;
