import authService from '../services/authService.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Auth Controller
 *
 * Responsibility: handle HTTP request/response for auth endpoints.
 * Business logic lives in authService.
 *
 * Pattern:
 *   1. Extract validated data from req.body (already cleaned by Zod middleware)
 *   2. Call the service
 *   3. Set cookie + send response
 */

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const { user, token } = await authService.register({ name, email, password });

  // Set JWT in HTTP-only cookie
  authService.setTokenCookie(res, token);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: { user },
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, token } = await authService.login({ email, password });

  authService.setTokenCookie(res, token);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    data: { user },
  });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  // Clear the cookie by overwriting it with an expired one
  // We don't need to invalidate the JWT server-side because:
  // 1. The token expires in 7 days anyway
  // 2. Without a token denylist (Redis), true server-side invalidation
  //    isn't possible in a stateless JWT system
  // 3. Clearing the cookie is sufficient for 99% of logout use cases
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),  // January 1, 1970 — immediately expired
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// GET /api/auth/me  (protected)
export const getMe = asyncHandler(async (req, res) => {
  // req.user is already attached by the protect middleware
  // We could just return req.user, but calling the service ensures
  // we always return fresh data from the database.
  const user = await authService.getMe(req.user._id);

  res.status(200).json({
    success: true,
    data: { user },
  });
});
