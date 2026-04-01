import type {
  AvailabilityRequest,
  ReservationRequest,
} from "../types/contracts";
import type { ReservationFormValues } from "../types/form";
import { toIsoDateTime } from "./validation";

export function buildAvailabilityPayload(
  values: ReservationFormValues,
): AvailabilityRequest {
  
  
  
  return {
    location: values.location,
    model: values.model,
    startTime: toIsoDateTime(values.startDateTime),
    durationMinutes: values.durationMinutes,
  };
}

export function buildReservationPayload(
  values: ReservationFormValues,
): ReservationRequest {
  return {
    model: values.model,
    location: values.location,
    customerName: "GJ",
    customerEmail: "gj@gmail.com",
    customerPhone: "+3531234567",
    startTime: toIsoDateTime(values.startDateTime),
    durationMinutes: values.durationMinutes,
  };
}
