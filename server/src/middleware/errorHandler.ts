import { Request, Response, NextFunction } from "express"
import { config } from "../config/env.js"

export interface AppError extends Error {
  statusCode?: number
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500
  const message = err.message || "Internal Server Error"

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err)

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(config.nodeEnv === "development" && { stack: err.stack }),
    },
  })
}
