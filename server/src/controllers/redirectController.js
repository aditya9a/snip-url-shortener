import redirectService from '../services/redirectService.js';
import config from '../config/index.js';

/**
 * Handles the actual redirection.
 * This is NOT an API route, this is the root /:shortCode route.
 */
export const handleRedirect = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const { link, error } = await redirectService.getValidLink(shortCode);

    if (error) {
      // Instead of an API JSON response, we redirect to the frontend error pages.
      // E.g., http://localhost:5173/error?type=disabled
      return res.redirect(302, `${config.clientUrl}/error?type=${error}`);
    }

    // ─── Password Protection ───
    if (link.password) {
      // If the link has a password, we don't redirect to originalUrl yet.
      // We redirect to a frontend page asking for the password.
      // We pass the shortCode so the frontend knows which link to unlock.
      return res.redirect(302, `${config.clientUrl}/unlock/${shortCode}`);
    }

    // ─── Analytics Capture (Fire and Forget) ───
    // We do NOT await this. We let it run in the background.
    redirectService.recordAnalytics(link._id, req);

    // ─── The Actual Redirect ───
    // 302 ensures the browser doesn't cache it, so we always capture clicks.
    return res.redirect(302, link.originalUrl);

  } catch (err) {
    console.error('Redirect Error:', err);
    return res.redirect(302, `${config.clientUrl}/error?type=server_error`);
  }
};

/**
 * Handles unlocking a password-protected link via API request.
 * Expected body: { password: "their_guess" }
 */
export const unlockLink = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { password } = req.body;

    // Must explicitly select password for comparison
    const link = await import('../models/Link.js').then(m => m.default.findOne({ shortCode }).select('+password'));

    if (!link || !link.isActive) {
      return res.status(404).json({ success: false, message: 'Link not found or disabled' });
    }

    const isMatch = await link.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    // Capture analytics on successful unlock
    redirectService.recordAnalytics(link._id, req);

    // Return the original URL so the frontend can manually window.location.href to it
    return res.status(200).json({
      success: true,
      data: { originalUrl: link.originalUrl }
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
