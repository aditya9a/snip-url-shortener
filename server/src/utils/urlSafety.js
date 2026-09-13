/**
 * URL Safety Utilities
 *
 * Basic checks to prevent obviously malicious URLs from being shortened.
 * This is NOT a replacement for Google Safe Browsing API or a virus scanner.
 * It catches the most common abuse patterns.
 *
 * For a production system at scale, you'd integrate:
 * - Google Safe Browsing API (free, detects phishing/malware)
 * - VirusTotal API (aggregates 70+ URL scanners)
 *
 * We're implementing local checks that work without external dependencies.
 */

// Known URL shortener domains — prevent recursive shortening
// (shortening a short link creates redirect chains that degrade UX and obscure the destination)
const SHORTENER_DOMAINS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
  'is.gd', 'buff.ly', 'rebrand.ly', 'cutt.ly', 'short.io',
]);

// Suspicious TLDs commonly used in phishing
const SUSPICIOUS_TLDS = new Set([
  '.tk', '.ml', '.ga', '.cf', '.gq', // Free TLDs heavily abused
]);

/**
 * Validates a URL for safety.
 * Returns { safe: true } or { safe: false, reason: "..." }
 */
export const validateUrlSafety = (url) => {
  try {
    const parsed = new URL(url);

    // 1. Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { safe: false, reason: 'Only HTTP and HTTPS URLs are allowed.' };
    }

    // 2. Block localhost and private IPs (Server-Side Request Forgery prevention)
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname === '::1'
    ) {
      return { safe: false, reason: 'URLs pointing to private/local networks are not allowed.' };
    }

    // 3. Block recursive shortening
    if (SHORTENER_DOMAINS.has(hostname)) {
      return { safe: false, reason: 'Shortening another short URL is not allowed.' };
    }

    // 4. Flag suspicious TLDs (warn, don't block — could be legitimate)
    const tld = '.' + hostname.split('.').pop();
    if (SUSPICIOUS_TLDS.has(tld)) {
      // We still allow it but could flag it for review
      // For now, just pass through
    }

    // 5. Check for overly long URLs (potential abuse/injection)
    if (url.length > 2048) {
      return { safe: false, reason: 'URL exceeds maximum length (2048 characters).' };
    }

    return { safe: true };

  } catch (err) {
    return { safe: false, reason: 'Invalid URL format.' };
  }
};
