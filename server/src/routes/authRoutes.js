import express from 'express';
import * as authController from '../controllers/authController.js';
import protect from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/index.js';

const router = express.Router();

// Routes: path → [middleware chain] → controller
// Middleware runs left-to-right. If any middleware calls next(error),
// the remaining middleware are skipped and the error handler takes over.

// POST /api/auth/register
// validate(registerSchema) → runs Zod validation → authController.register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/logout
// No auth required — anyone can hit logout (just clears the cookie)
router.post('/logout', authController.logout);

// GET /api/auth/me
// protect → verifies JWT, attaches req.user → authController.getMe
router.get('/me', protect, authController.getMe);

export default router;
