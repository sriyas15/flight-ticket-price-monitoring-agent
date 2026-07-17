import { Router } from "express";
import AgentRunLogRepository from "./agentRunLog.repository.js";
import { getMonitorQueue } from "../../jobs/monitor.job.js";
import { sendSuccess } from "../../utils/response.js";
import { authMiddleware, requireRole } from "../../middleware/auth.middleware.js";

// ── Controllers ───────────────────────────────────────────────────────────

// FR-21: last run status + health
const getSystemHealth = async (req, res, next) => {
  try {
    const lastRun = await AgentRunLogRepository.getLastRun();
    const queue = getMonitorQueue();
    const [waiting, active, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getFailedCount(),
    ]);

    return sendSuccess(res, 200, "System health", {
      lastRun,
      queue: { waiting, active, failed },
    });
  } catch (err) { next(err); }
};

const getRunLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const runs = await AgentRunLogRepository.getRecentRuns(limit);
    return sendSuccess(res, 200, "Agent run logs", { runs });
  } catch (err) { next(err); }
};

// Manually trigger a monitor run (useful for testing)
const triggerRun = async (req, res, next) => {
  try {
    const queue = getMonitorQueue();
    const job = await queue.add("monitor:all-routes", {}, { priority: 1 });
    return sendSuccess(res, 202, "Monitor run triggered", { jobId: job.id });
  } catch (err) { next(err); }
};

// ── Router ────────────────────────────────────────────────────────────────

const router = Router();

router.use(authMiddleware, requireRole("admin"));

router.get("/health",      getSystemHealth);
router.get("/runs",        getRunLogs);
router.post("/runs/trigger", triggerRun);

export default router;
