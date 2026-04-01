"use client";

import { createContext, useContext } from "react";

import type {
  AvailabilityResponse,
  ReservationResponse,
} from "../types/contracts";
import type {
  ReservationFormValues,
  ReservationRequestStatus,
} from "../types/form";

export type TestDriveReservationContextValue = {
  formValues: ReservationFormValues;
  validationErrors: string[];
  checkStatus: ReservationRequestStatus;
  reserveStatus: ReservationRequestStatus;
  availability: AvailabilityResponse | null;
  reservation: ReservationResponse | null;
  feedbackMessage: string | null;
  updateField: <K extends keyof ReservationFormValues>(
    field: K,
    value: ReservationFormValues[K],
  ) => void;
  checkAvailability: () => Promise<void>;
  reserve: () => Promise<void>;
  canReserve: boolean;
};

export const TestDriveReservationContext =
  createContext<TestDriveReservationContextValue | null>(null);

export function useTestDriveReservationContext() {
  const context = useContext(TestDriveReservationContext);
  if (!context) {
    throw new Error(
      "useTestDriveReservationContext must be used inside TestDriveReservationProvider.",
    );
  }
  return context;
}
