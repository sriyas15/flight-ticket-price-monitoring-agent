import { Router } from "express";
import authRoutes       from "../modules/auth/auth.routes.js";
import userRoutes       from "../modules/users/user.routes.js";
import flightRoutes     from "../modules/flight-routes/flightRoute.routes.js";
import alertRoutes      from "../modules/alerts/alert.routes.js";
import adminRoutes      from "../modules/admin/admin.routes.js";

const router = Router();

router.use("/auth",          authRoutes);
router.use("/users",         userRoutes);
router.use("/flight-routes", flightRoutes);
router.use("/alerts",        alertRoutes);
router.use("/admin",         adminRoutes);

export default router;
