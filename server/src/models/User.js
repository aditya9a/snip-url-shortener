import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,          // Creates a unique index
      lowercase: true,       // Normalize: "John@Gmail.COM" → "john@gmail.com"
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
      // ↑ IMPORTANT: select: false means this field is EXCLUDED from
      // query results by default. You must explicitly ask for it:
      //   User.findById(id).select('+password')
      // This prevents accidentally sending password hashes in API responses.
    },
  },
  {
    // Auto-manage createdAt and updatedAt fields
    timestamps: true,

    // Control JSON serialization — what gets sent to the client
    toJSON: {
      transform(doc, ret) {
        // Rename _id to id (cleaner API response)
        ret.id = ret._id;
        delete ret._id;
        // Never send these to the client
        delete ret.password;
        delete ret.__v;   // Mongoose version key — internal use only
        return ret;
      },
    },
  }
);

// ─── Pre-save Hook: Hash Password ──────────────────────────
// This runs BEFORE every save() call on a User document.
// We check isModified('password') to avoid re-hashing an already
// hashed password when updating other fields (like name).
//
// NOTE: Mongoose 8+ async hooks should NOT call next().
// Returning from the async function signals completion.
userSchema.pre('save', async function () {
  // Only hash if password field was modified (or is new)
  if (!this.isModified('password')) return;

  // Salt rounds = 12
  // Higher = more secure but slower. 12 is the current recommended balance.
  // At 12 rounds, hashing takes ~250ms — slow enough to resist brute force,
  // fast enough to not degrade user experience.
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Instance Method: Compare Password ─────────────────────
// Used during login: user.comparePassword(candidatePassword)
// Returns true if the plain-text password matches the stored hash.
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
