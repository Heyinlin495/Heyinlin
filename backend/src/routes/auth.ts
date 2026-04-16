// Auth routes
import { Router } from 'express';
import { register, login, refreshToken, logout } from '../controllers/userController';
import { authenticate, authLimiter } from '../middleware/auth';
import { createCaptcha } from '../utils/captcha';

const router = Router();

router.get('/captcha', authLimiter, (req, res) => {
  const { sessionId, image } = createCaptcha();
  res.json({ success: true, data: { sessionId, image } });
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);

export default router;
