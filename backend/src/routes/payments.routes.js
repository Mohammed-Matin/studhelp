import express from 'express';
import { createPayment, getPaymentStatus, verifyPaymentSignature } from '../controllers/payments.controller.js';

const router = express.Router();

router.post('/', createPayment);
router.get('/:id', getPaymentStatus);
router.post('/verify', verifyPaymentSignature);

export default router;
