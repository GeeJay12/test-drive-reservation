import { describe, expect, it, vi } from "vitest";
import { Location } from "@prisma/client";
import { validateCompleteReservationRequest, validateCreateReservationRequest } from "./reservation.validator.js";
import { ValidationError } from "../lib/errors.js";

function startOfTodayForValidator(): Date {
  // Must mirror `isWithinStartTimeWindow` logic (uses local date parts).
  return new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0, 0));
}

describe("reservation.validator", () => {
  it("validates a correct create reservation request", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T12:00:00.000Z"));

    const startOfToday = startOfTodayForValidator();
    const startTime = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const input = {
      model: "ModelX",
      location: "adamstown",
      customerName: "Alice",
      customerEmail: "alice@example.com",
      customerPhone: "+3531234567",
      startTime: startTime.toISOString(),
      durationMinutes: 30,
    };

    const result = validateCreateReservationRequest(input);
    expect(result.model).toBe("ModelX");
    expect(result.location).toBe(Location.ADAMSTOWN);
    expect(result.customerName).toBe("Alice");
    expect(result.customerEmail).toBe("alice@example.com");
    expect(result.customerPhone).toBe("+3531234567");
    expect(result.durationMinutes).toBe(30);
    expect(result.startTime.toISOString()).toBe(startTime.toISOString());

    vi.useRealTimers();
  });

  it("rejects invalid email", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T12:00:00.000Z"));

    const startOfToday = startOfTodayForValidator();
    const startTime = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const input = {
      model: "ModelX",
      location: Location.ARTANE,
      customerName: "Alice",
      customerEmail: "not-an-email",
      customerPhone: "+3531234567",
      startTime: startTime.toISOString(),
      durationMinutes: 30,
    };

    try {
      validateCreateReservationRequest(input);
      throw new Error("expected validation error");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).message).toBe("customerEmail must be valid");
    }

    vi.useRealTimers();
  });

  it("rejects out-of-window startTime", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T12:00:00.000Z"));

    const startOfToday = startOfTodayForValidator();
    const tooEarly = new Date(startOfToday.getTime() - 60_000);

    const input = {
      model: "ModelX",
      location: Location.ARTANE,
      customerName: "Alice",
      customerEmail: "alice@example.com",
      customerPhone: "+3531234567",
      startTime: tooEarly.toISOString(),
      durationMinutes: 30,
    };

    try {
      validateCreateReservationRequest(input);
      throw new Error("expected validation error");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).message).toBe("startTime must be within [today, today + 14 days).");
    }

    vi.useRealTimers();
  });

  it("rejects missing reservationId for completion", () => {
    expect(() => validateCompleteReservationRequest({})).toThrowError(ValidationError);
    try {
      validateCompleteReservationRequest({});
    } catch (err: unknown) {
      expect((err as ValidationError).message).toBe("reservationId is required");
    }
  });
});

