import app from "./src/app.js";
import config from "./src/config/config.config.js";
import { createServer } from "http";
import { Server } from "socket.io";
import pool from './src/config/db.js';

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_dm', (userId) => {
        socket.join(`dm_${userId}`);
        console.log(`Socket ${socket.id} joined DM room: dm_${userId}`);
    });

    socket.on('join_notifications', (userId) => {
        socket.join(`notifications_${userId}`);
        console.log(`Socket ${socket.id} joined notifications room: notifications_${userId}`);
    });

    socket.on('join_group', ({ groupType, groupId }) => {
        const room = `${groupType}_${groupId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined group: ${room}`);
    });

    socket.on('leave_group', ({ groupType, groupId }) => {
        const room = `${groupType}_${groupId}`;
        socket.leave(room);
    });

    socket.on('join_all_club_rooms', async (clubId) => {
        try {
            socket.join(`CLUB_${clubId}`);
            const groups = await pool.query(
                'SELECT DISTINCT role_tag FROM student.Club_Members WHERE club_id = $1',
                [clubId]
            );
            groups.rows.forEach(g => {
                socket.join(`CLUB_${clubId}_${g.role_tag}`);
            });
        } catch (err) {
            console.error('Error joining club rooms:', err);
        }
    });

    socket.on('send_message', (data) => {
        socket.to(data.room).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = config.port;
httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    io.close();
    httpServer.close();
    await pool.end();
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
