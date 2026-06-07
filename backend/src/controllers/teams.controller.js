import pool from '../config/db.js';

export const createTeam = async (req, res) => {
    const { event_id, leader_id, team_name } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const teamResult = await client.query(
            'INSERT INTO student.Teams (event_id, leader_id, team_name) VALUES ($1, $2, $3) RETURNING *',
            [event_id, leader_id, team_name]
        );
        const teamId = teamResult.rows[0].id;

        await client.query(
            'INSERT INTO student.Team_Members (team_id, user_id, status) VALUES ($1, $2, $3)',
            [teamId, leader_id, 'JOINED']
        );

        await client.query('COMMIT');
        res.status(201).json(teamResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: "Error creating team", error });
    } finally {
        client.release();
    }
};

export const getTeams = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM student.Teams');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving teams' });
    }
};

export const getTeamById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM student.Teams WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Team not found' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving team' });
    }
};

export const inviteMember = async (req, res) => {
    const { team_id, user_id } = req.body;
    try {
        await pool.query(
            'INSERT INTO student.Team_Members (team_id, user_id, status) VALUES ($1, $2, $3)',
            [team_id, user_id, 'INVITED']
        );
        res.status(201).json({ message: "Member invited successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error inviting member' });
    }
};
