// server/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDB, db } from './db.js';

// Route imports
import authRouter from './routes/auth.js';
import resumeRouter from './routes/resume.js';
import usersRouter from './routes/users.js';
import jobsRouter from './routes/jobs.js';
import challengesRouter from './routes/challenges.js';
import assessmentsRouter from './routes/assessments.js';
import submissionsRouter from './routes/submissions.js';
import reviewsRouter from './routes/reviews.js';
import scorecardsRouter from './routes/scorecards.js';
import candidatesRouter, { getRankingsSummary, getRankingEventsList } from './routes/candidates.js';
import shortlistRouter from './routes/shortlist.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize SQLite database and seed data
initDB();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 1. Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SignalCraft API is running'
  });
});

// Mount modular feature routes
app.use('/api/auth', authRouter);
app.use('/api/resume', resumeRouter);
app.use('/api/users', usersRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/scorecards', scorecardsRouter);
app.use('/api/candidates', candidatesRouter);
app.get('/api/rankings/events', (req, res) => {
  try {
    const events = getRankingEventsList();
    return res.status(200).json({ success: true, data: events });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve ranking events' });
  }
});
app.get('/api/rankings', (req, res) => {
  try {
    const data = getRankingsSummary(req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve rankings' });
  }
});
app.use('/api/shortlist', shortlistRouter);

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error handler (No stack trace exposure)
app.use((err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start Server
import { fileURLToPath } from 'url';

const isDirectExecution = process.argv[1] && (
  fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].toLowerCase()
);

if (process.env.NODE_ENV !== 'test' && isDirectExecution) {
  const server = app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`SignalCraft API`);
    console.log(`=================================`);
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: SQLite`);
    console.log(`=================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[SignalCraft] Port ${PORT} is currently in use. Retrying in 1s or run 'netstat' to check.`);
      setTimeout(() => {
        server.close();
        server.listen(PORT);
      }, 1000);
    } else {
      console.error('[SignalCraft Server Error]:', err.message);
    }
  });

  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
}

export default app;
