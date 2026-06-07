import express from 'express';
import { createPayment, getPaymentStatus, verifyPaymentSignature } from '../controllers/payments.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.post('/', createPayment);
router.get('/:id', getPaymentStatus);
router.post('/verify', verifyPaymentSignature);

export default router;
