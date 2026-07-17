import { Router } from "express";
import AlertRepository from "./alert.repository.js";
import { sendSuccess } from "../../utils/response.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

// ── Controller ────────────────────────────────────────────────────────────

const getMyAlerts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const logs = await AlertRepository.getAlertLogsByUser(req.user.sub, limit);
    return sendSuccess(res, 200, "Alert logs fetched", { logs });
  } catch (err) { next(err); }
};

// ── Router ────────────────────────────────────────────────────────────────

const router = Router();
router.use(authMiddleware);
router.get("/", getMyAlerts);

export default router;
