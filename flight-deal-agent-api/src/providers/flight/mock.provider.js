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
 * Simulates realistic price fluctuations for the full date window so the
 * daily price report renders with real-looking day-by-day data.
 */
const MockFlightProvider = {
  name: "mock",

  fetchLowestFare: async (params) => {
    const {
      origin,
      destination,
      departureDateFrom,
      departureDateTo,
      cabinClass = "economy",
      passengers = 1,
      currency = "INR",
    } = params;

    // Simulate network latency
    await _sleep(Math.random() * 300 + 100);

    const key = `${origin}-${destination}`;
    const base = BASE_FARES[key] ?? BASE_FARES.DEFAULT;

    const cabinMultiplier = {
      economy: 1,
      premium_economy: 1.6,
      business: 3.2,
      first: 5.5,
    }[cabinClass] ?? 1;

    // ── Generate price for every day in the window ────────────────────────
    const from = departureDateFrom ? new Date(departureDateFrom) : null;
    const to   = departureDateTo   ? new Date(departureDateTo)   : from;

    if (!from) return null;

    const allDayPrices = [];
    let best = null;

    const cursor = new Date(from);
    while (cursor <= to) {
      const dateKey = cursor.toISOString().slice(0, 10);

      // ~5% chance of no data for a day (simulates no available flights)
      if (Math.random() < 0.05) {
        allDayPrices.push({ date: dateKey, price: null });
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }

      // 10% chance of a deal day (30–40% below base)
      const isDeal   = Math.random() < 0.1;
      const variance = isDeal
        ? -(0.30 + Math.random() * 0.10)
        : (Math.random() * 0.20 - 0.05);

      const dayPrice = Math.round(base * cabinMultiplier * passengers * (1 + variance));

      allDayPrices.push({ date: dateKey, price: dayPrice, airline: null, transfers: 0 });

      if (!best || dayPrice < best.price) {
        best = { date: dateKey, price: dayPrice };
      }

      if (isDeal) {
        logger.debug(`[MockProvider] Deal price on ${dateKey} for ${key}: ${currency} ${dayPrice}`);
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (!best) return null;

    return {
      price: best.price,
      currency,
      origin,
      destination,
      departureDate: best.date,
      departureDateFrom,
      departureDateTo: departureDateTo ?? null,
      returnDate: params.returnDateFrom ?? null,
      cabinClass,
      allDayPrices,
      provider: "mock",
      bookingLink: `https://www.google.com/flights?q=${origin}+to+${destination}`,
      fetchedAt: new Date(),
    };
  },
};

const _sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default MockFlightProvider;
