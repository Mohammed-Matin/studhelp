import app from "./src/app.js";
import config from "./src/config/config.config.js";
import { createServer } from "http";
import { Server } from "socket.io";
import pool from './src/config/db.js';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Configure this to restrict origins in production
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a specific room (Club, Event, Team, or DM)
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  // Handle incoming messages
  socket.on('send_message', async (data) => {
    // Broadcast the message to everyone in the room
    io.to(data.room).emit('receive_message', data);

    // Save to the student.Messages table
    try {
        await pool.query(
            'INSERT INTO student.Messages (sender_id, receiver_id, content, is_anonymous, is_group_chat) VALUES ($1, $2, $3, $4, $5)',
            [data.senderId, data.room, data.content, data.isAnonymous || false, true]
        );
    } catch (error) {
        console.error("Error saving message to DB:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(config.port || 3000, () => {
  console.log(`Server is running on http://localhost:${config.port || 3000}`);
});
