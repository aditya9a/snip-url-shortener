import config from '../config/index.js';

/**
 * Global error handling middleware.
 *
 * Express recognizes this as an error handler because it has 4 parameters
 * (err, req, res, next). This is NOT a convention — Express literally checks
 * the function's parameter count. 3 params = regular middleware. 4 params = error handler.
 *
 * This middleware:
 * 1. Logs the error (always — for debugging)
 * 2. Handles specific Mongoose/MongoDB error types
 * 3. Sends a consistent JSON response
 * 4. Hides internal details in production (security)
 */
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ─── Handle specific error types ───────────────────────────

  // Mongoose validation error (e.g., required field missing)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = `Validation failed: ${messages.join(', ')}`;
  }

  // Mongoose duplicate key error (e.g., email already exists)
  if (err.code === 11000) {
    statusCode = 409; // Conflict
    const field = Object.keys(err.keyValue)[0];
    message = `A record with this ${field} already exists.`;
  }

  // Mongoose bad ObjectId (e.g., /api/links/not-a-valid-id)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  // ─── Log the error ────────────────────────────────────────

  if (statusCode >= 500) {
    // Server errors — always log full details
    console.error('SERVER ERROR:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  } else if (config.isDev) {
    // Client errors in dev — log for debugging convenience
    console.warn(`CLIENT ERROR ${statusCode}: ${message}`);
  }

  // ─── Send response ────────────────────────────────────────

  const response = {
    success: false,
    message,
  };

  // Include stack trace in development only — NEVER in production
  // Stack traces reveal file paths, line numbers, and internal structure
  if (config.isDev) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
