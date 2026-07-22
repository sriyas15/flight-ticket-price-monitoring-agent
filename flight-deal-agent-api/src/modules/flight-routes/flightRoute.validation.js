import { body, param } from "express-validator";
import { CABIN_CLASS, TRIP_TYPE } from "../../constants/index.js";

export const createRouteValidation = [
  body("origin")
    .trim().toUpperCase()
    .notEmpty().withMessage("Origin is required")
    .isLength({ min: 3, max: 3 }).withMessage("Origin must be a 3-letter IATA code"),

  body("isExplore")
    .optional()
    .isBoolean().withMessage("isExplore must be a boolean"),

  body("destination")
    .optional({ nullable: true })
    .trim().toUpperCase()
    .custom((val, { req }) => {
      const explore = req.body.isExplore === true || req.body.isExplore === "true";
      if (!explore && !val) {
        throw new Error("Destination is required unless isExplore is true");
      }
      if (val && val.length !== 3) {
        throw new Error("Destination must be a 3-letter IATA code");
      }
      return true;
    }),

  body("departureDateFrom")
    .notEmpty().withMessage("Departure date is required")
    .isISO8601().withMessage("Departure date must be a valid date (YYYY-MM-DD)")
    .custom((val) => {
      if (new Date(val) < new Date()) throw new Error("Departure date must be in the future");
      return true;
    }),

  body("departureDateTo")
    .optional({ nullable: true })
    .isISO8601().withMessage("Departure date (to) must be a valid date"),

  body("tripType")
    .optional()
    .isIn(Object.values(TRIP_TYPE))
    .withMessage(`Trip type must be one of: ${Object.values(TRIP_TYPE).join(", ")}`),

  body("cabinClass")
    .optional()
    .isIn(Object.values(CABIN_CLASS))
    .withMessage(`Cabin class must be one of: ${Object.values(CABIN_CLASS).join(", ")}`),

  body("passengers")
    .optional()
    .isInt({ min: 1, max: 9 }).withMessage("Passengers must be between 1 and 9"),

  body("targetPrice")
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage("Target price must be a positive number"),

  body("alertThresholdPct")
    .optional()
    .isFloat({ min: 1, max: 99 }).withMessage("Alert threshold must be between 1 and 99"),

  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 }).withMessage("Currency must be a 3-letter ISO code")
    .toUpperCase(),
];

export const updateRouteValidation = [
  param("id").isMongoId().withMessage("Invalid route ID"),

  body("targetPrice")
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage("Target price must be a positive number"),

  body("alertThresholdPct")
    .optional()
    .isFloat({ min: 1, max: 99 }).withMessage("Alert threshold must be between 1 and 99"),

  body("status")
    .optional()
    .isIn(["active", "paused"]).withMessage("Status must be active or paused"),
];

export const routeIdValidation = [
  param("id").isMongoId().withMessage("Invalid route ID"),
];
