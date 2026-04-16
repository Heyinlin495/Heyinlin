// Follow routes
import { Router } from 'express';
import { followUser, unfollowUser, getFollowList, checkFollow } from '../controllers/followController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Public
router.get('/:username/:type', optionalAuth, getFollowList); // :type = followers | following
router.get('/check/:targetUsername', authenticate, checkFollow);

// Authenticated
router.post('/:targetUsername', authenticate, followUser);
router.delete('/:targetUsername', authenticate, unfollowUser);

export default router;
