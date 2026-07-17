import logger from "../../config/logger.js";

// ── Base fare table — realistic INR ballpark prices ──
const BASE_FARES = {
  "MAA-DXB": 12000,
  "BOM-LHR": 45000,
  "DEL-JFK": 55000,
  "BLR-SIN": 8000,
  "MAA-BOM": 3500,
  DEFAULT: 15000,
};

/**
 * Mock Flight Provider
 *
 * Simulates realistic price fluctuations so the rest of the system
 * (baseline calc, deal detection, notifications) can be tested end-to-end
 * without a real API key.
 *
 * Occasionally produces a "deal" price (30–40% below base) to exercise
 * the full alert pipeline.
 */
const MockFlightProvider = {
  name: "mock",

  /**
   * @param {Object} params - See provider.interface.js
   * @returns {Promise<import('./provider.interface.js').FlightResult | null>}
   */
  fetchLowestFare: async (params) => {
    const {
      origin,
      destination,
      departureDateFrom,
      cabinClass,
      passengers,
      currency = "INR",
    } = params;

    // Simulate network latency
    await _sleep(Math.random() * 300 + 100);

    const key = `${origin}-${destination}`;
    const base = BASE_FARES[key] ?? BASE_FARES.DEFAULT;

    // Cabin class multipliers
    const cabinMultiplier = {
      economy: 1,
      premium_economy: 1.6,
      business: 3.2,
      first: 5.5,
    }[cabinClass] ?? 1;

    // 10% chance of a deal (price 30–40% below base)
    const isDeal = Math.random() < 0.1;
    const variance = isDeal
      ? -(0.30 + Math.random() * 0.10)      // −30% to −40%
      : (Math.random() * 0.20 - 0.05);      // −5% to +15% normal drift

    const price = Math.round(base * cabinMultiplier * passengers * (1 + variance));

    if (isDeal) {
      logger.debug(`[MockProvider] Deal price generated for ${key}: ${currency} ${price}`);
    }

    return {
      price,
      currency,
      origin,
      destination,
      departureDate: departureDateFrom,
      returnDate: params.returnDateFrom ?? null,
      provider: "mock",
      bookingLink: `https://www.google.com/flights?q=${origin}+to+${destination}`,
      fetchedAt: new Date(),
    };
  },
};

const _sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default MockFlightProvider;
