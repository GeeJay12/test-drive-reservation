import { Location } from "@prisma/client";
import Joi from "joi";
import type { CompleteReservationRequestDto, CreateReservationRequestDto } from "../dto/reservation.dto.js";
import { ValidationError } from "../lib/errors.js";

function isWithinStartTimeWindow(value: Date, helpers: Joi.CustomHelpers): Date {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(startOfToday);
  endDate.setUTCDate(endDate.getUTCDate() + 14);

  if (value.getTime() < startOfToday.getTime() || value.getTime() >= endDate.getTime()) {
    return helpers.error("date.outOfWindow") as unknown as Date;
  }

  return value;
}

const createReservationSchema = Joi.object({
  model: Joi.string().trim().min(1).required().messages({
    "any.required": "model is required",
    "string.empty": "model is required",
  }),
  location: Joi.string()
    .trim()
    .uppercase()
    .valid(...Object.values(Location))
    .required()
    .messages({
      "any.only": "location must be one of ADAMSTOWN, ARTANE, ASHTOWN, ATHGOE",
      "any.required": "location is required",
    }),
  customerName: Joi.string().trim().min(1).required().messages({
    "any.required": "customerName is required",
    "string.empty": "customerName is required",
  }),
  customerEmail: Joi.string().trim().email().required().messages({
    "any.required": "customerEmail is required",
    "string.email": "customerEmail must be valid",
    "string.empty": "customerEmail is required",
  }),
  customerPhone: Joi.string().trim().min(1).required().messages({
    "any.required": "customerPhone is required",
    "string.empty": "customerPhone is required",
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

const completeReservationSchema = Joi.object({
  reservationId: Joi.string().trim().min(1).required().messages({
    "any.required": "reservationId is required",
    "string.empty": "reservationId is required",
  }),
}).required();

export function validateCreateReservationRequest(input: unknown): CreateReservationRequestDto {
  const { value, error } = createReservationSchema.validate(input, {
    abortEarly: true,
    convert: true,
    stripUnknown: true,
  });

  if (error) {
    throw new ValidationError(error.details[0]?.message ?? "Invalid request body");
  }

  const casted = value as {
    model: string;
    location: Location;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    startTime: Date;
    durationMinutes: number;
  };

  return {
    model: casted.model,
    location: casted.location,
    customerName: casted.customerName,
    customerEmail: casted.customerEmail,
    customerPhone: casted.customerPhone,
    startTime: casted.startTime,
    durationMinutes: casted.durationMinutes,
  };
}

export function validateCompleteReservationRequest(input: unknown): CompleteReservationRequestDto {
  const { value, error } = completeReservationSchema.validate(input, {
    abortEarly: true,
    convert: true,
    stripUnknown: true,
  });

  if (error) {
    throw new ValidationError(error.details[0]?.message ?? "Invalid request body");
  }

  const casted = value as { reservationId: string };

  return { reservationId: casted.reservationId };
}
