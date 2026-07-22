import mongoose from "mongoose";
import {
  CABIN_CLASS,
  TRIP_TYPE,
  ROUTE_STATUS,
  MAX_ROUTES_PER_USER,
  DEFAULT_DROP_THRESHOLD,
} from "../../constants/index.js";

const flightRouteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ── Route definition ───────────────────────────
    origin: {
      type: String,
      required: [true, "Origin is required"],
      uppercase: true,
      trim: true,
      maxlength: 3,   // IATA code
    },
    destination: {
      type: String,
      required: false,   // optional for explore (any-destination) routes
      uppercase: true,
      trim: true,
      maxlength: 3,
      default: null,
    },

    // ── Explore mode (no specific destination) ─────
    isExplore: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ── Travel dates ───────────────────────────────
    departureDateFrom: {
      type: Date,
      required: [true, "Departure date (from) is required"],
    },
    departureDateTo: {
      type: Date,
      default: null,   // null = single date, not a range
    },
    returnDateFrom: {
      type: Date,
      default: null,
    },
    returnDateTo: {
      type: Date,
      default: null,
    },

    // ── Search params ──────────────────────────────
    tripType: {
      type: String,
      enum: Object.values(TRIP_TYPE),
      default: TRIP_TYPE.ONE_WAY,
    },
    cabinClass: {
      type: String,
      enum: Object.values(CABIN_CLASS),
      default: CABIN_CLASS.ECONOMY,
    },
    passengers: {
      type: Number,
      default: 1,
      min: 1,
      max: 9,
    },

    // ── Deal criteria ──────────────────────────────
    targetPrice: {
      type: Number,
      default: null,   // null = only use % threshold
      min: 0,
    },
    alertThresholdPct: {
      type: Number,
      default: DEFAULT_DROP_THRESHOLD,
      min: 1,
      max: 99,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    // ── State ──────────────────────────────────────
    status: {
      type: String,
      enum: Object.values(ROUTE_STATUS),
      default: ROUTE_STATUS.ACTIVE,
    },

    // ── Monitoring metadata ────────────────────────
    lastCheckedAt: {
      type: Date,
      default: null,
    },
    lastAlertSentAt: {
      type: Date,
      default: null,
    },
    baselinePrice: {
      type: Number,
      default: null,   // computed from PriceObservation rolling window
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ─────────────────────────────────────
flightRouteSchema.index({ userId: 1, status: 1 });
flightRouteSchema.index({ status: 1, lastCheckedAt: 1 }); // agent priority queue

// ── Static: enforce per-user route cap ──────────
flightRouteSchema.statics.countActiveForUser = function (userId) {
  return this.countDocuments({ userId, status: { $ne: ROUTE_STATUS.DELETED } });
};

flightRouteSchema.statics.MAX_PER_USER = MAX_ROUTES_PER_USER;

const FlightRoute = mongoose.model("FlightRoute", flightRouteSchema);

export default FlightRoute;
