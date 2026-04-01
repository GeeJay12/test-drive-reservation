import type { Location, Vehicle, WeekDay } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export type VehicleCandidate = Pick<Vehicle, "id" | "model" | "location" | "startTime" | "endTime" | "minGap" | "drivenCount" | "version">;

export class VehicleDao {
  async findCandidatesByModelLocationDay(input: {
    model: string;
    location: Location;
    weekDay: WeekDay;
  }): Promise<VehicleCandidate[]> {
    return prisma.vehicle.findMany({
      where: {
        model: input.model,
        location: input.location,
        availableDays: {
          has: input.weekDay,
        },
      },
      orderBy: [{ drivenCount: "asc" }, { id: "asc" }],
      select: {
        id: true,
        model: true,
        location: true,
        startTime: true,
        endTime: true,
        minGap: true,
        drivenCount: true,
        version: true,
      },
    });
  }
}
