import { Router } from "express";
import passport from "passport";
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getMe,
  googleCallback,
} from "./auth.controller.js";
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
} from "./auth.validation.js";
import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { authRateLimiter } from "../../middleware/rateLimit.middleware.js";

const router = Router();

// ── Local auth (strict rate limit applied per-route) ──────────────────────
// Google OAuth routes are intentionally excluded — the OAuth flow hits
// /google and /google/callback multiple times per login attempt, so
// applying the strict limiter would block legitimate users immediately.
router.post("/register",        authRateLimiter, registerValidation,       validate, register);
router.post("/login",           authRateLimiter, loginValidation,          validate, login);
router.post("/refresh",         authRateLimiter,                                     refresh);
router.post("/forgot-password", authRateLimiter, forgotPasswordValidation, validate, forgotPassword);
router.post("/verify-otp",      authRateLimiter, verifyOtpValidation,       validate, verifyOtp);
router.post("/reset-password",  authRateLimiter, resetPasswordValidation,   validate, resetPassword);
router.post("/logout",          authMiddleware,                                       logout);
router.get("/me",               authMiddleware,                                       getMe);

// ── Google OAuth (global rate limiter only — set in app.js) ──────────────
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5173"}/login?error=google_failed`,
  }),
  googleCallback
);

export default router;