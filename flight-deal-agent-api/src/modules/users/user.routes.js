import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { sendSuccess } from "../../utils/response.js";
import UserRepository from "./user.repository.js";
import ApiError from "../../utils/ApiError.js";
import { hashPassword, comparePassword } from "../../utils/bcrypt.js";

const router = Router();
router.use(authMiddleware);

// ── GET /users/me ─────────────────────────────────────────────────────────
router.get("/me", async (req, res, next) => {
  try {
    const user = await UserRepository.findById(req.user.sub);
    if (!user) throw ApiError.notFound("User not found");
    return sendSuccess(res, 200, "Profile fetched", { user: user.toPublicProfile() });
  } catch (err) { next(err); }
});

// ── PATCH /users/me — update first/last name ──────────────────────────────
router.patch("/me",
  [
    body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty").isLength({ max: 50 }),
    body("lastName").optional().trim().isLength({ max: 50 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { firstName, lastName } = req.body;
      const update = {};
      if (firstName !== undefined) update.firstName = firstName;
      if (lastName  !== undefined) update.lastName  = lastName;

      const user = await UserRepository.updateById(req.user.sub, update);
      return sendSuccess(res, 200, "Profile updated", { user: user.toPublicProfile() });
    } catch (err) { next(err); }
  }
);

// ── PATCH /users/me/telegram — connect Telegram (with real verification) ────
router.patch("/me/telegram",
  [body("telegramChatId").trim().notEmpty().withMessage("Telegram chat ID is required")],
  validate,
  async (req, res, next) => {
    try {
      const { telegramChatId } = req.body;

      // Send a real verification message — proves chat ID is valid
      // and confirms to the user that the connection worked.
      const TelegramProvider = (await import("../../providers/notification/telegram.provider.js")).default;
      try {
        await TelegramProvider.sendVerification(telegramChatId);
      } catch (telegramErr) {
        // If Telegram rejects the chat ID, return a clear user-facing error
        throw ApiError.badRequest(
          "Could not reach that Telegram chat. Make sure you have started a conversation with the bot first, then retry."
        );
      }

      const user = await UserRepository.updateById(req.user.sub, { telegramChatId });
      return sendSuccess(res, 200, "Telegram connected and verified", { user: user.toPublicProfile() });
    } catch (err) { next(err); }
  }
);

// ── DELETE /users/me/telegram — disconnect Telegram ───────────────────────
router.delete("/me/telegram", async (req, res, next) => {
  try {
    const user = await UserRepository.updateById(req.user.sub, { telegramChatId: null });
    return sendSuccess(res, 200, "Telegram disconnected", { user: user.toPublicProfile() });
  } catch (err) { next(err); }
});

// ── PATCH /users/me/password — change password ────────────────────────────
router.patch("/me/password",
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .notEmpty().withMessage("New password is required")
      .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
      .matches(/[0-9]/).withMessage("Password must contain at least one number"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await UserRepository.findById(req.user.sub, true); // include password
      if (!user) throw ApiError.notFound("User not found");

      const valid = await comparePassword(req.body.currentPassword, user.password);
      if (!valid) throw ApiError.unauthorized("Current password is incorrect");

      const hash = await hashPassword(req.body.newPassword);
      await UserRepository.updateById(req.user.sub, { password: hash });

      return sendSuccess(res, 200, "Password changed successfully");
    } catch (err) { next(err); }
  }
);

export default router;
