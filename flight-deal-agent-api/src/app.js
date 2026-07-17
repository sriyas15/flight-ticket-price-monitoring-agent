import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import env from "./config/env.js";
import { requestIdMiddleware } from "./middleware/requestId.middleware.js";
import { globalRateLimiter } from "./middleware/rateLimit.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import router from "./routes/index.js";

const app = express();

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Request tracing ───────────────────────────────────────────────────────
app.use(requestIdMiddleware);

// ── Global rate limiter ───────────────────────────────────────────────────
app.use(globalRateLimiter);

// ── Health check ──────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", environment: env.NODE_ENV, timestamp: new Date().toISOString() });
});

// ── API routes ────────────────────────────────────────────────────────────
app.use("/api", router);

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global error handler (must be last) ───────────────────────────────────
app.use(errorMiddleware);

export default app;
