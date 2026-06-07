import pool from '../config/db.js';

// Transaction Safety for complex operations
export const createEvent = async (req, res) => {
    const { club_id, title, description, start_time, end_time, entry_fee } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const result = await client.query(
            'INSERT INTO student.Events (club_id, title, description, start_time, end_time, entry_fee) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [club_id, title, description, start_time, end_time, entry_fee || 0.00]
        );
        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: "Error creating event", error });
    } finally {
        client.release();
    }
};

export const getEvents = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM student.Events ORDER BY start_time ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving events' });
    }
};

export const getEventById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM student.Events WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving event' });
    }
};
