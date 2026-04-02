import { describe, expect, it, vi } from "vitest";
import { AvailabilityService } from "./availability.service.js";
import { Location } from "@prisma/client";

describe("AvailabilityService.checkAvailability", () => {
  it("returns available:false when no candidate fits the operating window", async () => {
    const vehicleDao = {
      findCandidatesByModelLocationDay: vi.fn().mockResolvedValue([
        {
          id: 1,
          model: "ModelX",
          location: Location.ADAMSTOWN,
          startTime: new Date("2026-04-02T09:00:00.000Z"),
          endTime: new Date("2026-04-02T10:30:00.000Z"),
          minGap: 10,
          drivenCount: 0,
          version: 1,
        },
      ]),
    };

    const reservationDao = {
      findBookedByModelLocationDate: vi.fn(),
    };

    const service = new AvailabilityService(vehicleDao as any, reservationDao as any);

    const result = await service.checkAvailability({
      model: "ModelX",
      location: Location.ADAMSTOWN,
      startTime: new Date("2026-04-02T07:00:00.000Z"),
      durationMinutes: 30,
    });

    expect(result).toEqual({
      available: false,
      reason: "No candidate vehicle in operating window",
    });
    expect(reservationDao.findBookedByModelLocationDate).not.toHaveBeenCalled();
  });

  it("returns available:false when all candidates overlap the requested time window", async () => {
    const candidates = [
      {
        id: 1,
        model: "ModelX",
        location: Location.ADAMSTOWN,
        startTime: new Date("2026-04-02T09:00:00.000Z"),
        endTime: new Date("2026-04-02T11:00:00.000Z"),
        minGap: 10,
        drivenCount: 0,
        version: 1,
      },
      {
        id: 2,
        model: "ModelX",
        location: Location.ADAMSTOWN,
        startTime: new Date("2026-04-02T09:00:00.000Z"),
        endTime: new Date("2026-04-02T11:00:00.000Z"),
        minGap: 10,
        drivenCount: 0,
        version: 1,
      },
    ];

    const vehicleDao = {
      findCandidatesByModelLocationDay: vi.fn().mockResolvedValue(candidates),
    };

    const desiredStart = new Date("2026-04-02T10:00:00.000Z");
    // desiredEffectiveEnd = start + duration(30) + minGap(10) = 10:40

    const reservations = [
      // overlap for vehicle 1
      {
        vehicleId: 1,
        startTime: new Date("2026-04-02T10:20:00.000Z"),
        endTime: new Date("2026-04-02T10:50:00.000Z"),
      },
      // overlap for vehicle 2
      {
        vehicleId: 2,
        startTime: new Date("2026-04-02T10:10:00.000Z"),
        endTime: new Date("2026-04-02T10:30:00.000Z"),
      },
    ];

    const reservationDao = {
      findBookedByModelLocationDate: vi.fn().mockResolvedValue(reservations),
    };

    const service = new AvailabilityService(vehicleDao as any, reservationDao as any);

    const result = await service.checkAvailability({
      model: "ModelX",
      location: Location.ADAMSTOWN,
      startTime: desiredStart,
      durationMinutes: 30,
    });

    expect(result).toEqual({
      available: false,
      reason: "All candidate vehicles overlap for the requested time window",
    });

    expect(reservationDao.findBookedByModelLocationDate).toHaveBeenCalled();
  });

  it("returns available:true with a non-overlapping vehicle id", async () => {
    const candidates = [
      {
        id: 1,
        model: "ModelX",
        location: Location.ADAMSTOWN,
        startTime: new Date("2026-04-02T09:00:00.000Z"),
        endTime: new Date("2026-04-02T11:00:00.000Z"),
        minGap: 10,
        drivenCount: 0,
        version: 1,
      },
      {
        id: 2,
        model: "ModelX",
        location: Location.ADAMSTOWN,
        startTime: new Date("2026-04-02T09:00:00.000Z"),
        endTime: new Date("2026-04-02T11:00:00.000Z"),
        minGap: 10,
        drivenCount: 0,
        version: 1,
      },
    ];

    const vehicleDao = {
      findCandidatesByModelLocationDay: vi.fn().mockResolvedValue(candidates),
    };

    const desiredStart = new Date("2026-04-02T10:00:00.000Z");

    const reservations = [
      // vehicle 1 overlaps
      {
        vehicleId: 1,
        startTime: new Date("2026-04-02T10:20:00.000Z"),
        endTime: new Date("2026-04-02T10:50:00.000Z"),
      },
      // vehicle 2 starts exactly at desiredEffectiveEnd (10:40) => not overlapping due to strict < check
      {
        vehicleId: 2,
        startTime: new Date("2026-04-02T10:40:00.000Z"),
        endTime: new Date("2026-04-02T11:00:00.000Z"),
      },
    ];

    const reservationDao = {
      findBookedByModelLocationDate: vi.fn().mockResolvedValue(reservations),
    };

    const service = new AvailabilityService(vehicleDao as any, reservationDao as any);

    const result = await service.checkAvailability({
      model: "ModelX",
      location: Location.ADAMSTOWN,
      startTime: desiredStart,
      durationMinutes: 30,
    });

    expect(result).toEqual({
      available: true,
      vehicleId: 2,
    });
  });
});

