import {
  buildAvailabilityPayload,
  buildReservationPayload,
} from "../lib/payloads";

describe("payload builders", () => {
  it("maps form values to availability payload", () => {
    const payload = buildAvailabilityPayload({
      location: "ADAMSTOWN",
      model: "Tesla Model 3",
      startDateTime: "2026-04-01T09:00",
      durationMinutes: 30,
    });

    expect(payload).toEqual({
      location: "ADAMSTOWN",
      model: "Tesla Model 3",
      startTime: new Date("2026-04-01T09:00:00.000Z").toISOString(),
      durationMinutes: 30,
    });
  });

  it("maps form values to reservation payload with env defaults", () => {
    const payload = buildReservationPayload({
      location: "ADAMSTOWN",
      model: "Tesla Model 3",
      startDateTime: "2026-04-01T09:00",
      durationMinutes: 30,
    });

    expect(payload).toMatchObject({
      model: "Tesla Model 3",
      location: "ADAMSTOWN",
      startTime: new Date("2026-04-01T09:00:00.000Z").toISOString(),
      durationMinutes: 30,
    });
    expect(payload.customerName).toBeTruthy();
    expect(payload.customerEmail).toContain("@");
    expect(payload.customerPhone).toBeTruthy();
  });
});
