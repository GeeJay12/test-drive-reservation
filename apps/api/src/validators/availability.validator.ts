import { Location } from "@prisma/client";
import Joi from "joi";
import type { AvailabilityRequestDto } from "../dto/availability.dto.js";
import { ValidationError } from "../lib/errors.js";
import { isWithinStartTimeWindow } from "../lib/time.js";


const availabilitySchema = Joi.object({
  location: Joi.string()
    .trim()
    .uppercase()
    .valid(...Object.values(Location))
    .required()
    .messages({
      "any.only": "location must be one of ADAMSTOWN, ARTANE, ASHTOWN, ATHGOE",
      "any.required": "location is required",
    }),
  model: Joi.string().trim().min(1).required().messages({
    "any.required": "model is required",
    "string.empty": "model is required",
  }),
  startTime: Joi.date()
    .iso()
    .custom(isWithinStartTimeWindow)
    .required()
    .messages({
      "any.required": "startTime is required",
      "date.format": "startTime must be a valid ISO datetime",
      "date.base": "startTime must be a valid ISO datetime",
      "date.outOfWindow": "startTime must be within [today, today + 14 days).",
    }),
  durationMinutes: Joi.number().integer().min(1).max(1 * 60).required().messages({
    "any.required": "durationMinutes is required",
    "number.base": "durationMinutes must be a positive integer <= 60",
    "number.integer": "durationMinutes must be a positive integer <= 60",
    "number.min": "durationMinutes must be a positive integer <= 60",
    "number.max": "durationMinutes must be a positive integer <= 60",
  }),
}).required();

export function validateAvailabilityRequest(input: unknown): AvailabilityRequestDto {
  const { value, error } = availabilitySchema.validate(input, {
    abortEarly: true,
    convert: true,
    stripUnknown: true,
  });

  if (error) {
    throw new ValidationError(error.details[0]?.message ?? "Invalid request body");
  }

  const casted = value as {
    location: Location;
    model: string;
    startTime: Date;
    durationMinutes: number;
  };

  return {
    location: casted.location,
    model: casted.model,
    startTime: casted.startTime,
    durationMinutes: casted.durationMinutes,
  };
}
