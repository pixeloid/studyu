# StudyU - Stúdió Foglalási Rendszer

## Rendszer Áttekintés

Privát stúdió foglalási platform naptáralapú időpontfoglalással, automatikus számlázással és admin felülettel.

---

## 1. Oldalstruktúra

| Útvonal | Oldal | Leírás | Hozzáférés |
|---------|-------|--------|------------|
| `/` | Nyitóoldal | Hero szekció, CTA foglaláshoz | Publikus |
| `/bemutatkozas` | Bemutatkozás | Stúdió bemutatása, felszerelés | Publikus |
| `/galeria` | Galéria | Képek a stúdióról és munkákról | Publikus |
| `/kapcsolat` | Kapcsolat | Elérhetőségek, térkép, űrlap | Publikus |
| `/foglalas` | Foglalás | Naptár + foglalási folyamat | Authentikált |
| `/foglalasaim` | Saját foglalások | Felhasználó aktív/múltbeli foglalásai | Authentikált |
| `/admin` | Admin dashboard | Foglalások kezelése, statisztikák | Admin |
| `/admin/foglalasok` | Foglalások lista | Összes foglalás szűrőkkel | Admin |
| `/admin/arak` | Árazás | Időszakok, extra szolgáltatások árai | Admin |
| `/admin/beallitasok` | Beállítások | Lemondási szabályok, nyitvatartás | Admin |

---

## 2. Adatbázis Séma

> **📚 Részletes foglalási logika:** Lásd a projekt lokális skill-jét: `.claude/skills/booking-system/SKILL.md`
> Ez tartalmazza a nyitvatartás, szabadnapok, belső foglalások és ütközéskezelés teljes implementációját.

### 2.1 Táblák

```sql
-- Felhasználók (Supabase Auth kiegészítés)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  tax_number TEXT,           -- Adószám
  billing_address JSONB,     -- {zip, city, street, country}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Időszakok (árazáshoz)
CREATE TABLE time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "Délelőtt", "Délután", "Egész nap"
  start_time TIME NOT NULL,              -- 09:00
  end_time TIME NOT NULL,                -- 13:00
  duration_hours INTEGER NOT NULL,       -- 4
  base_price INTEGER NOT NULL,           -- Ft-ban (pl. 25000)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extra szolgáltatások
CREATE TABLE extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "Smink", "Stylist", "Drónfelvétel"
  description TEXT,
  price INTEGER NOT NULL,                -- Ft-ban
  price_type TEXT NOT NULL DEFAULT 'fixed', -- 'fixed' | 'per_hour' | 'per_person'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foglalások
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  booking_date DATE NOT NULL,
  time_slot_id UUID NOT NULL REFERENCES time_slots(id),

  -- Árazás
  base_price INTEGER NOT NULL,
  extras_price INTEGER DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  total_price INTEGER NOT NULL,

  -- Státusz
  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled'

  -- Számlázás
  proforma_sent_at TIMESTAMPTZ,
  proforma_url TEXT,
  invoice_id TEXT,                       -- Számlázz.hu invoice ID
  invoice_url TEXT,
  paid_at TIMESTAMPTZ,

  -- Lemondás
  cancelled_at TIMESTAMPTZ,
  cancellation_fee INTEGER,              -- Lemondási díj
  cancellation_reason TEXT,

  -- Megjegyzések
  user_notes TEXT,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Egy napra egy time_slot csak egyszer foglalható
  UNIQUE(booking_date, time_slot_id)
);

-- Foglalás extrák kapcsolótábla
CREATE TABLE booking_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  extra_id UUID NOT NULL REFERENCES extras(id),
  quantity INTEGER DEFAULT 1,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zárolt időpontok (admin által blokkolt napok)
CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time_slot_id UUID REFERENCES time_slots(id), -- NULL = egész nap
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, time_slot_id)
);

-- Rendszerbeállítások
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Kezdeti Beállítások

```sql
INSERT INTO settings (key, value) VALUES
  ('cancellation_policy', '{
    "rules": [
      {"days_before": 7, "fee_percent": 0},
      {"days_before": 3, "fee_percent": 50},
      {"days_before": 2, "fee_percent": 70},
      {"days_before": 1, "fee_percent": 100}
    ]
  }'),
  ('booking_settings', '{
    "min_days_ahead": 1,
    "max_days_ahead": 90,
    "require_approval": true
  }'),
  ('szamlazz_hu', '{
    "agent_key": "",
    "prefix": "STUDYU"
  }');
