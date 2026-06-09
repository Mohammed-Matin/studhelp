import express from 'express';
import {
    createClub,
    getClubs,
    getClubById,
    updateClub,
    getClubMembers,
    addMember,
    updateMemberRole,
    removeMember,
    followClub,
    unfollowClub,
    getClubFollowers,
    requestJoin,
    getJoinRequests,
    handleJoinRequest,
    getGallery,
    uploadGalleryImage,
    deleteGalleryImage,
    sendFollowerMessage,
    getFollowerMessages,
    replyToFollowerMessage,
    getClubDashboard,
    getBudget,
    getBudgetTransactions,
    addBudgetTransaction,
    addDonation,
    getUserClubs,
    getFollowedClubs,
} from '../controllers/clubs.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';
import { galleryUpload } from '../middlewares/upload.js';
import {
    validateBody,
    createClubSchema,
    updateClubSchema,
    joinRequestSchema,
    addMemberSchema,
    updateMemberRoleSchema,
    followerMessageSchema,
    budgetTransactionSchema,
} from '../validators/clubs.validators.js';

const router = express.Router();

// ─── User's clubs ─────────────────────────────────────────────
router.get('/mine', authenticateUser, getUserClubs);
router.get('/following', authenticateUser, getFollowedClubs);

// ─── Club CRUD ────────────────────────────────────────────────
router.post('/', authenticateUser, validateBody(createClubSchema), createClub);
router.get('/', getClubs);
router.get('/:id', authenticateUser, getClubById);
router.patch('/:id', authenticateUser, validateBody(updateClubSchema), updateClub);

// ─── Members ─────────────────────────────────────────────────
router.get('/:id/members', authenticateUser, getClubMembers);
router.post('/:id/members', authenticateUser, validateBody(addMemberSchema), addMember);
router.patch('/:id/members/:userId', authenticateUser, validateBody(updateMemberRoleSchema), updateMemberRole);
router.delete('/:id/members/:userId', authenticateUser, removeMember);

// ─── Followers ───────────────────────────────────────────────
router.post('/:id/follow', authenticateUser, followClub);
router.delete('/:id/follow', authenticateUser, unfollowClub);
router.get('/:id/followers', authenticateUser, getClubFollowers);

// ─── Join Requests ───────────────────────────────────────────
router.post('/:id/requests', authenticateUser, validateBody(joinRequestSchema), requestJoin);
router.get('/:id/requests', authenticateUser, getJoinRequests);
router.patch('/:id/requests/:requestId', authenticateUser, handleJoinRequest);

// ─── Gallery ─────────────────────────────────────────────────
router.get('/:id/gallery', authenticateUser, getGallery);
router.post('/:id/gallery', authenticateUser, galleryUpload.single('image'), uploadGalleryImage);
router.delete('/:id/gallery/:imageId', authenticateUser, deleteGalleryImage);

// ─── Follower Messages ──────────────────────────────────────
router.post('/:id/messages', authenticateUser, validateBody(followerMessageSchema), sendFollowerMessage);
router.get('/:id/messages', authenticateUser, getFollowerMessages);
router.patch('/:id/messages/:messageId', authenticateUser, replyToFollowerMessage);

// ─── Dashboard ───────────────────────────────────────────────
router.get('/:id/dashboard', authenticateUser, getClubDashboard);

// ─── Budget ─────────────────────────────────────────────────
router.get('/:id/budget', authenticateUser, getBudget);
router.get('/:id/budget/transactions', authenticateUser, getBudgetTransactions);
router.post('/:id/budget/transactions', authenticateUser, validateBody(budgetTransactionSchema), addBudgetTransaction);

// ─── Donations ──────────────────────────────────────────────
router.post('/:id/donations', authenticateUser, addDonation);

export default router;
