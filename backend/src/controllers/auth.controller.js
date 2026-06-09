import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import config from '../config/config.config.js';
import { registerSchema, loginSchema } from '../validators/auth.validators.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SALT_ROUNDS = 12;

const signToken = (user) => {
    return jwt.sign(
        { userId: user.id, role: user.role, status: user.status },
        config.jwtSecret,
        { expiresIn: '7d' }
    );
};

export const register = async (req, res) => {
    try {
        console.log('Register body keys:', Object.keys(req.body));
        console.log('Register file:', req.file?.originalname || 'no file');
        const parsed = registerSchema.parse(req.body);
        const bonafideUrl = req.file?.path || null;

        const [existingUsername, existingEmail, existingAdmission] = await Promise.all([
            pool.query('SELECT id FROM student.users WHERE username = $1', [parsed.username]),
            pool.query('SELECT id FROM student.users WHERE email = $1', [parsed.svnit_email]),
            pool.query('SELECT id FROM student.users WHERE admission_no = $1', [parsed.admission_no]),
        ]);

        const conflicts = [];
        if (existingUsername.rows.length > 0) conflicts.push('Username');
        if (existingEmail.rows.length > 0) conflicts.push('Email');
        if (existingAdmission.rows.length > 0) conflicts.push('Admission number');

        if (conflicts.length > 0) {
            return res.status(409).json({
                error: `${conflicts.join(', ')} already exist${conflicts.length === 1 ? 's' : ''}`,
                conflicts,
            });
        }

        const password_hash = await bcrypt.hash(parsed.password, SALT_ROUNDS);

        const result = await pool.query(
            `INSERT INTO student.users
             (username, email, password_hash, full_name, admission_no, branch, semester, degree, gender, mobile_no, bonafide_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING id, username, email, role, status, full_name, created_at`,
            [
                parsed.username,
                parsed.svnit_email,
                password_hash,
                parsed.full_name,
                parsed.admission_no,
                parsed.branch,
                parsed.semester,
                parsed.degree,
                parsed.gender,
                parsed.mobile_no,
                bonafideUrl,
            ]
        );

        const user = result.rows[0];
        res.status(201).json({ userId: user.id, status: user.status });
    } catch (error) {
        if (error?.issues) {
            return res.status(422).json({
                error: 'Validation failed',
                details: error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
            });
        }
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

export const login = async (req, res) => {
    try {
        const parsed = loginSchema.parse(req.body);

        const result = await pool.query(
            'SELECT id, username, email, password_hash, role, status, full_name FROM student.users WHERE username = $1 OR email = $1',
            [parsed.identifier]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(parsed.password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = signToken(user);

        res.json({
            token,
            role: user.role,
            status: user.status,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                status: user.status,
            },
        });
    } catch (error) {
        if (error?.issues) {
            return res.status(422).json({
                error: 'Validation failed',
                details: error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
            });
        }
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

export const logout = async (req, res) => {
    res.json({ message: 'Logged out successfully' });
};

export const rotateToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const oldToken = authHeader.split(' ')[1];
        const decoded = jwt.verify(oldToken, config.jwtSecret);

        const result = await pool.query(
            'SELECT id, role, status FROM student.users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const newToken = signToken(result.rows[0]);
        res.json({ token: newToken });
    } catch (error) {
        console.error('Rotate token error:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const verifyUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        if (!UUID_REGEX.test(userId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        if (!['VERIFIED', 'REJECTED'].includes(status)) {
            return res.status(422).json({ error: 'Status must be VERIFIED or REJECTED' });
        }

        const result = await pool.query(
            `UPDATE student.users SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND role = 'STUDENT'
             RETURNING id, username, email, role, status, full_name`,
            [status, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ message: `User ${status.toLowerCase()} successfully`, user: result.rows[0] });
    } catch (error) {
        console.error('Verify user error:', error);
        res.status(500).json({ error: 'Server error during verification' });
    }
};

export const getPendingStudents = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, full_name, admission_no, branch, semester, degree, gender, mobile_no, bonafide_url, created_at
             FROM student.users
             WHERE role = 'STUDENT' AND status = 'PENDING'
             ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get pending students error:', error);
        res.status(500).json({ error: 'Server error fetching pending students' });
    }
};

export const getProfile = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, full_name, admission_no, branch, semester, degree, gender, mobile_no, avatar_url, bonafide_url, role, status, created_at
             FROM student.users WHERE id = $1`,
            [req.user.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};

export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file?.path) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const result = await pool.query(
            `UPDATE student.users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
             RETURNING id, avatar_url`,
            [req.file.path, req.user.userId]
        );
        res.json({ avatar_url: result.rows[0].avatar_url });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ error: 'Server error uploading avatar' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { full_name, branch, semester, degree, gender, mobile_no } = req.body;

        const result = await pool.query(
            `UPDATE student.users
             SET full_name = COALESCE($1, full_name),
                 branch = COALESCE($2, branch),
                 semester = COALESCE($3, semester),
                 degree = COALESCE($4, degree),
                 gender = COALESCE($5, gender),
                 mobile_no = COALESCE($6, mobile_no),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING id, username, email, full_name, admission_no, branch, semester, degree, gender, mobile_no, avatar_url, role, status`,
            [full_name, branch, semester, degree, gender, mobile_no, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error updating profile' });
    }
};
