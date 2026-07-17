import getFlightProvider from "../providers/flight/provider.js";
import ComparisonService from "./comparison.service.js";
import NotificationService from "./notification.service.js";
import AlertRepository from "../modules/alerts/alert.repository.js";
import FlightRouteRepository from "../modules/flight-routes/flightRoute.repository.js";
import UserRepository from "../modules/users/user.repository.js";
import { ALERT_COOLDOWN_HOURS } from "../constants/index.js";
import logger from "../config/logger.js";

const MonitoringService = {
  /**
   * Process one route through the full monitoring pipeline:
   *   fetch → observe → compare → (optionally) alert
   *
   * Called by the BullMQ worker for each route job.
   *
   * @param {Object} route      - FlightRoute document
   * @param {string} agentRunId - Parent run ID for log correlation
   * @returns {Promise<{ dealt: boolean, price: number|null }>}
   */
  processRoute: async (route, agentRunId) => {
    const provider = getFlightProvider();

    // 1. Fetch current lowest fare from provider
    const result = await provider.fetchLowestFare({
      origin: route.origin,
      destination: route.destination,
      departureDateFrom: route.departureDateFrom?.toISOString().split("T")[0],
      departureDateTo: route.departureDateTo?.toISOString().split("T")[0] ?? null,
      returnDateFrom: route.returnDateFrom?.toISOString().split("T")[0] ?? null,
      returnDateTo: route.returnDateTo?.toISOString().split("T")[0] ?? null,
      tripType: route.tripType,
      cabinClass: route.cabinClass,
      passengers: route.passengers,
      currency: route.currency,
    });

    if (!result) {
      logger.debug(`No fares found for route ${route._id} (${route.origin}→${route.destination})`);
      await FlightRouteRepository.updateLastChecked(route._id, null);
      return { dealt: false, price: null };
    }

    // 2. Persist price observation (for history + baseline)
    await AlertRepository.saveObservation({
      routeId: route._id,
      price: result.price,
      currency: result.currency,
      provider: result.provider,
    });

    // 3. Compute rolling baseline
    const baseline = await ComparisonService.computeBaseline(
      route._id,
      route.baselinePrice
    );

    // 4. Update route with latest checked timestamp + new baseline
    await FlightRouteRepository.updateLastChecked(route._id, baseline);

    // 5. Evaluate deal criteria
    const { isDeal, dropPct } = ComparisonService.isDeal({
      currentPrice: result.price,
      targetPrice: route.targetPrice,
      baseline,
      thresholdPct: route.alertThresholdPct,
    });

    if (!isDeal) {
      logger.debug(
        `No deal for route ${route._id}: price=${result.price}, baseline=${baseline}`
      );
      return { dealt: false, price: result.price };
    }

    // 6. Cooldown check — avoid spam (FR-16)
    const recentAlert = await AlertRepository.findRecentAlert(
      route._id,
      ALERT_COOLDOWN_HOURS
    );

    if (recentAlert) {
      // Only re-alert if price dropped further than last alert
      const priceDroppedFurther = result.price < recentAlert.priceAtAlert;
      if (!priceDroppedFurther) {
        logger.debug(
          `Cooldown active for route ${route._id} — skipping alert`
        );
        return { dealt: true, price: result.price };
      }
    }

    // 7. Load user for their notification channel
    const user = await UserRepository.findById(route.userId.toString());
    if (!user) {
      logger.warn(`User not found for route ${route._id} — skipping alert`);
      return { dealt: true, price: result.price };
    }

    // 8. Send alert
    const sent = await NotificationService.sendDealAlert({
      user,
      route,
      result,
      dropPct,
      agentRunId,
    });

    if (sent) {
      await FlightRouteRepository.updateLastAlertSent(route._id);
    }

    return { dealt: true, price: result.price };
  },
};

export default MonitoringService;
