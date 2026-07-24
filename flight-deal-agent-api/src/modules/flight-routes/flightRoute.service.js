import FlightRouteRepository from "./flightRoute.repository.js";
import AlertRepository from "../alerts/alert.repository.js";
import FlightRoute from "./flightRoute.model.js";
import ApiError from "../../utils/ApiError.js";
import { ROUTE_STATUS } from "../../constants/index.js";

const FlightRouteService = {
  // FR-4: create route
  create: async (userId, data) => {
    // Enforce per-user cap (FR-8)
    const count = await FlightRouteRepository.countNonDeletedForUser(userId);
    if (count >= FlightRoute.MAX_PER_USER) {
      throw ApiError.badRequest(
        `You can monitor a maximum of ${FlightRoute.MAX_PER_USER} routes. Delete an existing route first.`
      );
    }

    const route = await FlightRouteRepository.create({ userId, ...data });
    return route;
  },

  // FR-6: list user's routes
  getAll: (userId) =>
    FlightRouteRepository.findAllByUser(userId),

  // Get single route (owned by user)
  getOne: async (userId, routeId) => {
    const route = await FlightRouteRepository.findByIdAndUser(routeId, userId);
    if (!route) throw ApiError.notFound("Route not found");
    return route;
  },

  // FR-6: edit route
  update: async (userId, routeId, updates) => {
    const route = await FlightRouteRepository.findByIdAndUser(routeId, userId);
    if (!route) throw ApiError.notFound("Route not found");
    if (route.status === ROUTE_STATUS.DELETED) {
      throw ApiError.badRequest("Cannot update a deleted route");
    }

    const allowed = ["targetPrice", "alertThresholdPct", "status"];
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

    return FlightRouteRepository.updateById(routeId, safeUpdates);
  },

  // FR-6: soft delete
  delete: async (userId, routeId) => {
    const route = await FlightRouteRepository.findByIdAndUser(routeId, userId);
    if (!route) throw ApiError.notFound("Route not found");
    return FlightRouteRepository.softDelete(routeId);
  },

  // FR-7: price history for chart
  getPriceHistory: async (userId, routeId, limit = 30) => {
    const route = await FlightRouteRepository.findByIdAndUser(routeId, userId);
    if (!route) throw ApiError.notFound("Route not found");
    return AlertRepository.getPriceHistory(routeId, limit);
  },

  // FR-9: alert log for a route
  getAlertLog: async (userId, routeId) => {
    const route = await FlightRouteRepository.findByIdAndUser(routeId, userId);
    if (!route) throw ApiError.notFound("Route not found");
    return AlertRepository.getAlertLogsByRoute(routeId);
  },
};

export default FlightRouteService;
