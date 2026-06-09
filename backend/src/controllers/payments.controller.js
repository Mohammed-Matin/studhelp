import Razorpay from 'razorpay';
import pool from '../config/db.js';
import crypto from 'crypto';
import config from '../config/config.config.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const razorpayInstance = new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret,
});

export const getRazorpayKey = async (req, res) => {
    res.json({ key_id: config.razorpayKeyId });
};

export const createPayment = async (req, res) => {
    const { event_id, amount } = req.body;
    const user_id = req.user.userId;

    if (!UUID_REGEX.test(event_id)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }

    try {
        const event = await pool.query('SELECT title FROM student.Events WHERE id = $1', [event_id]);
        if (event.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const options = {
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `receipt_event_${event_id}_user_${user_id}_${Date.now()}`
        };
        const order = await razorpayInstance.orders.create(options);

        await pool.query(
            'INSERT INTO student.Payments (user_id, event_id, razorpay_order_id, amount, status) VALUES ($1, $2, $3, $4, $5)',
            [user_id, event_id, order.id, amount, 'PENDING']
        );

        res.status(201).json({ message: "Payment order created", order, key_id: config.razorpayKeyId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error creating payment order' });
    }
};

export const getPaymentStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            UUID_REGEX.test(id)
                ? 'SELECT status FROM student.Payments WHERE id = $1'
                : 'SELECT status FROM student.Payments WHERE razorpay_order_id = $1',
            [id]
        );
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
    const expectedSignature = crypto.createHmac('sha256', config.razorpayKeySecret)
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
