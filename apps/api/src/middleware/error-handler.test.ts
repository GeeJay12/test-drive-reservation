import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "./error-handler.js";
import { AppError, ValidationError } from "../lib/errors.js";

describe("errorHandler middleware", () => {
  it("serializes AppError with correct status/code/message/details", () => {
    const err = new ValidationError("Invalid input", { field: "x" });

    const req: any = {
      headers: { "x-request-id": "req-1" },
    };

    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    errorHandler(err, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith((err as AppError).statusCode);
    expect(res.json).toHaveBeenCalledWith({
      error: err.code,
      message: err.message,
      details: err.details,
    });
  });

  it("returns 500 for unhandled errors", () => {
    const err = new Error("boom");

    const req: any = {
      headers: { "x-request-id": "req-2" },
    };

    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    errorHandler(err, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error",
    });
  });
});

