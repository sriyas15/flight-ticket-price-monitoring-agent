import { Queue, Worker } from "bullmq";
import { createRedisConnection } from "../config/redis.js";
import AlertRepository from "../modules/alerts/alert.repository.js";
import {
  QUEUE_NAME,
  JOB_NAME,
  CLEANUP_CRON,
  PRICE_OBSERVATION_TTL_DAYS,
} from "../constants/index.js";
import logger from "../config/logger.js";

// ── Queue ─────────────────────────────────────────────────────────────────

let cleanupQueue = null;

export const getCleanupQueue = () => {
  if (!cleanupQueue) {
    cleanupQueue = new Queue(QUEUE_NAME.CLEANUP, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 2,
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 10 },
      },
    });
  }
  return cleanupQueue;
};

// ── Scheduler ─────────────────────────────────────────────────────────────

export const scheduleCleanupJob = async () => {
  const queue = getCleanupQueue();

  await queue.upsertJobScheduler(
    "daily-cleanup",
    { pattern: CLEANUP_CRON },
    { name: JOB_NAME.CLEANUP_OBSERVATIONS }
  );

  logger.info(`Cleanup job scheduled: ${CLEANUP_CRON}`);
};

// ── Worker ────────────────────────────────────────────────────────────────

let cleanupWorker = null;

export const startCleanupWorker = () => {
  if (cleanupWorker) return cleanupWorker;

  cleanupWorker = new Worker(
    QUEUE_NAME.CLEANUP,
    async (job) => {
      if (job.name !== JOB_NAME.CLEANUP_OBSERVATIONS) return;

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - PRICE_OBSERVATION_TTL_DAYS);

      const result = await AlertRepository.deleteOldObservations(cutoff);

      logger.info(
        `Cleanup job: deleted ${result.deletedCount} observations older than ${PRICE_OBSERVATION_TTL_DAYS} days`
      );
    },
    {
      connection: createRedisConnection(),
      concurrency: 1,
    }
  );

  cleanupWorker.on("failed", (job, err) => {
    logger.error(`Cleanup job [${job?.id}] failed: ${err.message}`);
  });

  cleanupWorker.on("error", (err) => {
    logger.error("Cleanup worker error:", err);
  });

  logger.info("Cleanup worker started");
  return cleanupWorker;
};
