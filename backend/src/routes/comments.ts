// Comment routes
import { Router } from 'express';
import { listComments, createComment, deleteComment } from '../controllers/commentController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Public: list comments
router.get('/:targetType/:targetId', optionalAuth, listComments);

// Authenticated
router.post('/', authenticate, createComment);
router.delete('/:id', authenticate, deleteComment);

export default router;
