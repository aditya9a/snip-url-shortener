import rateLimit from 'express-rate-limit';

/**
 * Rate limiting middleware.
 *
 * express-rate-limit uses an in-memory sliding window counter.
 * It tracks requests by IP address.
 *
 * Why different limits for auth vs general API?
 * - Auth endpoints (login/register) are targets for brute-force attacks.
 *   An attacker trying 1000 passwords needs 1000 requests. We limit to 10/15min.
 * - General API is used legitimately by our own frontend, so it gets a
 *   more generous limit.
 *
 * Limitation: in-memory store doesn't work across multiple server instances
 * (each instance has its own counter). For multi-server deployments,
 * you'd use a Redis-backed store (rate-limiter-flexible). Our single-server
 * deployment doesn't have this problem.
 */

// General API rate limiter — applied to all /api/* routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 200,                     // 200 requests per 15 min per IP
  standardHeaders: true,        // Sends Rate-Limit headers so clients know their limit
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again in 15 minutes.',
  },
});

// Strict limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,                      // Only 10 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  // Skip rate limiting for successful requests (only count failures)
  // This prevents legitimate users from being locked out
  skipSuccessfulRequests: true,
});
