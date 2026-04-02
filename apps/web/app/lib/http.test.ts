import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchJson, HttpClientError } from "./http";

describe("fetchJson", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("returns parsed JSON on success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const data = await fetchJson<{ ok: boolean }>("https://example.test/api");
    expect(data).toEqual({ ok: true });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://example.test/api",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("throws HttpClientError with server error body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "NO_AVAILABILITY", message: "No slots" }), {
        status: 409,
      }),
    );

    await expect(fetchJson("https://example.test/api")).rejects.toMatchObject({
      name: "HttpClientError",
      code: "NO_AVAILABILITY",
      message: "No slots",
      status: 409,
    });
  });

  it("throws NETWORK_ERROR when fetch rejects", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("offline"));

    await expect(fetchJson("https://example.test/api")).rejects.toEqual(
      expect.objectContaining({
        name: "HttpClientError",
        code: "NETWORK_ERROR",
      }),
    );
  });

  it("throws REQUEST_TIMEOUT when the request times out", async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn((_url, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        if (!signal) {
          return;
        }
        if (signal.aborted) {
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        signal.addEventListener(
          "abort",
          () => {
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true },
        );
      });
    });

    const pending = fetchJson("https://example.test/api", { timeoutMs: 1000 });
    const expectTimeout = expect(pending).rejects.toEqual(
      expect.objectContaining({
        name: "HttpClientError",
        code: "REQUEST_TIMEOUT",
      }),
    );
    await vi.advanceTimersByTimeAsync(1000);
    await expectTimeout;
  });
});

describe("HttpClientError", () => {
  it("stores code, status, and details", () => {
    const err = new HttpClientError("X", "msg", 418, { hint: "tea" });
    expect(err.code).toBe("X");
    expect(err.message).toBe("msg");
    expect(err.status).toBe(418);
    expect(err.details).toEqual({ hint: "tea" });
  });
});
