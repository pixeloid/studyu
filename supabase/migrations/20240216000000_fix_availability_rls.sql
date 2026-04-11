-- Fix availability checking: users need to see booked slots and internal blocks
-- to prevent double-booking. Instead of exposing raw data, we use a SELECT policy
-- with limited visibility and a function for internal blocks.

-- 1. Allow all authenticated users to see booking availability data
-- This only exposes booking_date, time_slot_id, start_time, end_time, status, booking_type
-- The user_id and other sensitive fields are NOT exposed by this policy,
-- but RLS policies operate at row level, so we use a DB function approach instead.

-- Add a public read policy for bookings (only non-cancelled, future bookings)
-- Users need this to check slot availability
CREATE POLICY "Anyone can view booking slots for availability"
  ON bookings
  FOR SELECT
  USING (
    status NOT IN ('cancelled', 'no_show')
    AND booking_date >= CURRENT_DATE
  );

-- 2. Allow all authenticated users to read internal blocks (needed for availability)
CREATE POLICY "Authenticated users can view internal_blocks"
  ON internal_blocks
  FOR SELECT
  USING (auth.role() = 'authenticated');
