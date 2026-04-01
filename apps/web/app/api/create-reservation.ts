import { fetchJson } from "../lib/http";

import type { ReservationRequest, ReservationResponse } from "../types/contracts";

export function createReservation(
  payload: ReservationRequest,
  idempotencyKey: string,
) {
  return fetchJson<ReservationResponse>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservations/create`,
    {
      method: "POST",
      body: payload,
      headers: {
        "idempotency-key": idempotencyKey,
      },
    },
  );
}
