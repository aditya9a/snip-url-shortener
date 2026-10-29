import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import Link from '../models/Link.js';
import Click from '../models/Click.js';

const getLocation = (requestIp) => {
  // x-forwarded-for can contain a chain of addresses; the first is the client.
  const ip = String(requestIp || '').split(',')[0].trim();
  const isLoopback = ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
  const isPrivateIpv4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(ip);

  if (isLoopback || isPrivateIpv4) {
    return { country: 'Local / Private Network', city: 'Local' };
  }

  const geo = geoip.lookup(ip);
  return {
    country: geo?.country || 'Location unavailable',
    city: geo?.city || 'Location unavailable',
  };
};

/**
 * Persist a click before returning the redirect response. This adds a database
 * round trip to redirects, but avoids losing acknowledged clicks on shutdown.
 */
const recordAnalytics = async (linkId, req) => {
  // 1. Get the IP (handles proxies/load balancers properly)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // 2. Parse Geo Data
  const { country, city } = getLocation(ip);

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
};

/**
 * Validates a link and returns it. Throws if disabled or expired.
 */
const getValidLink = async (shortCode) => {
  // Password is select:false on the schema, so include it here to decide
  // whether a visitor must unlock the link before being redirected.
  const link = await Link.findOne({ shortCode }).select('+password');

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
