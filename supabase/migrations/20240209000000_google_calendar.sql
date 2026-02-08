-- Add Google Calendar event ID to bookings table
ALTER TABLE bookings ADD COLUMN google_calendar_event_id TEXT;
