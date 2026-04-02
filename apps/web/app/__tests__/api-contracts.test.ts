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
});
