export type ReservationFormValues = {
  location: string;
  model: string;
  startDateTime: string;
  durationMinutes: number;
};

export type ReservationRequestStatus = "idle" | "loading" | "success" | "error";
