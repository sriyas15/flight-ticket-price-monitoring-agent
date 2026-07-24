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
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
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

    // ── Notification schedule ──────────────────────
    // UTC hour (0-23) at which to send the daily Telegram alert.
    // Default: 6 = 06:00 UTC = 11:30 AM IST, matching the original cron.
    notifyHour: {
      type: Number,
      default: 6,
      min: 0,
      max: 23,
    },

    // ── Refresh token (hashed) ─────────────────────
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

    // ── OTP (password reset) ───────────────────────
    // Hashed 6-digit OTP + expiry. Never store plain OTP.
    otpHash: {
      type: String,
      select: false,
      default: null,
    },
    otpExpires: {
      type: Date,
      select: false,
      default: null,
    },

    // ── Password reset token ───────────────────────
    // Short-lived JWT issued after OTP is verified.
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
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ──────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });

// ── Instance methods ──────────────────────────────
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
    notifyHour: this.notifyHour ?? 6,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);

export default User;