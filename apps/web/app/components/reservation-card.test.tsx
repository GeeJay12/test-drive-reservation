import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkAvailability as checkAvailabilityApi } from "../api/check-availability";
import { createReservation as createReservationApi } from "../api/create-reservation";
import { TestDriveReservationProvider } from "../hooks/useReservation";
import { TestDriveReservationCard } from "./reservation-card";

vi.mock("../api/check-availability", () => ({
  checkAvailability: vi.fn(),
}));

vi.mock("../api/create-reservation", () => ({
  createReservation: vi.fn(),
}));

describe("TestDriveReservationCard", () => {
  beforeEach(() => {
    vi.mocked(checkAvailabilityApi).mockReset();
    vi.mocked(createReservationApi).mockReset();
  });

  function renderCard() {
    return render(
      <TestDriveReservationProvider>
        <TestDriveReservationCard />
      </TestDriveReservationProvider>,
    );
  }

  it("renders the form and primary actions", () => {
    renderCard();

    expect(screen.getByRole("heading", { name: /test drive reservation/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /check availability/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /^reserve$/i })).toBeDisabled();
  });

  it("allows reserving after a successful availability check", async () => {
    const user = userEvent.setup();
    vi.mocked(checkAvailabilityApi).mockResolvedValue({ available: true, vehicleId: 5 });
    vi.mocked(createReservationApi).mockResolvedValue({
      reservationId: "res-99",
      vehicleId: 5,
      status: "BOOKED",
      startTime: "2026-04-02T10:00:00.000Z",
      endTime: "2026-04-02T10:30:00.000Z",
    });

    renderCard();

    await user.click(screen.getByRole("button", { name: /check availability/i }));

    expect(await screen.findByText("Available", { exact: true })).toBeInTheDocument();

    const reserveBtn = screen.getByRole("button", { name: /^reserve$/i });
    expect(reserveBtn).toBeEnabled();

    await user.click(reserveBtn);

    expect(await screen.findByText(/reservation id:\s*res-99/i)).toBeInTheDocument();
  });
});
