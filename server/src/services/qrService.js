import QRCode from 'qrcode';
import Link from '../models/Link.js';
import AppError from '../utils/AppError.js';

/**
 * Generates a QR code PNG as a data URL or buffer.
 *
 * We generate the QR code on-the-fly rather than storing it.
 * Why? QR codes are deterministic — given the same URL, you always get
 * the same QR. Storing them would waste disk space for something we can
 * regenerate in milliseconds.
 *
 * If we needed to handle thousands of QR requests per second, we'd add
 * caching. At our scale, on-the-fly generation is fine.
 */

const generateQR = async (userId, linkId) => {
  const link = await Link.findOne({ _id: linkId, user: userId });
  if (!link) {
    throw new AppError('Link not found or unauthorized.', 404);
  }

  // Encode the destination directly so a QR scan never depends on the local
  // redirect server being reachable.
  const shortUrl = link.originalUrl;

  // Generate QR as a data URL (base64-encoded PNG)
  const qrDataUrl = await QRCode.toDataURL(shortUrl, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
    // Error correction levels:
    // L (7%)  — smallest QR, least redundancy
    // M (15%) — balanced (our choice)
    // Q (25%) — good for printed media
    // H (30%) — most redundancy, works even if partially obscured
  });

  return { qrDataUrl, shortUrl };
};

/**
 * Generates a QR code as a PNG buffer (for direct download).
 */
const generateQRBuffer = async (userId, linkId) => {
  const link = await Link.findOne({ _id: linkId, user: userId });
  if (!link) {
    throw new AppError('Link not found or unauthorized.', 404);
  }

  // Keep downloaded QR codes consistent with the preview: both point straight
  // to the destination URL rather than to a local redirect endpoint.
  const shortUrl = link.originalUrl;

  const buffer = await QRCode.toBuffer(shortUrl, {
    width: 600,
    margin: 2,
    errorCorrectionLevel: 'M',
  });

  return { buffer, shortCode: link.shortCode };
};

export default { generateQR, generateQRBuffer };
