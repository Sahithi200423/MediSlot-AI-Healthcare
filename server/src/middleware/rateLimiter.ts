import rateLimit from "express-rate-limit"
import { Request, Response } from "express"

/**
 * Authentication Rate Limiter
 * Applied to POST /api/auth/login
 * Maximum 5 failed attempts per IP within a 15-minute window.
 * Successful logins do NOT consume the failed attempt allowance (skipSuccessfulRequests: true).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // max 5 attempts per window
  skipSuccessfulRequests: true, // successful requests don't decrement allowance
  standardHeaders: true, // Draft-6 / Draft-7 RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: "Too many failed login attempts. Please try again after 15 minutes.",
  handler: (req: Request, res: Response, _next, options) => {
    res.status(429).json({
      success: false,
      error: {
        message: typeof options.message === "string" ? options.message : "Too many failed login attempts. Please try again after 15 minutes.",
        statusCode: 429,
      },
    })
  },
})

/**
 * Registration Rate Limiter
 * Applied to POST /api/auth/register
 * Maximum 3 registration attempts per IP within a 1-hour window.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3, // max 3 attempts per window
  skipSuccessfulRequests: false, // all registration attempts count
  standardHeaders: true, // Draft-6 / Draft-7 RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: "Too many accounts created from this IP. Please try again after an hour.",
  handler: (req: Request, res: Response, _next, options) => {
    res.status(429).json({
      success: false,
      error: {
        message: typeof options.message === "string" ? options.message : "Too many accounts created from this IP. Please try again after an hour.",
        statusCode: 429,
      },
    })
  },
})

