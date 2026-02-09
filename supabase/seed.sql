-- StudyU - Seed Data
-- This file contains initial data for the booking system

-- ============================================
-- 1. OPENING HOURS (Default weekly schedule)
-- ============================================
INSERT INTO opening_hours (day_of_week, open_time, close_time, is_closed) VALUES
  (0, '10:00', '16:00', false),  -- Sunday (shorter hours)
  (1, '09:00', '18:00', false),  -- Monday
  (2, '09:00', '18:00', false),  -- Tuesday
  (3, '09:00', '18:00', false),  -- Wednesday
  (4, '09:00', '18:00', false),  -- Thursday
  (5, '09:00', '18:00', false),  -- Friday
  (6, '10:00', '16:00', false);  -- Saturday (shorter hours)

-- ============================================
-- 2. SPECIAL DATES (Hungarian holidays 2024-2025)
-- ============================================
INSERT INTO special_dates (date, type, name) VALUES
  -- 2024
  ('2024-01-01', 'holiday', 'Újév'),
  ('2024-03-15', 'holiday', 'Nemzeti ünnep'),
  ('2024-04-01', 'holiday', 'Húsvéthétfő'),
  ('2024-05-01', 'holiday', 'Munka ünnepe'),
  ('2024-05-20', 'holiday', 'Pünkösdhétfő'),
  ('2024-08-20', 'holiday', 'Államalapítás'),
  ('2024-10-23', 'holiday', 'Nemzeti ünnep'),
  ('2024-11-01', 'holiday', 'Mindenszentek'),
  ('2024-12-24', 'holiday', 'Szenteste'),
  ('2024-12-25', 'holiday', 'Karácsony'),
  ('2024-12-26', 'holiday', 'Karácsony'),
  ('2024-12-31', 'holiday', 'Szilveszter'),
  -- 2025
  ('2025-01-01', 'holiday', 'Újév'),
  ('2025-03-15', 'holiday', 'Nemzeti ünnep'),
  ('2025-04-21', 'holiday', 'Húsvéthétfő'),
  ('2025-05-01', 'holiday', 'Munka ünnepe'),
  ('2025-06-09', 'holiday', 'Pünkösdhétfő'),
  ('2025-08-20', 'holiday', 'Államalapítás'),
  ('2025-10-23', 'holiday', 'Nemzeti ünnep'),
  ('2025-11-01', 'holiday', 'Mindenszentek'),
  ('2025-12-24', 'holiday', 'Szenteste'),
  ('2025-12-25', 'holiday', 'Karácsony'),
  ('2025-12-26', 'holiday', 'Karácsony'),
  ('2025-12-31', 'holiday', 'Szilveszter'),
  -- 2026
  ('2026-01-01', 'holiday', 'Újév'),
  ('2026-03-15', 'holiday', 'Nemzeti ünnep'),
  ('2026-04-06', 'holiday', 'Húsvéthétfő'),
  ('2026-05-01', 'holiday', 'Munka ünnepe'),
  ('2026-05-25', 'holiday', 'Pünkösdhétfő'),
  ('2026-08-20', 'holiday', 'Államalapítás'),
  ('2026-10-23', 'holiday', 'Nemzeti ünnep'),
  ('2026-11-01', 'holiday', 'Mindenszentek'),
  ('2026-12-24', 'holiday', 'Szenteste'),
  ('2026-12-25', 'holiday', 'Karácsony'),
  ('2026-12-26', 'holiday', 'Karácsony'),
  ('2026-12-31', 'holiday', 'Szilveszter');

-- ============================================
-- 3. TIME SLOTS (Booking periods)
-- ============================================
INSERT INTO time_slots (name, start_time, end_time, duration_hours, base_price, sort_order) VALUES
  ('Délelőtt', '09:00', '13:00', 4, 35000, 1),
  ('Délután', '14:00', '18:00', 4, 35000, 2),
  ('Egész nap', '09:00', '18:00', 9, 65000, 3);

-- ============================================
-- 4. EXTRAS (Additional services)
-- ============================================
INSERT INTO extras (name, description, price, price_type, sort_order) VALUES
  ('Smink', 'Professzionális sminkes szolgáltatás', 15000, 'fixed', 1),
  ('Stylist', 'Ruha és kiegészítő styling', 20000, 'fixed', 2),
  ('Fodrász', 'Haj styling és frizura', 12000, 'fixed', 3),
  ('Asszisztens', 'Fotós asszisztens (óránként)', 5000, 'per_hour', 4),
  ('Extra háttér', 'További háttér használata', 8000, 'fixed', 5),
  ('Rekvizit csomag', 'Dekorációs elemek használata', 10000, 'fixed', 6);

-- ============================================
-- 5. SETTINGS (System configuration)
-- ============================================
INSERT INTO settings (key, value) VALUES
  ('cancellation_policy', '{
    "rules": [
      {"days_before": 7, "fee_percent": 0},
      {"days_before": 3, "fee_percent": 50},
      {"days_before": 2, "fee_percent": 70},
      {"days_before": 1, "fee_percent": 100}
    ]
  }'::jsonb),
  ('booking_settings', '{
    "min_days_ahead": 1,
    "max_days_ahead": 90,
    "require_approval": true,
    "slot_duration_minutes": 60,
    "buffer_between_slots": 15
  }'::jsonb),
  ('site_settings', '{
    "studio_name": "StudyU Fotóstúdió",
    "studio_address": "1111 Budapest, Példa utca 1.",
    "studio_phone": "+36 30 123 4567",
    "studio_email": "info@studyu.hu",
    "currency": "HUF",
    "locale": "hu-HU"
  }'::jsonb),
  ('szamlazz_hu', '{
    "agent_key": "",
    "prefix": "STUDYU",
    "seller_name": "",
    "seller_bank": "",
    "seller_bank_account": ""
  }'::jsonb),
  ('email_settings', '{
    "from_name": "StudyU Fotóstúdió",
    "from_email": "noreply@studyu.hu",
    "admin_email": "admin@studyu.hu"
  }'::jsonb),
  ('hourly_booking', '{
    "hourly_rate": 10000,
    "min_hours": 2,
    "max_hours": 9,
    "enabled": true
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 6. TEST DATA
-- ============================================
-- Run `npx ts-node scripts/seed-test-data.ts` after `supabase db reset`
-- to create test users and bookings via the Supabase Admin API.

-- 7. COUPONS (Test discount codes)
-- ============================================
INSERT INTO coupons (code, description, discount_percent, max_uses, current_uses, is_active, valid_from, valid_until) VALUES
  ('WELCOME10', 'Üdvözlő kupon - 10% kedvezmény', 10, 100, 0, true, '2026-01-01', '2026-12-31'),
  ('VIP20', 'VIP kupon - 20% kedvezmény', 20, 10, 0, true, '2026-01-01', '2026-06-30');
