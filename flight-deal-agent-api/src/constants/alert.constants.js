export const DEAL_STATUS = Object.freeze({
  FLAGGED: "flagged",
  SENT: "sent",
  FAILED: "failed",
  SKIPPED: "skipped",   // cooldown active
});

export const ALERT_CHANNEL = Object.freeze({
  TELEGRAM: "telegram",
  WHATSAPP: "whatsapp",
});

export const ALERT_COOLDOWN_HOURS = 24;       // min hours before re-alerting same route
export const BASELINE_WINDOW_DAYS   = 14;     // rolling window for price baseline
export const DEFAULT_DROP_THRESHOLD = 20;     // % drop below baseline = deal
export const PRICE_OBSERVATION_TTL_DAYS = 90; // prune observations older than this
