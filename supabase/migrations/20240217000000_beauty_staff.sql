-- Beauty csapat: foglalható személyzet (hair/make-up), fix áras sávokkal.
-- A bookings tábla NEM módosul, meglévő adatot nem érint.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================
-- 1. SZEMÉLYZET + ÁRSÁVOK
-- ============================================
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role_name TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  hourly_rate INTEGER NOT NULL CHECK (hourly_rate >= 0),  -- bruttó Ft / óra
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix áras sávok (fél nap, egész nap). A `note` csak megjelenik, az árat nem befolyásolja.
CREATE TABLE staff_rate_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  hours INTEGER NOT NULL CHECK (hours > 0),
  price INTEGER NOT NULL CHECK (price >= 0),
  note TEXT,
  UNIQUE (staff_id, hours)
);

-- ============================================
-- 2. FOGLALÁSHOZ RENDELT SZEMÉLYZET
-- Az ár és az időablak szerver oldalon számolódik a trigger által;
-- a kliens csak (booking_id, staff_id) párt küld.
-- ============================================
CREATE TABLE booking_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_members(id),
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  hours INTEGER NOT NULL,
  hourly_rate INTEGER NOT NULL,
  tier_label TEXT,
  total_price INTEGER NOT NULL,
  staff_name TEXT NOT NULL,   -- snapshot (számlasor)
  role_name TEXT NOT NULL,    -- snapshot
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (booking_id, staff_id),
  CHECK (end_datetime > start_datetime),
  CONSTRAINT no_overlapping_staff EXCLUDE USING gist (
    staff_id WITH =,
    tstzrange(start_datetime, end_datetime, '[)') WITH &&
  ) WHERE (is_active)
);

CREATE INDEX idx_booking_staff_booking ON booking_staff (booking_id);

