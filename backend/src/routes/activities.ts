// Activity / Feed routes
import { Router } from 'express';
import { getFeed, getUnreadCount } from '../controllers/activityController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Unread count (auth required) — MUST be before /:username to avoid route collision
router.get('/unread/count', authenticate, getUnreadCount);

// Public feed
router.get('/:username', optionalAuth, getFeed);

export default router;
