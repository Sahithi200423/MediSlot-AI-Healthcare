import { Router } from "express"
import { AuthController } from "../controllers/auth.controller.js"
import { authenticate } from "../middleware/auth.js"

const router = Router()

/**
 * @route   POST /api/auth/register
 * @desc    Register a new patient
 * @access  Public
 */
router.post("/register", AuthController.register)

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
router.post("/login", AuthController.login)

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

export default router
