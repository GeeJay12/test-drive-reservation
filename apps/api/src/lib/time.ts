import { WeekDay } from "@prisma/client";

const DAY_MAP: WeekDay[] = [
  WeekDay.SUN,
  WeekDay.MON,
  WeekDay.TUE,
  WeekDay.WED,
  WeekDay.THU,
  WeekDay.FRI,
  WeekDay.SAT,
];

export function getWeekDay(input: Date): WeekDay {
  return DAY_MAP[input.getUTCDay()] ?? WeekDay.SUN;
}

export function startOfUtcDay(input: Date): Date {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate(), 0, 0, 0, 0));
}

export function endExclusiveUtcDay(input: Date): Date {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate() + 1, 0, 0, 0, 0));
}

export function toUtcMinutesOfDay(input: Date): number {
  return input.getUTCHours() * 60 + input.getUTCMinutes();
}

export function addMinutes(input: Date, minutes: number): Date {
  return new Date(input.getTime() + minutes * 60_000);
}
