import { Request, Response, NextFunction } from "express"
import crypto from "crypto"

declare global {
  namespace Express {
    interface Request {
      id?: string
    }
  }
}

const REQUEST_ID_REGEX = /^[a-zA-Z0-9_\-]{8,64}$/

/**
 * Request Correlation ID Middleware
 * Accepts incoming X-Request-Id if valid (alphanumeric, hyphens, underscores, 8-64 chars),
 * or generates a new RFC 4122 UUID v4.
 * Attaches the ID to req.id and sets the X-Request-Id response header.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers["x-request-id"]
  let reqId: string

  if (typeof incomingId === "string" && REQUEST_ID_REGEX.test(incomingId.trim())) {
    reqId = incomingId.trim()
  } else {
    reqId = crypto.randomUUID()
  }

  req.id = reqId
  res.setHeader("X-Request-Id", reqId)
  next()
}

