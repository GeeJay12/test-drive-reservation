"use client";

import { LOCATION_OPTIONS, MODEL_OPTIONS } from "../constants";
import { useTestDriveReservation } from "../hooks/useReservation";

export function TestDriveReservationCard() {
  const {
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
  } = useTestDriveReservation();

  return (
    <section className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900/80 p-8 shadow-2xl shadow-black/30">
      <h1 className="mb-6 text-2xl font-semibold text-slate-100">
        Test Drive Reservation
      </h1>

      <div className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Select Location</span>
          <select
            className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
            value={formValues.location}
            onChange={(event) => updateField("location", event.target.value)}
          >
            {LOCATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Select Model</span>
          <select
            className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
            value={formValues.model}
            onChange={(event) => updateField("model", event.target.value)}
          >
            {MODEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">
            Select Date and Time
          </span>
          <input
            className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
            type="datetime-local"
            value={formValues.startDateTime}
            onChange={(event) => updateField("startDateTime", event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">
            Test Drive Duration (min)
          </span>
          <input
            className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
            type="number"
            min={1}
            max={60}
            value={formValues.durationMinutes}
            onChange={(event) =>
              updateField("durationMinutes", Number(event.target.value))
            }
          />
        </label>
      </div>

      {validationErrors.length > 0 ? (
        <ul className="mt-4 rounded-md border border-rose-500/40 bg-rose-950/50 p-3 text-sm text-rose-200">
          {validationErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-600"
          type="button"
          onClick={checkAvailability}
          disabled={checkStatus === "loading" || reserveStatus === "loading"}
        >
          {checkStatus === "loading" ? "Checking..." : "Check Availability"}
        </button>

        <span
          className="text-sm"
          aria-live="polite"
          role="status"
        >
          {availability?.available ? (
            <span className="text-emerald-400">Available</span>
          ) : availability && !availability.available ? (
            <span className="text-amber-300">Not Available</span>
          ) : (
            <span className="text-slate-400">Awaiting availability check</span>
          )}
        </span>
      </div>

      <div className="mt-4">
        <button
          className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-600"
          type="button"
          onClick={reserve}
          disabled={!canReserve}
        >
          {reserveStatus === "loading" ? "Reserving..." : "Reserve"}
        </button>
      </div>

      {feedbackMessage ? (
        <p className="mt-4 text-sm text-slate-200" aria-live="polite">
          {feedbackMessage}
        </p>
      ) : null}

      {reservation ? (
        <div className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-950/30 p-3 text-sm text-emerald-200">
          Reservation ID: {reservation.reservationId}
        </div>
      ) : null}
    </section>
  );
}
