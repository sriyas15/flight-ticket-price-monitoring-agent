import TelegramBot from "node-telegram-bot-api";
import env from "../../config/env.js";
import logger from "../../config/logger.js";

let _bot = null;

export const getBot = () => {
  if (!_bot) {
    if (!env.TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN is not set in environment");
    }
    // polling: false here — long-poll is started separately in startBotListener()
    _bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: false });
  }
  return _bot;
};

// ── Deal alert ────────────────────────────────────────────────────────────

const formatDealMessage = (route, result, dropPct) => {
  const esc = (s) => String(s ?? "").replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
  const pct = dropPct != null ? `📉 *${esc(dropPct.toFixed(1))}% below baseline*\n` : "";
  const ret = result.returnDate ? `\n🔙 Return: ${esc(result.returnDate)}` : "";
  const airline = result.airline ? `\n✈️ Airline: ${esc(result.airline)}` : "";
  const stops = result.transfers != null
    ? `\n🔗 ${result.transfers === 0 ? "Non-stop" : `${result.transfers} stop(s)`}`
    : "";

  return (
    `✈️ *Flight Deal Alert\\!*\n\n` +
    `🛫 *${esc(route.origin)} → ${esc(route.destination)}*\n` +
    `📅 Departure: ${esc(result.departureDate)}${ret}${airline}${stops}\n` +
    `💰 Price: *${esc(route.currency)} ${esc(result.price?.toLocaleString("en-IN"))}*\n` +
    pct +
    `\n[Book now ↗](${result.bookingLink})`
  );
};

const TelegramProvider = {
  name: "telegram",

  /**
   * Send a welcome/verification message to a new chat ID.
   * Called during Telegram connect — confirms the chat ID is real.
   * Throws if the chat ID is invalid or bot is blocked.
   */
  sendVerification: async (chatId) => {
    const bot = getBot();
    await bot.sendMessage(
      chatId,
      `✅ *FareWatch connected\\!*\n\nYou'll receive flight deal alerts here\\. Use /help to see available commands\\.`,
      { parse_mode: "MarkdownV2" }
    );
    logger.info(`Telegram verification message sent to chat ${chatId}`);
  },

  /**
   * Send a deal alert.
   */
  sendDealAlert: async (chatId, route, result, dropPct = null) => {
    const bot = getBot();
    const text = formatDealMessage(route, result, dropPct);
    await bot.sendMessage(chatId, text, {
      parse_mode: "MarkdownV2",
      disable_web_page_preview: false,
    });
    logger.info(`Telegram alert sent to chat ${chatId} for route ${route._id}`);
  },

  /**
   * Send a plain text message (commands, errors).
   */
  sendMessage: async (chatId, text) => {
    const bot = getBot();
    await bot.sendMessage(chatId, text);
  },
};

export default TelegramProvider;
