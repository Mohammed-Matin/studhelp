import pool from '../config/db.js';

export const createClub = async (req, res) => {
    const { name, description, budget_balance } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO student.Clubs (name, description, budget_balance) VALUES ($1, $2, $3) RETURNING *',
            [name, description, budget_balance || 0.00]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error creating club' });
    }
};

export const getClubs = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM student.Clubs');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving clubs' });
    }
};

export const getClubById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM student.Clubs WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Club not found' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving club' });
    }
};
