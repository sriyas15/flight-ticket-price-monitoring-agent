export const JOB_NAME = Object.freeze({
  MONITOR_ALL_ROUTES: "monitor:all-routes",
  MONITOR_SINGLE_ROUTE: "monitor:single-route",
  SEND_ALERT: "alert:send",
  CLEANUP_OBSERVATIONS: "cleanup:observations",
});

export const QUEUE_NAME = Object.freeze({
  MONITOR: "monitor",
  ALERT: "alert",
  CLEANUP: "cleanup",
});

// Agent must finish within 1 hour per SRS FR-11
export const AGENT_TIMEOUT_MS = 55 * 60 * 1000; // 55 min (5 min buffer)
export const MONITOR_CRON = "0 6 * * *";         // daily at 06:00 UTC
export const CLEANUP_CRON = "0 3 * * *";         // daily at 03:00 UTC
