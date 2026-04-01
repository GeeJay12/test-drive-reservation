export type AvailabilityRequest = {
  location: string;
  model: string;
  startTime: string;
  durationMinutes: number;
};

export type AvailabilityResponse = {
  available: boolean;
  vehicleId?: number;
  reason?: string;
};

export type ReservationRequest = {
  model: string;
  location: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startTime: string;
  durationMinutes: number;
};

export type ReservationResponse = {
  reservationId: string;
  vehicleId: number;
  status: "BOOKED";
  startTime: string;
  endTime: string;
};
