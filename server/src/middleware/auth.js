import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/index.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Authentication middleware — "protect"
 *
 * Verifies the JWT from the HTTP-only cookie and attaches the
 * authenticated user to req.user for downstream use.
 *
 * Flow:
 * 1. Read token from cookie (or Authorization header as fallback)
 * 2. Verify the token's signature and check it hasn't expired
 * 3. Look up the user in the database
 * 4. Attach user to req.user
 * 5. Call next() to proceed to the route handler
 *
 * Why look up the user in the database if the token contains the ID?
 * The token proves the ID is valid and the token isn't tampered with.
 * But it doesn't know if the user was deleted after the token was issued.
 * A DB lookup ensures the user still exists.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Primary: read from HTTP-only cookie
  if (req.cookies?.token) {
    token = req.cookies.token;
  }
  // Fallback: read from Authorization header (useful for API testing / mobile clients)
  else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('You must be logged in to access this resource.', 401);
  }

  // Verify the token
  // jwt.verify throws if:
  // - The signature is invalid (token was tampered with)
  // - The token has expired (exp claim is in the past)
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    // Re-throw as AppError — the global error handler also handles
    // JsonWebTokenError and TokenExpiredError, but being explicit here
    // gives us control over the message
    throw new AppError('Invalid or expired token. Please log in again.', 401);
  }

  // Fetch the user from the database
  const user = await User.findById(decoded.id);
  if (!user) {
    // This can happen if: user was deleted after token was issued
    throw new AppError('The user for this token no longer exists.', 401);
  }

  // Attach to request for downstream use
  // Controllers can now access req.user.id, req.user.email, etc.
  req.user = user;
  next();
});

export default protect;
