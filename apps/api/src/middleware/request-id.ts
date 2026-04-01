import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";


// for distributed tracing requests - future scope
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existing = req.header("x-request-id");
  const requestId = existing && existing.trim() ? existing : randomUUID();
  req.headers["x-request-id"] = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}
