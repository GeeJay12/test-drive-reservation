import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchJson } from "../lib/http";
import { createReservation } from "./create-reservation";

import type { ReservationRequest, ReservationResponse } from "../types/contracts";

vi.mock("../lib/http", () => ({
  fetchJson: vi.fn(),
}));

describe("createReservation", () => {
  beforeEach(() => {
    vi.mocked(fetchJson).mockReset();
  });

  it("POSTs the payload to the API base URL", async () => {
    const payload: ReservationRequest = {
      model: "Tesla Model 3",
      location: "ADAMSTOWN",
      customerName: "Test",
      customerEmail: "t@example.com",
      customerPhone: "+10000000000",
      startTime: "2026-04-02T10:00:00.000Z",
      durationMinutes: 30,
    };

    const response: ReservationResponse = {
      reservationId: "res-1",
      vehicleId: 7,
      status: "BOOKED",
      startTime: "2026-04-02T10:00:00.000Z",
      endTime: "2026-04-02T10:30:00.000Z",
    };

    vi.mocked(fetchJson).mockResolvedValue(response);

    const result = await createReservation(payload);

    expect(result).toEqual(response);
    expect(fetchJson).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservations/create`,
      { method: "POST", body: payload },
    );
  });
});
