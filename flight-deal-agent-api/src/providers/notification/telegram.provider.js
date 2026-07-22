import TelegramBot from "node-telegram-bot-api";
import env from "../../config/env.js";
import logger from "../../config/logger.js";

let _bot = null;

export const getBot = () => {
  if (!_bot) {
    if (!env.TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN is not set in environment");
    }
    _bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: false });
  }
  return _bot;
};

// ── Helpers ───────────────────────────────────────────────────────────────

/** MarkdownV2 escaper */
const esc = (s) => String(s ?? "").replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");

/** "2025-10-15" → "Oct 15" */
const _fmtDay = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

/** "2025-10-15" → "Oct 15, 2025" */
const _fmtFull = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

/** Format a number as local currency string */
const _price = (amount, currency) =>
  `${currency} ${Number(amount).toLocaleString("en-IN")}`;

// ── Message builder ────────────────────────────────────────────────────────

/**
 * Build the daily price report message in Telegram MarkdownV2.
 *
 * @param {Object} route   - FlightRoute document
 * @param {Object} result  - FlightResult from provider (includes allDayPrices)
 * @param {number|null} dropPct  - % drop below baseline
 * @param {boolean} isDeal - true if target price or % threshold was met
 */
const formatPriceReport = (route, result, dropPct, isDeal) => {
  const currency   = result.currency ?? route.currency ?? "INR";
  const cabin      = (result.cabinClass ?? route.cabinClass ?? "economy")
    .replace("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const pax        = route.passengers ?? 1;
  const paxLabel   = pax === 1 ? "1 Adult" : `${pax} Adults`;

  // ── Header ───────────────────────────────────────────────────────────────
  const header =
    `📊 *Daily Price Report*\n\n` +
    `🛫 *${esc(route.origin)} → ${esc(route.destination)}*  ·  ${esc(cabin)}  ·  ${esc(paxLabel)}\n`;

  // ── Date window label ─────────────────────────────────────────────────────
  const windowStart = result.departureDateFrom ?? result.departureDate;
  const windowEnd   = result.departureDateTo;
  const windowLine  = windowEnd && windowEnd !== windowStart
    ? `📅 ${esc(_fmtFull(windowStart))} – ${esc(_fmtFull(windowEnd))}\n\n`
    : `📅 ${esc(_fmtFull(windowStart))}\n\n`;

  // ── Day-by-day price table ────────────────────────────────────────────────
  const allDayPrices = result.allDayPrices ?? [];
  let priceTable = "";

  if (allDayPrices.length > 0) {
    const rows = allDayPrices.map((day) => {
      const label  = esc(_fmtDay(day.date));
      const isBest = day.date === result.departureDate && day.price != null;
      if (day.price == null) {
        return `📆 ${label}  —`;
      }
      const priceStr = esc(_price(day.price, currency));
      return isBest
        ? `📆 ${label}  *${priceStr}*  ⭐`
        : `📆 ${label}  ${priceStr}`;
    });
    priceTable = rows.join("\n") + "\n\n";
  }

  // ── Summary line ──────────────────────────────────────────────────────────
  const bestLine =
    `💰 Best: *${esc(_price(result.price, currency))}*` +
    (result.departureDate ? `  on ${esc(_fmtDay(result.departureDate))}` : "") +
    "\n";

  // ── Target status ─────────────────────────────────────────────────────────
  let targetLine = "";
  if (route.targetPrice != null) {
    const targetStr = esc(_price(route.targetPrice, currency));
    targetLine = isDeal
      ? `🎯 Target: ${targetStr}  ·  ✅ *TARGET HIT\\!*\n`
      : `🎯 Target: ${targetStr}  ·  Not reached yet\n`;
  }

  // ── Baseline drop % ───────────────────────────────────────────────────────
  const dropLine = dropPct != null && dropPct > 0
    ? `📉 ${esc(dropPct.toFixed(1))}% below your ${esc("14")}-day average\n`
    : "";

  // ── Airline / stops ───────────────────────────────────────────────────────
  const airlineLine = result.airline
    ? `✈️  Airline: ${esc(result.airline)}\n`
    : "";
  const stopsLine = result.transfers != null
    ? `🔗 ${result.transfers === 0 ? "Non\\-stop" : esc(`${result.transfers} stop(s)`)}\n`
    : "";

  // ── Book link ─────────────────────────────────────────────────────────────
  const bookLink = `\n[Book cheapest day ↗](${result.bookingLink})`;

  return (
    header +
    windowLine +
    priceTable +
    bestLine +
    targetLine +
    dropLine +
    airlineLine +
    stopsLine +
    bookLink
  );
};

// ── Provider ──────────────────────────────────────────────────────────────

const TelegramProvider = {
  name: "telegram",

  /**
   * Send a welcome/verification message to a new chat ID.
   */
  sendVerification: async (chatId) => {
    const bot = getBot();
    await bot.sendMessage(
      chatId,
      `✅ *FareWatch connected\\!*\n\nYou'll receive daily flight price reports here\\. Use /help to see available commands\\.`,
      { parse_mode: "MarkdownV2" }
    );
    logger.info(`Telegram verification message sent to chat ${chatId}`);
  },

  /**
   * Send a consolidated "cheapest destinations" digest for an explore route.
   *
   * @param {string}   chatId
   * @param {Object}   route       - FlightRoute document (isExplore=true)
   * @param {Array}    destinations - Sorted array of {destination, price, currency, departureDate, bookingLink, airline}
   */
  sendExploreReport: async (chatId, route, destinations) => {
    const bot = getBot();
    const currency = route.currency ?? "INR";
    const cabin    = (route.cabinClass ?? "economy")
      .replace("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const pax      = route.passengers ?? 1;

    // Date window label
    const windowStart = route.departureDateFrom;
    const windowEnd   = route.departureDateTo;
    const windowLine  = windowEnd
      ? `📅 ${esc(_fmtFull(windowStart))} – ${esc(_fmtFull(windowEnd))}\n`
      : `📅 ${esc(_fmtFull(windowStart))}\n`;

    // Header
    const header =
      `🌍 *Cheapest Destinations from ${esc(route.origin)}*\n\n` +
      windowLine +
      `✈️  ${esc(cabin)}  ·  ${esc(pax === 1 ? "1 Adult" : `${pax} Adults`)}\n\n`;

    // Destination list — top 8
    const top = destinations.slice(0, 8);
    const rows = top.map((d, i) => {
      const rank  = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣"][i] ?? `${i + 1}\\.`;
      const dest  = esc(d.destination);
      const price = esc(_price(d.price, currency));
      const date  = d.departureDate ? `  📆 ${esc(_fmtDay(d.departureDate))}` : "";
      return `${rank} *${dest}*  —  ${price}${date}`;
    });

    const listText = rows.join("\n") + "\n";

    // Best deal booking link
    const best = top[0];
    const bookLine = best
      ? `\n[Book cheapest ↗](${best.bookingLink})`
      : "";

    const text = header + listText + bookLine;

    await bot.sendMessage(chatId, text, {
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true,
    });
    logger.info(`Telegram explore report sent to chat ${chatId} for origin ${route.origin} (${top.length} destinations)`);
  },

  /**
   * Send a daily price report for a route.
   *
   * @param {string}      chatId
   * @param {Object}      route
   * @param {Object}      result   - FlightResult (must include allDayPrices)
   * @param {number|null} dropPct
   * @param {boolean}     isDeal   - true if target or % threshold was met
   */
  sendDealAlert: async (chatId, route, result, dropPct = null, isDeal = false) => {
    const bot  = getBot();
    const text = formatPriceReport(route, result, dropPct, isDeal);
    await bot.sendMessage(chatId, text, {
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true,
    });
    logger.info(`Telegram price report sent to chat ${chatId} for route ${route._id}`);
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
