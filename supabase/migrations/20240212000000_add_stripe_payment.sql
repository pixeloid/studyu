-- Add Stripe payment columns to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'transfer' CHECK (payment_method IN ('transfer', 'card')),
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_link_url TEXT;

-- Add online_payment setting
INSERT INTO settings (key, value) VALUES ('online_payment', '{"enabled": false}')
ON CONFLICT (key) DO NOTHING;
