import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name must be 50 characters or less"],
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: [50, "Last name must be 50 characters or less"],
      default: "",
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },

    password: {
      type: String,
      // Not required at schema level — Google OAuth users won't have one
      minlength: [8, "Password must be at least 8 characters"],
      select: false,   // never returned in queries unless explicitly requested
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ── OAuth ──────────────────────────────────────
    googleId: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // ── Notification channels ──────────────────────
    telegramChatId: {
      type: String,
      default: null,
    },
    whatsappNumber: {
      type: String,
      default: null,
    },

    // ── Refresh token (hashed) ─────────────────────
    // Stored so we can invalidate on logout / rotation
    refreshTokenHash: {
      type: String,
      select: false,
      default: null,
    },

    // ── Account state ──────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Password reset ─────────────────────────────
    passwordResetToken: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
      default: null,
    },
  },
  {
    timestamps: true,   // createdAt, updatedAt
    versionKey: false,
  }
);

// ── Indexes ─────────────────────────────────────
userSchema.index({ googleId: 1 }, { sparse: true });

// ── Instance methods ─────────────────────────────

/**
 * Return a safe public representation — never include
 * password, tokens, or internal fields.
 */
userSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    role: this.role,
    authProvider: this.authProvider,
    telegramChatId: this.telegramChatId,
    whatsappNumber: this.whatsappNumber,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);

export default User;
