import jwt from "jsonwebtoken";
import env from "../config/env.js";
import ApiError from "./ApiError.js";

// ── Sign tokens ─────────────────────────────────

export const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

// ── Verify tokens ───────────────────────────────

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Access token expired");
    }
    throw ApiError.unauthorized("Invalid access token");
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Refresh token expired — please log in again");
    }
    throw ApiError.unauthorized("Invalid refresh token");
  }
};

// ── Token pair factory ───────────────────────────

/**
 * Returns { accessToken, refreshToken } for a given user.
 * Only embed non-sensitive, stable fields in the payload.
 */
export const generateTokenPair = (user) => {
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({ sub: payload.sub }),
  };
};
