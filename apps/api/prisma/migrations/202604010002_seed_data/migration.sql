INSERT INTO vehicles (
  model,
  location,
  start_time,
  end_time,
  available_days,
  min_gap,
  driven_count,
  _version
)
SELECT *
FROM (
  VALUES
    ('Tesla Model 3', 'ADAMSTOWN'::"Location", '2026-01-01T08:00:00Z'::timestamptz, '2026-01-01T18:00:00Z'::timestamptz, ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI']::"WeekDay"[], 15, 1, 1),
    ('Tesla Model 3', 'ADAMSTOWN'::"Location", '2026-01-01T08:00:00Z'::timestamptz, '2026-01-01T18:00:00Z'::timestamptz, ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI']::"WeekDay"[], 15, 2, 1),
    ('Tesla Model X', 'ARTANE'::"Location", '2026-01-01T09:00:00Z'::timestamptz, '2026-01-01T20:00:00Z'::timestamptz, ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']::"WeekDay"[], 20, 0, 1),
    ('Tesla Model Y', 'ASHTOWN'::"Location", '2026-01-01T10:00:00Z'::timestamptz, '2026-01-01T17:00:00Z'::timestamptz, ARRAY['FRI', 'SAT', 'SUN']::"WeekDay"[], 10, 4, 1)
) AS v(model, location, start_time, end_time, available_days, min_gap, driven_count, _version)
WHERE NOT EXISTS (SELECT 1 FROM vehicles);

INSERT INTO reservations (
  vehicle_id,
  status,
  model,
  location,
  customer_name,
  customer_email,
  customer_phone,
  start_time,
  end_time
)
SELECT *
FROM (
  SELECT
    (SELECT id FROM vehicles WHERE model = 'Tesla Model 3' AND location = 'ADAMSTOWN'::"Location" ORDER BY id ASC LIMIT 1) AS vehicle_id,
    'BOOKED'::"ReservationStatus" AS status,
    'Tesla Model 3' AS model,
    'ADAMSTOWN'::"Location" AS location,
    'Alice Murphy' AS customer_name,
    'alice@example.com' AS customer_email,
    '+353851111111' AS customer_phone,
    '2026-03-31T08:00:00Z'::timestamptz AS start_time,
    '2026-03-31T08:45:00Z'::timestamptz AS end_time
) r
WHERE r.vehicle_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM reservations);
