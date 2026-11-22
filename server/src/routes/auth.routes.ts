import { Router } from "express"
import { AuthController } from "../controllers/auth.controller.js"
import { authenticate } from "../middleware/auth.js"
import { authLimiter, registerLimiter } from "../middleware/rateLimiter.js"

const router = Router()

/**
 * @route   POST /api/auth/register
 * @desc    Register a new patient (rate-limited: max 3 attempts/hr per IP)
 * @access  Public
 */
router.post("/register", registerLimiter, AuthController.register)

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token (rate-limited: max 5 failed attempts/15min per IP)
 * @access  Public
 */
router.post("/login", authLimiter, AuthController.login)

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user details
 * @access  Protected
 */
router.get("/me", authenticate, AuthController.getMe)

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Protected
 */
router.post("/logout", authenticate, AuthController.logout)

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post("/forgot-password", AuthController.forgotPassword)

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify unconfirmed email using OTP/token
 * @access  Public
 */
router.post("/verify-email", AuthController.verifyEmail)

export default router
