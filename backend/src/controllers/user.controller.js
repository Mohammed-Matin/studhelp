import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const registerSchema = z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6),
    full_name: z.string().max(150).optional(),
    admission_no: z.string().max(20).optional(),
    branch: z.string().max(100).optional(),
    semester: z.string().optional().transform(val => val ? parseInt(val) : null), // handle form string
    degree: z.enum(['BTECH', 'MTECH', 'PHD', 'MSC']).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    mobile_no: z.string().max(15).optional(),
});

const loginSchema = z.object({
    identifier: z.string(), // can be email or username
    password: z.string()
});

export const register = async (req, res) => {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors });
        }

        const data = validation.data;

        // Handle file upload
        let bonafide_url = null;
        if (req.file) {
            bonafide_url = `/uploads/${req.file.filename}`;
        }

        // Check if user already exists
        const userCheck = await pool.query(
            'SELECT id FROM student.users WHERE email = $1 OR username = $2',
            [data.email, data.username]
        );
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ error: 'User with this email or username already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(data.password, saltRounds);

        // Insert into database
        const result = await pool.query(
            `INSERT INTO student.users (
                username, email, password_hash, full_name, admission_no,
                branch, semester, degree, gender, mobile_no, bonafide_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, username, email, status`,
            [
                data.username, data.email, password_hash, data.full_name, data.admission_no,
                data.branch, data.semester, data.degree, data.gender, data.mobile_no, bonafide_url
            ]
        );

        res.status(201).json({ message: "User registered successfully", user: result.rows[0] });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
};

export const login = async (req, res) => {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors });
        }

        const { identifier, password } = validation.data;

        const result = await pool.query(
            'SELECT * FROM student.users WHERE email = $1 OR username = $1',
            [identifier]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, role: user.role, status: user.status },
            process.env.JWT_SECRET || 'fallback_secret_for_dev',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
};

export const logout = (req, res) => {
    // In a stateless JWT setup, logout is primarily handled client-side by deleting the token.
    // We can just return a success response here.
    res.status(200).json({ message: "Logged out successfully" });
};

export const rotateToken = (req, res) => {
    // Very basic token rotation/refresh based on existing valid token from auth middleware
    try {
        const user = req.user; // Set by auth middleware
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const newToken = jwt.sign(
            { id: user.id, role: user.role, status: user.status },
            process.env.JWT_SECRET || 'fallback_secret_for_dev',
            { expiresIn: '1d' }
        );

        res.status(200).json({ token: newToken });
    } catch(error) {
        console.error("Rotate token error:", error);
        res.status(500).json({ error: 'Internal server error rotating token' });
    }
};
