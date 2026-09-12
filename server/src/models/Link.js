import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema(
  {
    // ─── Core Fields ───────────────────────────────────────────

    shortCode: {
      type: String,
      required: true,
      unique: true,          // Unique index — the primary lookup key for redirects
      index: true,           // Redundant with unique (unique implies index), but
                             // explicit is better than implicit for documentation
    },

    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      // We validate URL format with Zod before it reaches the model.
      // Mongoose validation is the last safety net, not the primary validator.
    },

    // ─── Ownership ─────────────────────────────────────────────

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',          // References the User model (for populate)
      required: true,
      index: true,           // Index for "get all links for this user" queries
    },

    // ─── Metadata ──────────────────────────────────────────────

    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      default: '',           // Optional user-given title for the link
    },

    tags: {
      type: [String],        // Embedded array — tags are small, bounded, always
                             // displayed with the link. No reason to reference.
      validate: {
        validator: (v) => v.length <= 10,
        message: 'A link cannot have more than 10 tags',
      },
    },

    // ─── Lifecycle ─────────────────────────────────────────────

    isActive: {
      type: Boolean,
      default: true,          // Links are active by default
      // When false, redirects return a "link disabled" page instead
    },

    expiresAt: {
      type: Date,
      default: null,          // null = never expires
      // We'll create a TTL index on this field later for auto-cleanup
    },

    // ─── Protected Links ───────────────────────────────────────

    password: {
      type: String,
      default: null,          // null = not password-protected
      select: false,          // Don't include in queries by default
      // Stored as a bcrypt hash, same as user passwords
    },

    // ─── Denormalized Analytics ────────────────────────────────

    totalClicks: {
      type: Number,
      default: 0,
      // WHY DENORMALIZE?
      // Without this, listing links requires a COUNT query on the clicks
      // collection for EVERY link. With 100 links, that's 100 extra queries.
      //
      // With this, link listing is a single query: find({ user: userId })
      // The trade-off: totalClicks might be slightly stale (a click increments
      // it asynchronously). For a dashboard showing "~142 clicks", being off
      // by 1 for a fraction of a second is acceptable.
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;  // Never send link passwords to client
        return ret;
      },
    },
  }
);

// ─── Indexes ───────────────────────────────────────────────────

// Compound index: efficiently query "all links by this user, newest first"
// This supports our most common query: the user's link list page
linkSchema.index({ user: 1, createdAt: -1 });

// TTL Index: MongoDB automatically deletes documents when expiresAt is reached
// Only documents where expiresAt is a valid Date are affected.
// Documents with expiresAt: null are never deleted.
// expireAfterSeconds: 0 means "delete at the exact Date specified in expiresAt"
linkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─── Pre-save Hook: Hash Link Password ─────────────────────────
// Same pattern as User password hashing
import bcrypt from 'bcryptjs';

linkSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to verify link password
linkSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Link = mongoose.model('Link', linkSchema);
export default Link;
