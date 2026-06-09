import pool from '../config/db.js';
import { notifyClubFollowed } from '../services/notification.service.js';

const MANAGER_ROLES = ['CORE_COMMITTEE', 'EXECUTIVE'];
const ADMIN_ROLES = ['CORE_COMMITTEE'];

async function getUserClubRole(userId, clubId) {
    const result = await pool.query(
        'SELECT role_tag FROM student.Club_Members WHERE user_id = $1 AND club_id = $2',
        [userId, clubId]
    );
    return result.rows[0]?.role_tag || null;
}

async function isFollower(userId, clubId) {
    const result = await pool.query(
        'SELECT 1 FROM student.Club_Followers WHERE user_id = $1 AND club_id = $2',
        [userId, clubId]
    );
    return result.rows.length > 0;
}

async function hasPendingRequest(userId, clubId) {
    const result = await pool.query(
        "SELECT 1 FROM student.Club_Join_Requests WHERE user_id = $1 AND club_id = $2 AND status = 'PENDING'",
        [userId, clubId]
    );
    return result.rows.length > 0;
}

// ─── Club CRUD ────────────────────────────────────────────────

export const createClub = async (req, res) => {
    const { name, description } = req.body;
    if (!name?.trim()) {
        return res.status(422).json({ error: 'Club name is required' });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `INSERT INTO student.Clubs (name, description)
             VALUES ($1, $2) RETURNING *`,
            [name, description]
        );
        const club = result.rows[0];

        await client.query(
            `INSERT INTO student.Club_Members (user_id, club_id, role_tag)
             VALUES ($1, $2, 'CORE_COMMITTEE')`,
            [req.user.userId, club.id]
        );

        await client.query(
            'UPDATE student.Clubs SET member_count = member_count + 1 WHERE id = $1',
            [club.id]
        );

        await client.query('COMMIT');
        club.role = 'CORE_COMMITTEE';
        res.status(201).json(club);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Server error creating club' });
    } finally {
        client.release();
    }
};

