import { WeekDay } from "@prisma/client";
import Joi from "joi";

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

export function isWithinStartTimeWindow(value: Date, helpers: Joi.CustomHelpers): Date {
  const startOfToday = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0, 0));
  const endDate = new Date(startOfToday);
  endDate.setDate(startOfToday.getDate() + 14);
  if (value.getTime() < startOfToday.getTime() || value.getTime() >= endDate.getTime()) {
    return helpers.error("date.outOfWindow") as unknown as Date;
  }

  return value;
}