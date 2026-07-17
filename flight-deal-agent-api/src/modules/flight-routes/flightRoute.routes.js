import { Router } from "express";
import {
  createRoute,
  getRoutes,
  getRoute,
  updateRoute,
  deleteRoute,
  getPriceHistory,
  getRouteAlertLog,
} from "./flightRoute.controller.js";
import {
  createRouteValidation,
  updateRouteValidation,
  routeIdValidation,
} from "./flightRoute.validation.js";
import { validate } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

// All flight-route endpoints require auth
router.use(authMiddleware);

router.post("/",           createRouteValidation,  validate, createRoute);
router.get("/",                                              getRoutes);
router.get("/:id",         routeIdValidation,      validate, getRoute);
router.patch("/:id",       updateRouteValidation,  validate, updateRoute);
router.delete("/:id",      routeIdValidation,      validate, deleteRoute);
router.get("/:id/history", routeIdValidation,      validate, getPriceHistory);
router.get("/:id/alerts",  routeIdValidation,      validate, getRouteAlertLog);

export default router;
