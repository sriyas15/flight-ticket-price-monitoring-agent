import rateLimit from "express-rate-limit";
import env from "../config/env.js";

// ── Global limiter — applied to all routes ────────────────────────────────
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,   // default 15 min
  max: env.RATE_LIMIT_MAX,              // default 100 req / window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

// ── Auth limiter — stricter, applied to /api/auth ─────────────────────────
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,          // default 10 req / 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
  },
  // Skip in test environment
  skip: () => env.NODE_ENV === "test",
});
