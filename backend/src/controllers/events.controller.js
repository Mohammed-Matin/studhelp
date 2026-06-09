import pool from '../config/db.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MANAGER_ROLES = ['CORE_COMMITTEE', 'EXECUTIVE'];

async function getUserClubRole(userId, clubId) {
    const result = await pool.query(
        'SELECT role_tag FROM student.Club_Members WHERE user_id = $1 AND club_id = $2',
        [userId, clubId]
    );
    return result.rows[0]?.role_tag || null;
}

async function isEventOrganizer(userId, eventId) {
    const result = await pool.query(
        'SELECT 1 FROM student.Event_Organizers WHERE user_id = $1 AND event_id = $2',
        [userId, eventId]
    );
    return result.rows.length > 0;
}

async function isRegisteredForEvent(userId, eventId) {
    const result = await pool.query(
        'SELECT 1 FROM student.Event_Registrations WHERE user_id = $1 AND event_id = $2',
        [userId, eventId]
    );
    return result.rows.length > 0;
}

// ─── CRUD ─────────────────────────────────────────────────────

export const createEvent = async (req, res) => {
    const { club_id, title, description, start_time, end_time, participation_type, max_teams, max_participants } = req.body;
    try {
        const clubResult = await pool.query('SELECT id FROM student.Clubs WHERE id = $1', [club_id]);
        if (clubResult.rows.length === 0) {
            return res.status(404).json({ error: 'Club not found' });
        }

        const role = await getUserClubRole(req.user.userId, club_id);
        if (!role || !MANAGER_ROLES.includes(role)) {
            return res.status(403).json({ error: 'Only club managers can create events' });
        }

        const result = await pool.query(
            `INSERT INTO student.Events (club_id, title, description, start_time, end_time, participation_type, max_teams, max_participants)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [club_id, title, description, start_time, end_time, participation_type || 'BOTH', max_teams, max_participants]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error creating event' });
    }
};

export const getEvents = async (req, res) => {
    const { club_id, status, month, year } = req.query;
    try {
        if (club_id && !UUID_REGEX.test(club_id)) {
            return res.status(400).json({ error: 'Invalid club ID format' });
        }

        let query = `SELECT e.*, c.name as club_name FROM student.Events e JOIN student.Clubs c ON c.id = e.club_id WHERE 1=1`;
        const params = [];
        let paramIndex = 1;

        if (club_id) {
            query += ` AND e.club_id = $${paramIndex++}`;
            params.push(club_id);
        }
        if (status) {
            query += ` AND e.status = $${paramIndex++}`;
            params.push(status);
        }
        if (month && year) {
            query += ` AND EXTRACT(MONTH FROM e.start_time) = $${paramIndex++} AND EXTRACT(YEAR FROM e.start_time) = $${paramIndex++}`;
            params.push(parseInt(month), parseInt(year));
        }

        query += ' ORDER BY e.start_time ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving events' });
    }
};

export const getEventById = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }
    try {
        const result = await pool.query(
            `SELECT e.*, c.name as club_name, c.id as club_id
             FROM student.Events e
             JOIN student.Clubs c ON c.id = e.club_id
             WHERE e.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const event = result.rows[0];
        const isOrganizer = await isEventOrganizer(req.user.userId, id);
        const isRegistered = await isRegisteredForEvent(req.user.userId, id);
        const role = await getUserClubRole(req.user.userId, event.club_id);
        const canManage = role && MANAGER_ROLES.includes(role);

        const organizers = (await pool.query(
            `SELECT eo.user_id, u.username, u.full_name
             FROM student.Event_Organizers eo
             JOIN student.users u ON u.id = eo.user_id
             WHERE eo.event_id = $1`,
            [id]
        )).rows;

        const teams = (await pool.query(
            `SELECT t.id, t.team_name, t.leader_id, u.username as leader_name,
                    COUNT(tm.user_id) as member_count
             FROM student.Teams t
             JOIN student.users u ON u.id = t.leader_id
             LEFT JOIN student.Team_Members tm ON tm.team_id = t.id AND tm.status = 'JOINED'
             WHERE t.event_id = $1
             GROUP BY t.id, t.team_name, t.leader_id, u.username`,
            [id]
        )).rows;

        const registrationCount = (await pool.query(
            'SELECT COUNT(*) FROM student.Event_Registrations WHERE event_id = $1',
            [id]
        )).rows[0].count;

        const clashEvents = (await pool.query(
            `SELECT id, title, start_time, end_time FROM student.Events
             WHERE club_id = $1 AND id != $2 AND status NOT IN ('PAST', 'CANCELLED')
             AND start_time < $4 AND end_time > $3`,
            [event.club_id, id, event.start_time, event.end_time]
        )).rows;

        res.json({
            ...event,
            isOrganizer,
            isRegistered,
            canManage,
            userRole: role,
            organizers,
            teams,
            registrationCount: parseInt(registrationCount),
            clashes: clashEvents,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving event' });
    }
};

export const updateEvent = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }
    const { title, description, banner_url, start_time, end_time, participation_type, max_teams, max_participants } = req.body;
    try {
        const result = await pool.query(
            `UPDATE student.Events
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 banner_url = COALESCE($3, banner_url),
                 start_time = COALESCE($4, start_time),
                 end_time = COALESCE($5, end_time),
                 participation_type = COALESCE($6, participation_type),
                 max_teams = $7,
                 max_participants = $8,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $9
             RETURNING *`,
            [title, description, banner_url, start_time, end_time, participation_type, max_teams ?? null, max_participants ?? null, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating event' });
    }
};

export const postponeEvent = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }
    const { start_time, end_time } = req.body;
    try {
        const result = await pool.query(
            `UPDATE student.Events
             SET start_time = $1, end_time = $2, status = 'POSTPONED', updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 RETURNING *`,
            [start_time, end_time, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error postponing event' });
    }
};

export const cancelEvent = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }
    try {
        const result = await pool.query(
            "UPDATE student.Events SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error cancelling event' });
    }
};

// ─── Organizers ───────────────────────────────────────────────

export const getEventOrganizers = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }
    try {
        const result = await pool.query(
            `SELECT eo.user_id, u.username, u.full_name, u.email, eo.created_at
             FROM student.Event_Organizers eo
             JOIN student.users u ON u.id = eo.user_id
             WHERE eo.event_id = $1`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving organizers' });
    }
};

export const addOrganizer = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }

    const event = (await pool.query('SELECT club_id FROM student.Events WHERE id = $1', [id])).rows[0];
    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    const role = await getUserClubRole(req.user.userId, event.club_id);
    if (!role || !MANAGER_ROLES.includes(role)) {
        return res.status(403).json({ error: 'Only club managers can add organizers' });
    }

    const { user_id } = req.body;
    try {
        await pool.query(
            'INSERT INTO student.Event_Organizers (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, user_id]
        );
        res.status(201).json({ message: 'Organizer added' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error adding organizer' });
    }
};

export const removeOrganizer = async (req, res) => {
    const { id, userId } = req.params;
    if (!UUID_REGEX.test(id) || !UUID_REGEX.test(userId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }
    try {
        await pool.query(
            'DELETE FROM student.Event_Organizers WHERE event_id = $1 AND user_id = $2',
            [id, userId]
        );
        res.json({ message: 'Organizer removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error removing organizer' });
    }
};

// ─── Registration ─────────────────────────────────────────────

export const registerForEvent = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }
    try {
        const event = (await pool.query('SELECT * FROM student.Events WHERE id = $1', [id])).rows[0];
        if (!event) return res.status(404).json({ error: 'Event not found' });

        if (event.status !== 'UPCOMING' && event.status !== 'LIVE') {
            return res.status(400).json({ error: 'Event is not accepting registrations' });
        }

        const isOrganizer = await isEventOrganizer(req.user.userId, id);
        if (isOrganizer) {
            return res.status(403).json({ error: 'Event organizers cannot participate' });
        }

        const alreadyRegistered = await isRegisteredForEvent(req.user.userId, id);
        if (alreadyRegistered) {
            return res.status(409).json({ error: 'Already registered for this event' });
        }

        if (event.max_participants) {
            const count = (await pool.query('SELECT COUNT(*) FROM student.Event_Registrations WHERE event_id = $1', [id])).rows[0].count;
            if (parseInt(count) >= event.max_participants) {
                return res.status(400).json({ error: 'Event is full' });
            }
        }

        await pool.query(
            'INSERT INTO student.Event_Registrations (event_id, user_id) VALUES ($1, $2)',
            [id, req.user.userId]
        );
        res.status(201).json({ message: 'Registered for event' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error registering for event' });
    }
};

export const getEventRegistrations = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }
    try {
        const result = await pool.query(
            `SELECT er.user_id, u.username, u.full_name, u.email, er.registered_at
             FROM student.Event_Registrations er
             JOIN student.users u ON u.id = er.user_id
             WHERE er.event_id = $1
             ORDER BY er.registered_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving registrations' });
    }
};

export const unregisterFromEvent = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }
    try {
        await pool.query(
            'DELETE FROM student.Event_Registrations WHERE event_id = $1 AND user_id = $2',
            [id, req.user.userId]
        );
        res.json({ message: 'Unregistered from event' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error unregistering' });
    }
};

// ─── Calendar ─────────────────────────────────────────────────

export const getCalendarEvents = async (req, res) => {
    const { month, year, club_id } = req.query;
    try {
        if (!month || !year) {
            return res.status(422).json({ error: 'Month and year are required' });
        }

        if (club_id && !UUID_REGEX.test(club_id)) {
            return res.status(400).json({ error: 'Invalid club ID format' });
        }

        const query = `
            SELECT e.*, c.name as club_name,
                   COUNT(er.id) as registration_count
            FROM student.Events e
            JOIN student.Clubs c ON c.id = e.club_id
            LEFT JOIN student.Event_Registrations er ON er.event_id = e.id
            WHERE EXTRACT(MONTH FROM e.start_time) = $1
              AND EXTRACT(YEAR FROM e.start_time) = $2
              ${club_id ? 'AND e.club_id = $3' : ''}
            GROUP BY e.id, c.name
            ORDER BY e.start_time ASC
        `;
        const params = [parseInt(month), parseInt(year)];
        if (club_id) params.push(club_id);

        const events = (await pool.query(query, params)).rows;

        const grouped = {
            upcoming: events.filter(e => e.status === 'UPCOMING'),
            live: events.filter(e => e.status === 'LIVE'),
            past: events.filter(e => e.status === 'PAST' || e.status === 'POSTPONED' || e.status === 'CANCELLED'),
        };

        res.json(grouped);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving calendar' });
    }
};

// ─── Clash Detection ─────────────────────────────────────────

export const getEventClashes = async (req, res) => {
    const { start_time, end_time, club_id, exclude_id } = req.query;
    try {
        if (!UUID_REGEX.test(club_id)) {
            return res.status(400).json({ error: 'Invalid club ID format' });
        }

        if (exclude_id && !UUID_REGEX.test(exclude_id)) {
            return res.status(400).json({ error: 'Invalid exclude ID format' });
        }

        const result = await pool.query(
            `SELECT id, title, start_time, end_time FROM student.Events
             WHERE club_id = $1
               AND ($2::uuid IS NULL OR id != $2::uuid)
               AND status NOT IN ('PAST', 'CANCELLED')
               AND start_time < $4 AND end_time > $3`,
            [club_id, exclude_id || null, start_time, end_time]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error checking clashes' });
    }
};

// ─── Delete ───────────────────────────────────────────────────

export const deleteEvent = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }
    try {
        await pool.query('DELETE FROM student.Events WHERE id = $1', [id]);
        res.json({ message: 'Event deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error deleting event' });
    }
};
