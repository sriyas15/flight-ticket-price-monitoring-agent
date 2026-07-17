import FlightRouteService from "./flightRoute.service.js";
import { sendSuccess } from "../../utils/response.js";

export const createRoute = async (req, res, next) => {
  try {
    const route = await FlightRouteService.create(req.user.sub, req.body);
    return sendSuccess(res, 201, "Route created successfully", { route });
  } catch (err) { next(err); }
};

export const getRoutes = async (req, res, next) => {
  try {
    const routes = await FlightRouteService.getAll(req.user.sub);
    return sendSuccess(res, 200, "Routes fetched", { routes });
  } catch (err) { next(err); }
};

export const getRoute = async (req, res, next) => {
  try {
    const route = await FlightRouteService.getOne(req.user.sub, req.params.id);
    return sendSuccess(res, 200, "Route fetched", { route });
  } catch (err) { next(err); }
};

export const updateRoute = async (req, res, next) => {
  try {
    const route = await FlightRouteService.update(req.user.sub, req.params.id, req.body);
    return sendSuccess(res, 200, "Route updated", { route });
  } catch (err) { next(err); }
};

export const deleteRoute = async (req, res, next) => {
  try {
    await FlightRouteService.delete(req.user.sub, req.params.id);
    return sendSuccess(res, 200, "Route deleted");
  } catch (err) { next(err); }
};

export const getPriceHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    const history = await FlightRouteService.getPriceHistory(req.user.sub, req.params.id, limit);
    return sendSuccess(res, 200, "Price history fetched", { history });
  } catch (err) { next(err); }
};

export const getRouteAlertLog = async (req, res, next) => {
  try {
    const logs = await FlightRouteService.getAlertLog(req.user.sub, req.params.id);
    return sendSuccess(res, 200, "Alert log fetched", { logs });
  } catch (err) { next(err); }
};
