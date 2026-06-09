import bcrypt from 'bcrypt';
import pool from '../config/db.js';

const SALT_ROUNDS = 12;

async function seed() {
    const client = await pool.connect();
    try {
        console.log('Seeding admin user...');

        const existingAdmin = await client.query(
            "SELECT id FROM student.users WHERE role = 'ADMIN'"
        );

        if (existingAdmin.rows.length > 0) {
            console.log('Admin user already exists. Skipping seed.');
            return;
        }

        const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);

        await client.query(
            `INSERT INTO student.users (username, email, password_hash, role, status, full_name)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            ['admin', 'admin@studhelp.com', passwordHash, 'ADMIN', 'VERIFIED', 'System Admin']
        );

        console.log('Admin user created successfully');
        console.log('  Username: admin');
        console.log('  Password: admin123');
        console.log('  Email: admin@studhelp.com');
    } catch (error) {
        console.error('Seed failed:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
