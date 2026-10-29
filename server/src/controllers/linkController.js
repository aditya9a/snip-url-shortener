import linkService from '../services/linkService.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Link Controller
 */

// POST /api/links
export const createLink = asyncHandler(async (req, res) => {
  // req.user is attached by protect middleware
  // req.body is validated by Zod
  const link = await linkService.createLink(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: 'Link created successfully.',
    data: { link },
  });
});

// GET /api/links
export const getLinks = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.validatedQuery;

  const result = await linkService.getUserLinks(req.user._id, page, limit, search);

  res.status(200).json({
    success: true,
    data: result,
  });
});

// GET /api/links/:id
export const getLink = asyncHandler(async (req, res) => {
  const link = await linkService.getLinkById(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    data: { link },
  });
});

// PATCH /api/links/:id
export const updateLink = asyncHandler(async (req, res) => {
  const link = await linkService.updateLink(req.user._id, req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Link updated successfully.',
    data: { link },
  });
});

// DELETE /api/links/:id
export const deleteLink = asyncHandler(async (req, res) => {
  await linkService.deleteLink(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Link deleted successfully.',
  });
});
