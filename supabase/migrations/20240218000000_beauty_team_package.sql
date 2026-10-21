-- Beauty csapat átalakítás:
--  * ELSŐDLEGES: a csapat (több munkatárs együtt) foglalható csomagként 4 / 6 / 12 órára, fix áras sávokkal
--  * MÁSODLAGOS: munkatársak külön-külön, óradíjjal; az óraszámot (és kezdést) a munkatársnál kell megadni,
--    nem függ a stúdióbérlés időtartamától
-- Additív: a 20240217 migráció táblái megmaradnak, a régi kliens kód a kiadás alatt is működik.

-- 1. Az eddigi 90 000 / 150 000 a CSAPAT ára volt, egyéni sávok nincsenek
DELETE FROM staff_rate_tiers;

-- 2. Csapatcsomag
CREATE TABLE staff_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  hourly_rate INTEGER NOT NULL CHECK (hourly_rate >= 0),   -- csapat óradíj (sávok nélküli órákra)
  allowed_hours INTEGER[] NOT NULL DEFAULT '{4,6,12}',     -- választható óraszámok
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE staff_package_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES staff_packages(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  hours INTEGER NOT NULL CHECK (hours > 0),
  price INTEGER NOT NULL CHECK (price >= 0),
  note TEXT,
  UNIQUE (package_id, hours)
);

