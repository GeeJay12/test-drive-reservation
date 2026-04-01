import type { AvailabilityRequestDto, AvailabilityResponseDto } from "../dto/availability.dto.js";
import { ReservationDao } from "../dao/reservation.dao.js";
import { VehicleDao, type VehicleCandidate } from "../dao/vehicle.dao.js";
import { addMinutes, endExclusiveUtcDay, getWeekDay, startOfUtcDay, toUtcMinutesOfDay } from "../lib/time.js";

export class AvailabilityService {
  constructor(
    private readonly vehicleDao = new VehicleDao(),
    private readonly reservationDao = new ReservationDao(),
  ) {}

  async checkAvailability(input: AvailabilityRequestDto): Promise<AvailabilityResponseDto> {    
    const weekDay = getWeekDay(input.startTime);
    const candidates = await this.vehicleDao.findCandidatesByModelLocationDay({
      model: input.model,
      location: input.location,
      weekDay,
    });

    const filteredCandidates = candidates.filter((vehicle) => this.vehicleSupportsWindow(vehicle, input.startTime, input.durationMinutes));
    if (filteredCandidates.length === 0) {
      return { available: false, reason: "No candidate vehicle in operating window" };
    }
    
    const reservations = await this.reservationDao.findBookedByModelLocationDate({
      model: input.model,
      location: input.location,
      dayStart: startOfUtcDay(input.startTime),
      dayEndExclusive: endExclusiveUtcDay(input.startTime),
    });

    const selected = this.chooseFirstNonOverlappingVehicle(filteredCandidates, reservations, input.startTime, input.durationMinutes);
    if (!selected) {
      return { available: false, reason: "All candidate vehicles overlap for the requested time window" };
    }

    return {
      available: true,
      vehicleId: selected.id,
    };
  }

  private vehicleSupportsWindow(vehicle: VehicleCandidate, desiredStart: Date, durationMinutes: number): boolean {
    const vehicleStartMinutes = toUtcMinutesOfDay(vehicle.startTime);
    const vehicleEndMinutes = toUtcMinutesOfDay(vehicle.endTime);
    const desiredStartMinutes = toUtcMinutesOfDay(desiredStart);
    const desiredEndMinutes = desiredStartMinutes + durationMinutes + vehicle.minGap;
    return desiredStartMinutes >= vehicleStartMinutes && desiredEndMinutes <= vehicleEndMinutes;
  }

  private chooseFirstNonOverlappingVehicle(
    candidates: VehicleCandidate[],
    reservations: Array<{ vehicleId: number; startTime: Date; endTime: Date }>,
    desiredStart: Date,
    durationMinutes: number,
  ): VehicleCandidate | null {
    if (reservations.length === 0) {
      return candidates[0] ?? null;
    }

    for (const vehicle of candidates) {
      const desiredEffectiveEnd = addMinutes(desiredStart, durationMinutes + vehicle.minGap);
      const hasOverlap = reservations.some(
        (item) =>
          item.vehicleId === vehicle.id && item.startTime < desiredEffectiveEnd && item.endTime > desiredStart,
      );

      if (!hasOverlap) {
        return vehicle;
      }
    }

    return null;
  }
}
