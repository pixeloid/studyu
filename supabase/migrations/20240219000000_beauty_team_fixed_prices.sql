-- A csapatnak nincs óradíja: csak fix áras csomagok vannak (fél nap, egész nap, ...).
-- Választható óraszám = azok az órák, amelyekhez a csapatcsomagnál fix ár van.
CREATE OR REPLACE FUNCTION public.book_beauty_team(p_booking UUID, p_package UUID, p_hours INTEGER, p_start TIME DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  b RECORD; pk RECORD; tier RECORD; m RECORD; v_time TIME; v_start TIMESTAMPTZ; v_end TIMESTAMPTZ;
  v_first UUID; v_share INTEGER; v_members INTEGER;
BEGIN
  SELECT bk.user_id, bk.status, bk.booking_date, COALESCE(bk.start_time, ts.start_time) AS st
    INTO b FROM bookings bk LEFT JOIN time_slots ts ON ts.id = bk.time_slot_id WHERE bk.id = p_booking;
  IF NOT FOUND OR (b.user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin()) THEN
    RAISE EXCEPTION 'Nincs jogosultság ehhez a foglaláshoz';
  END IF;
  IF b.status <> 'pending' AND NOT public.is_admin() THEN RAISE EXCEPTION 'A foglalás már nem módosítható'; END IF;

  SELECT id, name, is_active INTO pk FROM staff_packages WHERE id = p_package;
  IF NOT FOUND OR NOT pk.is_active THEN RAISE EXCEPTION 'A csomag nem foglalható'; END IF;

  SELECT label, price INTO tier FROM staff_package_tiers WHERE package_id = p_package AND hours = p_hours;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ehhez az óraszámhoz nincs csapatcsomag'; END IF;

  v_time := COALESCE(p_start, b.st);
  IF v_time IS NULL OR (b.booking_date + v_time) + make_interval(hours => p_hours) > (b.booking_date + 1) THEN
    RAISE EXCEPTION 'A kiválasztott idősáv átlóg éjfélen';
  END IF;
  v_start := (b.booking_date + v_time) AT TIME ZONE 'Europe/Budapest';
  v_end := v_start + make_interval(hours => p_hours);

  SELECT count(*) INTO v_members
    FROM staff_package_members sm JOIN staff_members st ON st.id = sm.staff_id
    WHERE sm.package_id = p_package AND st.is_active;
  SELECT st.id INTO v_first
    FROM staff_package_members sm JOIN staff_members st ON st.id = sm.staff_id
    WHERE sm.package_id = p_package AND st.is_active ORDER BY st.id LIMIT 1;
  IF v_members = 0 THEN RAISE EXCEPTION 'A csomagnak nincs aktív tagja'; END IF;
  v_share := tier.price / v_members;

  PERFORM set_config('app.beauty_rpc', '1', true);
  FOR m IN
    SELECT st.id, st.name, st.role_name, st.hourly_rate FROM staff_package_members sm
    JOIN staff_members st ON st.id = sm.staff_id WHERE sm.package_id = p_package AND st.is_active ORDER BY st.id
  LOOP
    -- a csomag ára a tagok között egyenlően; a kerekítési maradék az első taghoz kerül
    INSERT INTO booking_staff (booking_id, staff_id, start_datetime, end_datetime, hours, hourly_rate, tier_label,
                               total_price, staff_name, role_name, package_id, package_name)
    VALUES (p_booking, m.id, v_start, v_end, p_hours, m.hourly_rate, tier.label,
            CASE WHEN m.id = v_first THEN tier.price - v_share * (v_members - 1) ELSE v_share END,
            m.name, m.role_name, p_package, pk.name);
  END LOOP;
  PERFORM set_config('app.beauty_rpc', '', true);
  RETURN tier.price;
END; $$;

REVOKE ALL ON FUNCTION public.book_beauty_team(UUID, UUID, INTEGER, TIME) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_beauty_team(UUID, UUID, INTEGER, TIME) TO authenticated;
