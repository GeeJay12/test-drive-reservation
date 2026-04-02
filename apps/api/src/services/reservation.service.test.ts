import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Location, ReservationStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ConflictError, NotFoundError } from "../lib/errors.js";
import { ReservationService } from "./reservation.service.js";

const originalTransaction = (prisma as any).$transaction;

describe("ReservationService", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (prisma as any).$transaction = originalTransaction;
  });

  it("creates a reservation successfully on first attempt", async () => {
    const candidate = {
      id: 1,
      model: "ModelX",
      location: Location.ADAMSTOWN,
      startTime: new Date("2026-04-02T09:00:00.000Z"),
      endTime: new Date("2026-04-02T12:00:00.000Z"),
      minGap: 10,
      drivenCount: 0,
      version: 1,
    };

    const input = {
      model: "ModelX",
      location: Location.ADAMSTOWN,
      customerName: "Alice",
      customerEmail: "alice@example.com",
      customerPhone: "+3531234567",
      startTime: new Date("2026-04-02T10:00:00.000Z"),
      durationMinutes: 30,
    };

    const expectedEndTime = new Date("2026-04-02T10:40:00.000Z"); // 10:00 + 30 + minGap(10)

    const txMock = {
      vehicle: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      reservation: {
        create: vi.fn().mockImplementation(({ data }: any) => ({ id: 123n, ...data })),
      },
    };

    (prisma as any).$transaction = vi.fn(async (cb: any) => cb(txMock));

    const vehicleDao = {
      findCandidatesByModelLocationDay: vi.fn().mockResolvedValue([candidate]),
    };
    const reservationDao = {
      findBookedByModelLocationDate: vi.fn().mockResolvedValue([]),
    };

    const service = new ReservationService(vehicleDao as any, reservationDao as any);

    const result = await service.createReservation(input as any);

    expect((prisma as any).$transaction).toHaveBeenCalledTimes(1);
    expect(txMock.vehicle.updateMany).toHaveBeenCalledWith({
      where: { id: candidate.id, version: candidate.version },
      data: {
        version: { increment: 1 },
        drivenCount: { increment: 1 },
      },
    });

    expect(txMock.reservation.create).toHaveBeenCalledTimes(1);
    const createArg = txMock.reservation.create.mock.calls[0][0];
    expect(createArg.data.endTime.toISOString()).toBe(expectedEndTime.toISOString());
    expect(createArg.data.status).toBe(ReservationStatus.BOOKED);

    expect(result).toEqual(
      expect.objectContaining({
        id: 123n,
        vehicleId: candidate.id,
        status: ReservationStatus.BOOKED,
      }),
    );
  });

  it("retries on conflict and fails after retry limit", async () => {
    const candidate = {
      id: 1,
      model: "ModelX",
      location: Location.ADAMSTOWN,
      startTime: new Date("2026-04-02T09:00:00.000Z"),
      endTime: new Date("2026-04-02T12:00:00.000Z"),
      minGap: 10,
      drivenCount: 0,
      version: 1,
    };

    const input = {
      model: "ModelX",
      location: Location.ADAMSTOWN,
      customerName: "Alice",
      customerEmail: "alice@example.com",
      customerPhone: "+3531234567",
      startTime: new Date("2026-04-02T10:00:00.000Z"),
      durationMinutes: 30,
    };

    const txMock = {
      vehicle: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }), // forces "Vehicle version changed"
      },
      reservation: {
        create: vi.fn(),
      },
    };

    (prisma as any).$transaction = vi.fn(async (cb: any) => cb(txMock));

    const vehicleDao = {
      findCandidatesByModelLocationDay: vi.fn().mockResolvedValue([candidate]),
    };
    const reservationDao = {
      findBookedByModelLocationDate: vi.fn().mockResolvedValue([]),
    };

    const service = new ReservationService(vehicleDao as any, reservationDao as any);
    const backoffMock = vi.fn().mockResolvedValue(undefined);
    (service as any).backoff = backoffMock;

    let thrown: unknown;
    try {
      await service.createReservation(input as any);
    } catch (err: unknown) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(ConflictError);
    expect((thrown as ConflictError).message).toBe("Reservation conflict after retry limit reached");
    expect((thrown as ConflictError).details).toEqual({ attempts: 3 });

    expect((prisma as any).$transaction).toHaveBeenCalledTimes(3);
    expect(backoffMock).toHaveBeenCalledTimes(2); // backoff after attempts 1 and 2
    expect(txMock.reservation.create).not.toHaveBeenCalled();
  });

  it("completes a reservation and updates vehicle when status is BOOKED", async () => {
    const txMock = {
      reservation: {
        findUnique: vi.fn().mockResolvedValue({
          id: 10n,
          vehicleId: 1,
          status: ReservationStatus.BOOKED,
        }),
        update: vi.fn().mockResolvedValue({
          id: 10n,
          vehicleId: 1,
          status: ReservationStatus.COMPLETED,
        }),
      },
      vehicle: {
        update: vi.fn().mockResolvedValue({}),
      },
    };

    (prisma as any).$transaction = vi.fn(async (cb: any) => cb(txMock));

    const service = new ReservationService({} as any, {} as any);

    const result = await service.completeReservation("10");

    expect(txMock.reservation.findUnique).toHaveBeenCalledWith({ where: { id: 10n } });
    expect(txMock.reservation.update).toHaveBeenCalledWith({
      where: { id: 10n },
      data: { status: ReservationStatus.COMPLETED },
    });
    expect(txMock.vehicle.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        drivenCount: { increment: 1 },
        version: { increment: 1 },
      },
    });
    expect(result).toEqual(expect.objectContaining({ status: ReservationStatus.COMPLETED }));
  });

  it("throws NotFoundError when completing a non-existent reservation", async () => {
    const txMock = {
      reservation: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
      vehicle: {
        update: vi.fn(),
      },
    };

    (prisma as any).$transaction = vi.fn(async (cb: any) => cb(txMock));

    const service = new ReservationService({} as any, {} as any);

    await expect(service.completeReservation("999")).rejects.toBeInstanceOf(NotFoundError);
    expect(txMock.vehicle.update).not.toHaveBeenCalled();
  });
});

