import express from 'express';
import { createClub, getClubs, getClubById } from '../controllers/clubs.controller.js';

const router = express.Router();

router.post('/', createClub);
router.get('/', getClubs);
router.get('/:id', getClubById);

export default router;
