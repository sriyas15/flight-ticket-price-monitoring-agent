import { verifyAccessToken } from "../utils/jwt.js";
import ApiError from "../utils/ApiError.js";

/**
 * Extracts Bearer token from Authorization header,
 * verifies it, and attaches the decoded payload to req.user.
 */
export const authMiddleware = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.user = decoded; // { sub, email, role, iat, exp }
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Role-based access guard. Use after authMiddleware.
 * e.g. router.get("/admin", authMiddleware, requireRole("admin"), handler)
 */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(ApiError.forbidden("You do not have permission to access this resource"));
  }
  next();
};
