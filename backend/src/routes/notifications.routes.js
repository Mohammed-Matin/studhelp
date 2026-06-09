import express from 'express';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from '../controllers/notifications.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticateUser, getNotifications);
router.get('/unread-count', authenticateUser, getUnreadCount);
router.patch('/read-all', authenticateUser, markAllAsRead);
router.patch('/:id/read', authenticateUser, markAsRead);

export default router;
