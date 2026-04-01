import { Location, ReservationStatus } from "@prisma/client";

export type CreateReservationRequestDto = {
  model: string;
  location: Location;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startTime: Date;
  durationMinutes: number;
};

export type CreateReservationResponseDto = {
  reservationId: string;
  vehicleId: number;
  status: ReservationStatus;
  startTime: string;
  endTime: string;
};

export type CompleteReservationRequestDto = {
  reservationId: string;
};
