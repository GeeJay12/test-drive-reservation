import { z } from "zod";

import type { ReservationFormValues } from "../types/form";

export const reservationFormSchema = z.object({
  location: z.string().trim().min(1, "Location is required."),
  model: z.string().trim().min(1, "Model is required."),
  startDateTime: z
    .string()
    .trim()
    .min(1, "Date and time are required.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Date and time are invalid.",
    })
    .refine((value) => {
      const selectedDateTime = new Date(value);
      const startOfToday = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0, 0));
      startOfToday.setHours(0, 0, 0, 0);
      const endDate = new Date(startOfToday);
      endDate.setDate(endDate.getDate() + 14);
      const selectedTime = selectedDateTime.getTime();
      return selectedTime >= startOfToday.getTime() && selectedTime < endDate.getTime();
    }, "Date and time must be within [today, today + 14 days)."),
  durationMinutes: z
    .number()
    .int("Duration must be a whole number.")
    .min(1, "Duration must be at least 1 minute.")
    .max(60, "Duration cannot exceed 60 minutes."),
});

export function validateReservationForm(values: ReservationFormValues): string[] {  
  const result = reservationFormSchema.safeParse(values);
  if (result.success) {
    return [];
  }
  return result.error.issues.map((issue) => issue.message);
}

export function toIsoDateTime(localDateTime: string): string {
  const [datePart, timePart] = localDateTime.split("T");
  if (!datePart || !timePart) {
    throw new Error("Invalid date and time format");
  }
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) {
    throw new Error("Invalid date and time format");
  }
  const [hour, minute] = timePart.split(":");
  if (!hour || !minute) {
    throw new Error("Invalid date and time format");
  }

// Build a Date object interpreting those as UTC
const utcDate = new Date(
  Date.UTC(
    parseInt(year, 10),
    parseInt(month, 10) - 1,  // JS months are 0‑indexed
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10)
  )
);
return utcDate.toISOString(); 
}
