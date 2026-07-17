import TelegramProvider from "../providers/notification/telegram.provider.js";
import AlertRepository from "../modules/alerts/alert.repository.js";
import { ALERT_CHANNEL, DEAL_STATUS } from "../constants/index.js";
import logger from "../config/logger.js";

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [2000, 5000, 10000]; // backoff schedule (FR-20)

const NotificationService = {
  /**
   * Deliver a deal alert to the user via their connected channel.
   * Handles retry + backoff (FR-20) and writes to AlertLog.
   *
   * @param {Object} params
   * @param {Object} params.user       - User document (needs telegramChatId)
   * @param {Object} params.route      - FlightRoute document
   * @param {Object} params.result     - FlightResult from provider
   * @param {number|null} params.dropPct
   * @param {string} params.agentRunId
   * @returns {Promise<boolean>} true if delivered successfully
   */
  sendDealAlert: async ({ user, route, result, dropPct, agentRunId }) => {
    // Determine channel
    const channel = _resolveChannel(user);
    if (!channel) {
      logger.warn(
        `User ${user._id} has no notification channel connected — skipping alert`
      );
      return false;
    }

    // Create initial alert log entry
    const alertLog = await AlertRepository.createAlertLog({
      routeId: route._id,
      userId: user._id,
      priceAtAlert: result.price,
      baselineAtAlert: route.baselinePrice,
      dropPct,
      currency: result.currency,
      channel,
      status: DEAL_STATUS.FLAGGED,
      agentRunId,
    });

    // Attempt delivery with retry + backoff
    let lastError = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          await _sleep(RETRY_DELAYS_MS[attempt - 1]);
          logger.debug(
            `Retrying alert delivery (attempt ${attempt + 1}) for route ${route._id}`
          );
        }

        await _deliver(channel, user, route, result, dropPct);

        // Mark as sent
        await AlertRepository.updateAlertStatus(alertLog._id, DEAL_STATUS.SENT);
        logger.info(
          `Alert delivered via ${channel} for route ${route._id} (attempt ${attempt + 1})`
        );
        return true;
      } catch (err) {
        lastError = err;
        logger.warn(`Alert delivery attempt ${attempt + 1} failed: ${err.message}`);
      }
    }

    // All retries exhausted
    await AlertRepository.updateAlertStatus(
      alertLog._id,
      DEAL_STATUS.FAILED,
      lastError?.message
    );
    logger.error(
      `Alert delivery failed after ${MAX_RETRIES} attempts for route ${route._id}: ${lastError?.message}`
    );
    return false;
  },
};

// ── Private helpers ───────────────────────────────────────────────────────

const _resolveChannel = (user) => {
  if (user.telegramChatId) return ALERT_CHANNEL.TELEGRAM;
  if (user.whatsappNumber) return ALERT_CHANNEL.WHATSAPP;
  return null;
};

const _deliver = async (channel, user, route, result, dropPct) => {
  switch (channel) {
    case ALERT_CHANNEL.TELEGRAM:
      await TelegramProvider.sendDealAlert(
        user.telegramChatId,
        route,
        result,
        dropPct
      );
      break;

    case ALERT_CHANNEL.WHATSAPP:
      // TODO: WhatsApp provider integration
      throw new Error("WhatsApp provider not yet implemented");

    default:
      throw new Error(`Unknown notification channel: ${channel}`);
  }
};

const _sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default NotificationService;
