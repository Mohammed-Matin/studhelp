import express from 'express';
import { createPayment, getPaymentStatus, verifyPaymentSignature, getRazorpayKey } from '../controllers/payments.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/key', getRazorpayKey);
router.post('/', authenticateUser, createPayment);
router.get('/:id', authenticateUser, getPaymentStatus);
router.post('/verify', authenticateUser, verifyPaymentSignature);

export default router;
