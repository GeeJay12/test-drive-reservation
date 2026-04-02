import { describe, expect, it, vi } from "vitest";
import { WeekDay } from "@prisma/client";
import Joi from "joi";
import {
  addMinutes,
  endExclusiveUtcDay,
  getWeekDay,
  isWithinStartTimeWindow,
  startOfUtcDay,
  toUtcMinutesOfDay,
} from "./time.js";

describe("time helpers", () => {
  it("maps UTC weekday correctly", () => {
    // 2026-04-02 is Thursday (UTC)
    const d = new Date("2026-04-02T12:00:00.000Z");
    expect(getWeekDay(d)).toBe(WeekDay.THU);
  });

  it("computes start/end of UTC day boundaries", () => {
    const d = new Date("2026-04-02T12:34:56.000Z");
    expect(startOfUtcDay(d).toISOString()).toBe("2026-04-02T00:00:00.000Z");
    expect(endExclusiveUtcDay(d).toISOString()).toBe("2026-04-03T00:00:00.000Z");
  });

  it("converts minutes and adds minutes", () => {
    const d = new Date("2026-04-02T01:30:00.000Z");
    expect(toUtcMinutesOfDay(d)).toBe(90);

    const added = addMinutes(d, 45);
    expect(added.toISOString()).toBe("2026-04-02T02:15:00.000Z");
  });

  it("isWithinStartTimeWindow allows dates in [today, today + 14 days)", () => {
    const fixedNow = new Date("2026-04-02T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    const startOfToday = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0, 0));
    const okDate = new Date(startOfToday.getTime() + 60_000);

    const result = isWithinStartTimeWindow(okDate, { error: () => { throw new Error("should not error"); } } as unknown as Joi.CustomHelpers);
    expect(result).toBe(okDate);

    vi.useRealTimers();
  });

  it("isWithinStartTimeWindow rejects dates outside the window", () => {
    const fixedNow = new Date("2026-04-02T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    const startOfToday = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0, 0));
    const tooEarly = new Date(startOfToday.getTime() - 60_000);

    expect(() =>
      isWithinStartTimeWindow(tooEarly, {
        error: () => {
          throw new Error("date.outOfWindow");
        },
      } as unknown as Joi.CustomHelpers),
    ).toThrow("date.outOfWindow");

    vi.useRealTimers();
  });
});

