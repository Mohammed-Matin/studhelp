import pool from '../config/db.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── User Search ─────────────────────────────────────────────

export const searchUsers = async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) {
        return res.status(422).json({ error: 'Search query must be at least 2 characters' });
    }
    try {
        const result = await pool.query(
            `SELECT id, username, full_name
             FROM student.users
             WHERE username ILIKE $1 OR full_name ILIKE $1
             LIMIT 20`,
            [`%${q}%`]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error searching users' });
    }
};

// ─── DM Conversations ─────────────────────────────────────────

export const getDMConversations = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT
                CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as user_id,
                u.username, u.full_name,
                (SELECT content FROM student.Messages
                 WHERE (sender_id = $1 AND receiver_id = CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END)
                    OR (receiver_id = $1 AND sender_id = CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END)
                 ORDER BY timestamp DESC LIMIT 1) as last_message,
                (SELECT timestamp FROM student.Messages
                 WHERE (sender_id = $1 AND receiver_id = CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END)
                    OR (receiver_id = $1 AND sender_id = CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END)
                 ORDER BY timestamp DESC LIMIT 1) as last_message_at
             FROM student.Messages m
             JOIN student.users u ON u.id = CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END
             WHERE sender_id = $1 OR receiver_id = $1
             ORDER BY last_message_at DESC NULLS LAST`,
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving conversations' });
    }
};

export const getDMThread = async (req, res) => {
    const { userId } = req.params;
    if (!UUID_REGEX.test(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
    }
    try {
        const result = await pool.query(
            `SELECT m.*, u.username as sender_name, u.full_name as sender_full_name
             FROM student.Messages m
             JOIN student.users u ON u.id = m.sender_id
             WHERE (m.sender_id = $1 AND m.receiver_id = $2 AND m.is_group_chat = false)
                OR (m.sender_id = $2 AND m.receiver_id = $1 AND m.is_group_chat = false)
             ORDER BY m.timestamp ASC`,
            [req.user.userId, userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving messages' });
    }
};

export const sendDMMessage = async (req, res) => {
    const { receiver_id, content } = req.body;
    if (!UUID_REGEX.test(receiver_id)) {
        return res.status(400).json({ error: 'Invalid receiver ID format' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO student.Messages (sender_id, receiver_id, is_group_chat, content)
             VALUES ($1, $2, false, $3) RETURNING *`,
            [req.user.userId, receiver_id, content]
        );

        const message = (await pool.query(
            `SELECT m.*, u.username as sender_name
             FROM student.Messages m
             JOIN student.users u ON u.id = m.sender_id
             WHERE m.id = $1`,
            [result.rows[0].id]
        )).rows[0];

        const io = req.app.get('io');
        if (io) {
            io.to(`dm_${req.user.userId}`).emit('receive_message', message);
            io.to(`dm_${receiver_id}`).emit('receive_message', message);
        }

        res.status(201).json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error sending message' });
    }
};

// ─── Group Messages (Club / Event) ───────────────────────────

export const getGroupMessages = async (req, res) => {
    const { groupType, groupId } = req.params;
    if (!['CLUB', 'EVENT', 'TEAM'].includes(groupType)) {
        return res.status(422).json({ error: 'Invalid group type' });
    }
    if (!UUID_REGEX.test(groupId)) {
        return res.status(400).json({ error: 'Invalid group ID format' });
    }
    try {
        const result = await pool.query(
            `SELECT m.*, u.username as sender_name, u.full_name as sender_full_name
             FROM student.Messages m
             JOIN student.users u ON u.id = m.sender_id
             WHERE m.receiver_id = $1 AND m.is_group_chat = true AND m.group_type = $2
             ORDER BY m.timestamp ASC`,
            [groupId, groupType]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving messages' });
    }
};

export const sendGroupMessage = async (req, res) => {
    const { groupType, groupId } = req.params;
    const { content, is_anonymous } = req.body;

    if (!['CLUB', 'EVENT', 'TEAM'].includes(groupType)) {
        return res.status(422).json({ error: 'Invalid group type' });
    }
    if (!UUID_REGEX.test(groupId)) {
        return res.status(400).json({ error: 'Invalid group ID format' });
    }

    // Verify membership
    if (groupType === 'CLUB') {
        const member = await pool.query(
            'SELECT 1 FROM student.Club_Members WHERE user_id = $1 AND club_id = $2',
            [req.user.userId, groupId]
        );
        if (member.rows.length === 0) {
            return res.status(403).json({ error: 'You are not a member of this club' });
        }
    }

    try {
        const result = await pool.query(
            `INSERT INTO student.Messages (sender_id, receiver_id, is_group_chat, group_type, content, is_anonymous)
             VALUES ($1, $2, true, $3, $4, $5) RETURNING *`,
            [req.user.userId, groupId, groupType, content, is_anonymous || false]
        );

        const message = (await pool.query(
            `SELECT m.*, u.username as sender_name, u.full_name as sender_full_name
             FROM student.Messages m
             JOIN student.users u ON u.id = m.sender_id
             WHERE m.id = $1`,
            [result.rows[0].id]
        )).rows[0];

        const io = req.app.get('io');
        if (io) {
            const room = `${groupType}_${groupId}`;
            io.to(room).emit('receive_message', message);
        }

        res.status(201).json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error sending message' });
    }
};

// ─── Club Role-Based Groups ──────────────────────────────────

export const getClubRoleGroups = async (req, res) => {
    const { clubId } = req.params;
    if (!UUID_REGEX.test(clubId)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }
    try {
        const result = await pool.query(
            `SELECT DISTINCT role_tag FROM student.Club_Members
             WHERE club_id = $1
             ORDER BY
                 CASE role_tag
                     WHEN 'CORE_COMMITTEE' THEN 0
                     WHEN 'EXECUTIVE' THEN 1
                     WHEN 'TECHNICAL' THEN 2
                     WHEN 'DESIGN' THEN 3
                     WHEN 'PUBLICITY' THEN 4
                     WHEN 'ADMINISTRATIVE_SPONSORS' THEN 5
                     ELSE 6
                 END`,
            [clubId]
        );
        res.json(result.rows.map(r => r.role_tag));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving groups' });
    }
};
