import TelegramBot from "node-telegram-bot-api";
import env from "../../config/env.js";
import logger from "../../config/logger.js";
import UserRepository from "../../modules/users/user.repository.js";
import FlightRouteRepository from "../../modules/flight-routes/flightRoute.repository.js";
import { ROUTE_STATUS } from "../../constants/index.js";

let _pollingBot = null;

/**
 * Start the long-polling Telegram bot.
 * Separate instance from TelegramProvider (which uses polling:false).
 * Called once from server.js on startup.
 */
export const startBotListener = () => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    logger.warn("TELEGRAM_BOT_TOKEN not set — Telegram bot listener not started");
    return null;
  }

  if (_pollingBot) return _pollingBot;

  _pollingBot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, {
    polling: {
      interval: 1000,       // poll every 1s
      autoStart: true,
      params: { timeout: 10 },
    },
  });

  logger.info("Telegram bot listener started (long polling)");

  // ── /start ───────────────────────────────────────────────────────────────
  _pollingBot.onText(/\/start/, async (msg) => {
    const chatId = String(msg.chat.id);
    await _pollingBot.sendMessage(
      chatId,
      `👋 Welcome to *FareWatch*\\!\n\nI'll send you flight deal alerts when prices drop on your monitored routes\\.\n\nUse /help to see what I can do\\.`,
      { parse_mode: "MarkdownV2" }
    );
  });

  // ── /help ────────────────────────────────────────────────────────────────
  _pollingBot.onText(/\/help/, async (msg) => {
    const chatId = String(msg.chat.id);
    await _pollingBot.sendMessage(
      chatId,
      `*FareWatch commands:*\n\n` +
      `/mystatus — list your active monitored routes\n` +
      `/pause <route\\_id> — pause monitoring for a route\n` +
      `/resume <route\\_id> — resume a paused route\n` +
      `/help — show this message`,
      { parse_mode: "Markdown" }
    );
  });

  // ── /mystatus ─────────────────────────────────────────────────────────────
  _pollingBot.onText(/\/mystatus/, async (msg) => {
    const chatId = String(msg.chat.id);

    try {
      const user = await _findUserByChatId(chatId);
      if (!user) {
        await _pollingBot.sendMessage(chatId, "❌ No FareWatch account linked to this chat. Connect Telegram from your Settings page.");
        return;
      }

      const routes = await FlightRouteRepository.findActiveByUser(user._id);
      if (!routes.length) {
        await _pollingBot.sendMessage(chatId, "You have no active routes. Add some from the FareWatch dashboard.");
        return;
      }

      const lines = routes.map((r, i) => {
        const destLabel = r.isExplore ? "🌍 Any" : r.destination;
        const targetLabel = r.isExplore 
          ? "Explore Mode" 
          : (r.targetPrice ? `₹${r.targetPrice.toLocaleString("en-IN")}` : `≥${r.alertThresholdPct}% drop`);
        return `${i + 1}. *${r.origin} → ${destLabel}* (${r.status})\n` +
               `   ID: \`${r._id}\`\n` +
               `   Target: ${targetLabel}`;
      });

      await _pollingBot.sendMessage(
        chatId,
        `📋 *Your monitored routes:*\n\n${lines.join("\n\n")}`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      logger.error(`[Bot] /mystatus error for chat ${chatId}: ${err.message}`);
      await _pollingBot.sendMessage(chatId, "⚠️ Something went wrong. Please try again later.");
    }
  });

  // ── /pause <route_id> ─────────────────────────────────────────────────────
  _pollingBot.onText(/\/pause (.+)/, async (msg, match) => {
    const chatId  = String(msg.chat.id);
    const routeId = match[1].trim();
    await _toggleRoute(chatId, routeId, "paused");
  });

  // ── /resume <route_id> ────────────────────────────────────────────────────
  _pollingBot.onText(/\/resume (.+)/, async (msg, match) => {
    const chatId  = String(msg.chat.id);
    const routeId = match[1].trim();
    await _toggleRoute(chatId, routeId, "active");
  });

  // ── Error handler ─────────────────────────────────────────────────────────
  _pollingBot.on("polling_error", (err) => {
    logger.error(`[Bot] Polling error: ${err.message}`);
  });

  return _pollingBot;
};

/**
 * Stop the bot listener gracefully (called on server shutdown).
 */
export const stopBotListener = async () => {
  if (_pollingBot) {
    await _pollingBot.stopPolling();
    _pollingBot = null;
    logger.info("Telegram bot listener stopped");
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────

const _findUserByChatId = (chatId) =>
  // UserRepository doesn't have findByTelegramChatId yet — use a direct query
  import("../../modules/users/user.model.js").then(({ default: User }) =>
    User.findOne({ telegramChatId: chatId }).exec()
  );

const _toggleRoute = async (chatId, routeId, targetStatus) => {
  try {
    const user = await _findUserByChatId(chatId);
    if (!user) {
      await _pollingBot.sendMessage(chatId, "❌ No FareWatch account linked to this chat.");
      return;
    }

    const route = await FlightRouteRepository.findByIdAndUser(routeId, user._id);
    if (!route) {
      await _pollingBot.sendMessage(chatId, `❌ Route not found or doesn't belong to your account.`);
      return;
    }

    if (route.status === ROUTE_STATUS.DELETED) {
      await _pollingBot.sendMessage(chatId, `❌ This route has been deleted.`);
      return;
    }

    if (route.status === targetStatus) {
      await _pollingBot.sendMessage(
        chatId,
        `ℹ️ Route *${route.origin} → ${route.destination}* is already ${targetStatus}.`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    await FlightRouteRepository.updateById(routeId, { status: targetStatus });

    const emoji = targetStatus === "paused" ? "⏸️" : "▶️";
    await _pollingBot.sendMessage(
      chatId,
      `${emoji} Route *${route.origin} → ${route.destination}* is now *${targetStatus}*.`,
      { parse_mode: "Markdown" }
    );

    logger.info(`[Bot] Route ${routeId} set to ${targetStatus} by user ${user._id} via Telegram`);
  } catch (err) {
    logger.error(`[Bot] Toggle route error: ${err.message}`);
    await _pollingBot.sendMessage(chatId, "⚠️ Something went wrong. Please try again later.");
  }
};
