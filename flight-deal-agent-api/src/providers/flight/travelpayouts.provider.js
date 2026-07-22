import axios from "axios";
import env from "../../config/env.js";
import logger from "../../config/logger.js";

const BASE_URL = "https://api.travelpayouts.com/v1/prices";

// Cabin class → trip_class integer (Travelpayouts uses 0/1/2)
const CABIN_MAP = {
  economy: 0,
  premium_economy: 0,
  business: 1,
  first: 2,
};

// Build a booking search link (affiliate deep link)
const bookingLink = (origin, destination, departDate, currency) =>
  `https://www.aviasales.com/search/${origin}${departDate?.replace(/-/g, "").slice(4)}${destination}1?currency=${currency?.toLowerCase() ?? "inr"}`;

/**
 * TravelpayoutsProvider
 *
 * Uses the /v1/prices/calendar endpoint — returns cheapest tickets per day
 * for a given month. We filter to the user's date window, pick the cheapest
 * day, and return a full day-by-day price list for the report.
 */
const TravelpayoutsProvider = {
  name: "travelpayouts",

  fetchLowestFare: async (params) => {
    const {
      origin,
      destination,
      departureDateFrom,
      departureDateTo,
      returnDateFrom,
      tripType,
      cabinClass = "economy",
      currency = "INR",
    } = params;

    if (!env.TRAVELPAYOUTS_API_TOKEN) {
      throw new Error("TRAVELPAYOUTS_API_TOKEN is not set in environment");
    }

    const departMonth = _toYYYYMM(departureDateFrom);
    if (!departMonth) {
      logger.warn(`[Travelpayouts] Invalid departureDateFrom: ${departureDateFrom}`);
      return null;
    }

    const query = {
      origin,
      destination,
      depart_date: departMonth,
      calendar_type: "departure_date",
      currency: currency.toUpperCase(),
      trip_class: CABIN_MAP[cabinClass] ?? 0,
      token: env.TRAVELPAYOUTS_API_TOKEN,
    };

    if (tripType === "round_trip" && returnDateFrom) {
      query.return_date = _toYYYYMM(returnDateFrom);
    }

    logger.debug(
      `[Travelpayouts] Fetching ${origin}→${destination} for ${departMonth} ` +
      `(cabin: ${cabinClass}, range: ${departureDateFrom} → ${departureDateTo ?? "single day"})`,
    );

    // ── Fetch with local 429 retry (up to 3 attempts) ─────────────────────
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAYS_MS = [5_000, 10_000];
    let body;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await axios.get(`${BASE_URL}/calendar`, {
          params: query,
          headers: {
            "x-access-token": env.TRAVELPAYOUTS_API_TOKEN,
            "Accept-Encoding": "gzip, deflate",
          },
          timeout: 10_000,
        });
        body = response.data;
        break;
      } catch (err) {
        if (err.response?.status === 429) {
          if (attempt < MAX_ATTEMPTS) {
            const delay = RETRY_DELAYS_MS[attempt - 1];
            logger.warn(
              `[Travelpayouts] Rate limit hit — retrying in ${delay / 1000}s (attempt ${attempt}/${MAX_ATTEMPTS})`,
            );
            await _sleep(delay);
            continue;
          }
          logger.warn("[Travelpayouts] Rate limit hit — all retries exhausted");
          throw new Error("Travelpayouts rate limit exceeded");
        }
        if (err.response?.status === 403) {
          throw new Error("Travelpayouts token invalid or unauthorised");
        }
        logger.error(`[Travelpayouts] API error: ${err.message}`);
        throw err;
      }
    }

    if (!body?.success || !body?.data || !Object.keys(body.data).length) {
      logger.debug(`[Travelpayouts] No data returned for ${origin}→${destination} ${departMonth}`);
      return null;
    }

    // ── Collect prices in user's window + enumerate all days ──────────────
    const { best, allDayPrices } = _collectInRange(body.data, departureDateFrom, departureDateTo);

    if (!best) {
      logger.debug(
        `[Travelpayouts] No fares in window ${departureDateFrom} → ${departureDateTo ?? departureDateFrom} ` +
        `for ${origin}→${destination}`,
      );
      return null;
    }

    // Reject stale prices
    if (best.expires_at && new Date(best.expires_at) < new Date()) {
      logger.debug(`[Travelpayouts] Price expired for ${origin}→${destination}`);
      return null;
    }

    const bestDate = best.departure_at?.slice(0, 10) ?? departureDateFrom;

    return {
      price: best.price,
      currency: currency.toUpperCase(),
      origin,
      destination,
      departureDate: bestDate,              // cheapest day in window
      departureDateFrom,                    // user window start
      departureDateTo: departureDateTo ?? null,
      returnDate: best.return_at?.slice(0, 10) ?? null,
      airline: best.airline ?? null,
      transfers: best.transfers ?? null,
      cabinClass,
      allDayPrices,                         // [{date, price, airline, transfers}] for report
      provider: "travelpayouts",
      bookingLink: bookingLink(origin, destination, bestDate, currency),
      fetchedAt: new Date(),
      expiresAt: best.expires_at ? new Date(best.expires_at) : null,
    };
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Collect all prices within [fromStr, toStr] from the API response,
 * enumerate every calendar day in the range (including "no data" days),
 * and return both the cheapest entry and the full sorted list.
 */
const _collectInRange = (data, fromStr, toStr) => {
  const from = fromStr ? new Date(fromStr) : null;
  const to   = toStr   ? new Date(toStr)   : from;

  // Build a map of date → entry for dates within range
  const dataMap = {};
  let best = null;

  for (const [dateKey, entry] of Object.entries(data)) {
    if (!entry.price) continue;
    const d = new Date(dateKey);
    if (from && to && (d < from || d > to)) continue;

    dataMap[dateKey] = entry;
    if (!best || entry.price < best.price) {
      best = { ...entry, _dateKey: dateKey };
    }
  }

  // Enumerate all days in range (including no-data days)
  const allDayPrices = [];
  if (from && to) {
    const cursor = new Date(from);
    while (cursor <= to) {
      const dateKey = cursor.toISOString().slice(0, 10);
      const entry = dataMap[dateKey];
      allDayPrices.push(
        entry
          ? { date: dateKey, price: entry.price, airline: entry.airline ?? null, transfers: entry.transfers ?? null }
          : { date: dateKey, price: null },
      );
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (best) {
    allDayPrices.push({ date: best._dateKey, price: best.price, airline: best.airline ?? null, transfers: best.transfers ?? null });
  }

  logger.debug(
    `[Travelpayouts] ${allDayPrices.filter(d => d.price).length}/${allDayPrices.length} days have data — best: ${best?.price ?? "none"}`,
  );

  return { best, allDayPrices };
};

const _toYYYYMM = (dateStr) => {
  if (!dateStr) return null;
  const m = String(dateStr).match(/^(\d{4}-\d{2})/);
  return m ? m[1] : null;
};

const _sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default TravelpayoutsProvider;