```

### 2.3 RLS Policies

```sql
-- Profiles: saját profil olvasás/írás
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Bookings: saját foglalás olvasás, admin minden
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can do everything" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Time slots, extras: mindenki olvashat
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view time_slots" ON time_slots FOR SELECT USING (true);

ALTER TABLE extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view extras" ON extras FOR SELECT USING (true);
```

---

## 3. Foglalási Folyamat

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FOGLALÁSI FOLYAMAT                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  1. Naptár   │───▶│ 2. Időpont  │───▶│  3. Extrák   │
│   megnyitás  │    │   választás  │    │   kiválasztás│
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                    ┌──────────────────────────┘
                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 6. Proforma  │◀───│ 5. Foglalás │◀───│4. Összesítés │
│    e-mail    │    │   mentés DB  │    │  + Auth/Adat │
└──────────────┘    └──────────────┘    └──────────────┘
       │
       ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  7. Admin    │───▶│ 8. Fizetés  │───▶│ 9. Végszámla │
│  jóváhagyás  │    │   beérkezik  │    │ (Számlázz.hu)│
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │10. Foglalás │
                                        │   COMPLETED  │
                                        └──────────────┘
```

### 3.1 Naptár Lekérdezés

```typescript
// GET /api/calendar?month=2024-03
interface CalendarDay {
  date: string           // "2024-03-15"
  slots: {
    id: string
    name: string         // "Délelőtt (9-13)"
    available: boolean
    price: number
  }[]
}
```

### 3.2 Foglalás Létrehozása

```typescript
// POST /api/bookings
interface CreateBookingRequest {
  date: string           // "2024-03-15"
  time_slot_id: string
  extras: {
    extra_id: string
    quantity: number
  }[]
  billing_data: {
    full_name: string
    company_name?: string
    tax_number?: string
    address: {
      zip: string
      city: string
      street: string
      country: string
    }
  }
  notes?: string
}
```

---

## 4. Lemondási Folyamat

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LEMONDÁSI FOLYAMAT                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 1. Foglalás │───▶│ 2. Lemondás │───▶│ 3. Díj       │
│   megnyitás  │    │    gomb     │    │   kalkuláció │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                    ┌──────────────────────────┘
                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 6. Státusz   │◀───│ 5. E-mail   │◀───│4. Megerősítés│
│   CANCELLED  │    │  mindkét fél │    │   + mentés   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### 4.1 Lemondási Díj Kalkuláció

```typescript
function calculateCancellationFee(
  bookingDate: Date,
  totalPrice: number,
  policy: CancellationRule[]
): number {
  const daysUntil = differenceInDays(bookingDate, new Date())

  // Rendezett szabályok (napok szerint csökkenő)
  const sortedRules = [...policy].sort((a, b) => b.days_before - a.days_before)

  for (const rule of sortedRules) {
    if (daysUntil >= rule.days_before) {
      return Math.round(totalPrice * (rule.fee_percent / 100))
    }
  }

  // Ha már elmúlt vagy aznap: 100%
  return totalPrice
}

// Példa:
// 10 nap múlva van → 0% díj
// 5 nap múlva van → 50% díj
// 2 nap múlva van → 70% díj
// holnap van → 100% díj
```

---

## 5. Integrációk

### 5.1 Számlázz.hu API

