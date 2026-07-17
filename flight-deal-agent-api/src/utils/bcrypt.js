import bcrypt from "bcryptjs";
import env from "../config/env.js";

/**
 * Hash a plain-text password.
 */
export const hashPassword = async (plainText) =>
  bcrypt.hash(plainText, env.BCRYPT_SALT_ROUNDS);

/**
 * Compare a plain-text password against a stored hash.
 * Returns true if they match.
 */
export const comparePassword = async (plainText, hash) =>
  bcrypt.compare(plainText, hash);
