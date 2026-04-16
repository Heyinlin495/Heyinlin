// User routes — profile management
import { Router } from 'express';
import multer from 'multer';
import { getProfile, getMyProfile, updateProfile, updateProfileBio, deleteAccount, uploadAvatar, changePassword } from '../controllers/userController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Public profile
router.get('/:username', optionalAuth, getProfile);

// Authenticated user operations
router.get('/me/profile', authenticate, getMyProfile);
router.put('/me/profile', authenticate, updateProfile);
router.put('/me/bio', authenticate, updateProfileBio);
router.post('/me/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.put('/me/password', authenticate, changePassword);
router.delete('/me/account', authenticate, deleteAccount);

export default router;
