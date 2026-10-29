import redirectService from '../services/redirectService.js';
import config from '../config/index.js';
import Link from '../models/Link.js';

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

    // Record the click durably before acknowledging the redirect. If analytics
    // storage is unavailable, return a retryable response instead of silently
    // dropping the event.
    try {
      await redirectService.recordAnalytics(link._id, req);
    } catch (analyticsError) {
      console.error('Failed to record redirect click:', analyticsError);
      return res.status(503).set('Retry-After', '5').send('Click tracking is temporarily unavailable. Please retry.');
    }

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
    const link = await Link.findOne({ shortCode }).select('+password');

    if (!link || !link.isActive) {
      return res.status(404).json({ success: false, message: 'Link not found or disabled' });
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'This link has expired' });
    }

    if (!link.password) {
      return res.status(400).json({ success: false, message: 'This link does not require a password' });
    }

    if (typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const isMatch = await link.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    // Capture analytics on successful unlock
    try {
      await redirectService.recordAnalytics(link._id, req);
    } catch (analyticsError) {
      console.error('Failed to record unlocked click:', analyticsError);
      return res.status(503).json({ success: false, message: 'Click tracking is temporarily unavailable. Please retry.' });
    }

    // Return the original URL so the frontend can manually window.location.href to it
    return res.status(200).json({
      success: true,
      data: { originalUrl: link.originalUrl }
    });

  } catch (err) {
    console.error('Unlock Error:', err);
    return res.status(500).json({ success: false, message: 'Unable to unlock this link' });
  }
};
