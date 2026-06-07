import express from 'express';
import { sendMessage, getMessages } from '../controllers/messages.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.post('/', sendMessage);
router.get('/', getMessages);

export default router;
