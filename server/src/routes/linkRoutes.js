import express from 'express';
import * as linkController from '../controllers/linkController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import * as qrController from '../controllers/qrController.js';
import protect from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createLinkSchema, updateLinkSchema } from '../validators/index.js';

const router = express.Router();

// ALL link routes require authentication
router.use(protect);

// POST /api/links
router.post('/', validate(createLinkSchema), linkController.createLink);

// GET /api/links
router.get('/', linkController.getLinks);

// GET /api/links/:id
router.get('/:id', linkController.getLink);

// GET /api/links/:id/analytics
router.get('/:id/analytics', analyticsController.getLinkAnalytics);

// GET /api/links/:id/qr
router.get('/:id/qr', qrController.getQRCode);

// GET /api/links/:id/qr/download
router.get('/:id/qr/download', qrController.downloadQRCode);

// PATCH /api/links/:id
router.patch('/:id', validate(updateLinkSchema), linkController.updateLink);

// DELETE /api/links/:id
router.delete('/:id', linkController.deleteLink);

export default router;
