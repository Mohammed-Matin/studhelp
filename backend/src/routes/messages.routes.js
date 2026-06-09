import express from 'express';
import {
    searchUsers,
    getDMConversations,
    getDMThread,
    sendDMMessage,
    getGroupMessages,
    sendGroupMessage,
    getClubRoleGroups,
} from '../controllers/messages.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/search', authenticateUser, searchUsers);
router.get('/conversations', authenticateUser, getDMConversations);
router.get('/dm/:userId', authenticateUser, getDMThread);
router.post('/dm', authenticateUser, sendDMMessage);
router.get('/group/:groupType/:groupId', authenticateUser, getGroupMessages);
router.post('/group/:groupType/:groupId', authenticateUser, sendGroupMessage);
router.get('/club/:clubId/groups', authenticateUser, getClubRoleGroups);

export default router;