export const getClubs = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.*,
                    COALESCE(json_agg(json_build_object(
                        'user_id', cm.user_id,
                        'username', u.username,
                        'full_name', u.full_name,
                        'role_tag', cm.role_tag
                    )) FILTER (WHERE cm.user_id IS NOT NULL), '[]') as members
             FROM student.Clubs c
             LEFT JOIN student.Club_Members cm ON cm.club_id = c.id
             LEFT JOIN student.users u ON u.id = cm.user_id
             GROUP BY c.id
             ORDER BY c.created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving clubs' });
    }
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getClubById = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }
    try {
        const clubResult = await pool.query(
            `SELECT c.*,
                    COALESCE(json_agg(json_build_object(
                        'user_id', cm.user_id,
                        'username', u.username,
                        'full_name', u.full_name,
                        'role_tag', cm.role_tag
                    )) FILTER (WHERE cm.user_id IS NOT NULL), '[]') as members
             FROM student.Clubs c
             LEFT JOIN student.Club_Members cm ON cm.club_id = c.id
             LEFT JOIN student.users u ON u.id = cm.user_id
             WHERE c.id = $1
             GROUP BY c.id`,
            [id]
        );
        if (clubResult.rows.length === 0) {
            return res.status(404).json({ error: 'Club not found' });
        }

        const club = clubResult.rows[0];
        const role = await getUserClubRole(req.user.userId, id);
        const following = await isFollower(req.user.userId, id);

        const gallery = (await pool.query(
            'SELECT * FROM student.Club_Gallery_Images WHERE club_id = $1 ORDER BY created_at DESC',
            [id]
        )).rows;

        const pendingRequest = await hasPendingRequest(req.user.userId, id);

        const events = (await pool.query(
            `SELECT id, title, description, start_time, end_time, status, participation_type, banner_url
             FROM student.Events WHERE club_id = $1 ORDER BY start_time DESC`,
            [id]
        )).rows;

        res.json({
            ...club,
            userRole: role,
            isFollower: following,
            pendingRequest,
            events,
            gallery,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving club' });
    }
};

export const updateClub = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }

    const requesterRole = await getUserClubRole(req.user.userId, id);
    if (!requesterRole || !MANAGER_ROLES.includes(requesterRole)) {
        return res.status(403).json({ error: 'Only club managers can update club details' });
    }

    const { name, description, logo_url, cover_url } = req.body;
    try {
        const result = await pool.query(
            `UPDATE student.Clubs
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 logo_url = COALESCE($3, logo_url),
                 cover_url = COALESCE($4, cover_url),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING *`,
            [name, description, logo_url, cover_url, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Club not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating club' });
    }
};

export const deleteClub = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }

    const requesterRole = await getUserClubRole(req.user.userId, id);
    if (!requesterRole || !ADMIN_ROLES.includes(requesterRole)) {
        return res.status(403).json({ error: 'Only core committee can delete the club' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const club = await client.query('SELECT id FROM student.Clubs WHERE id = $1', [id]);
        if (club.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Club not found' });
        }

        const eventIds = (await client.query(
            'SELECT id FROM student.Events WHERE club_id = $1',
            [id]
        )).rows.map((r) => r.id);

        if (eventIds.length > 0) {
            await client.query(
                `DELETE FROM student.Messages
                 WHERE group_type = 'EVENT' AND receiver_id = ANY($1::uuid[])`,
                [eventIds]
            );
            await client.query(
                `DELETE FROM student.Notifications
                 WHERE reference_type = 'EVENT' AND reference_id = ANY($1::uuid[])`,
                [eventIds]
            );
        }

        await client.query(
            "DELETE FROM student.Messages WHERE group_type = 'CLUB' AND receiver_id = $1",
            [id]
        );
        await client.query(
            "DELETE FROM student.Notifications WHERE reference_type = 'CLUB' AND reference_id = $1",
            [id]
        );

        await client.query('DELETE FROM student.Clubs WHERE id = $1', [id]);
        await client.query('COMMIT');
        res.json({ message: 'Club deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Server error deleting club' });
    } finally {
        client.release();
    }
};

// ─── Members ─────────────────────────────────────────────────

export const getClubMembers = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }
    try {
        const result = await pool.query(
            `SELECT cm.user_id, u.username, u.full_name, u.email, cm.role_tag, cm.joined_at
             FROM student.Club_Members cm
             JOIN student.users u ON u.id = cm.user_id
             WHERE cm.club_id = $1
             ORDER BY
                 CASE cm.role_tag
                     WHEN 'CORE_COMMITTEE' THEN 0
                     WHEN 'EXECUTIVE' THEN 1
                     WHEN 'TECHNICAL' THEN 2
                     WHEN 'DESIGN' THEN 3
                     WHEN 'PUBLICITY' THEN 4
                     WHEN 'ADMINISTRATIVE_SPONSORS' THEN 5
                     ELSE 6
                 END`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving members' });
    }
};

