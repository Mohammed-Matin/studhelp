import express from 'express';
import { createTeam, getTeams, getTeamById, inviteMember } from '../controllers/teams.controller.js';

const router = express.Router();

router.post('/', createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/invite', inviteMember);

export default router;
