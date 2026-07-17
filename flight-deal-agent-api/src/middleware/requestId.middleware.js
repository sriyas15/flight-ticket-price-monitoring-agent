import { v4 as uuidv4 } from "uuid";

/**
 * Attaches a unique request ID to every incoming request.
 * - Reads X-Request-ID header if provided by a gateway/proxy
 * - Otherwise generates a new UUID v4
 * - Echoes the ID back in the response header for client-side tracing
 */
export const requestIdMiddleware = (req, res, next) => {
  const id = req.headers["x-request-id"] || uuidv4();
  req.requestId = id;
  res.setHeader("X-Request-ID", id);
  next();
};
