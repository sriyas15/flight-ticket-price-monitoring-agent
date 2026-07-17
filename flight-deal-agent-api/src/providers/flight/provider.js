import MockFlightProvider from "./mock.provider.js";
import env from "../../config/env.js";

/**
 * Returns the configured flight data provider.
 * Swap env.FLIGHT_PROVIDER to "kiwi" or "duffel" when real providers
 * are integrated — no changes needed in MonitoringService.
 */
const getFlightProvider = () => {
  const name = env.FLIGHT_PROVIDER || "mock";

  switch (name) {
    case "mock":
      return MockFlightProvider;
    // case "kiwi":   return KiwiProvider;
    // case "duffel": return DuffelProvider;
    default:
      return MockFlightProvider;
  }
};

export default getFlightProvider;
