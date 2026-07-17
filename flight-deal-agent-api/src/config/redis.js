import Redis from "ioredis";
import env from "./env.js";
import logger from "./logger.js";

// BullMQ requires separate connection instances for Queue and Worker
// because Worker keeps a blocking connection open.
// Use createRedisConnection() to get a fresh instance wherever needed.

const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,    // required by BullMQ
};

/**
 * Creates a new ioredis connection.
 * BullMQ Queue, Worker, and QueueScheduler each need their own instance.
 */
export const createRedisConnection = () => {
  const client = new Redis(redisConfig);

  client.on("connect", () => logger.debug("Redis connected"));
  client.on("error", (err) => logger.error("Redis error:", err));
  client.on("close", () => logger.warn("Redis connection closed"));

  return client;
};

// Shared connection for non-BullMQ usage (caching, etc.)
let _sharedClient = null;

export const getRedisClient = () => {
  if (!_sharedClient) {
    _sharedClient = createRedisConnection();
  }
  return _sharedClient;
};

export default redisConfig;
