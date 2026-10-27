import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/index.js';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import AppError from './utils/AppError.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import linkRoutes from './routes/linkRoutes.js';
import redirectRoutes from './routes/redirectRoutes.js';

// ─── Initialize Express ─────────────────────────────────────
const app = express();

// Render sits behind a reverse proxy. Trust the first proxy so IP-based rate
// limits and request metadata use the actual visitor rather than the proxy.
if (config.isProd) {
  app.set('trust proxy', 1);
}

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

// Apply general rate limiter to all API routes
app.use('/api', apiLimiter);

// Auth routes — stricter rate limit applied directly in the router
// We apply authLimiter only on the mutation endpoints (login/register)
app.use('/api/auth', authLimiter, authRoutes);

// Link management routes
app.use('/api/links', linkRoutes);

// ─── Production Setup: Serve React Frontend ────────────────────

if (config.isProd) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, '../../client/dist')));

  // Serve known client-side routes before the one-segment short-code route.
  // This keeps direct visits to /dashboard from being treated as a short URL.
  const serveFrontend = (req, res) =>
    res.sendFile(path.resolve(__dirname, '../../client/dist', 'index.html'));
  app.get(['/login', '/register', '/dashboard', '/dashboard/:id/analytics'], serveFrontend);
}

// Redirect engine and password unlock
// Contains GET /:shortCode and POST /api/unlock/:shortCode
// This must come after production SPA routes so those routes are not confused
// with one-segment short URLs.
app.use('/', redirectRoutes);

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

// Only start the server automatically if we are not in a test environment
// In tests, Supertest binds the app to an ephemeral port automatically.
if (config.nodeEnv !== 'test') {
  startServer();
}

export default app;

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
