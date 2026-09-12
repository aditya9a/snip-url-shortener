import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/index.js';
import AppError from '../utils/AppError.js';

// ─── Token Generation ──────────────────────────────────────

/**
 * Generates a signed JWT containing the user's ID.
 *
 * We only put the user ID in the payload — not the email, name, or role.
 * Why? The token can't be invalidated until it expires. If we embed
 * the user's role in the token and then change their role in the DB,
 * the old token still has the old role. By storing only the ID, we
 * fetch fresh user data from the DB on every authenticated request.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },           // Payload
    config.jwtSecret,         // Secret key
    { expiresIn: config.jwtExpiresIn }  // Expiry (e.g., "7d")
  );
};

/**
 * Sets the JWT as an HTTP-only cookie on the response.
 *
 * Cookie options explained:
 * - httpOnly: true       → JS cannot access this cookie (prevents XSS token theft)
 * - secure: true in prod → cookie only sent over HTTPS (prevents network interception)
 * - sameSite: 'strict'   → cookie not sent on cross-site requests (CSRF protection)
 * - maxAge               → how long before the cookie expires (in milliseconds)
 */
const setTokenCookie = (res, token) => {
  const millisecondsIn7Days = 7 * 24 * 60 * 60 * 1000;

  res.cookie('token', token, {
    httpOnly: true,
    secure: config.isProd,           // Only HTTPS in production
    sameSite: config.isProd ? 'strict' : 'lax',
    // 'lax' in dev: allows cookie to work with our local SPA dev server
    // 'strict' in prod: strongest CSRF protection
    maxAge: millisecondsIn7Days,
  });
};

// ─── Service Methods ───────────────────────────────────────

/**
 * Register a new user.
 * Throws AppError if email already exists.
 * Returns the new user (without password) and their JWT.
 */
const register = async ({ name, email, password }) => {
  // Check if user already exists with this email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // Create the user — pre-save hook handles password hashing
  const user = await User.create({ name, email, password });

  const token = generateToken(user._id);

  return { user, token };
};

/**
 * Login an existing user.
 * Throws AppError if credentials are invalid.
 *
 * IMPORTANT: We use the same error message for "user not found" AND
 * "wrong password". This is intentional — different messages would let
 * attackers enumerate valid email addresses (user enumeration attack).
 */
const login = async ({ email, password }) => {
  // Need to explicitly select password because select:false hides it by default
  const user = await User.findOne({ email }).select('+password');

  // Deliberately vague error — same message for both failure cases
  const invalidCredentials = new AppError('Invalid email or password.', 401);

  if (!user) throw invalidCredentials;

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) throw invalidCredentials;

  const token = generateToken(user._id);

  return { user, token };
};

/**
 * Get the current user's profile.
 * This is a simple DB lookup by ID.
 */
const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

export default { register, login, getMe, generateToken, setTokenCookie };
