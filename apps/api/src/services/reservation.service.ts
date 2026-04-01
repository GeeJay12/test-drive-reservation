import { Prisma, ReservationStatus, type Reservation, type Vehicle } from "@prisma/client";
import { ReservationDao } from "../dao/reservation.dao.js";
import { VehicleDao, type VehicleCandidate } from "../dao/vehicle.dao.js";
import type { CreateReservationRequestDto } from "../dto/reservation.dto.js";
import { ConflictError, NoAvailabilityError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { addMinutes, endExclusiveUtcDay, getWeekDay, startOfUtcDay, toUtcMinutesOfDay } from "../lib/time.js";

const MAX_BOOKING_RETRIES = 3;

export class ReservationService {
  constructor(
    private readonly vehicleDao = new VehicleDao(),
    private readonly reservationDao = new ReservationDao(),
  ) {}

  async createReservation(input: CreateReservationRequestDto): Promise<Reservation> {
    for (let attempt = 1; attempt <= MAX_BOOKING_RETRIES; attempt += 1) {
      try {
        const candidate = await this.findTargetVehicle(input);
        if (!candidate) {
          throw new NoAvailabilityError();
        }

        const created = await prisma.$transaction(async (tx) => {
          const desiredEnd = addMinutes(input.startTime, input.durationMinutes + candidate.minGap);
          const versionUpdate = await tx.vehicle.updateMany({
            where: {
              id: candidate.id,
              version: candidate.version,
            },
            data: {
              version: { increment: 1 },
              drivenCount: { increment: 1 },
            },
          });

          if (versionUpdate.count === 0) {
            throw new ConflictError("Vehicle version changed");
          }

          return tx.reservation.create({
            data: {
              vehicleId: candidate.id,
              status: ReservationStatus.BOOKED,
              model: input.model,
              location: input.location,
              customerName: input.customerName,
              customerEmail: input.customerEmail,
              customerPhone: input.customerPhone,
              startTime: input.startTime,
              endTime: desiredEnd,
            },
          });
        });

        return created;
      } catch (error: unknown) {
        const retryable = this.isRetryableConflict(error);
        if (!retryable || attempt === MAX_BOOKING_RETRIES) {
          if (error instanceof NoAvailabilityError) {
            throw error;
          }
          if (error instanceof ConflictError) {
            throw new ConflictError("Reservation conflict after retry limit reached", { attempts: attempt });
          }
          throw error;
        }

        logger.warn("Reservation attempt conflicted. Retrying full process", { attempt });
        await this.backoff(attempt);
      }
    }

    throw new ConflictError("Reservation conflict after retry limit reached");
  }

  async completeReservation(reservationId: string): Promise<Reservation> {
    const parsed = BigInt(reservationId);
    return prisma.$transaction(async (tx) => {
      const found = await tx.reservation.findUnique({
        where: { id: parsed },
      });

      if (!found) {
        throw new NotFoundError("Reservation not found");
      }

      if (found.status === ReservationStatus.COMPLETED) {
        return found;
      }

      const updated = await tx.reservation.update({
        where: { id: parsed },
        data: { status: ReservationStatus.COMPLETED },
      });

      await tx.vehicle.update({
        where: { id: found.vehicleId },
        data: {
          drivenCount: { increment: 1 },
          version: { increment: 1 },
        },
      });

      return updated;
    });
  }

  private async findTargetVehicle(input: CreateReservationRequestDto): Promise<VehicleCandidate | null> {
    const candidates = await this.vehicleDao.findCandidatesByModelLocationDay({
      model: input.model,
      location: input.location,
      weekDay: getWeekDay(input.startTime),
    });

    const eligible = candidates.filter((vehicle) => this.vehicleSupportsWindow(vehicle, input.startTime, input.durationMinutes));
    if (eligible.length === 0) {
      return null;
    }

    const reservations = await this.reservationDao.findBookedByModelLocationDate({
      model: input.model,
      location: input.location,
      dayStart: startOfUtcDay(input.startTime),
      dayEndExclusive: endExclusiveUtcDay(input.startTime),
    });

    if (reservations.length === 0) {
      return eligible[0] ?? null;
    }

    for (const candidate of eligible) {
      const desiredEffectiveEnd = addMinutes(input.startTime, input.durationMinutes + candidate.minGap);
      const hasOverlap = reservations.some(
        (reservation) =>
          reservation.vehicleId === candidate.id &&
          reservation.startTime < desiredEffectiveEnd &&
          reservation.endTime > input.startTime,
      );

      if (!hasOverlap) {
        return candidate;
      }
    }

    return null;
  }

  private vehicleSupportsWindow(vehicle: Pick<Vehicle, "startTime" | "endTime" | "minGap">, desiredStart: Date, durationMinutes: number): boolean {
    const vehicleStartMinutes = toUtcMinutesOfDay(vehicle.startTime);
    const vehicleEndMinutes = toUtcMinutesOfDay(vehicle.endTime);
    const desiredStartMinutes = toUtcMinutesOfDay(desiredStart);
    const desiredEndMinutes = desiredStartMinutes + durationMinutes + vehicle.minGap;
    return desiredStartMinutes >= vehicleStartMinutes && desiredEndMinutes <= vehicleEndMinutes;
  }

  private isRetryableConflict(error: unknown): boolean {
    if (error instanceof NoAvailabilityError) {
      return false;
    }
    if (error instanceof ConflictError) {
      return true;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return true;
    }
    return false;
  }

  private async backoff(attempt: number): Promise<void> {
    const base = 50 * 2 ** (attempt - 1);
    const jitter = Math.floor(Math.random() * 50);
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), base + jitter);
    });
  }
}
