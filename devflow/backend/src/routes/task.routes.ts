import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  getProjectTasks, createTask, updateTask, deleteTask,
  addComment, createSprint,
} from '../controllers/task.controller';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get('/', getProjectTasks);
router.post('/', createTask);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);
router.post('/:taskId/comments', addComment);
router.post('/sprints', createSprint);

export default router;
