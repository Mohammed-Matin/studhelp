import express from 'express';
import {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    postponeEvent,
    cancelEvent,
    getEventOrganizers,
    addOrganizer,
    removeOrganizer,
    registerForEvent,
    unregisterFromEvent,
    getEventRegistrations,
    getCalendarEvents,
    getEventClashes,
    deleteEvent,
} from '../controllers/events.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/calendar', authenticateUser, getCalendarEvents);
router.get('/clashes', authenticateUser, getEventClashes);

router.post('/', authenticateUser, createEvent);
router.get('/', getEvents);
router.get('/:id', authenticateUser, getEventById);
router.patch('/:id', authenticateUser, updateEvent);
router.delete('/:id', authenticateUser, deleteEvent);
router.patch('/:id/postpone', authenticateUser, postponeEvent);
router.patch('/:id/cancel', authenticateUser, cancelEvent);

router.get('/:id/organizers', authenticateUser, getEventOrganizers);
router.post('/:id/organizers', authenticateUser, addOrganizer);
router.delete('/:id/organizers/:userId', authenticateUser, removeOrganizer);

router.post('/:id/register', authenticateUser, registerForEvent);
router.delete('/:id/register', authenticateUser, unregisterFromEvent);
router.get('/:id/registrations', authenticateUser, getEventRegistrations);

export default router;
