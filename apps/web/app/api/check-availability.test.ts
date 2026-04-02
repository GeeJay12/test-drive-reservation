import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchJson } from "../lib/http";
import { checkAvailability } from "./check-availability";

import type { AvailabilityRequest, AvailabilityResponse } from "../types/contracts";

vi.mock("../lib/http", () => ({
  fetchJson: vi.fn(),
}));

describe("checkAvailability", () => {
  beforeEach(() => {
    vi.mocked(fetchJson).mockReset();
  });

  it("POSTs the payload to the availability endpoint", async () => {
    const payload: AvailabilityRequest = {
      model: "Tesla Model X",
      location: "ASHTOWN",
      startTime: "2026-04-03T11:00:00.000Z",
      durationMinutes: 20,
    };

    const response: AvailabilityResponse = {
      available: true,
      vehicleId: 3,
    };

    vi.mocked(fetchJson).mockResolvedValue(response);

    const result = await checkAvailability(payload);

    expect(result).toEqual(response);
    expect(fetchJson).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/availability/check`,
      { method: "POST", body: payload },
    );
  });
});
