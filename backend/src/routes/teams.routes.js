import express from 'express';
import { createTeam, getTeams, getTeamById } from '../controllers/teams.controller.js';

const router = express.Router();

router.post('/', createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);

export default router;
