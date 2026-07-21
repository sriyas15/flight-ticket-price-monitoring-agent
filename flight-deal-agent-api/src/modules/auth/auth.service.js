import crypto from "crypto";
import jwt from "jsonwebtoken";
import AuthRepository from "./auth.repository.js";
import { hashPassword, comparePassword } from "../../utils/bcrypt.js";
import { generateTokenPair, verifyRefreshToken } from "../../utils/jwt.js";
import { sendEmail } from "../../config/mailer.js";
import { otpEmailTemplate } from "../../utils/email.templates.js";
import ApiError from "../../utils/ApiError.js";
import env from "../../config/env.js";
import logger from "../../config/logger.js";

const OTP_EXPIRY_MINUTES = 10;
const OTP_EXPIRY_MS      = OTP_EXPIRY_MINUTES * 60 * 1000;

const AuthService = {
  // ── REGISTER ──────────────────────────────────────────────────────────────

  register: async ({ firstName, lastName, email, password }) => {
    const exists = await AuthRepository.existsByEmail(email);
    if (exists) throw ApiError.conflict("An account with this email already exists");

    const passwordHash = await hashPassword(password);
    const user = await AuthRepository.createUser({
      firstName, lastName: lastName || "", email,
      password: passwordHash, authProvider: "local",
    });

    const tokens = generateTokenPair(user);
    await AuthRepository.setRefreshToken(user._id, _hashToken(tokens.refreshToken));
    logger.info(`New user registered: ${user.email} [${user._id}]`);
    return { user: user.toPublicProfile(), ...tokens };
  },

  // ── LOGIN ─────────────────────────────────────────────────────────────────

  login: async ({ email, password }) => {
    const user = await AuthRepository.findByEmail(email);
    if (!user || !user.password) throw ApiError.unauthorized("Invalid email or password");

    const valid = await comparePassword(password, user.password);
    if (!valid) throw ApiError.unauthorized("Invalid email or password");

    if (!user.isActive) throw ApiError.forbidden("Your account has been deactivated. Contact support.");

    const tokens = generateTokenPair(user);
    await AuthRepository.setRefreshToken(user._id, _hashToken(tokens.refreshToken));
    logger.info(`User logged in: ${user.email} [${user._id}]`);
    return { user: user.toPublicProfile(), ...tokens };
  },

  // ── REFRESH ───────────────────────────────────────────────────────────────

  refresh: async (incomingRefreshToken) => {
    const payload = verifyRefreshToken(incomingRefreshToken);
    const user = await AuthRepository.findByIdWithRefreshToken(payload.sub);
    if (!user || !user.refreshTokenHash) throw ApiError.unauthorized("Session not found — please log in again");

    const incomingHash = _hashToken(incomingRefreshToken);
    if (incomingHash !== user.refreshTokenHash) {
      await AuthRepository.setRefreshToken(user._id, null);
      logger.warn(`Refresh token reuse detected for user ${user._id}`);
      throw ApiError.unauthorized("Token reuse detected — please log in again");
    }

    const tokens = generateTokenPair(user);
    await AuthRepository.setRefreshToken(user._id, _hashToken(tokens.refreshToken));
    return { user: user.toPublicProfile(), ...tokens };
  },

  // ── LOGOUT ────────────────────────────────────────────────────────────────

  logout: async (userId) => {
    await AuthRepository.setRefreshToken(userId, null);
    logger.info(`User logged out: [${userId}]`);
  },

  // ── FORGOT PASSWORD — step 1: send OTP ───────────────────────────────────

  forgotPassword: async (email) => {
    const user = await AuthRepository.findByEmail(email);

    if (!user) {
      logger.debug(`Forgot password for non-existent email: ${email}`);
      throw ApiError.notFound("User not found with this email");
    }

    // Block Google-only accounts from using email reset
    if (user.authProvider === "google" && !user.password) {
      logger.debug(`Forgot password attempted on Google-only account: ${email}`);
      throw ApiError.badRequest("This email is registered with Google. Please log in with Google.");
    }

    // Generate 6-digit numeric OTP
    const otp     = _generateOtp();
    const otpHash = _hashToken(otp);
    const expires = new Date(Date.now() + OTP_EXPIRY_MS);

    await AuthRepository.setOtp(user._id, otpHash, expires);

    // Send email
    const template = otpEmailTemplate(otp, user.firstName);
    await sendEmail({ to: user.email, ...template });

    logger.info(`OTP sent to ${user.email}`);

    return {
      message: "If that email is registered, an OTP has been sent.",
      // Expose OTP in dev only — so you can test without email setup
      ...(env.isDev && { devOtp: otp }),
    };
  },

  // ── VERIFY OTP — step 2: exchange OTP for resetToken ─────────────────────

  verifyOtp: async (email, otp) => {
    const user = await AuthRepository.findByEmail(email);

    // Generic error — don't leak whether email exists
    const invalid = () => ApiError.badRequest("Invalid or expired OTP");

    if (!user) throw invalid();

    // Load OTP fields (select:false by default)
    const userWithOtp = await AuthRepository.findByIdWithOtp(user._id);
    if (!userWithOtp?.otpHash || !userWithOtp?.otpExpires) throw invalid();

    // Check expiry
    if (new Date() > new Date(userWithOtp.otpExpires)) {
      await AuthRepository.clearOtp(user._id);
      throw ApiError.badRequest("OTP has expired. Please request a new one.");
    }

    // Hash the incoming OTP and compare with stored hash
    const incomingHash = _hashToken(otp);

    // timingSafeEqual requires same-length buffers — both are SHA-256 hex = 64 chars
    // If for any reason lengths differ, fall back to direct comparison
    let valid = false;
    try {
      valid = crypto.timingSafeEqual(
        Buffer.from(incomingHash, "hex"),
        Buffer.from(userWithOtp.otpHash, "hex")
      );
    } catch {
      valid = incomingHash === userWithOtp.otpHash;
    }
    if (!valid) throw invalid();

    // OTP verified — clear it immediately (one-time use)
    await AuthRepository.clearOtp(user._id);

    // Issue a short-lived reset JWT (10 min)
    const resetToken = jwt.sign(
      { sub: user._id.toString(), purpose: "password_reset" },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "10m" }
    );

    logger.info(`OTP verified for ${user.email} — reset token issued`);
    return { resetToken };
  },

  // ── RESET PASSWORD — step 3: set new password ─────────────────────────────

  resetPassword: async (resetToken, newPassword) => {
    // Verify the reset JWT
    let payload;
    try {
      payload = jwt.verify(resetToken, env.JWT_ACCESS_SECRET);
    } catch {
      throw ApiError.badRequest("Reset token is invalid or has expired. Please start again.");
    }

    if (payload.purpose !== "password_reset") {
      throw ApiError.badRequest("Invalid reset token.");
    }

    const user = await AuthRepository.findById(payload.sub);
    if (!user) throw ApiError.notFound("User not found");

    const newHash = await hashPassword(newPassword);

    // Update password + invalidate all sessions
    await AuthRepository.clearPasswordReset(user._id, newHash);
    await AuthRepository.setRefreshToken(user._id, null);

    logger.info(`Password reset successful for user [${user._id}]`);
    return { message: "Password reset successfully. Please log in with your new password." };
  },

  // ── GOOGLE OAUTH ──────────────────────────────────────────────────────────

  googleAuth: async (user) => {
    if (!user.isActive) throw ApiError.forbidden("Your account has been deactivated. Contact support.");
    const tokens = generateTokenPair(user);
    await AuthRepository.setRefreshToken(user._id, _hashToken(tokens.refreshToken));
    logger.info(`Google OAuth login: ${user.email} [${user._id}]`);
    return { user: user.toPublicProfile(), ...tokens };
  },

  // ── GET ME ────────────────────────────────────────────────────────────────

  getMe: async (userId) => {
    const user = await AuthRepository.findById(userId);
    if (!user) throw ApiError.notFound("User not found");
    return user.toPublicProfile();
  },
};

// ── Private helpers ────────────────────────────────────────────────────────

const _hashToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

/** Generate a cryptographically random 6-digit OTP */
const _generateOtp = () => {
  // Use crypto.randomInt for uniform distribution (no modulo bias)
  return String(crypto.randomInt(100000, 999999));
};

export default AuthService;