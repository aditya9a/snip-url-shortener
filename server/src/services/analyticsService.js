import mongoose from 'mongoose';
import Click from '../models/Click.js';
import Link from '../models/Link.js';
import AppError from '../utils/AppError.js';

/**
 * Analytics Service
 *
 * Uses MongoDB aggregation pipelines to compute analytics.
 * All queries filter by link ownership (userId) to prevent
 * unauthorized access to other users' analytics.
 */

/**
 * Helper: verify link belongs to user and return its _id
 */
const verifyLinkOwnership = async (userId, linkId) => {
  const link = await Link.findOne({ _id: linkId, user: userId });
  if (!link) {
    throw new AppError('Link not found or unauthorized.', 404);
  }
  return link;
};

/**
 * Get summary stats for a link.
 * Returns total clicks + time-series breakdown.
 */
const getLinkStats = async (userId, linkId, { startDate, endDate, granularity }) => {
  const link = await verifyLinkOwnership(userId, linkId);

  // Build the date filter
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  // Base match stage — always filter by this link
  const matchStage = { link: link._id };
  if (Object.keys(dateFilter).length > 0) {
    matchStage.clickedAt = dateFilter;
  }

  // ─── Time-series aggregation ────────────────────────────────
  // Groups clicks by time period (hour/day/week/month)
  // This is the most complex aggregation — let me explain each part.

  // Determine the $dateTrunc unit for grouping
  const dateGroupUnit = granularity || 'day';

  const timeSeriesPipeline = [
    { $match: matchStage },
    {
      $group: {
        // Group by truncated date (e.g., all clicks on the same day → same group)
        // $dateTrunc rounds a date down to the specified unit:
        //   2026-09-13T15:42:33Z with unit:"day" → 2026-09-13T00:00:00Z
        _id: {
          $dateTrunc: {
            date: '$clickedAt',
            unit: dateGroupUnit,
          },
        },
        clicks: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },  // Chronological order
    {
      $project: {
        _id: 0,
        date: '$_id',       // Rename _id to date for clarity
        clicks: 1,
      },
    },
  ];

  // ─── Geographic breakdown ────────────────────────────────────
  const geoPipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$country',
        clicks: { $sum: 1 },
      },
    },
    { $sort: { clicks: -1 } },
    { $limit: 20 },
    {
      $project: {
        _id: 0,
        country: '$_id',
        clicks: 1,
      },
    },
  ];

  // ─── Device breakdown ────────────────────────────────────────
  const devicePipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$device',
        clicks: { $sum: 1 },
      },
    },
    { $sort: { clicks: -1 } },
    {
      $project: {
        _id: 0,
        device: '$_id',
        clicks: 1,
      },
    },
  ];

  // ─── Browser breakdown ───────────────────────────────────────
  const browserPipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$browser',
        clicks: { $sum: 1 },
      },
    },
    { $sort: { clicks: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        browser: '$_id',
        clicks: 1,
      },
    },
  ];

  // ─── OS breakdown ────────────────────────────────────────────
  const osPipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$os',
        clicks: { $sum: 1 },
      },
    },
    { $sort: { clicks: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        os: '$_id',
        clicks: 1,
      },
    },
  ];

  // ─── Referrer breakdown ──────────────────────────────────────
  const referrerPipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$referrer',
        clicks: { $sum: 1 },
      },
    },
    { $sort: { clicks: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        referrer: '$_id',
        clicks: 1,
      },
    },
  ];

  // Run ALL aggregations in parallel using Promise.all
  // Each aggregation uses the compound index { link: 1, clickedAt: -1 }
  // so they're all efficient.
  const [timeSeries, geoData, deviceData, browserData, osData, referrerData] =
    await Promise.all([
      Click.aggregate(timeSeriesPipeline),
      Click.aggregate(geoPipeline),
      Click.aggregate(devicePipeline),
      Click.aggregate(browserPipeline),
      Click.aggregate(osPipeline),
      Click.aggregate(referrerPipeline),
    ]);

  return {
    link: {
      id: link._id,
      shortCode: link.shortCode,
      originalUrl: link.originalUrl,
      title: link.title,
      totalClicks: link.totalClicks,
      createdAt: link.createdAt,
    },
    analytics: {
      timeSeries,
      geographic: geoData,
      devices: deviceData,
      browsers: browserData,
      os: osData,
      referrers: referrerData,
    },
  };
};

export default { getLinkStats };
