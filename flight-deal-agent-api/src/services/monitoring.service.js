import { getPrimaryProvider, getFallbackProvider } from "../providers/flight/provider.js";
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
   *   fetch → observe → compare → send daily price report
   *
   * A report is always sent once per 24h regardless of whether the target
   * price was hit. The report includes day-by-day prices for the user's window.
   *
   * @param {Object} route      - FlightRoute document
   * @param {string} agentRunId - Parent run ID for log correlation
   * @returns {Promise<{ dealt: boolean, price: number|null }>}
   */
  processRoute: async (route, agentRunId) => {
    const primaryProvider  = getPrimaryProvider();
    const fallbackProvider = getFallbackProvider();

    // Build provider params once — reused for primary + optional fallback
    const providerParams = {
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
    };

    // 1. Fetch from primary provider; fall back if it returns null
    let result = await primaryProvider.fetchLowestFare(providerParams);

    if (!result && fallbackProvider) {
      logger.warn(
        `[MonitoringService] Primary provider returned null for route ${route._id} — trying fallback (${fallbackProvider.name})`
      );
      result = await fallbackProvider.fetchLowestFare(providerParams);
    }

    if (!result) {
      logger.debug(`No fares found for route ${route._id} (${route.origin}→${route.destination})`);
      await FlightRouteRepository.updateLastChecked(route._id, null);
      return { dealt: false, price: null };
    }

    // 2. Persist price observation (best price only — for baseline history)
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

    // 5. Evaluate deal criteria (informational — used in report label, not to gate sending)
    const { isDeal, dropPct } = ComparisonService.isDeal({
      currentPrice: result.price,
      targetPrice: route.targetPrice,
      baseline,
      thresholdPct: route.alertThresholdPct,
    });

    logger.debug(
      `Route ${route._id} (${route.origin}→${route.destination}): price=${result.price}, baseline=${baseline}, isDeal=${isDeal}`
    );

    // 6. Cooldown check — one report per 24h per route
    const recentAlert = await AlertRepository.findRecentAlert(
      route._id,
      ALERT_COOLDOWN_HOURS
    );

    if (recentAlert) {
      logger.debug(`Cooldown active for route ${route._id} — skipping report`);
      return { dealt: isDeal, price: result.price };
    }

    // 7. Load user for their notification channel
    const user = await UserRepository.findById(route.userId.toString());
    if (!user) {
      logger.warn(`User not found for route ${route._id} — skipping report`);
      return { dealt: isDeal, price: result.price };
    }

    // 8. Send daily price report (always — target hit is just a label in the message)
    const sent = await NotificationService.sendDealAlert({
      user,
      route,
      result,
      dropPct,
      isDeal,
      agentRunId,
    });

    if (sent) {
      await FlightRouteRepository.updateLastAlertSent(route._id);
    }

    return { dealt: isDeal, price: result.price };
  },
};

export default MonitoringService;
