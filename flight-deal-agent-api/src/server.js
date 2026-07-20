import "./config/env.js";          
import app from "./app.js";
import connectDB from "./config/db.js";
import { getRedisClient } from "./config/redis.js";
import logger from "./config/logger.js";
import env from "./config/env.js";
import { scheduleMonitorJob, startMonitorWorker } from "./jobs/monitor.job.js";
import { scheduleCleanupJob, startCleanupWorker } from "./jobs/cleanup.job.js";
import { startBotListener, stopBotListener } from "./providers/notification/telegram.bot.js";
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

const workers = [];

const start = async () => {
  // 1. MongoDB
  await connectDB();

  // 2. Redis — verify connection before starting workers
  const redis = getRedisClient();
  await redis.ping();
  logger.info("Redis connected and responsive");

  // 3. BullMQ workers
  const monitorWorker = startMonitorWorker();
  const cleanupWorker = startCleanupWorker();
  workers.push(monitorWorker, cleanupWorker);

  // 4. Schedule cron jobs (upsert — safe on restart)
  await scheduleMonitorJob();
  await scheduleCleanupJob();

  // 5. Telegram long-poll bot (FR-19: /mystatus, /pause, /help)
  startBotListener();

  // 6. HTTP server
  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Flight provider: ${env.FLIGHT_PROVIDER}`);
    logger.info(`Telegram bot: ${env.TELEGRAM_BOT_TOKEN ? "active" : "disabled (no token)"}`);
  });

  // ── Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);

    // Stop accepting new HTTP requests
    server.close();

    // Stop Telegram polling first (avoids duplicate updates on restart)
    await stopBotListener();

    // Drain BullMQ workers (let in-progress jobs finish)
    await Promise.all(workers.map((w) => w.close()));
    logger.info("Workers drained");

    // Close Redis
    await redis.quit();
    logger.info("Redis disconnected");

    logger.info("Shutdown complete");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection:", reason);
    shutdown("unhandledRejection");
  });

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception:", err);
    shutdown("uncaughtException");
  });
};

start();
