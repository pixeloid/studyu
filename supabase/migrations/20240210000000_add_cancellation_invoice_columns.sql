-- Add cancellation invoice tracking columns to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS storno_invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_invoice_url TEXT;
