import Razorpay from 'razorpay';
import pool from '../config/db.js';
import crypto from 'crypto';

// Assuming config is properly set up with keys
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

export const createPayment = async (req, res) => {
    const { user_id, event_id, amount } = req.body;

    try {
        // Step 1: Create Order in Razorpay

        const options = {
            amount: amount * 100, // amount in smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_event_${event_id}_user_${user_id}`
        };
        const order = await razorpayInstance.orders.create(options);


        // Step 2: Store Payment record in PostgreSQL (status: PENDING)
        await pool.query(
            'INSERT INTO student.Payments (user_id, event_id, razorpay_order_id, amount, status) VALUES ($1, $2, $3, $4, $5)',
            [user_id, event_id, order.id, amount, 'PENDING']
        );

        res.status(201).json({ message: "Payment order created", order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error creating payment order' });
    }
};

export const getPaymentStatus = async (req, res) => {
    const { id } = req.params; // This could be the payment record ID or order ID
    try {
        const result = await pool.query('SELECT status FROM student.Payments WHERE id = $1 OR razorpay_order_id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
        res.status(200).json({ status: result.rows[0].status });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving payment status' });
    }
};

export const verifyPaymentSignature = async (req, res) => {
    // Webhook or frontend callback endpoint to verify signature and update DB to 'SUCCESS'
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Cryptographic verification logic goes here using crypto library and Razorpay Secret
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret')
                                    .update(text.toString())
                                    .digest('hex');

    if (expectedSignature === razorpay_signature) {
        try {
            await pool.query(
                'UPDATE student.Payments SET status = $1, razorpay_payment_id = $2, razorpay_signature = $3 WHERE razorpay_order_id = $4',
                ['SUCCESS', razorpay_payment_id, razorpay_signature, razorpay_order_id]
            );
            res.status(200).json({ message: "Payment verified successfully" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Server error verifying payment' });
        }
    } else {
        res.status(400).json({ message: "Invalid signature passed!" });
    }
};