export const addMember = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }

    const requesterRole = await getUserClubRole(req.user.userId, id);
    if (!requesterRole || !ADMIN_ROLES.includes(requesterRole)) {
        return res.status(403).json({ error: 'Only core committee can add members' });
    }

    const { user_id, role_tag } = req.body;
    try {
        await pool.query(
            'INSERT INTO student.Club_Members (user_id, club_id, role_tag) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [user_id, id, role_tag || 'CUSTOM']
        );
        await pool.query('UPDATE student.Clubs SET member_count = member_count + 1 WHERE id = $1', [id]);
        res.status(201).json({ message: 'Member added' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error adding member' });
    }
};

export const updateMemberRole = async (req, res) => {
    const { id, userId } = req.params;
    if (!UUID_REGEX.test(id) || !UUID_REGEX.test(userId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    const requesterRole = await getUserClubRole(req.user.userId, id);
    if (!requesterRole || !ADMIN_ROLES.includes(requesterRole)) {
        return res.status(403).json({ error: 'Only core committee can update member roles' });
    }

    const { role_tag } = req.body;
    try {
        const result = await pool.query(
            'UPDATE student.Club_Members SET role_tag = $1 WHERE user_id = $2 AND club_id = $3 RETURNING *',
            [role_tag, userId, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Member not found in this club' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating member role' });
    }
};

export const removeMember = async (req, res) => {
    const { id, userId } = req.params;
    if (!UUID_REGEX.test(id) || !UUID_REGEX.test(userId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    const requesterRole = await getUserClubRole(req.user.userId, id);
    if (!requesterRole || !ADMIN_ROLES.includes(requesterRole)) {
        return res.status(403).json({ error: 'Only core committee can remove members' });
    }

    try {
        await pool.query(
            'DELETE FROM student.Club_Members WHERE user_id = $1 AND club_id = $2',
            [userId, id]
        );
        await pool.query('UPDATE student.Clubs SET member_count = GREATEST(member_count - 1, 0) WHERE id = $1', [id]);
        res.json({ message: 'Member removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error removing member' });
    }
};

// ─── Followers ────────────────────────────────────────────────

export const followClub = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }
    try {
        const insertResult = await pool.query(
            'INSERT INTO student.Club_Followers (user_id, club_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
            [req.user.userId, id]
        );

        if (insertResult.rows.length === 0) {
            return res.json({ message: 'Already following this club' });
        }

        await pool.query('UPDATE student.Clubs SET follower_count = follower_count + 1 WHERE id = $1', [id]);

        const club = (await pool.query('SELECT name FROM student.Clubs WHERE id = $1', [id])).rows[0];
        const follower = (await pool.query(
            'SELECT username, full_name FROM student.users WHERE id = $1',
            [req.user.userId]
        )).rows[0];
        const io = req.app.get('io');
        if (club && follower) {
            await notifyClubFollowed(io, id, club.name, {
                userId: req.user.userId,
                username: follower.username,
                full_name: follower.full_name,
            });
        }

        res.json({ message: 'Club followed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error following club' });
    }
};

export const unfollowClub = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }
    try {
        await pool.query(
            'DELETE FROM student.Club_Followers WHERE user_id = $1 AND club_id = $2',
            [req.user.userId, id]
        );
        await pool.query('UPDATE student.Clubs SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = $1', [id]);
        res.json({ message: 'Club unfollowed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error unfollowing club' });
    }
};

export const getClubFollowers = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }
    try {
        const result = await pool.query(
            `SELECT cf.user_id, u.username, u.full_name, cf.followed_at
             FROM student.Club_Followers cf
             JOIN student.users u ON u.id = cf.user_id
             WHERE cf.club_id = $1
             ORDER BY cf.followed_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving followers' });
    }
};

// ─── Join Requests ───────────────────────────────────────────

export const requestJoin = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }
    const { message, requested_role } = req.body;
    try {
        const existing = await hasPendingRequest(req.user.userId, id);
        if (existing) {
            return res.status(409).json({ error: 'Already have a pending request' });
        }
        await pool.query(
            `INSERT INTO student.Club_Join_Requests (user_id, club_id, message, requested_role)
             VALUES ($1, $2, $3, COALESCE($4::student.club_role, 'CUSTOM'))`,
            [req.user.userId, id, message, requested_role || 'CUSTOM']
        );
        res.status(201).json({ message: 'Join request submitted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error submitting request' });
    }
};

export const getJoinRequests = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }

    const requesterRole = await getUserClubRole(req.user.userId, id);
    if (!requesterRole || !MANAGER_ROLES.includes(requesterRole)) {
        return res.status(403).json({ error: 'Only club managers can view join requests' });
    }

    try {
        const result = await pool.query(
            `SELECT r.*, u.username, u.full_name, u.email
             FROM student.Club_Join_Requests r
             JOIN student.users u ON u.id = r.user_id
             WHERE r.club_id = $1 AND r.status = 'PENDING'
             ORDER BY r.created_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving requests' });
    }
};

