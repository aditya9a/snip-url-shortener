/**
 * Custom application error class.
 *
 * Extends the built-in Error with:
 * - statusCode: HTTP status code to send (e.g., 400, 404, 500)
 * - isOperational: Distinguishes "expected" errors (bad input, not found)
 *   from "unexpected" errors (bugs, DB crashes)
 *
 * Why this distinction matters:
 * - Operational errors: We know what happened. Send a meaningful message to the client.
 * - Programming errors: We DON'T know what happened. Log it, send a generic message.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Captures the stack trace, excluding the constructor call itself
    // This gives cleaner stack traces that point to where the error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
