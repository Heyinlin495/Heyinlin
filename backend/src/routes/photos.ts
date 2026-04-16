// Photo routes
import { Router } from 'express';
import { listPhotos, createPhoto, updatePhoto, deletePhoto } from '../controllers/photoController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Public
router.get('/user/:username', optionalAuth, listPhotos);

// Authenticated
router.post('/', authenticate, createPhoto);
router.put('/:id', authenticate, updatePhoto);
router.delete('/:id', authenticate, deletePhoto);

export default router;
