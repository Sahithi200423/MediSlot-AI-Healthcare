import { Request, Response, NextFunction } from "express"
import { AuthService } from "../services/auth.service.js"
import { registerSchema, loginSchema, forgotPasswordSchema } from "../validators/auth.validator.js"
import { getSupabaseAdmin } from "../config/supabase.js"

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = registerSchema.parse(req.body)
      const result = await AuthService.register(validatedData)

      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: result,
      })
    } catch (err: any) {
      if (err.name === "ZodError") {
        res.status(400).json({
          success: false,
          error: {
            message: "Validation Error",
            details: err.errors,
            statusCode: 400,
          },
        })
        return
      }
      res.status(400).json({
        success: false,
        error: { message: err.message || "Registration failed", statusCode: 400 },
      })
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body)
      const result = await AuthService.login(validatedData)

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      })
    } catch (err: any) {
      if (err.name === "ZodError") {
        res.status(400).json({
          success: false,
          error: {
            message: "Validation Error",
            details: err.errors,
            statusCode: 400,
          },
        })
        return
      }
      res.status(401).json({
        success: false,
        error: { message: err.message || "Invalid credentials", statusCode: 401 },
      })
    }
  }

  public static async getMe(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: "User session active",
      data: {
        user: req.user,
      },
    })
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    })
  }

  public static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = forgotPasswordSchema.parse(req.body)
      const supabase = getSupabaseAdmin()

      if (supabase) {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${req.headers.origin || "http://localhost:5173"}/reset-password`,
        })
      }

      res.status(200).json({
        success: true,
        message: `If an account exists for ${email}, a password reset link has been dispatched.`,
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Password reset request failed", statusCode: 400 },
      })
    }
  }

  public static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, token } = req.body
      if (!email || !token) {
        res.status(400).json({
          success: false,
          error: { message: "Email and verification token/OTP are required", statusCode: 400 },
        })
        return
      }

      const result = await AuthService.verifyEmail(email, token)
      res.status(200).json({
        success: true,
        message: "Email verified successfully! You may now sign in.",
        data: result,
      })
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { message: err.message || "Email verification failed", statusCode: 400 },
      })
    }
  }
}

