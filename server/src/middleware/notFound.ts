import { Request, Response, NextFunction } from "express"

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint not found - ${req.method} ${req.originalUrl}`,
      statusCode: 404,
    },
  })
}
