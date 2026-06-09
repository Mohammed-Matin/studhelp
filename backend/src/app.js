import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import clubRoutes from "./routes/clubs.routes.js";
import eventRoutes from "./routes/events.routes.js";
import teamRoutes from "./routes/teams.routes.js";
import messageRoutes from "./routes/messages.routes.js";
const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/user', authRoutes);
app.use('/api/v1/clubs', clubRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/messages', messageRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Backend server is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    ...(err.details && { details: err.details }),
  });
});

export default app;
