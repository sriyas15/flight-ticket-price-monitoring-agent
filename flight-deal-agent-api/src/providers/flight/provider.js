import MockFlightProvider        from "./mock.provider.js";
import TravelpayoutsProvider     from "./travelpayouts.provider.js";
import env from "../../config/env.js";

/**
 * Returns the primary flight data provider based on FLIGHT_PROVIDER env var.
 * All providers implement the same interface (provider.interface.js).
 */
export const getPrimaryProvider = () => {
  switch (env.FLIGHT_PROVIDER) {
    case "travelpayouts": return TravelpayoutsProvider;
    case "mock":          return MockFlightProvider;
    default:              return MockFlightProvider;
  }
};

/**
 * Returns the fallback provider to try when the primary returns null.
 * MockProvider is used as fallback in dev; swap for a second real provider later.
 * Returns null if no fallback is configured (primary === mock already).
 */
export const getFallbackProvider = () => {
  // No point falling back to mock if mock is already primary
  if (env.FLIGHT_PROVIDER === "mock") return null;
  return MockFlightProvider;
};

// Keep the old default export working for any code that still imports it
const getFlightProvider = getPrimaryProvider;
export default getFlightProvider;
