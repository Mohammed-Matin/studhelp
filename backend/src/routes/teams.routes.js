import express from 'express';
import { createTeam, getTeams, getTeamById, inviteMember } from '../controllers/teams.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.post('/', createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/invite', inviteMember);

export default router;
