import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn("Handled application error", {
      requestId: req.headers["x-request-id"],
      code: err.code,
      message: err.message,
      details: err.details,
    });
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      details: err.details,
    });
    return;
  }

  logger.error("Unhandled server error", {
    requestId: req.headers["x-request-id"],
    error: err instanceof Error ? err.message : String(err),
  });
  res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "Unexpected server error",
  });
}
