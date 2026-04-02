import { describe, expect, it, vi } from "vitest";
import { Location } from "@prisma/client";
import { validateAvailabilityRequest } from "./availability.validator.js";
import { ValidationError } from "../lib/errors.js";

function startOfTodayForValidator(): Date {
  // Must mirror `isWithinStartTimeWindow` logic (uses local date parts).
  return new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0, 0));
}

describe("availability.validator", () => {
  it("validates a correct availability request", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T12:00:00.000Z"));

    const startOfToday = startOfTodayForValidator();
    const startTime = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const input = {
      location: "adamstown",
      model: " ModelX ",
      startTime: startTime.toISOString(),
      durationMinutes: 30,
    };

    const result = validateAvailabilityRequest(input);

    expect(result.location).toBe(Location.ADAMSTOWN);
    expect(result.model).toBe("ModelX");
    expect(result.durationMinutes).toBe(30);
    expect(result.startTime.toISOString()).toBe(startTime.toISOString());

    vi.useRealTimers();
  });

  it("rejects unknown location", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T12:00:00.000Z"));

    const startOfToday = startOfTodayForValidator();
    const startTime = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const input = {
      location: "INVALID" as any,
      model: "ModelX",
      startTime: startTime.toISOString(),
      durationMinutes: 30,
    };

    expect(() => validateAvailabilityRequest(input)).toThrowError(ValidationError);

    try {
      validateAvailabilityRequest(input);
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).message).toBe("location must be one of ADAMSTOWN, ARTANE, ASHTOWN, ATHGOE");
    }

    vi.useRealTimers();
  });

  it("rejects out-of-window startTime", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T12:00:00.000Z"));

    const startOfToday = startOfTodayForValidator();
    const tooEarly = new Date(startOfToday.getTime() - 60_000);

    const input = {
      location: Location.ARTANE,
      model: "ModelX",
      startTime: tooEarly.toISOString(),
      durationMinutes: 30,
    };

    try {
      validateAvailabilityRequest(input);
      throw new Error("expected validation error");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).message).toBe("startTime must be within [today, today + 14 days).");
    }

    vi.useRealTimers();
  });

  it("rejects invalid durationMinutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T12:00:00.000Z"));

    const startOfToday = startOfTodayForValidator();
    const startTime = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const input = {
      location: Location.ARTANE,
      model: "ModelX",
      startTime: startTime.toISOString(),
      durationMinutes: 0,
    };

    try {
      validateAvailabilityRequest(input);
      throw new Error("expected validation error");
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).message).toBe("durationMinutes must be a positive integer <= 60");
    }

    vi.useRealTimers();
  });
});

