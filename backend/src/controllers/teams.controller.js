import pool from '../config/db.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createTeam = async (req, res) => {
    const { event_id, team_name } = req.body;
    const leaderId = req.user.userId;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const teamResult = await client.query(
            'INSERT INTO student.Teams (event_id, leader_id, team_name) VALUES ($1, $2, $3) RETURNING *',
            [event_id, leaderId, team_name]
        );
        const teamId = teamResult.rows[0].id;

        await client.query(
            'INSERT INTO student.Team_Members (team_id, user_id, status) VALUES ($1, $2, $3)',
            [teamId, leaderId, 'JOINED']
        );

        await client.query('COMMIT');
        res.status(201).json(teamResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Error creating team' });
    } finally {
        client.release();
    }
};

export const getTeams = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.*, u.username as leader_name,
                    COUNT(tm.user_id) FILTER (WHERE tm.status = 'JOINED') as member_count
             FROM student.Teams t
             JOIN student.users u ON u.id = t.leader_id
             LEFT JOIN student.Team_Members tm ON tm.team_id = t.id
             GROUP BY t.id, t.team_name, t.leader_id, u.username, t.event_id, t.created_at
             ORDER BY t.created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error retrieving teams' });
    }
};

export const getTeamById = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid team ID format' });
    }
    try {
        const team = (await pool.query(
            `SELECT t.*, u.username as leader_name
             FROM student.Teams t
             JOIN student.users u ON u.id = t.leader_id
             WHERE t.id = $1`,
            [id]
        )).rows[0];

        if (!team) return res.status(404).json({ error: 'Team not found' });

        const members = (await pool.query(
            `SELECT tm.user_id, u.username, u.full_name, tm.status, tm.joined_at
             FROM student.Team_Members tm
             JOIN student.users u ON u.id = tm.user_id
             WHERE tm.team_id = $1
             ORDER BY tm.joined_at`,
            [id]
        )).rows;

        res.json({ ...team, members });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error retrieving team' });
    }
};

export const inviteMember = async (req, res) => {
    const { team_id, user_id } = req.body;
    try {
        const team = (await pool.query(
            'SELECT leader_id, event_id FROM student.Teams WHERE id = $1',
            [team_id]
        )).rows[0];
        if (!team) return res.status(404).json({ error: 'Team not found' });

        const isLeader = req.user.userId === team.leader_id;
        let isManager = false;
        if (!isLeader) {
            const event = (await pool.query('SELECT club_id FROM student.Events WHERE id = $1', [team.event_id])).rows[0];
            if (event) {
                const role = (await pool.query(
                    'SELECT role_tag FROM student.Club_Members WHERE user_id = $1 AND club_id = $2',
                    [req.user.userId, event.club_id]
                )).rows[0]?.role_tag;
                isManager = role && ['CORE_COMMITTEE', 'EXECUTIVE'].includes(role);
            }
        }

        if (!isLeader && !isManager) {
            return res.status(403).json({ error: 'Only the team leader or club manager can invite members' });
        }

        await pool.query(
            'INSERT INTO student.Team_Members (team_id, user_id, status) VALUES ($1, $2, $3)',
            [team_id, user_id, 'INVITED']
        );
        res.status(201).json({ message: 'Member invited' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error inviting member' });
    }
};

export const updateTeamMember = async (req, res) => {
    const { id, userId } = req.params;
    if (!UUID_REGEX.test(id) || !UUID_REGEX.test(userId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }
    const { status } = req.body;
    try {
        const validStatuses = ['INVITED', 'JOINED', 'DECLINED', 'DROPPED'];
        if (!validStatuses.includes(status)) {
            return res.status(422).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            'UPDATE student.Team_Members SET status = $1 WHERE team_id = $2 AND user_id = $3 RETURNING *',
            [status, id, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found in team' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating member' });
    }
};

export const removeTeamMember = async (req, res) => {
    const { id, userId } = req.params;
    if (!UUID_REGEX.test(id) || !UUID_REGEX.test(userId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }
    try {
        const team = (await pool.query('SELECT leader_id, event_id FROM student.Teams WHERE id = $1', [id])).rows[0];
        if (!team) return res.status(404).json({ error: 'Team not found' });

        const isLeader = req.user.userId === team.leader_id;
        const isCommittee = (await pool.query(
            `SELECT 1 FROM student.Club_Members cm
             JOIN student.Events e ON e.club_id = cm.club_id
             WHERE e.id = $1 AND cm.user_id = $2 AND cm.role_tag IN ('CORE_COMMITTEE', 'EXECUTIVE')`,
            [team.event_id, req.user.userId]
        )).rows.length > 0;

        if (!isLeader && !isCommittee) {
            return res.status(403).json({ error: 'Only team leader or committee can remove members' });
        }

        await pool.query(
            'DELETE FROM student.Team_Members WHERE team_id = $1 AND user_id = $2',
            [id, userId]
        );
        res.json({ message: 'Member removed from team' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error removing member' });
    }
};

export const deleteTeam = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid team ID format' });
    }
    try {
        const team = (await pool.query('SELECT leader_id, event_id FROM student.Teams WHERE id = $1', [id])).rows[0];
        if (!team) return res.status(404).json({ error: 'Team not found' });

        const isLeader = req.user.userId === team.leader_id;
        const isCommittee = (await pool.query(
            `SELECT 1 FROM student.Club_Members cm
             JOIN student.Events e ON e.club_id = cm.club_id
             WHERE e.id = $1 AND cm.user_id = $2 AND cm.role_tag IN ('CORE_COMMITTEE', 'EXECUTIVE')`,
            [team.event_id, req.user.userId]
        )).rows.length > 0;

        if (!isLeader && !isCommittee) {
            return res.status(403).json({ error: 'Only team leader or committee can delete teams' });
        }

        await pool.query('DELETE FROM student.Teams WHERE id = $1', [id]);
        res.json({ message: 'Team deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting team' });
    }
};
