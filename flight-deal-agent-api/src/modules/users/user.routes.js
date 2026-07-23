import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { sendSuccess } from "../../utils/response.js";
import ApiError from "../../utils/ApiError.js";
import UserRepository from "./user.repository.js";
import { hashPassword, comparePassword } from "../../utils/bcrypt.js";
import FlightRoute from "../flight-routes/flightRoute.model.js";
import { PriceObservation, AlertLog } from "../alerts/alert.model.js";

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

// ── PATCH /users/me — update name ─────────────────────────────────────────
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

// ── PATCH /users/me/telegram — connect + verify ───────────────────────────
router.patch("/me/telegram",
  [body("telegramChatId").trim().notEmpty().withMessage("Telegram chat ID is required")],
  validate,
  async (req, res, next) => {
    try {
      const { telegramChatId } = req.body;

      // 1. Check if the chat ID is already linked to another account
      const existingUser = await UserRepository.findByTelegramChatId(telegramChatId);
      if (existingUser && existingUser._id.toString() !== req.user.sub) {
        throw ApiError.conflict("This Telegram account is already connected to another user.");
      }

      // 2. Verify with Telegram provider
      const TelegramProvider = (await import("../../providers/notification/telegram.provider.js")).default;
      try {
        await TelegramProvider.sendVerification(telegramChatId);
      } catch {
        throw ApiError.badRequest(
          "Could not reach that Telegram chat. Make sure you have started a conversation with the bot first, then retry."
        );
      }

      // 3. Update user profile
      const user = await UserRepository.updateById(req.user.sub, { telegramChatId });
      return sendSuccess(res, 200, "Telegram connected and verified", { user: user.toPublicProfile() });
    } catch (err) { next(err); }
  }
);

// ── DELETE /users/me/telegram — disconnect ────────────────────────────────
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
      const user = await UserRepository.findById(req.user.sub, true);
      if (!user) throw ApiError.notFound("User not found");
      const valid = await comparePassword(req.body.currentPassword, user.password);
      if (!valid) throw ApiError.unauthorized("Current password is incorrect");
      const hash = await hashPassword(req.body.newPassword);
      await UserRepository.updateById(req.user.sub, { password: hash });
      return sendSuccess(res, 200, "Password changed successfully");
    } catch (err) { next(err); }
  }
);

// ── DELETE /users/me — delete account + all data ─────────────────────────
router.delete("/me",
  [body("password").notEmpty().withMessage("Password is required to confirm deletion")],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user.sub;

      // 1. Load user with password for confirmation
      const user = await UserRepository.findById(userId, true);
      if (!user) throw ApiError.notFound("User not found");

      // 2. Require password confirmation (Google OAuth users skip this)
      if (user.authProvider === "local") {
        const valid = await comparePassword(req.body.password, user.password);
        if (!valid) throw ApiError.unauthorized("Incorrect password. Account not deleted.");
      }

      // 3. Send Telegram goodbye before deleting (best-effort)
      if (user.telegramChatId) {
        try {
          const TelegramProvider = (await import("../../providers/notification/telegram.provider.js")).default;
          await TelegramProvider.sendMessage(
            user.telegramChatId,
            "👋 Your FareWatch account has been deleted. You will no longer receive deal alerts. We're sorry to see you go."
          );
        } catch {
          // Don't block deletion if Telegram fails
        }
      }

      // 4. Find all route IDs belonging to this user
      const routes = await FlightRoute.find({ userId }).select("_id").lean();
      const routeIds = routes.map((r) => r._id);

      // 5. Delete all related data in order
      if (routeIds.length) {
        await PriceObservation.deleteMany({ routeId: { $in: routeIds } });
        await AlertLog.deleteMany({ routeId: { $in: routeIds } });
        await FlightRoute.deleteMany({ userId });
      }

      // 6. Delete the user document itself
      await UserRepository.updateById(userId, { refreshTokenHash: null }); // invalidate sessions
      await user.deleteOne();

      return sendSuccess(res, 200, "Account deleted successfully. Goodbye.");
    } catch (err) { next(err); }
  }
);

export default router;