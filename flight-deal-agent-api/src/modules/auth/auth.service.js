import crypto from "crypto";
import AuthRepository from "./auth.repository.js";
import { hashPassword, comparePassword } from "../../utils/bcrypt.js";
import { generateTokenPair, verifyRefreshToken } from "../../utils/jwt.js";
import ApiError from "../../utils/ApiError.js";
import logger from "../../config/logger.js";

const AuthService = {
  // ── REGISTER ──────────────────────────────────────────────────────────────

  register: async ({ firstName, lastName, email, password }) => {
    // 1. Check for duplicate email
    const exists = await AuthRepository.existsByEmail(email);
    if (exists) {
      throw ApiError.conflict("An account with this email already exists");
    }

    // 2. Hash password
    const passwordHash = await hashPassword(password);

    // 3. Persist user
    const user = await AuthRepository.createUser({
      firstName,
      lastName: lastName || "",
      email,
      password: passwordHash,
      authProvider: "local",
    });

    // 4. Issue tokens
    const tokens = generateTokenPair(user);

    // 5. Store hashed refresh token for later rotation/invalidation
    const rtHash = _hashToken(tokens.refreshToken);
    await AuthRepository.setRefreshToken(user._id, rtHash);

    logger.info(`New user registered: ${user.email} [${user._id}]`);

    return { user: user.toPublicProfile(), ...tokens };
  },

  // ── LOGIN ─────────────────────────────────────────────────────────────────

  login: async ({ email, password }) => {
    // 1. Find user — password is selected here (see AuthRepository)
    const user = await AuthRepository.findByEmail(email);

    // 2. Deliberate generic message — don't leak whether the email exists
    if (!user || !user.password) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // 3. Verify password
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // 4. Check account active
    if (!user.isActive) {
      throw ApiError.forbidden("Your account has been deactivated. Contact support.");
    }

    // 5. Issue tokens
    const tokens = generateTokenPair(user);

    // 6. Store hashed refresh token
    const rtHash = _hashToken(tokens.refreshToken);
    await AuthRepository.setRefreshToken(user._id, rtHash);

    logger.info(`User logged in: ${user.email} [${user._id}]`);

    return { user: user.toPublicProfile(), ...tokens };
  },

  // ── REFRESH TOKEN ─────────────────────────────────────────────────────────

  refresh: async (incomingRefreshToken) => {
    // 1. Verify JWT signature + expiry
    const payload = verifyRefreshToken(incomingRefreshToken);

    // 2. Load user with stored hash
    const user = await AuthRepository.findByIdWithRefreshToken(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw ApiError.unauthorized("Session not found — please log in again");
    }

    // 3. Validate token matches what we stored (rotation check)
    const incomingHash = _hashToken(incomingRefreshToken);
    if (incomingHash !== user.refreshTokenHash) {
      // Possible token reuse — invalidate session entirely
      await AuthRepository.setRefreshToken(user._id, null);
      logger.warn(`Refresh token reuse detected for user ${user._id}`);
      throw ApiError.unauthorized("Token reuse detected — please log in again");
    }

    // 4. Rotate: issue new pair
    const tokens = generateTokenPair(user);
    const newHash = _hashToken(tokens.refreshToken);
    await AuthRepository.setRefreshToken(user._id, newHash);

    return { user: user.toPublicProfile(), ...tokens };
  },

  // ── LOGOUT ────────────────────────────────────────────────────────────────

  logout: async (userId) => {
    await AuthRepository.setRefreshToken(userId, null);
    logger.info(`User logged out: [${userId}]`);
  },

  // ── FORGOT PASSWORD ───────────────────────────────────────────────────────

  forgotPassword: async (email) => {
    const user = await AuthRepository.findByEmail(email);

    // Always respond positively — don't leak email existence
    if (!user) {
      logger.debug(`Forgot password requested for non-existent email: ${email}`);
      return { message: "If that email is registered, a reset link has been sent." };
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await AuthRepository.setPasswordResetToken(user._id, resetTokenHash, expires);

    // TODO: send email with resetToken (plain, not hash)
    // e.g. EmailService.sendPasswordReset(user.email, resetToken)
    logger.info(`Password reset token generated for: ${user.email}`);

    // In dev, return the token directly so you can test without email setup
    return {
      message: "If that email is registered, a reset link has been sent.",
      ...(process.env.NODE_ENV === "development" && { devResetToken: resetToken }),
    };
  },

  // ── RESET PASSWORD ────────────────────────────────────────────────────────

  resetPassword: async (token, newPassword) => {
    // Hash the incoming token to compare with what's stored
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await AuthRepository.findByResetToken(tokenHash);
    if (!user) {
      throw ApiError.badRequest("Reset token is invalid or has expired");
    }

    const newHash = await hashPassword(newPassword);
    await AuthRepository.clearPasswordReset(user._id, newHash);

    // Invalidate all sessions on password change
    await AuthRepository.setRefreshToken(user._id, null);

    logger.info(`Password reset successful for user: [${user._id}]`);

    return { message: "Password reset successfully. Please log in with your new password." };
  },

  // ── GOOGLE OAUTH ──────────────────────────────────────────────────────────

  /**
   * Called after Passport verifies the Google profile.
   * User is already found-or-created by the strategy.
   * Just issues tokens and stores the refresh token hash.
   */
  googleAuth: async (user) => {
    if (!user.isActive) {
      throw ApiError.forbidden("Your account has been deactivated. Contact support.");
    }

    const tokens = generateTokenPair(user);
    const rtHash = _hashToken(tokens.refreshToken);
    await AuthRepository.setRefreshToken(user._id, rtHash);

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

/**
 * SHA-256 hash a token before storing in DB.
 * We never store the raw refresh token — only its hash.
 */
const _hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export default AuthService;