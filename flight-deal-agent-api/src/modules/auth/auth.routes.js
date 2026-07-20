import { Router } from "express";
import { register,login,refresh,logout,forgotPassword,resetPassword,getMe,} 
 from "./auth.controller.js";
import { registerValidation,loginValidation,forgotPasswordValidation,resetPasswordValidation,
} from "./auth.validation.js";
import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { authRateLimiter } from "../../middleware/rateLimit.middleware.js";

const router = Router();

// Apply strict rate limiting to all auth routes
router.use(authRateLimiter);

// ── Public routes ─────────────────────────────────────────────────────────
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post("/refresh", refresh);
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  validate,
  forgotPassword,
);
router.post(
  "/reset-password",
  resetPasswordValidation,
  validate,
  resetPassword,
);

// ── Protected routes ──────────────────────────────────────────────────────
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getMe);

export default router;