> **📚 Részletes dokumentáció:** Használd a `/szamlazz-hu` skill-t a teljes API dokumentációért, kód példákért és hibakezelésért.

```typescript
// lib/szamlazz.ts - Használd a szamlazz-hu skill-ben lévő implementációt
import { SzamlazzHuClient } from '@/lib/szamlazz'

const client = new SzamlazzHuClient(process.env.SZAMLAZZ_AGENT_KEY!)

// Díjbekérő
const proforma = await client.createProforma(invoiceData)

// Végszámla
const invoice = await client.createInvoice(invoiceData)

// Sztornó
const storno = await client.createReverseInvoice(invoiceNumber)
```

**Elérhető műveletek:**
- `createProforma()` - Díjbekérő generálás
- `createInvoice()` - Végszámla generálás
- `createReverseInvoice()` - Sztornó számla
- `downloadPdf()` - PDF letöltés
- `getInvoice()` - Számla lekérdezés

### 5.2 E-mail Küldés (Resend / Supabase Edge Function)

```typescript
// E-mail típusok
type EmailType =
  | 'booking_confirmation'    // Foglalás visszaigazolás + proforma PDF
  | 'booking_approved'        // Admin jóváhagyta
  | 'payment_received'        // Fizetés beérkezett + végszámla
  | 'booking_reminder'        // Emlékeztető (1 nappal előtte)
  | 'cancellation_user'       // Lemondás visszaigazolás (felhasználónak)
  | 'cancellation_admin'      // Lemondás értesítés (adminnak)
```

### 5.3 Authentikáció

```typescript
// Supabase Auth providers
const authProviders = ['google', 'facebook']

// Bejelentkezés után profil kiegészítés
async function onAuthComplete(user: User) {
  const { data: profile } = await supabase
    .from('profiles')
    .select()
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Új felhasználó → számlázási adatok bekérése
    redirect('/foglalas/adatok')
  }
}
```

---

## 6. API Végpontok

### 6.1 Publikus

| Metódus | Útvonal | Leírás |
|---------|---------|--------|
| GET | `/api/calendar` | Naptár adatok (szabad időpontok) |
| GET | `/api/time-slots` | Elérhető időszakok listája |
| GET | `/api/extras` | Extra szolgáltatások listája |

### 6.2 Authentikált (User)

| Metódus | Útvonal | Leírás |
|---------|---------|--------|
| GET | `/api/bookings` | Saját foglalások |
| POST | `/api/bookings` | Új foglalás létrehozása |
| GET | `/api/bookings/[id]` | Foglalás részletei |
| POST | `/api/bookings/[id]/cancel` | Foglalás lemondása |
| GET | `/api/profile` | Saját profil |
| PUT | `/api/profile` | Profil módosítása |

### 6.3 Admin

| Metódus | Útvonal | Leírás |
|---------|---------|--------|
| GET | `/api/admin/bookings` | Összes foglalás (szűrőkkel) |
| PUT | `/api/admin/bookings/[id]` | Foglalás módosítása |
| POST | `/api/admin/bookings/[id]/approve` | Jóváhagyás |
| POST | `/api/admin/bookings/[id]/invoice` | Végszámla készítés |
| POST | `/api/admin/blocked-dates` | Időpont zárolása |
| DELETE | `/api/admin/blocked-dates/[id]` | Zárolás feloldása |
| PUT | `/api/admin/time-slots/[id]` | Időszak módosítása |
| PUT | `/api/admin/extras/[id]` | Extra módosítása |
| PUT | `/api/admin/settings/[key]` | Beállítás módosítása |

---

## 7. Komponens Struktúra

