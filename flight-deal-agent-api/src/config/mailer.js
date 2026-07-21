import nodemailer from "nodemailer";
import env from "./env.js";
import logger from "./logger.js";

let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_APP_PASSWORD, // Gmail App Password (not your login password)
    },
  });

  return _transporter;
};

/**
 * Send an email via Gmail SMTP.
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    // In development without email config, log OTP to console instead
    logger.warn(`[Mailer] Email not configured — would have sent to ${to}: ${subject}`);
    logger.warn(`[Mailer] Email body (text): ${text}`);
    return;
  }

  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from: `"FareWatch" <${env.GMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  });

  logger.info(`[Mailer] Email sent to ${to} — messageId: ${info.messageId}`);
  return info;
};

export default { sendEmail };