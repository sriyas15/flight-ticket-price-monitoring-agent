import mongoose from "mongoose";

const agentRunLogSchema = new mongoose.Schema(
  {
    runId: {
      type: String,
      required: true,
      unique: true
    },
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    durationMs: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["running", "completed", "failed", "timeout"],
      default: "running",
    },
    routesTotal: { type: Number, default: 0 },
    routesProcessed: { type: Number, default: 0 },
    routesSkipped: { type: Number, default: 0 },
    routesFailed: { type: Number, default: 0 },
    dealsFound: { type: Number, default: 0 },
    alertsSent: { type: Number, default: 0 },
    apiCallsUsed: { type: Number, default: 0 },
    errorLogs: {
      type: [
        {
          routeId: String,
          message: String,
          at: Date,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const AgentRunLog = mongoose.model("AgentRunLog", agentRunLogSchema);

export default AgentRunLog;
