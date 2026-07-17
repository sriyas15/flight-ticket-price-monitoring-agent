/**
 * Send a consistent success response.
 *
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*} data
 */
export const sendSuccess = (res, statusCode = 200, message = "Success", data = null) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

/**
 * Send a consistent error response.
 * Normally called from error.middleware — use this directly only when
 * you need to bypass the error middleware.
 */
export const sendError = (res, statusCode = 500, message = "Error", errors = []) => {
  const body = { success: false, message };
  if (errors.length) body.errors = errors;
  return res.status(statusCode).json(body);
};
