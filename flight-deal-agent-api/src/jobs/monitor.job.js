import { Queue, Worker, QueueEvents } from "bullmq";
import { v4 as uuidv4 } from "uuid";
import { createRedisConnection } from "../config/redis.js";
import MonitoringService from "../services/monitoring.service.js";
import FlightRouteRepository from "../modules/flight-routes/flightRoute.repository.js";
import AgentRunLogRepository from "../modules/admin/agentRunLog.repository.js";
import {
  QUEUE_NAME,
  JOB_NAME,
  MONITOR_CRON,
  AGENT_TIMEOUT_MS,
} from "../constants/index.js";
import logger from "../config/logger.js";

// ── Queue ─────────────────────────────────────────────────────────────────

let monitorQueue = null;

export const getMonitorQueue = () => {
  if (!monitorQueue) {
    monitorQueue = new Queue(QUEUE_NAME.MONITOR, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return monitorQueue;
};

// ── Scheduler: registers the daily cron job ───────────────────────────────

export const scheduleMonitorJob = async () => {
  const queue = getMonitorQueue();

  // Upsert cron job — safe to call on every startup
  await queue.upsertJobScheduler(
    "daily-monitor",
    { pattern: MONITOR_CRON },
    {
      name: JOB_NAME.MONITOR_ALL_ROUTES,
      opts: { jobId: "daily-monitor" },
    }
  );

  logger.info(`Monitor job scheduled: ${MONITOR_CRON}`);
};

// ── Worker ────────────────────────────────────────────────────────────────

let monitorWorker = null;

export const startMonitorWorker = () => {
  if (monitorWorker) return monitorWorker;

  monitorWorker = new Worker(
    QUEUE_NAME.MONITOR,
    async (job) => {
      if (job.name === JOB_NAME.MONITOR_ALL_ROUTES) {
        await _runFullMonitorCycle(job);
      } else if (job.name === JOB_NAME.MONITOR_SINGLE_ROUTE) {
        await _runSingleRoute(job);
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 1,           // one full run at a time
      lockDuration: AGENT_TIMEOUT_MS,
    }
  );

  monitorWorker.on("completed", (job) => {
    logger.info(`Monitor job [${job.id}] completed`);
  });

  monitorWorker.on("failed", (job, err) => {
    logger.error(`Monitor job [${job?.id}] failed: ${err.message}`);
  });

  monitorWorker.on("error", (err) => {
    logger.error("Monitor worker error:", err);
  });

  logger.info("Monitor worker started");
  return monitorWorker;
};

// ── Full cycle processor (FR-10, FR-11) ──────────────────────────────────

const _runFullMonitorCycle = async (job) => {
  const runId = uuidv4();
  const startedAt = new Date();
  const deadline = startedAt.getTime() + AGENT_TIMEOUT_MS;

  // Create run log
  const runLog = await AgentRunLogRepository.create({
    runId,
    startedAt,
    status: "running",
  });

  logger.info(`Agent run started: ${runId}`);
  await job.updateProgress(0);

  try {
    // Load all active routes — sorted oldest-checked first (FR-11)
    const routes = await FlightRouteRepository.findAllActiveForAgent();
    const total = routes.length;

    await AgentRunLogRepository.updateRun(runId, { routesTotal: total });
    logger.info(`Agent run ${runId}: processing ${total} routes`);

    let processed = 0, skipped = 0, failed = 0, deals = 0, alerts = 0, apiCalls = 0;

    for (const route of routes) {
      // Enforce 1-hour window (FR-11)
      if (Date.now() > deadline) {
        const remaining = total - processed - skipped - failed;
        skipped += remaining;
        logger.warn(
          `Agent run ${runId} hit time limit — ${remaining} routes skipped`
        );
        await AgentRunLogRepository.updateRun(runId, { routesSkipped: skipped });
        break;
      }

      try {
        const { dealt, price } = await MonitoringService.processRoute(route, runId);

        processed++;
        apiCalls++;
        if (dealt) {
          deals++;
          alerts++;
        }

        await job.updateProgress(Math.floor((processed / total) * 100));
        await AgentRunLogRepository.incrementField(runId, "routesProcessed");

        logger.debug(
          `Route ${route._id} (${route.origin}→${route.destination}): price=${price}, dealt=${dealt}`
        );
      } catch (err) {
        failed++;
        logger.error(`Route ${route._id} processing error: ${err.message}`);
        await AgentRunLogRepository.appendError(runId, {
          routeId: route._id.toString(),
          message: err.message,
          at: new Date(),
        });
        await AgentRunLogRepository.incrementField(runId, "routesFailed");
      }
    }

    // Finalise run log
    const endedAt = new Date();
    await AgentRunLogRepository.updateRun(runId, {
      status: "completed",
      endedAt,
      durationMs: endedAt - startedAt,
      routesProcessed: processed,
      routesSkipped: skipped,
      routesFailed: failed,
      dealsFound: deals,
      alertsSent: alerts,
      apiCallsUsed: apiCalls,
    });

    logger.info(
      `Agent run ${runId} completed in ${((endedAt - startedAt) / 1000).toFixed(1)}s — ` +
      `processed=${processed}, skipped=${skipped}, failed=${failed}, deals=${deals}`
    );
  } catch (err) {
    await AgentRunLogRepository.updateRun(runId, {
      status: "failed",
      endedAt: new Date(),
    });
    logger.error(`Agent run ${runId} failed fatally: ${err.message}`);
    throw err;
  }
};

// ── Single route processor (for manual triggers / retries) ────────────────

const _runSingleRoute = async (job) => {
  const { routeId } = job.data;
  const route = await FlightRouteRepository.findById(routeId);
  if (!route) throw new Error(`Route not found: ${routeId}`);
  await MonitoringService.processRoute(route, `manual-${uuidv4()}`);
};
