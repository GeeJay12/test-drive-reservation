CREATE TYPE "Location" AS ENUM ('ADAMSTOWN', 'ARTANE', 'ASHTOWN', 'ATHGOE');
CREATE TYPE "WeekDay" AS ENUM ('SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT');
CREATE TYPE "ReservationStatus" AS ENUM ('BOOKED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "IdempotencyStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

CREATE TABLE "vehicles" (
  "id" SERIAL NOT NULL,
  "model" TEXT NOT NULL,
  "location" "Location" NOT NULL,
  "start_time" TIMESTAMPTZ NOT NULL,
  "end_time" TIMESTAMPTZ NOT NULL,
  "available_days" "WeekDay"[] NOT NULL,
  "min_gap" INTEGER NOT NULL,
  "driven_count" INTEGER NOT NULL DEFAULT 0,
  "_version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "vehicles_time_window_ck" CHECK ("start_time" < "end_time"),
  CONSTRAINT "vehicles_min_gap_ck" CHECK ("min_gap" >= 0),
  CONSTRAINT "vehicles_version_ck" CHECK ("_version" >= 1),
  CONSTRAINT "vehicles_available_days_not_empty_ck" CHECK (cardinality("available_days") > 0)
);

CREATE TABLE "reservations" (
  "id" BIGSERIAL NOT NULL,
  "vehicle_id" INTEGER NOT NULL,
  "status" "ReservationStatus" NOT NULL DEFAULT 'BOOKED',
  "model" TEXT NOT NULL,
  "location" "Location" NOT NULL,
  "customer_name" TEXT NOT NULL,
  "customer_email" TEXT NOT NULL,
  "customer_phone" TEXT NOT NULL,
  "start_time" TIMESTAMPTZ NOT NULL,
  "end_time" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reservations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reservations_time_window_ck" CHECK ("start_time" < "end_time"),
  CONSTRAINT "reservations_vehicle_start_end_uniq" UNIQUE ("vehicle_id", "start_time", "end_time"),
  CONSTRAINT "reservations_vehicle_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "idempotency_keys" (
  "key" TEXT NOT NULL,
  "request_fingerprint" TEXT NOT NULL,
  "status" "IdempotencyStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "response_code" INTEGER,
  "response_body" JSONB,
  "reservation_id" BIGINT,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("key"),
  CONSTRAINT "idempotency_keys_expires_at_ck" CHECK ("expires_at" > "created_at")
);

CREATE INDEX "vehicles_location_model_idx" ON "vehicles" ("location", "model");
CREATE INDEX "vehicles_location_model_driven_count_id_idx" ON "vehicles" ("location", "model", "driven_count", "id");

CREATE INDEX "reservations_location_model_start_time_idx" ON "reservations" ("location", "model", "start_time");
CREATE INDEX "reservations_vehicle_start_time_idx" ON "reservations" ("vehicle_id", "start_time");
CREATE INDEX "reservations_status_start_time_idx" ON "reservations" ("status", "start_time");

CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys" ("expires_at");

-- Partition automation scaffolding for reservations with 14-day windows.
-- The table remains compatible with Prisma schema even if partman setup is unavailable.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_partitioned_table p
    INNER JOIN pg_class c ON c.oid = p.partrelid
    INNER JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'reservations'
  ) THEN
    PERFORM partman.create_parent(
      p_parent_table := 'public.reservations',
      p_control := 'start_time',
      p_interval := '14 days',
      p_start_partition := '2026-01-01 00:00:00+00',
      p_premake := 4
    );
  ELSE
    RAISE NOTICE 'Skipping pg_partman create_parent; public.reservations is not partitioned';
  END IF;
EXCEPTION
  WHEN undefined_function OR invalid_parameter_value OR feature_not_supported THEN
    RAISE NOTICE 'pg_partman create_parent not applied: %', SQLERRM;
END $$;

DO $$
BEGIN
  UPDATE partman.part_config
  SET infinite_time_partitions = true
  WHERE parent_table = 'public.reservations';
EXCEPTION
  WHEN undefined_table OR insufficient_privilege THEN
    RAISE NOTICE 'pg_partman part_config update skipped: %', SQLERRM;
END $$;
