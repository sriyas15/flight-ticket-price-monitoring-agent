import MockFlightProvider        from "./mock.provider.js";
import TravelpayoutsProvider     from "./travelpayouts.provider.js";
import env from "../../config/env.js";

/**
 * Returns the active flight data provider based on FLIGHT_PROVIDER env var.
 * All providers implement the same interface (provider.interface.js).
 */
const getFlightProvider = () => {
  switch (env.FLIGHT_PROVIDER) {
    case "travelpayouts": return TravelpayoutsProvider;
    case "mock":          return MockFlightProvider;
    default:
      return MockFlightProvider;
  }
};

export default getFlightProvider;
