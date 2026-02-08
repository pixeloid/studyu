-- Migration: 20240206000000_booking_update_policy.sql
-- Add policy for users to update their own bookings (for cancellation)

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);
