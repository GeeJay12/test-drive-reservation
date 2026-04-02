import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Location, ReservationStatus, WeekDay, PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { buildDatabaseUrl } from "../src/lib/database-url.js";

const connectionString = buildDatabaseUrl("api");
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function utcDate(iso: string): Date {
  return new Date(iso);
}

async function main(): Promise<void> {
  await prisma.reservation.deleteMany();
  await prisma.vehicle.deleteMany();

  const vehicles = await prisma.vehicle.createManyAndReturn({
    data: [
      {
        model: "Tesla Model 3",
        location: Location.ADAMSTOWN,
        startTime: utcDate("2026-01-01T08:00:00Z"),
        endTime: utcDate("2026-01-01T18:00:00Z"),
        availableDays: [WeekDay.MON, WeekDay.TUE, WeekDay.WED, WeekDay.THU, WeekDay.FRI],
        minGap: 15,
        drivenCount: 1,
      },
      {
        model: "Tesla Model 3",
        location: Location.ADAMSTOWN,
        startTime: utcDate("2026-01-01T08:00:00Z"),
        endTime: utcDate("2026-01-01T18:00:00Z"),
        availableDays: [WeekDay.MON, WeekDay.TUE, WeekDay.WED, WeekDay.THU, WeekDay.FRI],
        minGap: 15,
        drivenCount: 2,
      },
      {
        model: "Tesla Model X",
        location: Location.ARTANE,
        startTime: utcDate("2026-01-01T09:00:00Z"),
        endTime: utcDate("2026-01-01T20:00:00Z"),
        availableDays: [WeekDay.MON, WeekDay.TUE, WeekDay.WED, WeekDay.THU, WeekDay.FRI, WeekDay.SAT],
        minGap: 20,
        drivenCount: 0,
      },
      {
        model: "Tesla Model Y",
        location: Location.ASHTOWN,
        startTime: utcDate("2026-01-01T10:00:00Z"),
        endTime: utcDate("2026-01-01T17:00:00Z"),
        availableDays: [WeekDay.FRI, WeekDay.SAT, WeekDay.SUN],
        minGap: 10,
        drivenCount: 4,
      },
    ],
  });

  const model3Adamstown = vehicles.filter(
    (vehicle) => vehicle.model === "Tesla Model 3" && vehicle.location === Location.ADAMSTOWN,
  );

  if (model3Adamstown.length >= 2) {
    await prisma.reservation.createMany({
      data: [
        {
          vehicleId: model3Adamstown[0].id,
          status: ReservationStatus.BOOKED,
          model: "Tesla Model 3",
          location: Location.ADAMSTOWN,
          customerName: "Alice Murphy",
          customerEmail: "alice@example.com",
          customerPhone: "+353851111111",
          startTime: utcDate("2026-03-31T08:00:00Z"),
          endTime: utcDate("2026-03-31T08:45:00Z"),
        },
        {
          vehicleId: model3Adamstown[0].id,
          status: ReservationStatus.COMPLETED,
          model: "Tesla Model 3",
          location: Location.ADAMSTOWN,
          customerName: "Bob Ryan",
          customerEmail: "bob@example.com",
          customerPhone: "+353852222222",
          startTime: utcDate("2026-03-31T06:00:00Z"),
          endTime: utcDate("2026-03-31T06:45:00Z"),
        },
        {
          vehicleId: model3Adamstown[1].id,
          status: ReservationStatus.CANCELLED,
          model: "Tesla Model 3",
          location: Location.ADAMSTOWN,
          customerName: "Cara Quinn",
          customerEmail: "cara@example.com",
          customerPhone: "+353853333333",
          startTime: utcDate("2026-03-31T09:00:00Z"),
          endTime: utcDate("2026-03-31T09:45:00Z"),
        },
      ],
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
