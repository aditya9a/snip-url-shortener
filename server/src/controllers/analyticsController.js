import analyticsService from '../services/analyticsService.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/links/:id/analytics
export const getLinkAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, granularity } = req.query;

  const stats = await analyticsService.getLinkStats(
    req.user._id,
    req.params.id,
    { startDate, endDate, granularity }
  );

  res.status(200).json({
    success: true,
    data: stats,
  });
});
