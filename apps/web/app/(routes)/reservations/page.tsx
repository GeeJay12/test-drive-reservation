import { TestDriveReservationCard } from "@/app/components/reservation-card";
import { TestDriveReservationProvider } from "@/app/hooks/useReservation";

export default function ReservationsPage() {
  return (
    <TestDriveReservationProvider>
      <TestDriveReservationCard />
    </TestDriveReservationProvider>
  );
}
