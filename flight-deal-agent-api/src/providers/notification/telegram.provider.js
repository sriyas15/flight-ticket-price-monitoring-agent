import TelegramBot from "node-telegram-bot-api";
import env from "../../config/env.js";
import logger from "../../config/logger.js";

let _bot = null;

const getBot = () => {
  if (!_bot) {
    if (!env.TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN is not set in environment");
    }
    // polling:false — we only send messages, not receive via long-poll here.
    // Incoming bot commands (/mystatus, /pause) are handled in a separate
    // bot listener started in server.js if TELEGRAM_BOT_TOKEN is present.
    _bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: false });
  }
  return _bot;
};

/**
 * Format a deal alert message in Telegram MarkdownV2.
 */
const formatDealMessage = (route, result, dropPct) => {
  const escape = (s) => String(s).replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");

  const pct = dropPct != null ? `📉 *${escape(dropPct.toFixed(1))}% below baseline*\n` : "";
  const ret = result.returnDate ? `\n🔙 Return: ${escape(result.returnDate)}` : "";

  return (
    `✈️ *Flight Deal Alert\\!*\n\n` +
    `🛫 *${escape(route.origin)} → ${escape(route.destination)}*\n` +
    `📅 Departure: ${escape(result.departureDate)}${ret}\n` +
    `💰 Price: *${escape(route.currency)} ${escape(result.price.toLocaleString("en-IN"))}*\n` +
    pct +
    `\n[Book now ↗](${result.bookingLink})`
  );
};

const TelegramProvider = {
  name: "telegram",

  /**
   * Send a deal alert to a user's Telegram chat.
   *
   * @param {string} chatId   - User's Telegram chat ID
   * @param {Object} route    - FlightRoute document
   * @param {Object} result   - FlightResult from provider
   * @param {number|null} dropPct - % price drop vs baseline
   */
  sendDealAlert: async (chatId, route, result, dropPct = null) => {
    const bot = getBot();
    const text = formatDealMessage({ ...route, ...result }, result, dropPct);

    await bot.sendMessage(chatId, text, {
      parse_mode: "MarkdownV2",
      disable_web_page_preview: false,
    });

    logger.info(`Telegram alert sent to chat ${chatId} for route ${route._id}`);
  },

  /**
   * Send a plain text message (used for bot commands /mystatus, /help).
   */
  sendMessage: async (chatId, text) => {
    const bot = getBot();
    await bot.sendMessage(chatId, text);
  },
};

export default TelegramProvider;
