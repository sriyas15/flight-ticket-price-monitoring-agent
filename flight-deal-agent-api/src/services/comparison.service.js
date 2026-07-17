import AlertRepository from "../modules/alerts/alert.repository.js";
import { DEFAULT_DROP_THRESHOLD } from "../constants/index.js";

/**
 * ComparisonService
 *
 * Owns all deal-detection logic (FR-13, FR-14).
 * Pure functions — no DB writes, easy to unit-test.
 */
const ComparisonService = {
  /**
   * Compute the rolling average (baseline) from recent price observations.
   * Falls back to the stored baselinePrice on the route if no observations exist yet.
   *
   * @param {string} routeId
   * @param {number|null} storedBaseline - route.baselinePrice
   * @returns {Promise<number|null>}
   */
  computeBaseline: async (routeId, storedBaseline = null) => {
    const observations = await AlertRepository.getBaselineObservations(routeId);

    if (!observations.length) return storedBaseline;

    const avg =
      observations.reduce((sum, o) => sum + o.price, 0) / observations.length;

    return Math.round(avg);
  },

  /**
   * Determine whether a current price qualifies as a deal.
   *
   * Rules (FR-14):
   *   Deal if: currentPrice <= targetPrice
   *         OR currentPrice drops >= thresholdPct% below baseline
   *
   * @param {Object} params
   * @param {number}      params.currentPrice
   * @param {number|null} params.targetPrice       - user-set target (optional)
   * @param {number|null} params.baseline          - rolling avg
   * @param {number}      params.thresholdPct      - % drop to qualify
   * @returns {{ isDeal: boolean, reason: string|null, dropPct: number|null }}
   */
  isDeal: ({ currentPrice, targetPrice, baseline, thresholdPct = DEFAULT_DROP_THRESHOLD }) => {
    // Rule A: target price hit
    if (targetPrice != null && currentPrice <= targetPrice) {
      return {
        isDeal: true,
        reason: "target_price",
        dropPct: baseline
          ? _dropPct(baseline, currentPrice)
          : null,
      };
    }

    // Rule B: significant % drop below baseline
    if (baseline != null && baseline > 0) {
      const drop = _dropPct(baseline, currentPrice);
      if (drop >= thresholdPct) {
        return { isDeal: true, reason: "baseline_drop", dropPct: drop };
      }
    }

    return { isDeal: false, reason: null, dropPct: null };
  },
};

// ── Private helpers ───────────────────────────────────────────────────────

/** Returns how many % currentPrice is below baseline (positive = cheaper). */
const _dropPct = (baseline, currentPrice) =>
  parseFloat((((baseline - currentPrice) / baseline) * 100).toFixed(2));

export default ComparisonService;
