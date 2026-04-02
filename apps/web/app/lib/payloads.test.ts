import { describe, expect, it } from "vitest";

import { buildAvailabilityPayload, buildReservationPayload } from "./payloads";

import type { ReservationFormValues } from "../types/form";

const sample: ReservationFormValues = {
  location: "ARTANE",
  model: "Tesla Model Y",
  startDateTime: "2026-05-01T09:15",
  durationMinutes: 45,
};

describe("buildAvailabilityPayload", () => {
  it("maps form values and converts start time to ISO", () => {
    expect(buildAvailabilityPayload(sample)).toEqual({
      location: "ARTANE",
      model: "Tesla Model Y",
      startTime: "2026-05-01T09:15:00.000Z",
      durationMinutes: 45,
    });
  });
});

describe("buildReservationPayload", () => {
  it("includes customer fields and booking window", () => {
    expect(buildReservationPayload(sample)).toEqual({
      model: "Tesla Model Y",
      location: "ARTANE",
      customerName: "GJ",
      customerEmail: "gj@gmail.com",
      customerPhone: "+3531234567",
      startTime: "2026-05-01T09:15:00.000Z",
      durationMinutes: 45,
    });
  });
});
