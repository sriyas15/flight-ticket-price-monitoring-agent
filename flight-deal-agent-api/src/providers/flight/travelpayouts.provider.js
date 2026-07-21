import axios from "axios";
import env from "../../config/env.js";
import logger from "../../config/logger.js";

const BASE_URL = "https://api.travelpayouts.com/v1/prices";

// Cabin class → trip_class integer (Travelpayouts uses 0/1/2)
const CABIN_MAP = {
  economy: 0,
  premium_economy: 0, // no premium_economy in TP — treat as economy
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
 * for a given month. We pick the single lowest price across all returned
 * dates to get the "best fare" for the route in that window.
 *
 * Docs: https://travelpayouts.github.io/slate/#tickets-for-each-day-of-a-month
 *
 * Rate limit: 10 req/second — BullMQ worker concurrency=1 is safe.
 * Data freshness: cached from last 48h of user searches on Aviasales.
 */
const TravelpayoutsProvider = {
  name: "travelpayouts",

  /**
   * @param {Object} params - See provider.interface.js
   * @returns {Promise<import('./provider.interface.js').FlightResult | null>}
   */
  fetchLowestFare: async (params) => {
    const {
      origin,
      destination,
      departureDateFrom,
      returnDateFrom,
      tripType,
      cabinClass = "economy",
      currency = "INR",
    } = params;

    if (!env.TRAVELPAYOUTS_API_TOKEN) {
      throw new Error("TRAVELPAYOUTS_API_TOKEN is not set in environment");
    }

    // Calendar endpoint needs yyyy-mm (month granularity)
    const departMonth = _toYYYYMM(departureDateFrom);
    if (!departMonth) {
      logger.warn(
        `[Travelpayouts] Invalid departureDateFrom: ${departureDateFrom}`,
      );
      return null;
    }

    const query = {
      origin,
      destination,
      depart_date: departMonth,
      calendar_type: "departure_date",
      currency: currency.toUpperCase(),
      token: env.TRAVELPAYOUTS_API_TOKEN,
    };

    // Add return month for round trips
    if (tripType === "round_trip" && returnDateFrom) {
      query.return_date = _toYYYYMM(returnDateFrom);
    }

    logger.debug(
      `[Travelpayouts] Fetching ${origin}→${destination} for ${departMonth}`,
    );

    try {
      const { data: body } = await axios.get(`${BASE_URL}/calendar`, {
        params: query,
        headers: {
          "x-access-token": env.TRAVELPAYOUTS_API_TOKEN,
          "Accept-Encoding": "gzip, deflate",
        },
        timeout: 10_000,
      });

      if (!body.success || !body.data || !Object.keys(body.data).length) {
        logger.debug(
          `[Travelpayouts] No data returned for ${origin}→${destination} ${departMonth}`,
        );
        return null;
      }

      // Pick the date with the lowest price across the whole month
      const best = _pickLowest(body.data);
      if (!best) return null;

      // Reject stale prices (expired_at in the past)
      if (best.expires_at && new Date(best.expires_at) < new Date()) {
        logger.debug(
          `[Travelpayouts] Price expired for ${origin}→${destination}`,
        );
        return null;
      }

      return {
        price: best.price,
        currency: currency.toUpperCase(),
        origin,
        destination,
        departureDate: best.departure_at?.slice(0, 10) ?? departureDateFrom,
        returnDate: best.return_at?.slice(0, 10) ?? null,
        airline: best.airline ?? null,
        transfers: best.transfers ?? null,
        provider: "travelpayouts",
        bookingLink: bookingLink(
          origin,
          destination,
          best.departure_at?.slice(0, 10),
          currency,
        ),
        fetchedAt: new Date(),
        expiresAt: best.expires_at ? new Date(best.expires_at) : null,
      };
    } catch (err) {
      if (err.response?.status === 429) {
        logger.warn("[Travelpayouts] Rate limit hit — backing off");
        throw new Error("Travelpayouts rate limit exceeded");
      }
      if (err.response?.status === 403) {
        throw new Error("Travelpayouts token invalid or unauthorised");
      }
      logger.error(`[Travelpayouts] API error: ${err.message}`);
      throw err;
    }
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Pick the entry with the lowest price from the calendar response object.
 * { "2025-10-01": { price, airline, ... }, "2025-10-02": { ... } }
 */
const _pickLowest = (data) => {
  let best = null;
  for (const entry of Object.values(data)) {
    if (!entry.price) continue;
    if (!best || entry.price < best.price) best = entry;
  }
  return best;
};

/**
 * Convert any date string (yyyy-mm-dd or yyyy-mm) to yyyy-mm.
 * Returns null if unparseable.
 */
const _toYYYYMM = (dateStr) => {
  if (!dateStr) return null;
  const m = String(dateStr).match(/^(\d{4}-\d{2})/);
  return m ? m[1] : null;
};

export default TravelpayoutsProvider;