-- ============================================
-- 3. ÁRSZÁMÍTÁS: óradíj + fix sávok legolcsóbb kombinációja
-- (a lib/booking/staff-pricing.ts tükörképe)
-- ============================================
CREATE OR REPLACE FUNCTION public.staff_price(p_staff UUID, p_hours INTEGER)
RETURNS TABLE (total INTEGER, label TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rate INTEGER;
  best INTEGER[];
  lab TEXT[];
  h INTEGER;
  prev INTEGER;
  cand INTEGER;
  t RECORD;
BEGIN
  SELECT hourly_rate INTO rate FROM staff_members WHERE id = p_staff;
  IF rate IS NULL THEN RAISE EXCEPTION 'Ismeretlen munkatárs'; END IF;
  best[0] := 0; lab[0] := '';
  FOR h IN 1..p_hours LOOP
    best[h] := h * rate; lab[h] := '';
    FOR t IN SELECT st.hours, st.price, st.label FROM staff_rate_tiers st WHERE st.staff_id = p_staff LOOP
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
GRANT EXECUTE ON FUNCTION public.staff_price(UUID, INTEGER) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.booking_staff_fill() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  b RECORD;
  s RECORD;
  p RECORD;
  v_start TIME;
  v_end TIME;
BEGIN
  SELECT bk.booking_date, bk.booking_type, bk.start_time, bk.end_time, ts.start_time AS slot_start, ts.end_time AS slot_end
    INTO b
    FROM bookings bk LEFT JOIN time_slots ts ON ts.id = bk.time_slot_id
    WHERE bk.id = NEW.booking_id;
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

  SELECT * INTO p FROM staff_price(NEW.staff_id, NEW.hours);
  NEW.total_price := p.total;
  NEW.tier_label := p.label;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_booking_staff_fill
  BEFORE INSERT ON booking_staff
  FOR EACH ROW EXECUTE FUNCTION public.booking_staff_fill();

-- Lemondáskor / no-show-nál a munkatárs felszabadul
CREATE OR REPLACE FUNCTION public.release_booking_staff() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('cancelled', 'no_show') AND OLD.status NOT IN ('cancelled', 'no_show') THEN
    UPDATE booking_staff SET is_active = FALSE WHERE booking_id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_release_booking_staff
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION public.release_booking_staff();

-- Foglalt munkatársak egy időablakban (anonim is hívhatja, a booking_staff tábla nem olvasható)
CREATE OR REPLACE FUNCTION public.busy_staff(p_from TIMESTAMPTZ, p_to TIMESTAMPTZ)
RETURNS TABLE (staff_id UUID)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT staff_id FROM booking_staff
  WHERE is_active AND start_datetime < p_to AND end_datetime > p_from;
$$;
GRANT EXECUTE ON FUNCTION public.busy_staff(TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;

-- Ugyanez dátum + helyi (Europe/Budapest) idők alapján, hogy a böngésző időzónája ne számítson
CREATE OR REPLACE FUNCTION public.busy_staff_on(p_date DATE, p_start TIME, p_end TIME)
RETURNS TABLE (staff_id UUID)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM busy_staff(
    (p_date + p_start) AT TIME ZONE 'Europe/Budapest',
    (p_date + p_end) AT TIME ZONE 'Europe/Budapest'
  );
$$;
GRANT EXECUTE ON FUNCTION public.busy_staff_on(DATE, TIME, TIME) TO anon, authenticated;

-- ============================================
-- 4. RLS  (public.is_admin() a 20240207 migrációból)
-- ============================================
ALTER TABLE staff_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_rate_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_staff    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read staff_members" ON staff_members FOR SELECT USING (is_active OR public.is_admin());
CREATE POLICY "Admin manage staff_members" ON staff_members FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public read staff_rate_tiers" ON staff_rate_tiers FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage staff_rate_tiers" ON staff_rate_tiers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Read own booking_staff" ON booking_staff FOR SELECT
  USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Insert own booking_staff" ON booking_staff FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = auth.uid() AND b.status = 'pending') OR public.is_admin());
CREATE POLICY "Admin manage booking_staff" ON booking_staff FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- 5. BEAUTY CSAPAT
-- ============================================
INSERT INTO staff_members (name, role_name, bio, image_url, hourly_rate, sort_order) VALUES
('Szepesi Bence', 'Session stylist',
 '2013 óta a magyarországi Kevin Murphy csapatának aktív tagja Session Stylistként. Rendszeresen dolgozik vezető modellügynökségekkel: VM Model, Visage Model, Attractive Model Management. Magazin megjelenései között szerepel a Marie Claire, Glamour, Elle és RunWay Magazin. Reklámfilmjei között megtalálható a McDonald’s, Lidl, Szentkirályi, Rossmann, Vodafone, AXE, Xiaomi és a Nemzeti Színház kampányai. Videoklipek terén a Follow The Flow, Cloud9+, Random Trip, Soulwave, Hauser, Gently Da Spittah, Biga és USEme, míg filmek közül a Kincsem, A Viszkis, Én Passant és IM Perfekt alkotások, Punnany Massif, Gájer Bálint és idén „Az utolsó betyár" c. nagyjátékfilm Csuja László rendezésében köthetők a nevéhez.'
 , '/team/bence.jpeg', 20000, 1),
('Keserű Barbara', 'Sminkes és hair stylist',
 'Nemzetközi tapasztalattal rendelkező sminkes és hair stylist. 2009 óta dolgozik a divat-, reklám-, film- és televíziós iparban. Pályafutása során számos hazai és nemzetközi produkcióban, valamint világmárkák kampányaiban vett részt, többek között az Apple, Adidas, Coca-Cola, McDonald’s, Doritos, Sensodyne, Oreo, Milka, LEGO, Deutsche Telekom, Captain Morgan, Bailey’s, KFC, HELL számára. Munkái olyan hazai és nemzetközi magazinokban jelentek meg, mint a Glamour, Impression Magazine, Kaltblut Magazine és Institute Magazine. Rendszeresen dolgozik reklámfilmekben, editoriálokon, divatkampányokon és filmes produkciókban, valamint több alkalommal dolgozott a New York Fashion Week, a Paris Fashion Week és a Mercedes-Benz Fashion Week backstage csapatában. Film- és televíziós munkái mellett szakmai referenciái IMDb-profilján is megtalálhatók. Tanulmányait Budapesten kezdte, majd Londonban, New Yorkban és Párizsban folytatta.'
 , '/team/barbara.jpeg', 20000, 2);

INSERT INTO staff_rate_tiers (staff_id, label, hours, price, note)
SELECT id, 'Fél nap', 6, 90000, NULL FROM staff_members
UNION ALL
SELECT id, 'Egész nap', 12, 150000, '3-4 fő részére' FROM staff_members;
