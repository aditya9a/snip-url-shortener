import express from 'express';
import { handleRedirect, unlockLink } from '../controllers/redirectController.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /api/unlock/:shortCode
// Used by the frontend to submit a password for a protected link
router.post('/api/unlock/:shortCode', apiLimiter, unlockLink);

// GET /:shortCode
// The main redirect engine. Must be at the root level, but we mount it last
// in server.js so it doesn't accidentally catch /api/* routes.
router.get('/:shortCode', handleRedirect);

export default router;