CREATE TABLE staff_package_members (
  package_id UUID NOT NULL REFERENCES staff_packages(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  PRIMARY KEY (package_id, staff_id)
);

ALTER TABLE booking_staff
  ADD COLUMN package_id UUID REFERENCES staff_packages(id),
  ADD COLUMN package_name TEXT;

ALTER TABLE staff_packages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_package_tiers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_package_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read staff_packages" ON staff_packages FOR SELECT USING (is_active OR public.is_admin());
CREATE POLICY "Admin manage staff_packages" ON staff_packages FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public read staff_package_tiers" ON staff_package_tiers FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage staff_package_tiers" ON staff_package_tiers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public read staff_package_members" ON staff_package_members FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage staff_package_members" ON staff_package_members FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Csapatcsomag ára: óradíj + fix sávok legolcsóbb kombinációja
CREATE OR REPLACE FUNCTION public.staff_package_price(p_package UUID, p_hours INTEGER)
RETURNS TABLE (total INTEGER, label TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rate INTEGER; best INTEGER[]; lab TEXT[]; h INTEGER; prev INTEGER; cand INTEGER; t RECORD;
BEGIN
  SELECT hourly_rate INTO rate FROM staff_packages WHERE id = p_package;
  IF rate IS NULL THEN RAISE EXCEPTION 'Ismeretlen csomag'; END IF;
  best[0] := 0; lab[0] := '';
  FOR h IN 1..p_hours LOOP
    best[h] := h * rate; lab[h] := '';
    FOR t IN SELECT st.hours, st.price, st.label FROM staff_package_tiers st WHERE st.package_id = p_package LOOP
      prev := GREATEST(h - t.hours, 0);
      cand := t.price + best[prev];
      IF cand < best[h] THEN
        best[h] := cand;
        lab[h] := t.label || CASE WHEN lab[prev] <> '' THEN ' + ' || lab[prev] ELSE '' END;
      END IF;
    END LOOP;
  END LOOP;
  RETURN QUERY SELECT best[p_hours], NULLIF(lab[p_hours], '');
END; $$;
GRANT EXECUTE ON FUNCTION public.staff_package_price(UUID, INTEGER) TO anon, authenticated;

-- 4. A 20240217 kitöltő trigger csak a RÉGI útvonalon (óraszám = foglalás időtartama) dolgozik;
--    az új RPC-k saját értékekkel szúrnak be (app.beauty_rpc jelző), azokat nem írja felül.
CREATE OR REPLACE FUNCTION public.booking_staff_fill() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  b RECORD; s RECORD; p RECORD; v_start TIME; v_end TIME;
BEGIN
  IF current_setting('app.beauty_rpc', true) = '1' THEN
    RETURN NEW;
  END IF;

  SELECT bk.booking_date, bk.start_time, bk.end_time, ts.start_time AS slot_start, ts.end_time AS slot_end
    INTO b FROM bookings bk LEFT JOIN time_slots ts ON ts.id = bk.time_slot_id WHERE bk.id = NEW.booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ismeretlen foglalás'; END IF;

  v_start := COALESCE(b.start_time, b.slot_start);
  v_end   := COALESCE(b.end_time, b.slot_end);
  IF v_start IS NULL OR v_end IS NULL OR v_end <= v_start THEN
    RAISE EXCEPTION 'A foglalás időablaka nem határozható meg';
  END IF;

  SELECT name, role_name, hourly_rate, is_active INTO s FROM staff_members WHERE id = NEW.staff_id;
  IF NOT FOUND OR NOT s.is_active THEN RAISE EXCEPTION 'A munkatárs nem foglalható'; END IF;

  NEW.start_datetime := (b.booking_date + v_start) AT TIME ZONE 'Europe/Budapest';
  NEW.end_datetime   := (b.booking_date + v_end)   AT TIME ZONE 'Europe/Budapest';
  NEW.hours := CEIL(EXTRACT(EPOCH FROM (NEW.end_datetime - NEW.start_datetime)) / 3600);
  NEW.hourly_rate := s.hourly_rate;
  NEW.staff_name := s.name;
  NEW.role_name := s.role_name;
  NEW.is_active := TRUE;
  NEW.package_id := NULL;
  NEW.package_name := NULL;
  SELECT * INTO p FROM staff_price(NEW.staff_id, NEW.hours);
  NEW.total_price := p.total;
  NEW.tier_label := p.label;
  RETURN NEW;
END; $$;

-- 5. Foglalás RPC-k: az óraszám és a kezdés a munkatársnál (csapatnál) adott, az ár szerver oldali
CREATE OR REPLACE FUNCTION public.book_beauty_staff(p_booking UUID, p_staff UUID, p_hours INTEGER, p_start TIME DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  b RECORD; s RECORD; p RECORD; v_time TIME; v_start TIMESTAMPTZ; v_end TIMESTAMPTZ;
BEGIN
  SELECT bk.user_id, bk.status, bk.booking_date, COALESCE(bk.start_time, ts.start_time) AS st
    INTO b FROM bookings bk LEFT JOIN time_slots ts ON ts.id = bk.time_slot_id WHERE bk.id = p_booking;
  IF NOT FOUND OR (b.user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin()) THEN
    RAISE EXCEPTION 'Nincs jogosultság ehhez a foglaláshoz';
  END IF;
  IF b.status <> 'pending' AND NOT public.is_admin() THEN RAISE EXCEPTION 'A foglalás már nem módosítható'; END IF;
  IF p_hours < 1 OR p_hours > 12 THEN RAISE EXCEPTION 'Az óraszám 1 és 12 között lehet'; END IF;

  v_time := COALESCE(p_start, b.st);
  IF v_time IS NULL OR (b.booking_date + v_time) + make_interval(hours => p_hours) > (b.booking_date + 1) THEN
    RAISE EXCEPTION 'A kiválasztott idősáv átlóg éjfélen';
  END IF;
  v_start := (b.booking_date + v_time) AT TIME ZONE 'Europe/Budapest';
  v_end := v_start + make_interval(hours => p_hours);

  SELECT name, role_name, hourly_rate, is_active INTO s FROM staff_members WHERE id = p_staff;
  IF NOT FOUND OR NOT s.is_active THEN RAISE EXCEPTION 'A munkatárs nem foglalható'; END IF;
  SELECT * INTO p FROM staff_price(p_staff, p_hours);

  PERFORM set_config('app.beauty_rpc', '1', true);
  INSERT INTO booking_staff (booking_id, staff_id, start_datetime, end_datetime, hours, hourly_rate, tier_label,
                             total_price, staff_name, role_name)
  VALUES (p_booking, p_staff, v_start, v_end, p_hours, s.hourly_rate, p.label, p.total, s.name, s.role_name);
  PERFORM set_config('app.beauty_rpc', '', true);
  RETURN p.total;
END; $$;

CREATE OR REPLACE FUNCTION public.book_beauty_team(p_booking UUID, p_package UUID, p_hours INTEGER, p_start TIME DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  b RECORD; pk RECORD; p RECORD; m RECORD; v_time TIME; v_start TIMESTAMPTZ; v_end TIMESTAMPTZ;
  v_first UUID; v_share INTEGER; v_members INTEGER;
BEGIN
  SELECT bk.user_id, bk.status, bk.booking_date, COALESCE(bk.start_time, ts.start_time) AS st
    INTO b FROM bookings bk LEFT JOIN time_slots ts ON ts.id = bk.time_slot_id WHERE bk.id = p_booking;
  IF NOT FOUND OR (b.user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin()) THEN
    RAISE EXCEPTION 'Nincs jogosultság ehhez a foglaláshoz';
  END IF;
  IF b.status <> 'pending' AND NOT public.is_admin() THEN RAISE EXCEPTION 'A foglalás már nem módosítható'; END IF;

  SELECT id, name, allowed_hours, is_active INTO pk FROM staff_packages WHERE id = p_package;
  IF NOT FOUND OR NOT pk.is_active THEN RAISE EXCEPTION 'A csomag nem foglalható'; END IF;
  IF NOT (p_hours = ANY (pk.allowed_hours)) THEN RAISE EXCEPTION 'Ez az óraszám nem választható a csomagnál'; END IF;

  v_time := COALESCE(p_start, b.st);
  IF v_time IS NULL OR (b.booking_date + v_time) + make_interval(hours => p_hours) > (b.booking_date + 1) THEN
    RAISE EXCEPTION 'A kiválasztott idősáv átlóg éjfélen';
  END IF;
  v_start := (b.booking_date + v_time) AT TIME ZONE 'Europe/Budapest';
  v_end := v_start + make_interval(hours => p_hours);

  SELECT * INTO p FROM staff_package_price(p_package, p_hours);
  SELECT count(*) INTO v_members
    FROM staff_package_members sm JOIN staff_members st ON st.id = sm.staff_id
    WHERE sm.package_id = p_package AND st.is_active;
  SELECT st.id INTO v_first
    FROM staff_package_members sm JOIN staff_members st ON st.id = sm.staff_id
    WHERE sm.package_id = p_package AND st.is_active ORDER BY st.id LIMIT 1;
  IF v_members = 0 THEN RAISE EXCEPTION 'A csomagnak nincs aktív tagja'; END IF;
  v_share := p.total / v_members;

  PERFORM set_config('app.beauty_rpc', '1', true);
  FOR m IN
    SELECT st.id, st.name, st.role_name, st.hourly_rate FROM staff_package_members sm
    JOIN staff_members st ON st.id = sm.staff_id WHERE sm.package_id = p_package AND st.is_active ORDER BY st.id
  LOOP
    -- a csomag ára tagok között egyenlően; a kerekítési maradék az első taghoz kerül
    INSERT INTO booking_staff (booking_id, staff_id, start_datetime, end_datetime, hours, hourly_rate, tier_label,
                               total_price, staff_name, role_name, package_id, package_name)
    VALUES (p_booking, m.id, v_start, v_end, p_hours, m.hourly_rate, p.label,
            CASE WHEN m.id = v_first THEN p.total - v_share * (v_members - 1) ELSE v_share END,
            m.name, m.role_name, p_package, pk.name);
  END LOOP;
  PERFORM set_config('app.beauty_rpc', '', true);
  RETURN p.total;
END; $$;

REVOKE ALL ON FUNCTION public.book_beauty_staff(UUID, UUID, INTEGER, TIME) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.book_beauty_team(UUID, UUID, INTEGER, TIME) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_beauty_staff(UUID, UUID, INTEGER, TIME) TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_beauty_team(UUID, UUID, INTEGER, TIME) TO authenticated;

-- 6. Seed: csapatcsomag (Bence + Barbara). A 4 órás ár az óradíjból adódik (4 × 20 000 Ft) –
--    admin felületen módosítható.
WITH pk AS (
  INSERT INTO staff_packages (name, description, hourly_rate, allowed_hours, sort_order)
  VALUES ('Beauty csapat', 'Szepesi Bence és Keserű Barbara együtt – sminkes és hair stylist a fotózás teljes idejére.',
          20000, '{4,6,12}', 1)
  RETURNING id
), tiers AS (
  INSERT INTO staff_package_tiers (package_id, label, hours, price, note)
  SELECT id, 'Fél nap', 6, 90000, NULL FROM pk
  UNION ALL SELECT id, 'Egész nap', 12, 150000, '3-4 fő részére' FROM pk
  RETURNING 1
)
INSERT INTO staff_package_members (package_id, staff_id)
SELECT pk.id, sm.id FROM pk, staff_members sm WHERE sm.name IN ('Szepesi Bence', 'Keserű Barbara');
