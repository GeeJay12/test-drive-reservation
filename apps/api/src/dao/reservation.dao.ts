import { ReservationStatus, type Location, type Reservation } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export type ReservationRecord = Pick<Reservation, "id" | "vehicleId" | "startTime" | "endTime" | "status">;

export class ReservationDao {
  async findBookedByModelLocationDate(input: {
    model: string;
    location: Location;
    dayStart: Date;
    dayEndExclusive: Date;
  }): Promise<ReservationRecord[]> {
    return prisma.reservation.findMany({
      where: {
        model: input.model,
        location: input.location,
        status: ReservationStatus.BOOKED,
        startTime: {
          gte: input.dayStart,
          lt: input.dayEndExclusive,
        },
      },
      orderBy: [{ startTime: "asc" }],
      select: {
        id: true,
        vehicleId: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    });
  }
}
