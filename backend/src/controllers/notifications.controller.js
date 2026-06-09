import pool from '../config/db.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getNotifications = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    try {
        const notifications = (await pool.query(
            `SELECT * FROM student.Notifications
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.user.userId, parseInt(limit), offset]
        )).rows;

        const unread = (await pool.query(
            'SELECT COUNT(*) FROM student.Notifications WHERE user_id = $1 AND is_read = false',
            [req.user.userId]
        )).rows[0].count;

        res.json({
            notifications,
            unread_count: parseInt(unread),
            page: parseInt(page),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving notifications' });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT COUNT(*) FROM student.Notifications WHERE user_id = $1 AND is_read = false',
            [req.user.userId]
        );
        res.json({ unread_count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error retrieving unread count' });
    }
};

export const markAsRead = async (req, res) => {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
    }
    try {
        const result = await pool.query(
            `UPDATE student.Notifications SET is_read = true
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, req.user.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating notification' });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        await pool.query(
            'UPDATE student.Notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
            [req.user.userId]
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating notifications' });
    }
};