export const handleJoinRequest = async (req, res) => {
    const { id, requestId } = req.params;
    if (!UUID_REGEX.test(id) || !UUID_REGEX.test(requestId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    const requesterRole = await getUserClubRole(req.user.userId, id);
    if (!requesterRole || !MANAGER_ROLES.includes(requesterRole)) {
        return res.status(403).json({ error: 'Only club managers can handle join requests' });
    }

    const { status } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const request = await client.query(
            'SELECT * FROM student.Club_Join_Requests WHERE id = $1 AND club_id = $2',
            [requestId, id]
        );
        if (request.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found' });
        }

        await client.query(
            'UPDATE student.Club_Join_Requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [status, requestId]
        );

        if (status === 'APPROVED') {
            const { user_id, requested_role } = request.rows[0];
            await client.query(
                'INSERT INTO student.Club_Members (user_id, club_id, role_tag) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [user_id, id, requested_role]
            );
            await client.query(
                'UPDATE student.Clubs SET member_count = member_count + 1 WHERE id = $1',
                [id]
            );
        }

        await client.query('COMMIT');
        res.json({ message: `Request ${status.toLowerCase()}` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Server error handling request' });
    } finally {
        client.release();
    }
};

// ─── Gallery ─────────────────────────────────────────────────

export const getGallery = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }
    try {
        const result = await pool.query(
            `SELECT g.*, u.username as uploaded_by_name
             FROM student.Club_Gallery_Images g
             LEFT JOIN student.users u ON u.id = g.uploaded_by
             WHERE g.club_id = $1
             ORDER BY g.created_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving gallery' });
    }
};

export const uploadGalleryImage = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }
    const { caption } = req.body;
    try {
        if (!req.file) {
            return res.status(422).json({ error: 'Image file is required' });
        }
        const result = await pool.query(
            `INSERT INTO student.Club_Gallery_Images (club_id, image_url, caption, uploaded_by)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [id, req.file.path, caption || null, req.user.userId]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error uploading image' });
    }
};

export const deleteGalleryImage = async (req, res) => {
    const { id, imageId } = req.params;
    if (!UUID_REGEX.test(id) || !UUID_REGEX.test(imageId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }
    try {
        const result = await pool.query(
            'DELETE FROM student.Club_Gallery_Images WHERE id = $1 AND club_id = $2 RETURNING *',
            [imageId, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }
        res.json({ message: 'Image deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error deleting image' });
    }
};

// ─── Follower Messages ───────────────────────────────────────

export const sendFollowerMessage = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }
    const { message } = req.body;
    try {
        await pool.query(
            'INSERT INTO student.Follower_Messages (sender_id, club_id, message) VALUES ($1, $2, $3)',
            [req.user.userId, id, message]
        );
        res.status(201).json({ message: 'Message sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error sending message' });
    }
};

export const getFollowerMessages = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }

    const requesterRole = await getUserClubRole(req.user.userId, id);
    if (!requesterRole || !MANAGER_ROLES.includes(requesterRole)) {
        return res.status(403).json({ error: 'Only club managers can view follower messages' });
    }

    try {
        const result = await pool.query(
            `SELECT m.*, u.username, u.full_name
             FROM student.Follower_Messages m
             JOIN student.users u ON u.id = m.sender_id
             WHERE m.club_id = $1
             ORDER BY m.created_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving messages' });
    }
};

export const replyToFollowerMessage = async (req, res) => {
    const { id, messageId } = req.params;
    if (!UUID_REGEX.test(id) || !UUID_REGEX.test(messageId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    const requesterRole = await getUserClubRole(req.user.userId, id);
    if (!requesterRole || !MANAGER_ROLES.includes(requesterRole)) {
        return res.status(403).json({ error: 'Only club managers can reply to messages' });
    }

    const { admin_reply } = req.body;
    try {
        const result = await pool.query(
            `UPDATE student.Follower_Messages
             SET admin_reply = $1, replied_by = $2, replied_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND club_id = $4
             RETURNING *`,
            [admin_reply, req.user.userId, messageId, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error replying to message' });
    }
};

// ─── Dashboard ───────────────────────────────────────────────

export const getClubDashboard = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }
    try {
        const club = (await pool.query('SELECT * FROM student.Clubs WHERE id = $1', [id])).rows[0];
        if (!club) {
            return res.status(404).json({ error: 'Club not found' });
        }

        const role = await getUserClubRole(req.user.userId, id);
        const following = await isFollower(req.user.userId, id);

        const members = (await pool.query(
            `SELECT cm.role_tag, COUNT(*) as count FROM student.Club_Members cm WHERE cm.club_id = $1 GROUP BY cm.role_tag`,
            [id]
        )).rows;

        const recentEvents = (await pool.query(
            `SELECT id, title, start_time, status FROM student.Events WHERE club_id = $1 ORDER BY start_time DESC LIMIT 5`,
            [id]
        )).rows;

        const dashboard = {
            club: {
                id: club.id,
                name: club.name,
                description: club.description,
                logo_url: club.logo_url,
                cover_url: club.cover_url,
                member_count: club.member_count,
                follower_count: club.follower_count,
                created_at: club.created_at,
            },
            userRole: role,
            isFollower: following,
            members,
            recentEvents,
        };

        if (role && MANAGER_ROLES.includes(role)) {
            const budget = (await pool.query(
                `SELECT
                    COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as total_income,
                    COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as total_expense
                 FROM student.Budget_Transactions WHERE club_id = $1`,
                [id]
            )).rows[0];

            const pendingRequests = (await pool.query(
                "SELECT COUNT(*) FROM student.Club_Join_Requests WHERE club_id = $1 AND status = 'PENDING'",
                [id]
            )).rows[0].count;

            dashboard.budget = {
                balance: club.budget_balance,
                totalIncome: budget.total_income,
                totalExpense: budget.total_expense,
            };
            dashboard.pendingRequests = parseInt(pendingRequests);
        }

        res.json(dashboard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error loading dashboard' });
    }
};

// ─── Budget ──────────────────────────────────────────────────

export const getBudget = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }
    try {
        const balance = (await pool.query(
            'SELECT budget_balance FROM student.Clubs WHERE id = $1',
            [id]
        )).rows[0]?.budget_balance || 0;

        const summary = (await pool.query(
            `SELECT
                COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as total_expense
             FROM student.Budget_Transactions WHERE club_id = $1`,
            [id]
        )).rows[0];

        res.json({ balance, ...summary });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving budget' });
    }
};

export const getBudgetTransactions = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    try {
        const transactions = (await pool.query(
            `SELECT * FROM student.Budget_Transactions
             WHERE club_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [id, parseInt(limit), offset]
        )).rows;

        const total = (await pool.query(
            'SELECT COUNT(*) FROM student.Budget_Transactions WHERE club_id = $1',
            [id]
        )).rows[0].count;

        res.json({ transactions, total: parseInt(total), page: parseInt(page) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving transactions' });
    }
};

export const addBudgetTransaction = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }

    const requesterRole = await getUserClubRole(req.user.userId, id);
    if (!requesterRole || !MANAGER_ROLES.includes(requesterRole)) {
        return res.status(403).json({ error: 'Only club managers can add budget transactions' });
    }

    const { type, category, amount, description } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `INSERT INTO student.Budget_Transactions (club_id, type, category, amount, description)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [id, type, category, amount, description || null]
        );

        const sign = type === 'INCOME' ? '+' : '-';
        await client.query(
            `UPDATE student.Clubs SET budget_balance = budget_balance ${sign} $1 WHERE id = $2`,
            [amount, id]
        );

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Server error adding transaction' });
    } finally {
        client.release();
    }
};

// ─── Donations ────────────────────────────────────────────────

export const addDonation = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid club ID format' });
    }
    const { donor_name, amount, message } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const donation = await client.query(
            `INSERT INTO student.Club_Donations (club_id, donor_name, amount, message)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [id, donor_name || 'Anonymous', amount, message || null]
        );

        await client.query(
            'UPDATE student.Clubs SET budget_balance = budget_balance + $1 WHERE id = $2',
            [amount, id]
        );

        await client.query(
            `INSERT INTO student.Budget_Transactions (club_id, type, category, amount, description, reference_type, reference_id)
             VALUES ($1, 'INCOME', 'DONATION', $2, $3, 'DONATION', $4)`,
            [id, amount, `Donation from ${donor_name || 'Anonymous'}`, donation.rows[0].id]
        );

        await client.query('COMMIT');
        res.status(201).json(donation.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Server error recording donation' });
    } finally {
        client.release();
    }
};

// ─── User's Clubs ─────────────────────────────────────────────

export const getUserClubs = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.*, cm.role_tag as user_role
             FROM student.Clubs c
             JOIN student.Club_Members cm ON cm.club_id = c.id
             WHERE cm.user_id = $1
             ORDER BY cm.joined_at DESC`,
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving user clubs' });
    }
};

export const getFollowedClubs = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.*, cf.followed_at
             FROM student.Clubs c
             JOIN student.Club_Followers cf ON cf.club_id = c.id
             WHERE cf.user_id = $1
             ORDER BY cf.followed_at DESC`,
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving followed clubs' });
    }
};
