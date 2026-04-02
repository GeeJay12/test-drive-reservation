import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkAvailability as checkAvailabilityApi } from "../api/check-availability";
import { createReservation as createReservationApi } from "../api/create-reservation";
import { TestDriveReservationProvider, useTestDriveReservation } from "./useReservation";

vi.mock("../api/check-availability", () => ({
  checkAvailability: vi.fn(),
}));

vi.mock("../api/create-reservation", () => ({
  createReservation: vi.fn(),
}));

describe("TestDriveReservationProvider", () => {
  beforeEach(() => {
    vi.mocked(checkAvailabilityApi).mockReset();
    vi.mocked(createReservationApi).mockReset();
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <TestDriveReservationProvider>{children}</TestDriveReservationProvider>;
  }

  it("exposes initial idle state", () => {
    const { result } = renderHook(() => useTestDriveReservation(), { wrapper });

    expect(result.current.checkStatus).toBe("idle");
    expect(result.current.reserveStatus).toBe("idle");
    expect(result.current.availability).toBeNull();
    expect(result.current.canReserve).toBe(false);
  });

  it("checks availability and updates state on success", async () => {
    vi.mocked(checkAvailabilityApi).mockResolvedValue({ available: true, vehicleId: 1 });

    const { result } = renderHook(() => useTestDriveReservation(), { wrapper });

    await act(async () => {
      await result.current.checkAvailability();
    });

    expect(checkAvailabilityApi).toHaveBeenCalled();
    expect(result.current.checkStatus).toBe("success");
    expect(result.current.availability?.available).toBe(true);
    expect(result.current.canReserve).toBe(true);
  });

  it("blocks reserve until availability says the slot is open", async () => {
    const { result } = renderHook(() => useTestDriveReservation(), { wrapper });

    await act(async () => {
      await result.current.reserve();
    });

    expect(createReservationApi).not.toHaveBeenCalled();
    expect(result.current.reserveStatus).toBe("error");
    expect(result.current.feedbackMessage).toContain("Check availability");
  });

  it("creates a reservation after a successful availability check", async () => {
    vi.mocked(checkAvailabilityApi).mockResolvedValue({ available: true, vehicleId: 2 });
    vi.mocked(createReservationApi).mockResolvedValue({
      reservationId: "abc",
      vehicleId: 2,
      status: "BOOKED",
      startTime: "2026-04-02T10:00:00.000Z",
      endTime: "2026-04-02T10:30:00.000Z",
    });

    const { result } = renderHook(() => useTestDriveReservation(), { wrapper });

    await act(async () => {
      await result.current.checkAvailability();
    });
    await act(async () => {
      await result.current.reserve();
    });

    expect(createReservationApi).toHaveBeenCalled();
    expect(result.current.reserveStatus).toBe("success");
    expect(result.current.reservation?.reservationId).toBe("abc");
  });
});
