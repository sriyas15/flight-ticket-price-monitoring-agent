import AuthService from "./auth.service.js";
import { sendSuccess } from "../../utils/response.js";

// ── Cookie helpers ────────────────────────────────────────────────────────

const REFRESH_COOKIE = "refreshToken";

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: "/api/auth",               // scoped — cookie only sent to auth routes
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
};

// ── Controllers ───────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const result = await AuthService.register({ firstName, lastName, email, password });

    setRefreshCookie(res, result.refreshToken);

    return sendSuccess(res, 201, "Account created successfully", {
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login({ email, password });

    setRefreshCookie(res, result.refreshToken);

    return sendSuccess(res, 200, "Logged in successfully", {
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 * Reads refresh token from httpOnly cookie (preferred) OR body fallback.
 */
export const refresh = async (req, res, next) => {
  try {
    const token =
      req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not provided",
      });
    }

    const result = await AuthService.refresh(token);

    // Rotate cookie
    setRefreshCookie(res, result.refreshToken);

    return sendSuccess(res, 200, "Token refreshed", {
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Protected — requires valid access token (auth middleware).
 */
export const logout = async (req, res, next) => {
  try {
    await AuthService.logout(req.user.sub);
    clearRefreshCookie(res);
    return sendSuccess(res, 200, "Logged out successfully");
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const result = await AuthService.forgotPassword(req.body.email);
    return sendSuccess(res, 200, result.message, result.devResetToken
      ? { devResetToken: result.devResetToken }
      : null
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await AuthService.resetPassword(token, password);
    return sendSuccess(res, 200, result.message);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Protected — requires valid access token.
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await AuthService.getMe(req.user.sub);
    return sendSuccess(res, 200, "User profile fetched", { user });
  } catch (err) {
    next(err);
  }
};
