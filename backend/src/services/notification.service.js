import pool from '../config/db.js';

/**
 * @param {import('socket.io').Server | null | undefined} io
 * @param {string[]} userIds
 * @param {{ type: string, title: string, message: string, link?: string, reference_type?: string, reference_id?: string }} data
 */
export async function notifyUsers(io, userIds, data) {
    const uniqueIds = [...new Set(userIds)].filter(Boolean);
    if (uniqueIds.length === 0) return [];

    const created = [];
    for (const userId of uniqueIds) {
        const result = await pool.query(
            `INSERT INTO student.Notifications (user_id, type, title, message, link, reference_type, reference_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                userId,
                data.type,
                data.title,
                data.message,
                data.link || null,
                data.reference_type || null,
                data.reference_id || null,
            ]
        );
        const notification = result.rows[0];
        created.push(notification);
        if (io) {
            io.to(`notifications_${userId}`).emit('new_notification', notification);
        }
    }
    return created;
}

export async function getClubCoreMemberIds(clubId, excludeUserId = null) {
    const params = [clubId];
    let query = `SELECT user_id FROM student.Club_Members
                 WHERE club_id = $1 AND role_tag = 'CORE_COMMITTEE'`;
    if (excludeUserId) {
        query += ' AND user_id != $2';
        params.push(excludeUserId);
    }
    const result = await pool.query(query, params);
    return result.rows.map((r) => r.user_id);
}

export async function getClubAudienceIds(clubId, excludeUserId = null) {
    const params = [clubId];
    let excludeClause = '';
    if (excludeUserId) {
        excludeClause = ' AND user_id != $2';
        params.push(excludeUserId);
    }
    const result = await pool.query(
        `SELECT DISTINCT user_id FROM (
            SELECT user_id FROM student.Club_Members WHERE club_id = $1
            UNION
            SELECT user_id FROM student.Club_Followers WHERE club_id = $1
        ) audience
        WHERE 1=1${excludeClause}`,
        params
    );
    return result.rows.map((r) => r.user_id);
}

export async function notifyEventCreated(io, event, clubName, creatorId) {
    const audience = await getClubAudienceIds(event.club_id, creatorId);
    return notifyUsers(io, audience, {
        type: 'EVENT_CREATED',
        title: 'New Event',
        message: `${clubName} posted "${event.title}"`,
        link: `/events/${event.id}`,
        reference_type: 'EVENT',
        reference_id: event.id,
    });
}

export async function notifyClubFollowed(io, clubId, clubName, follower) {
    const coreIds = await getClubCoreMemberIds(clubId, follower.userId);
    const name = follower.full_name || follower.username;
    return notifyUsers(io, coreIds, {
        type: 'CLUB_FOLLOWED',
        title: 'New Follower',
        message: `${name} started following ${clubName}`,
        link: `/clubs/${clubId}`,
        reference_type: 'CLUB',
        reference_id: clubId,
    });
}

export async function notifyEventRegistration(io, event, clubName, registrant) {
    const coreIds = await getClubCoreMemberIds(event.club_id, registrant.userId);
    const name = registrant.full_name || registrant.username;
    return notifyUsers(io, coreIds, {
        type: 'EVENT_REGISTRATION',
        title: 'New Registration',
        message: `${name} registered for "${event.title}" (${clubName})`,
        link: `/events/${event.id}`,
        reference_type: 'EVENT',
        reference_id: event.id,
    });
}
