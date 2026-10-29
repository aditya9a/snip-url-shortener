import analyticsService from '../services/analyticsService.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/links/:id/analytics
export const getLinkAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, granularity } = req.validatedQuery;
  const defaultRangeMs = 366 * 24 * 60 * 60 * 1000;
  const boundedStartDate = startDate || new Date(Date.now() - defaultRangeMs).toISOString();
  const boundedEndDate = endDate || new Date().toISOString();

  const stats = await analyticsService.getLinkStats(
    req.user._id,
    req.params.id,
    { startDate: boundedStartDate, endDate: boundedEndDate, granularity }
  );

  res.status(200).json({
    success: true,
    data: stats,
  });
});
