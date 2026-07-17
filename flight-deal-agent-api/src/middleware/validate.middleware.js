import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

/**
 * Collect express-validator errors and throw a 400 ApiError
 * with all messages in the errors array.
 *
 * Usage:  router.post("/register", registerValidation, validate, controller)
 */
export const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  next(ApiError.badRequest("Validation failed", errors));
};
