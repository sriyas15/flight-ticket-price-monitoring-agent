import { body } from "express-validator";

export const registerValidation = [
  body("firstName")
    .trim()
    .notEmpty().withMessage("First name is required")
    .isLength({ max: 50 }).withMessage("First name must be 50 characters or less"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("Last name must be 50 characters or less"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),
];

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required"),
];

export const refreshTokenValidation = [
  body("refreshToken")
    .notEmpty().withMessage("Refresh token is required"),
];

export const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail(),
];

export const resetPasswordValidation = [
  body("token")
    .notEmpty().withMessage("Reset token is required"),

  body("password")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),
];
