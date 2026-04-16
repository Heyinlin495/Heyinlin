// Project routes
import { Router } from 'express';
import { listProjects, getProject, createProject, updateProject, deleteProject } from '../controllers/projectController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Public
router.get('/user/:username', optionalAuth, listProjects);
router.get('/:slug', optionalAuth, getProject);

// Authenticated
router.post('/', authenticate, createProject);
router.put('/:slug', authenticate, updateProject);
router.delete('/:slug', authenticate, deleteProject);

export default router;
