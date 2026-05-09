import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, getNotifications);
router.put('/:id/read', verifyToken, markAsRead);

export default router;