import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useTestDriveReservationContext } from "./reservation-context";

describe("useTestDriveReservationContext", () => {
  it("throws when there is no provider", () => {
    expect(() => {
      renderHook(() => useTestDriveReservationContext());
    }).toThrow(/TestDriveReservationProvider/);
  });
});
