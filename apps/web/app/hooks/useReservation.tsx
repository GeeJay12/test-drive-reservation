"use client";

import { useMemo, useState } from "react";

import { checkAvailability as checkAvailabilityApi } from "../api/check-availability";
import { createReservation as createReservationApi } from "../api/create-reservation";
import { toUserErrorMessage } from "../api/error-message";
import { LOCATION_OPTIONS, MODEL_OPTIONS } from "@/app/constants";
import {
  TestDriveReservationContext,
  useTestDriveReservationContext,
  type TestDriveReservationContextValue,
} from "../context/reservation-context";
import {
  buildAvailabilityPayload,
  buildReservationPayload,
} from "../lib/payloads";
import { validateReservationForm } from "../lib/validation";
import type {
  AvailabilityResponse,
  ReservationResponse,
} from "../types/contracts";
import type { ReservationFormValues, ReservationRequestStatus } from "../types/form";

function getInitialDateTimeLocal(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  now.setSeconds(0, 0);

  const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  const local = new Date(now.getTime() - timezoneOffsetMs);
  return local.toISOString().slice(0, 16);
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `tdr-${Date.now()}`;
}

function formSnapshotKey(values: ReservationFormValues): string {
  return `${values.location}|${values.model}|${values.startDateTime}|${values.durationMinutes}`;
}

export function TestDriveReservationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [formValues, setFormValues] = useState<ReservationFormValues>({
    location: LOCATION_OPTIONS[0].value,
    model: MODEL_OPTIONS[0].value,
    startDateTime: getInitialDateTimeLocal(),
    durationMinutes: 30,
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [checkStatus, setCheckStatus] = useState<ReservationRequestStatus>("idle");
  const [reserveStatus, setReserveStatus] =
    useState<ReservationRequestStatus>("idle");
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [reservation, setReservation] = useState<ReservationResponse | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [availabilitySnapshot, setAvailabilitySnapshot] = useState<string | null>(
    null,
  );

  const updateField: TestDriveReservationContextValue["updateField"] = (
    field,
    value,
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setValidationErrors([]);
    setAvailability(null);
    setAvailabilitySnapshot(null);
    setFeedbackMessage(null);
    setCheckStatus("idle");
    setReserveStatus("idle");
    setReservation(null);
  };

  const checkAvailability = async () => {
    const errors = validateReservationForm(formValues);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setFeedbackMessage(errors[0] ?? null);
      setCheckStatus("error");
      return;
    }

    setValidationErrors([]);
    setReservation(null);
    setCheckStatus("loading");
    setReserveStatus("idle");
    setFeedbackMessage(null);

    try {
      const payload = buildAvailabilityPayload(formValues);
      const response = await checkAvailabilityApi(payload);
      setAvailability(response);
      setAvailabilitySnapshot(formSnapshotKey(formValues));
      setCheckStatus("success");
      setFeedbackMessage(
        response.available
          ? "Vehicle is available for the selected slot."
          : response.reason ?? "No availability for the selected slot.",
      );
    } catch (error) {
      setAvailability(null);
      setAvailabilitySnapshot(null);
      setCheckStatus("error");
      setFeedbackMessage(toUserErrorMessage(error));
    }
  };

  const reserve = async () => {
    if (!availability?.available) {
      setReserveStatus("error");
      setFeedbackMessage("Check availability before making a reservation.");
      return;
    }

    const errors = validateReservationForm(formValues);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setReserveStatus("error");
      setFeedbackMessage(errors[0] ?? null);
      return;
    }

    setReserveStatus("loading");
    setValidationErrors([]);

    try {
      const payload = buildReservationPayload(formValues);
      const response = await createReservationApi(payload, createIdempotencyKey());
      setReservation(response);
      setReserveStatus("success");
      setFeedbackMessage("Reservation created successfully.");
    } catch (error) {
      setReserveStatus("error");
      setFeedbackMessage(toUserErrorMessage(error));
    }
  };

  const canReserve = useMemo(() => {
    const hasFreshAvailability =
      availability?.available &&
      availabilitySnapshot !== null &&
      availabilitySnapshot === formSnapshotKey(formValues);

    return (
      Boolean(hasFreshAvailability) &&
      checkStatus !== "loading" &&
      reserveStatus !== "loading"
    );
  }, [availability, availabilitySnapshot, checkStatus, formValues, reserveStatus]);

  const value: TestDriveReservationContextValue = {
    formValues,
    validationErrors,
    checkStatus,
    reserveStatus,
    availability,
    reservation,
    feedbackMessage,
    updateField,
    checkAvailability,
    reserve,
    canReserve,
  };

  return (
    <TestDriveReservationContext.Provider value={value}>
      {children}
    </TestDriveReservationContext.Provider>
  );
}

export function useTestDriveReservation() {
  return useTestDriveReservationContext();
}
