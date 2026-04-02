import { describe, expect, it, vi } from "vitest";
import { requestIdMiddleware } from "./request-id.js";

describe("requestIdMiddleware", () => {
  it("sets x-request-id when missing", () => {
    const req: any = {
      header: vi.fn().mockReturnValue(undefined),
      headers: {},
    };
    const res: any = {
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    requestIdMiddleware(req, res, next);

    expect(typeof req.headers["x-request-id"]).toBe("string");
    expect(req.headers["x-request-id"]).not.toBe("");
    expect(res.setHeader).toHaveBeenCalledWith("x-request-id", req.headers["x-request-id"]);
    expect(next).toHaveBeenCalled();
  });

  it("reuses existing x-request-id when present", () => {
    const req: any = {
      header: vi.fn().mockReturnValue("my-request-id"),
      headers: {},
    };
    const res: any = {
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    requestIdMiddleware(req, res, next);

    expect(req.headers["x-request-id"]).toBe("my-request-id");
    expect(res.setHeader).toHaveBeenCalledWith("x-request-id", "my-request-id");
    expect(next).toHaveBeenCalled();
  });

  it("generates a new id when existing header is whitespace-only", () => {
    const req: any = {
      header: vi.fn().mockReturnValue("   "),
      headers: {},
    };
    const res: any = {
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    requestIdMiddleware(req, res, next);

    expect(req.headers["x-request-id"]).not.toBe("   ");
    expect(req.headers["x-request-id"]).toBeTypeOf("string");
    expect(res.setHeader).toHaveBeenCalledWith("x-request-id", req.headers["x-request-id"]);
    expect(next).toHaveBeenCalled();
  });
});

