import { z } from 'zod';

// ─── Auth Validators ────────────────────────────────────────

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name cannot be empty')
    .max(50, 'Name cannot exceed 50 characters'),

  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),
    // ↑ .toLowerCase() normalizes the email before it reaches our controller.
    // Without this, "John@Gmail.com" and "john@gmail.com" would be different users.

  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters'),
    // ↑ Why max 72? bcrypt truncates passwords at 72 bytes.
    // Allowing longer passwords would silently ignore extra characters,
    // creating a false sense of security. Better to tell the user upfront.
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
    // ↑ We don't enforce min length on login — the stored hash handles that.
    // If someone sends a 3-char password, it simply won't match the hash.
});

// ─── Link Validators ───────────────────────────────────────

export const createLinkSchema = z.object({
  originalUrl: z
    .string({ required_error: 'URL is required' })
    .trim()
    .url('Please provide a valid URL')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      { message: 'URL must start with http:// or https://' }
    ),
    // ↑ Why not allow ftp://, data:, javascript:, etc.?
    // - ftp:// is obsolete and rarely useful
    // - data: URIs can embed malicious content
    // - javascript: URIs execute code (XSS vector)
    // Only HTTP(S) URLs are safe to redirect to.

  customAlias: z
    .string()
    .trim()
    .min(3, 'Custom alias must be at least 3 characters')
    .max(30, 'Custom alias cannot exceed 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Custom alias can only contain letters, numbers, hyphens, and underscores'
    )
    .optional(),
    // ↑ URL-safe characters only. No spaces, special chars, or unicode.
    // This prevents encoding issues and keeps URLs clean.

  title: z
    .string()
    .trim()
    .max(200, 'Title cannot exceed 200 characters')
    .optional(),

  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(10, 'Cannot have more than 10 tags')
    .optional()
    .default([]),

  expiresAt: z
    .string()
    .datetime({ message: 'Invalid date format. Use ISO 8601.' })
    .refine(
      (date) => new Date(date) > new Date(),
      { message: 'Expiration date must be in the future' }
    )
    .optional(),

  password: z
    .string()
    .min(4, 'Link password must be at least 4 characters')
    .max(72, 'Link password cannot exceed 72 characters')
    .optional(),
});

export const updateLinkSchema = z.object({
  title: z
    .string()
    .trim()
    .max(200, 'Title cannot exceed 200 characters')
    .optional(),

  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(10, 'Cannot have more than 10 tags')
    .optional(),

  isActive: z.boolean().optional(),

  expiresAt: z
    .string()
    .datetime({ message: 'Invalid date format. Use ISO 8601.' })
    .refine(
      (date) => new Date(date) > new Date(),
      { message: 'Expiration date must be in the future' }
    )
    .optional()
    .nullable(),   // Allow null to remove expiration
});

// ─── Analytics Validators ───────────────────────────────────

export const analyticsQuerySchema = z.object({
  startDate: z
    .string()
    .datetime()
    .optional(),

  endDate: z
    .string()
    .datetime()
    .optional(),

  // How to group time-series data
  granularity: z
    .enum(['hour', 'day', 'week', 'month'])
    .optional()
    .default('day'),
});
