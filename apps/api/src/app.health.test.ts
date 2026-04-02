import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("API app", () => {
  it("responds to GET /api/health", async () => {
    const app = createApp();

    await request(app)
      .get("/api/health")
      .expect(200)
      .expect({ ok: true });
  });
});

