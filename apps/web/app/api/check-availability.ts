import { fetchJson } from "../lib/http";

import type {
  AvailabilityRequest,
  AvailabilityResponse,
} from "../types/contracts";

export function checkAvailability(payload: AvailabilityRequest) {
  return fetchJson<AvailabilityResponse>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/availability/check`,
    {
      method: "POST",
      body: payload,
    },
  );
}
