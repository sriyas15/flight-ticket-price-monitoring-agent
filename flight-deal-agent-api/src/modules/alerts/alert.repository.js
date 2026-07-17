import { PriceObservation, AlertLog } from "./alert.model.js";
import { BASELINE_WINDOW_DAYS, DEAL_STATUS } from "../../constants/index.js";

const AlertRepository = {
  // ── PriceObservation ────────────────────────────

  saveObservation: (data) =>
    PriceObservation.create(data),

  /**
   * Fetch observations within the baseline window for a route.
   * Used by ComparisonService to compute the rolling average.
   */
  getBaselineObservations: (routeId) => {
    const since = new Date();
    since.setDate(since.getDate() - BASELINE_WINDOW_DAYS);
    return PriceObservation.find({
      routeId,
      observedAt: { $gte: since },
    })
      .sort({ observedAt: -1 })
      .exec();
  },

  /**
   * Price history for the dashboard chart (FR-7).
   * Returns last `limit` observations, oldest-first for charting.
   */
  getPriceHistory: (routeId, limit = 30) =>
    PriceObservation.find({ routeId })
      .sort({ observedAt: -1 })
      .limit(limit)
      .lean()
      .exec()
      .then((obs) => obs.reverse()),

  deleteOldObservations: (cutoffDate) =>
    PriceObservation.deleteMany({ observedAt: { $lt: cutoffDate } }).exec(),

  // ── AlertLog ─────────────────────────────────────

  createAlertLog: (data) =>
    AlertLog.create(data),

  updateAlertStatus: (id, status, errorMessage = null) =>
    AlertLog.findByIdAndUpdate(
      id,
      {
        status,
        ...(status === DEAL_STATUS.SENT && { sentAt: new Date() }),
        ...(errorMessage && { errorMessage }),
      },
      { new: true }
    ).exec(),

  getAlertLogsByUser: (userId, limit = 20) =>
    AlertLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("routeId", "origin destination")
      .lean()
      .exec(),

  getAlertLogsByRoute: (routeId, limit = 10) =>
    AlertLog.find({ routeId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec(),

  /**
   * Check if a deal alert was already sent for this route
   * within the cooldown window (FR-16).
   */
  findRecentAlert: (routeId, cooldownHours) => {
    const since = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);
    return AlertLog.findOne({
      routeId,
      status: DEAL_STATUS.SENT,
      sentAt: { $gte: since },
    }).exec();
  },
};

export default AlertRepository;
