import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import Link from '../models/Link.js';
import Click from '../models/Click.js';

/**
 * Handles the background processing of a click event.
 * We do not await this function in the request cycle.
 */
const recordAnalytics = async (linkId, req) => {
  try {
    // 1. Get the IP (handles proxies/load balancers properly)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 2. Parse Geo Data
    const geo = geoip.lookup(ip);
    const country = geo?.country || 'Unknown';
    const city = geo?.city || 'Unknown';

    // 3. Parse User-Agent
    const uaString = req.headers['user-agent'] || '';
    const parser = new UAParser(uaString);
    
    // Determine device type (UAParser returns undefined for desktop by default)
    const deviceType = parser.getDevice().type || 'desktop';
    
    // Determine browser and OS
    const browser = parser.getBrowser().name || 'Unknown';
    const os = parser.getOS().name || 'Unknown';

    // 4. Get Referrer
    const referrer = req.headers.referer || req.headers.referrer || 'Direct';

    // 5. Save the click event
    await Click.create({
      link: linkId,
      country,
      city,
      device: deviceType,
      browser,
      os,
      referrer,
    });

    // 6. Increment the denormalized totalClicks counter on the Link document
    await Link.updateOne({ _id: linkId }, { $inc: { totalClicks: 1 } });
    
  } catch (error) {
    // We log it, but since this runs asynchronously, it won't crash the request
    console.error('Failed to record analytics:', error);
  }
};

/**
 * Validates a link and returns it. Throws if disabled or expired.
 */
const getValidLink = async (shortCode) => {
  const link = await Link.findOne({ shortCode });

  if (!link) {
    return { error: 'not_found' };
  }

  if (!link.isActive) {
    return { error: 'disabled' };
  }

  // Check manual expiration (TTL index handles automatic, but we still check just in case)
  if (link.expiresAt && link.expiresAt < new Date()) {
    return { error: 'expired' };
  }

  return { link };
};

export default {
  recordAnalytics,
  getValidLink,
};
