import express from 'express';
import multer from 'multer';
import { register, login, logout, rotateToken } from '../controllers/user.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

router.post('/register', upload.single('bonafide'), register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/rotate-token', authenticateUser, rotateToken);

export default router;
