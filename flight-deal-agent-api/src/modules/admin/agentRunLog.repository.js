import AgentRunLog from "./agentRunLog.model.js";

const AgentRunLogRepository = {
  create: (data) =>
    AgentRunLog.create(data),

  updateRun: (runId, update) =>
    AgentRunLog.findOneAndUpdate({ runId }, update, { new: true }).exec(),

  getLastRun: () =>
    AgentRunLog.findOne().sort({ startedAt: -1 }).lean().exec(),

  getRecentRuns: (limit = 10) =>
    AgentRunLog.find().sort({ startedAt: -1 }).limit(limit).lean().exec(),

  appendError: (runId, errorEntry) =>
    AgentRunLog.findOneAndUpdate(
      { runId },
      { $push: { errorLogs: errorEntry } },
      { new: true }
    ).exec(),

  incrementField: (runId, field, amount = 1) =>
    AgentRunLog.findOneAndUpdate(
      { runId },
      { $inc: { [field]: amount } },
      { new: true }
    ).exec(),
};

export default AgentRunLogRepository;
