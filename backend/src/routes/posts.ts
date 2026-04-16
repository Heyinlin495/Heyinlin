// Post routes
import { Router } from 'express';
import { listPosts, getPost, createPost, updatePost, deletePost } from '../controllers/postController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Public: list and get posts
router.get('/user/:username', optionalAuth, listPosts);
router.get('/:slug', optionalAuth, getPost);

// Authenticated: CRUD
router.post('/', authenticate, createPost);
router.put('/:slug', authenticate, updatePost);
router.delete('/:slug', authenticate, deletePost);

export default router;
