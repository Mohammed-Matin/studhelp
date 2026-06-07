import express from 'express';
import { createEvent, getEvents, getEventById } from '../controllers/events.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.post('/', createEvent);
router.get('/', getEvents);
router.get('/:id', getEventById);

export default router;
