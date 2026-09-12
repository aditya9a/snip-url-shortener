import { nanoid } from 'nanoid';
import Link from '../models/Link.js';
import AppError from '../utils/AppError.js';

// ─── Constants ──────────────────────────────────────────────

// Custom alphabet: 62 characters (no special chars, url-safe)
// Using nanoid's default url-safe alphabet is also fine, but we explicitly
// want standard base62 for clean URLs without dashes or underscores.
import { customAlphabet } from 'nanoid';
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const generateShortCode = customAlphabet(alphabet, 8);

// ─── Service Methods ───────────────────────────────────────

/**
 * Creates a new short link.
 * Handles custom aliases and auto-generated collision retries.
 */
const createLink = async (userId, data) => {
  const { originalUrl, customAlias, title, tags, expiresAt, password } = data;

  let shortCode;

  if (customAlias) {
    // 1. User provided a custom alias
    // We must check if it's already taken BEFORE creating
    const existing = await Link.findOne({ shortCode: customAlias });
    if (existing) {
      throw new AppError('This custom alias is already taken.', 409);
    }
    shortCode = customAlias;
  } else {
    // 2. Auto-generate with collision handling (Retry loop)
    // We try up to 3 times if we hit a highly improbable collision.
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!isUnique && attempts < maxAttempts) {
      shortCode = generateShortCode();
      const existing = await Link.findOne({ shortCode });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      // Extremely rare, but handle it gracefully
      throw new AppError('Failed to generate a unique short link. Please try again.', 500);
    }
  }

  // 3. Create the document
  const link = await Link.create({
    shortCode,
    originalUrl,
    user: userId,
    title,
    tags,
    expiresAt,
    password,
  });

  return link;
};

/**
 * Gets a paginated list of links for a specific user.
 */
const getUserLinks = async (userId, page = 1, limit = 10, search = '') => {
  const skip = (page - 1) * limit;

  // Build the query
  const query = { user: userId };
  
  if (search) {
    // Basic text search on title or originalUrl using regex
    // Note: for massive databases, you'd use a MongoDB Text Index or Atlas Search.
    // For a user's personal link list (typically < 1000 links), regex is fine.
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { originalUrl: { $regex: search, $options: 'i' } },
    ];
  }

  // Execute query and count in parallel using Promise.all
  // We use the compound index { user: 1, createdAt: -1 } we defined earlier.
  const [links, total] = await Promise.all([
    Link.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password'), // Ensure we never accidentally return link passwords
    Link.countDocuments(query),
  ]);

  return {
    links,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

/**
 * Gets a single link by ID, ensuring it belongs to the requesting user.
 */
const getLinkById = async (userId, linkId) => {
  const link = await Link.findOne({ _id: linkId, user: userId });
  if (!link) {
    throw new AppError('Link not found or unauthorized.', 404);
  }
  return link;
};

/**
 * Updates a link.
 */
const updateLink = async (userId, linkId, updateData) => {
  // First ensure the link exists and belongs to the user
  const link = await getLinkById(userId, linkId);

  // Apply updates (only to allowed fields)
  if (updateData.title !== undefined) link.title = updateData.title;
  if (updateData.tags !== undefined) link.tags = updateData.tags;
  if (updateData.isActive !== undefined) link.isActive = updateData.isActive;
  if (updateData.expiresAt !== undefined) link.expiresAt = updateData.expiresAt;
  
  // Notice we do NOT allow updating the originalUrl or shortCode.
  // Once a link is minted, its destination shouldn't change to prevent abuse
  // (e.g. sharing a safe link, getting traffic, then swapping to a phishing site).

  await link.save();
  return link;
};

/**
 * Deletes a link (and conceptually its analytics, though we'll handle analytics cleanup later).
 */
const deleteLink = async (userId, linkId) => {
  const link = await getLinkById(userId, linkId);
  await link.deleteOne();
  return true;
};

export default {
  createLink,
  getUserLinks,
  getLinkById,
  updateLink,
  deleteLink,
};
