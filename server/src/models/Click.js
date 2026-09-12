import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema(
  {
    // ─── Reference to the clicked link ─────────────────────────
    link: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
      index: true,           // Most analytics queries filter by link
    },

    // ─── Temporal Data ─────────────────────────────────────────
    // We store clickedAt explicitly instead of relying on timestamps.createdAt
    // because we might want to index it differently or use it in
    // aggregation pipelines without referencing the Mongoose-managed field.
    clickedAt: {
      type: Date,
      default: Date.now,
      index: true,           // Time-range queries: "clicks in the last 7 days"
    },

    // ─── Geographic Data ───────────────────────────────────────
    // Populated by geoip-lite from the client's IP address
    country: {
      type: String,
      default: 'Unknown',
    },
    city: {
      type: String,
      default: 'Unknown',
    },

    // ─── Device Data ───────────────────────────────────────────
    // Populated by ua-parser-js from the User-Agent header
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    browser: {
      type: String,
      default: 'Unknown',
    },
    os: {
      type: String,
      default: 'Unknown',
    },

    // ─── Traffic Source ─────────────────────────────────────────
    // The Referer header tells us where the click came from.
    // Was it from Twitter? An email? Direct? This is valuable marketing data.
    referrer: {
      type: String,
      default: 'Direct',     // No Referer header = user typed/pasted the URL
    },
  },
  {
    timestamps: false,
    // ↑ We're NOT using Mongoose timestamps here.
    // We have our own clickedAt field. Adding createdAt/updatedAt would be
    // redundant — click events are immutable (never updated), so updatedAt
    // is meaningless, and createdAt duplicates clickedAt.
  }
);

// ─── Compound Indexes for Analytics ────────────────────────────

// Primary analytics query: "Get click data for link X in time range Y"
// This compound index lets MongoDB efficiently filter by link AND sort by time
// in a single index scan.
clickSchema.index({ link: 1, clickedAt: -1 });

// ─── Schema Configuration ──────────────────────────────────────

// We deliberately do NOT add a toJSON transform here.
// Click data is never sent directly to clients — it's always aggregated
// through our analytics endpoints using MongoDB aggregation pipelines.
// The raw click documents are internal data.

const Click = mongoose.model('Click', clickSchema);
export default Click;
