import express from "express";
import userRoutes from "./routes/user.routes.js";
import clubRoutes from "./routes/clubs.routes.js";
import eventRoutes from "./routes/events.routes.js";
import teamRoutes from "./routes/teams.routes.js";
import messageRoutes from "./routes/messages.routes.js";
import paymentRoutes from "./routes/payments.routes.js";

const app = express();

app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static('uploads'));

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/clubs', clubRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/payments', paymentRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Backend server is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

export default app;
