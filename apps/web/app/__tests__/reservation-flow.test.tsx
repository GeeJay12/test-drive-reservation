import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";

import { TestDriveReservationCard } from "../components/test-drive-reservation-card";
import { TestDriveReservationProvider } from "../hooks/use-test-drive-reservation";

describe("test drive reservation flow", () => {
  it("checks availability and reserves successfully", async () => {
    const user = userEvent.setup();

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ available: true, vehicleId: 7 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            reservationId: "99",
            vehicleId: 7,
            status: "BOOKED",
            startTime: "2026-04-01T09:00:00.000Z",
            endTime: "2026-04-01T09:40:00.000Z",
          }),
          {
            status: 201,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    render(
      createElement(
        TestDriveReservationProvider,
        null,
        createElement(TestDriveReservationCard),
      ),
    );

    await user.click(
      screen.getByRole("button", { name: /check availability/i }),
    );
    expect(
      await screen.findByText("Vehicle is available for the selected slot."),
    ).toBeTruthy();

    const reserveButton = screen.getByRole("button", { name: /^reserve$/i });
    expect((reserveButton as HTMLButtonElement).disabled).toBe(false);
    await user.click(reserveButton);

    expect(await screen.findByText(/reservation id: 99/i)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mockRestore();
  });
});
