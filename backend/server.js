import app from "./src/app.js";
import config from "./src/config/config.config.js";
import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Configure this to restrict origins
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(config.port || 3000, () => {
  console.log(`Server is running on http://localhost:${config.port || 3000}`);
});
