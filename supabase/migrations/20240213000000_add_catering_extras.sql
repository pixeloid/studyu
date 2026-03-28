-- Add catering packages as extras
INSERT INTO extras (name, description, price, price_type, is_active, sort_order)
VALUES
  ('Alap csomag', 'Olívabogyó válogatás, Magmix (50g/fő), Kovászos kenyér hagymás vajjal (teljes adag/fő)', 3500, 'per_person', true, 10),
  ('Közepes csomag', 'Olívabogyó válogatás, Magmix, Kovászos kenyér hagymás vajjal, Fetakrém pitával', 5300, 'per_person', true, 11),
  ('Teljes csomag', 'Olívabogyó válogatás, Magmix, Kovászos kenyér hagymás vajjal, Fetakrém pitával, 1 db meleg étel (aktuális kínálat alapján)', 7200, 'per_person', true, 12);
