import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  reservationFormSchema,
  toIsoDateTime,
  validateReservationForm,
} from "./validation";

import type { ReservationFormValues } from "../types/form";

function baseValues(overrides: Partial<ReservationFormValues> = {}): ReservationFormValues {
  return {
    location: "ADAMSTOWN",
    model: "Tesla Model 3",
    startDateTime: "2026-04-10T14:30",
    durationMinutes: 30,
    ...overrides,
  };
}

describe("reservationFormSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 2, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts values within the booking window", () => {
    const result = reservationFormSchema.safeParse(baseValues());
    expect(result.success).toBe(true);
  });

  it("rejects empty location", () => {
    const result = reservationFormSchema.safeParse(baseValues({ location: "   " }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("Location"))).toBe(true);
    }
  });

  it("rejects invalid datetime string", () => {
    const result = reservationFormSchema.safeParse(
      baseValues({ startDateTime: "not-a-date" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects datetimes outside the 14-day window", () => {
    const result = reservationFormSchema.safeParse(
      baseValues({ startDateTime: "2026-04-30T14:30" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects duration below range", () => {
    const result = reservationFormSchema.safeParse(baseValues({ durationMinutes: 0 }));
    expect(result.success).toBe(false);
  });

  it("rejects duration above 60", () => {
    const result = reservationFormSchema.safeParse(baseValues({ durationMinutes: 61 }));
    expect(result.success).toBe(false);
  });
});

describe("validateReservationForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 2, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns no messages when valid", () => {
    expect(validateReservationForm(baseValues())).toEqual([]);
  });

  it("returns messages when invalid", () => {
    const messages = validateReservationForm(baseValues({ location: "" }));
    expect(messages.length).toBeGreaterThan(0);
  });
});

describe("toIsoDateTime", () => {
  it("converts local datetime parts to UTC ISO string", () => {
    expect(toIsoDateTime("2026-04-10T14:30")).toBe("2026-04-10T14:30:00.000Z");
  });

  it("throws when format is incomplete", () => {
    expect(() => toIsoDateTime("2026-04-10")).toThrow("Invalid date and time format");
  });
});