```
src/
├── app/
│   ├── (public)/              # Publikus layout
│   │   ├── page.tsx           # Nyitóoldal
│   │   ├── bemutatkozas/
│   │   ├── galeria/
│   │   └── kapcsolat/
│   ├── (auth)/                # Auth layout
│   │   ├── foglalas/
│   │   │   ├── page.tsx       # Naptár nézet
│   │   │   ├── [date]/
│   │   │   │   └── page.tsx   # Adott nap foglalása
│   │   │   └── adatok/
│   │   │       └── page.tsx   # Számlázási adatok
│   │   └── foglalasaim/
│   │       ├── page.tsx       # Lista
│   │       └── [id]/
│   │           └── page.tsx   # Részletek + lemondás
│   ├── admin/
│   │   ├── layout.tsx         # Admin layout + auth check
│   │   ├── page.tsx           # Dashboard
│   │   ├── foglalasok/
│   │   ├── arak/
│   │   └── beallitasok/
│   └── api/
│       ├── calendar/
│       ├── bookings/
│       ├── profile/
│       └── admin/
├── components/
│   ├── booking/
│   │   ├── Calendar.tsx       # Naptár komponens
│   │   ├── TimeSlotPicker.tsx # Időszak választó
│   │   ├── ExtrasPicker.tsx   # Extrák választó
│   │   ├── BookingSummary.tsx # Összesítő
│   │   └── BookingCard.tsx    # Foglalás kártya
│   ├── admin/
│   │   ├── BookingsTable.tsx
│   │   ├── BookingModal.tsx
│   │   └── StatsCards.tsx
│   └── ui/                    # Általános UI komponensek
└── lib/
    ├── supabase/
    ├── szamlazz.ts            # Számlázz.hu integráció
    ├── email.ts               # E-mail küldés
    └── utils/
        ├── pricing.ts         # Ár kalkuláció
        └── cancellation.ts    # Lemondási díj
```

---

## 8. Státusz Diagram

```
                    ┌─────────┐
                    │ PENDING │ ◀─── Foglalás létrehozva
                    └────┬────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            │            ▼
     ┌───────────┐       │     ┌───────────┐
     │ CONFIRMED │       │     │ CANCELLED │
     └─────┬─────┘       │     └───────────┘
           │             │
           ▼             │
      ┌─────────┐        │
      │  PAID   │────────┘
      └────┬────┘
           │
           ▼
     ┌───────────┐
     │ COMPLETED │ ◀─── Esemény lezajlott
     └───────────┘
```

---

## 9. Környezeti Változók

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Csak szerver oldalon

# Számlázz.hu
SZAMLAZZ_AGENT_KEY=

# E-mail (Resend)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://studyu.hu
```

---

## 10. Implementációs Sorrend

### Fázis 1: Alapok
1. [ ] Adatbázis migráció létrehozása
2. [ ] Publikus oldalak (nyitó, bemutatkozás, galéria, kapcsolat)
3. [ ] Auth beállítás (Google/Facebook)
4. [ ] Profil kezelés

### Fázis 2: Foglalás
5. [ ] Naptár komponens
6. [ ] Időpont foglalás flow
7. [ ] Extra szolgáltatások
8. [ ] Foglalás összesítő és mentés

### Fázis 3: Admin
9. [ ] Admin dashboard
10. [ ] Foglalások kezelése
11. [ ] Árazás és beállítások kezelése
12. [ ] Időpont zárolás

### Fázis 4: Számlázás
13. [ ] Számlázz.hu integráció
14. [ ] Proforma generálás
15. [ ] Végszámla generálás
16. [ ] E-mail értesítések

### Fázis 5: Lemondás
17. [ ] Lemondási folyamat
18. [ ] Díj kalkuláció
19. [ ] Sztornó kezelés

---

## 11. Biztonsági Megfontolások

- **RLS**: Minden tábla Row Level Security-vel védve
- **Admin ellenőrzés**: Middleware-ben role check
- **Rate limiting**: API végpontokon (Vercel/Supabase)
- **Input validáció**: Zod sémákkal minden endpoint-on
- **CSRF védelem**: Next.js beépített védelem
- **Számlázási adatok**: Csak HTTPS, titkosított tárolás
