/**
 * Explore Destinations Config
 *
 * Defines the pool of IATA destination codes queried when a route is
 * in "Explore" mode (isExplore=true, no specific destination).
 *
 * The agent fans out to each destination in the pool, fetches the cheapest
 * fare for the user's date window, sorts results by price, and sends a
 * consolidated digest.
 *
 * Origin-specific pools take precedence; the DEFAULT pool is used for any
 * origin not listed.
 */

const EXPLORE_DESTINATIONS = {
  // ── Indian domestic hubs ────────────────────────────────────────────────
  DEL: ["BOM", "BLR", "MAA", "HYD", "GOI", "CCU", "COK", "JAI", "AMD", "PNQ", "IXC", "LKO"],
  BOM: ["DEL", "BLR", "MAA", "HYD", "GOI", "CCU", "COK", "JAI", "AMD", "IXB", "PNQ", "ATQ"],
  BLR: ["DEL", "BOM", "MAA", "HYD", "GOI", "CCU", "COK", "JAI", "PNQ", "IXM", "AMD", "IXZ"],
  MAA: ["DEL", "BOM", "BLR", "HYD", "GOI", "CCU", "COK", "JAI", "AMD", "IXZ", "IXM", "PNQ"],
  HYD: ["DEL", "BOM", "BLR", "MAA", "GOI", "CCU", "COK", "JAI", "AMD", "PNQ", "NAG", "IXB"],

  // ── International hubs (Indian origin → popular int'l) ─────────────────
  // fallback to DEFAULT for anything not listed above
};

/**
 * Default pool used when the origin has no specific mapping.
 * Mix of domestic + popular international from major Indian hubs.
 */
const DEFAULT_EXPLORE_DESTINATIONS = [
  // Domestic
  "DEL", "BOM", "BLR", "MAA", "HYD", "GOI", "CCU", "COK",
  // International
  "DXB", "SIN", "BKK", "KUL", "LHR", "CDG", "NRT", "HKG",
];

/**
 * Returns the destination pool for a given origin IATA code.
 *
 * @param {string} origin - IATA code of the departure airport
 * @returns {string[]} Array of IATA destination codes
 */
export const getExploreDestinations = (origin) => {
  const code = (origin ?? "").toUpperCase().trim();
  return EXPLORE_DESTINATIONS[code] ?? DEFAULT_EXPLORE_DESTINATIONS;
};
