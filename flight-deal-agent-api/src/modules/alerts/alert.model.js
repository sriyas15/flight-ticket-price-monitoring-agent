import mongoose from "mongoose";
import { ALERT_CHANNEL, DEAL_STATUS } from "../../constants/index.js";

// ── PriceObservation ────────────────────────────
// One record per agent check per route.
// Used for baseline calculation and price history chart.
const priceObservationSchema = new mongoose.Schema(
  {
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FlightRoute",
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
    },
    provider: {
      type: String,
      default: "mock",
    },
    observedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { versionKey: false }
);

priceObservationSchema.index({ routeId: 1, observedAt: -1 });

export const PriceObservation = mongoose.model("PriceObservation", priceObservationSchema);

// ── AlertLog ─────────────────────────────────────
// One record per deal notification attempt.
const alertLogSchema = new mongoose.Schema(
  {
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FlightRoute",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    priceAtAlert: {
      type: Number,
      required: true,
    },
    baselineAtAlert: {
      type: Number,
      default: null,
    },
    dropPct: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      uppercase: true,
    },
    channel: {
      type: String,
      enum: Object.values(ALERT_CHANNEL),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(DEAL_STATUS),
      default: DEAL_STATUS.FLAGGED,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    agentRunId: {
      type: String,
      default: null,   // ties alert back to the run that triggered it
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

alertLogSchema.index({ routeId: 1, sentAt: -1 });
alertLogSchema.index({ userId: 1, sentAt: -1 });

export const AlertLog = mongoose.model("AlertLog", alertLogSchema);
