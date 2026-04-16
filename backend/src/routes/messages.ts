// Message routes
import { Router } from 'express';
import { listConversations, getConversation, sendMessage, deleteMessage } from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All message routes require auth
router.get('/conversations', authenticate, listConversations);
router.get('/:targetUsername', authenticate, getConversation);
router.post('/send', authenticate, sendMessage);
router.delete('/:id', authenticate, deleteMessage);

export default router;
