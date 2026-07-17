import winston from "winston";
import env from "./env.js";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// ── Dev format: human-readable ──────────────────
const devFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, requestId, stack }) => {
    const rid = requestId ? ` [${requestId}]` : "";
    return `${timestamp}${rid} ${level}: ${stack || message}`;
  })
);

// ── Prod format: structured JSON ────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = winston.createLogger({
  level: env.isDev ? "debug" : "info",
  format: env.isDev ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console(),
    ...(env.isProd
      ? [
          new winston.transports.File({ filename: "logs/error.log", level: "error" }),
          new winston.transports.File({ filename: "logs/combined.log" }),
        ]
      : []),
  ],
});

export default logger;
