import FlightRoute from "./flightRoute.model.js";
import { ROUTE_STATUS } from "../../constants/index.js";

const FlightRouteRepository = {
  findById: (id) =>
    FlightRoute.findById(id).exec(),

  findByIdAndUser: (id, userId) =>
    FlightRoute.findOne({ _id: id, userId }).exec(),

  findAllByUser: (userId) =>
    FlightRoute.find({ userId, status: { $ne: ROUTE_STATUS.DELETED } })
      .sort({ createdAt: -1 })
      .exec(),

  findActiveByUser: (userId) =>
    FlightRoute.find({ userId, status: ROUTE_STATUS.ACTIVE }).exec(),

  // Used by monitoring agent — oldest-checked first (FR-11 priority)
  findAllActiveForAgent: () =>
    FlightRoute.find({ status: ROUTE_STATUS.ACTIVE })
      .sort({ lastCheckedAt: 1 })  // nulls first = never-checked routes get priority
      .exec(),

  create: (data) =>
    FlightRoute.create(data),

  updateById: (id, update) =>
    FlightRoute.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec(),

  softDelete: (id) =>
    FlightRoute.findByIdAndUpdate(
      id,
      { status: ROUTE_STATUS.DELETED },
      { new: true }
    ).exec(),

  countNonDeletedForUser: (userId) =>
    FlightRoute.countActiveForUser(userId),

  updateLastChecked: (id, baselinePrice) =>
    FlightRoute.findByIdAndUpdate(id, {
      lastCheckedAt: new Date(),
      ...(baselinePrice != null && { baselinePrice }),
    }).exec(),

  updateLastAlertSent: (id) =>
    FlightRoute.findByIdAndUpdate(id, { lastAlertSentAt: new Date() }).exec(),
};

export default FlightRouteRepository;
