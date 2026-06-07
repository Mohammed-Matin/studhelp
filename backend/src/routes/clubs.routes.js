import express from 'express';
import { createClub, getClubs, getClubById } from '../controllers/clubs.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.post('/', createClub);
router.get('/', getClubs);
router.get('/:id', getClubById);

export default router;
