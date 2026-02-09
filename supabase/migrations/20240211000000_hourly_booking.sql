-- Hourly booking support
-- Allow custom hourly bookings alongside existing package-based time slots

-- Make time_slot_id nullable for hourly bookings
ALTER TABLE bookings ALTER COLUMN time_slot_id DROP NOT NULL;

-- Add hourly booking fields
ALTER TABLE bookings ADD COLUMN booking_type TEXT NOT NULL DEFAULT 'package'
  CHECK (booking_type IN ('package', 'hourly'));
ALTER TABLE bookings ADD COLUMN start_time TIME;
ALTER TABLE bookings ADD COLUMN end_time TIME;
ALTER TABLE bookings ADD COLUMN duration_hours INTEGER;

-- Drop old unique constraint, replace with partial unique for packages
ALTER TABLE bookings DROP CONSTRAINT bookings_booking_date_time_slot_id_key;
CREATE UNIQUE INDEX bookings_package_unique
  ON bookings (booking_date, time_slot_id)
  WHERE time_slot_id IS NOT NULL
    AND status NOT IN ('cancelled', 'no_show');

-- Add hourly_booking settings
INSERT INTO settings (key, value) VALUES
  ('hourly_booking', '{"hourly_rate": 10000, "min_hours": 2, "max_hours": 9, "enabled": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
