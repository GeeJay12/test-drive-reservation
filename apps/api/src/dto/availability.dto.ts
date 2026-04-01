import { Location } from "@prisma/client";

export type AvailabilityRequestDto = {
  location: Location;
  model: string;
  startTime: Date;
  durationMinutes: number;
};

export type AvailabilityResponseDto = {
  available: boolean;
  vehicleId?: number;
  reason?: string;
};
