import qrService from '../services/qrService.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/links/:id/qr
// Returns the QR code as a base64 data URL (for embedding in frontend)
export const getQRCode = asyncHandler(async (req, res) => {
  const { qrDataUrl, shortUrl } = await qrService.generateQR(
    req.user._id,
    req.params.id
  );

  res.status(200).json({
    success: true,
    data: {
      qrCode: qrDataUrl,
      shortUrl,
    },
  });
});

// GET /api/links/:id/qr/download
// Returns the QR code as a downloadable PNG file
export const downloadQRCode = asyncHandler(async (req, res) => {
  const { buffer, shortCode } = await qrService.generateQRBuffer(
    req.user._id,
    req.params.id
  );

  // Set headers for file download
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', `attachment; filename="qr-${shortCode}.png"`);
  res.send(buffer);
});
