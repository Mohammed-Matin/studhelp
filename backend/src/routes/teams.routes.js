import express from 'express';
import {
    createTeam,
    getTeams,
    getTeamById,
    inviteMember,
    updateTeamMember,
    removeTeamMember,
    deleteTeam,
} from '../controllers/teams.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', authenticateUser, createTeam);
router.get('/', getTeams);
router.get('/:id', authenticateUser, getTeamById);
router.delete('/:id', authenticateUser, deleteTeam);
router.post('/invite', authenticateUser, inviteMember);
router.patch('/:id/members/:userId', authenticateUser, updateTeamMember);
router.delete('/:id/members/:userId', authenticateUser, removeTeamMember);

export default router;
