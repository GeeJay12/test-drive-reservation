import { checkAvailability } from "../api/check-availability";
import { createReservation } from "../api/create-reservation";

describe("API contracts", () => {
  it("posts availability payload to backend endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ available: false, reason: "No inventory" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await checkAvailability({
      location: "ADAMSTOWN",
      model: "Tesla Model 3",
      startTime: "2026-04-01T09:00:00.000Z",
      durationMinutes: 30,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/availability/check",
      expect.objectContaining({
        method: "POST",
      }),
    );

    fetchMock.mockRestore();
  });

  it.skip("sends idempotency header for reservation create", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          reservationId: "42",
          vehicleId: 12,
          status: "BOOKED",
          startTime: "2026-04-01T09:00:00.000Z",
          endTime: "2026-04-01T09:40:00.000Z",
        }),
        {
          status: 201,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    await createReservation(
      {
        model: "Tesla Model 3",
        location: "ADAMSTOWN",
        customerName: "Demo User",
        customerEmail: "demo.user@example.com",
        customerPhone: "+3531234567",
        startTime: "2026-04-01T09:00:00.000Z",
        durationMinutes: 30,
      },
      "idem-123",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/reservations/create",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "idempotency-key": "idem-123",
        }),
      }),
    );

    fetchMock.mockRestore();
  });
});
