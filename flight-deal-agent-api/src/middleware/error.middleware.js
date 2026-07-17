import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.js";
import env from "../config/env.js";

/**
 * Global error handler — must be registered last in app.js.
 * Catches everything forwarded via next(err).
 */
// eslint-disable-next-line no-unused-vars
export const errorMiddleware = (err, req, res, _next) => {
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    err = ApiError.conflict(`${field} already in use`);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    err = ApiError.badRequest("Validation failed", errors);
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err.name === "CastError") {
    err = ApiError.badRequest(`Invalid value for field: ${err.path}`);
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal server error";
  const errors = err.errors || [];

  // Log non-operational (unexpected) errors with full stack
  if (!err.isOperational) {
    logger.error({
      message: err.message,
      stack: err.stack,
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
    });
  } else {
    logger.debug(`[${statusCode}] ${message} — ${req.method} ${req.originalUrl}`);
  }

  const body = {
    success: false,
    message,
    ...(errors.length && { errors }),
    // Only expose stack in dev
    ...(env.isDev && !err.isOperational && { stack: err.stack }),
  };

  return res.status(statusCode).json(body);
};
