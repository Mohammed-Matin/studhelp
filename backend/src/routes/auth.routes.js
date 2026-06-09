import express from 'express';
import {
    register,
    login,
    logout,
    rotateToken,
    verifyUser,
    getPendingStudents,
    getProfile,
    updateProfile,
    uploadAvatar,
} from '../controllers/auth.controller.js';
import { authenticateUser, authorizeAdmin } from '../middlewares/auth.middleware.js';
import upload, { avatarUpload } from '../middlewares/upload.js';

const router = express.Router();

router.post('/register', upload.single('bonafide_file'), register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/rotate-token', rotateToken);
router.get('/profile', authenticateUser, getProfile);
router.post('/avatar', authenticateUser, avatarUpload.single('avatar'), uploadAvatar);
router.patch('/profile', authenticateUser, updateProfile);
router.patch('/verify/:userId', authenticateUser, authorizeAdmin, verifyUser);
router.get('/pending', authenticateUser, authorizeAdmin, getPendingStudents);

export default router;
