import express from 'express';
import { createPayment, getPaymentStatus } from '../controllers/payments.controller.js';

const router = express.Router();

router.post('/', createPayment);
router.get('/:id', getPaymentStatus);

export default router;
