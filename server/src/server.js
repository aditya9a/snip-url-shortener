import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import config from './config/index.js';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import AppError from './utils/AppError.js';

// ─── Initialize Express ─────────────────────────────────────
const app = express();

// ─── Middleware Pipeline ────────────────────────────────────
// ORDER MATTERS. Each middleware processes the request in sequence.

// 1. Security headers (Helmet)
// Sets headers like X-Content-Type-Options, Strict-Transport-Security, etc.
// Must be FIRST — these headers should be on every response, including errors.
app.use(helmet());

// 2. CORS (Cross-Origin Resource Sharing)
// Our React frontend (localhost:5173) and Express backend (localhost:5000)
// are on different origins. Without CORS, the browser blocks frontend requests.
// credentials: true allows cookies (our JWT) to be sent cross-origin.
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));

// 3. Request logging (Morgan)
// 'dev' format: concise colored output for development
// Disabled in production test environments, enabled everywhere else
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// 4. Body parsers
// express.json() parses JSON request bodies (Content-Type: application/json)
// Without this, req.body is undefined for POST/PUT/PATCH requests
// limit: '10kb' prevents someone sending a massive payload to exhaust memory
app.use(express.json({ limit: '10kb' }));

// 5. Cookie parser
// Parses the Cookie header and populates req.cookies
// We need this to read JWT from HTTP-only cookies
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────────

// Health check endpoint — useful for monitoring and deployment health checks
// Hosting platforms (Render, Railway) ping this to know your server is alive
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Snip API is running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// TODO: Mount route files here as we build them
// app.use('/api/auth', authRoutes);
// app.use('/api/links', linkRoutes);

// ─── 404 Handler ─────────────────────────────────────────────
// This catches any request that doesn't match a defined route.
// Must be AFTER all route definitions.
// Using middleware (not app.all('*')) for Express 5 compatibility.
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ─── Global Error Handler ────────────────────────────────────
// Must be the LAST middleware — it catches errors from everything above.
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────
const startServer = async () => {
  // Connect to MongoDB first
  await connectDB();

  app.listen(config.port, () => {
    console.log(`\n🔗 Snip API running on http://localhost:${config.port}`);
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🗃️  Database: connected\n`);
  });
};

startServer();

// ─── Unhandled Rejection & Exception Handlers ────────────────
// These are safety nets for errors that escape Express's error handling.
// Examples: a promise rejection in a setTimeout, or a synchronous throw
// outside a request context.

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.message);
  // Shut down gracefully — let existing requests finish, then exit
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  process.exit(1);
});
