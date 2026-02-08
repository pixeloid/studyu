---
name: booking-system
description: Óránkénti foglalási rendszer implementációs útmutató. Nyitvatartás, szabadnapok, belső foglalások, ütközéskezelés, elérhetőség kalkuláció.
category: booking
version: 1.0.0
key_capabilities: hourly-booking, availability-calculation, collision-detection, opening-hours, holidays, internal-blocks
when_to_use: foglalási rendszer, időpontfoglalás, naptár, elérhetőség, ütközés, nyitvatartás, szabadnap, belső foglalás
---

# Óránkénti Foglalási Rendszer - Implementációs Útmutató

## Áttekintés

Ez a dokumentum egy professzionális, óránkénti alapú foglalási rendszer implementációját mutatja be, amely kezeli:
- **Nyitvatartási időket** (napokra lebontva, különböző időszakokkal)
- **Szabadnapokat** (ünnepnapok, rendkívüli zárva tartás)
- **Belső foglalásokat** (admin által blokkolt időpontok)
- **Ütközéskezelést** (dupla foglalás megelőzése)
- **Elérhetőség kalkulációt** (szabad időpontok meghatározása)

---

## 1. Adatbázis Séma

### 1.1 Nyitvatartási Idők

```sql
-- Heti nyitvatartás (napokra lebontva)
CREATE TABLE opening_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  -- 0 = Vasárnap, 1 = Hétfő, ..., 6 = Szombat
  open_time TIME NOT NULL,           -- 09:00
  close_time TIME NOT NULL,          -- 18:00
  is_closed BOOLEAN DEFAULT FALSE,   -- Ha true, az egész nap zárva
  break_start TIME,                  -- Ebédszünet kezdete (opcionális)
  break_end TIME,                    -- Ebédszünet vége (opcionális)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day_of_week)
);

-- Alapértelmezett nyitvatartás seed
INSERT INTO opening_hours (day_of_week, open_time, close_time, is_closed) VALUES
  (0, '10:00', '16:00', false),  -- Vasárnap (rövidebb)
  (1, '09:00', '18:00', false),  -- Hétfő
  (2, '09:00', '18:00', false),  -- Kedd
  (3, '09:00', '18:00', false),  -- Szerda
  (4, '09:00', '18:00', false),  -- Csütörtök
  (5, '09:00', '18:00', false),  -- Péntek
  (6, '10:00', '16:00', false);  -- Szombat (rövidebb)
```

### 1.2 Szabadnapok és Speciális Napok

```sql
-- Szabadnapok és speciális nyitvatartások
CREATE TABLE special_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('holiday', 'closed', 'special_hours')),
  -- 'holiday': Ünnepnap (zárva)
  -- 'closed': Rendkívüli zárva tartás
  -- 'special_hours': Speciális nyitvatartás
  name TEXT,                         -- "Karácsony", "Húsvét", stb.
  open_time TIME,                    -- Ha special_hours
  close_time TIME,                   -- Ha special_hours
  reason TEXT,                       -- Admin megjegyzés
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Magyar ünnepnapok 2024-2025
INSERT INTO special_dates (date, type, name) VALUES
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
  ('2024-12-31', 'holiday', 'Szilveszter');
```

### 1.3 Belső Foglalások (Admin Blokkolások)

```sql
-- Belső foglalások és blokkolások
CREATE TABLE internal_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN (
    'maintenance',      -- Karbantartás
    'internal_event',   -- Belső esemény
    'private_booking',  -- Privát foglalás (nem publikus)
    'preparation',      -- Előkészület másik foglaláshoz
    'other'             -- Egyéb
  )),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,              -- iCal RRULE formátum ha ismétlődő
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_datetime CHECK (end_datetime > start_datetime)
);

-- Index a gyors kereséshez
CREATE INDEX idx_internal_blocks_datetime ON internal_blocks (start_datetime, end_datetime);
```

### 1.4 Foglalások (Ütközéskezeléshez)

```sql
-- Foglalások táblája
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),

  -- Időpont (kezdet és vég)
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,

  -- Vagy time_slot alapú (ha fix időszakok vannak)
  booking_date DATE,
  time_slot_id UUID REFERENCES time_slots(id),

  -- Státusz
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'paid', 'completed', 'cancelled', 'no_show')),

  -- Buffer idő (takarítás, előkészület)
  buffer_minutes_before INTEGER DEFAULT 0,
  buffer_minutes_after INTEGER DEFAULT 15,

  -- ... többi mező

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FONTOS: Ütközés megelőzés EXCLUSION constraint-tel
-- Ez adatbázis szinten garantálja, hogy nincs időbeli átfedés
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
  EXCLUDE USING gist (
    tstzrange(
      start_datetime - (buffer_minutes_before || ' minutes')::interval,
      end_datetime + (buffer_minutes_after || ' minutes')::interval
    ) WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'no_show'));

-- Index az időpont kereséshez
CREATE INDEX idx_bookings_datetime ON bookings (start_datetime, end_datetime)
  WHERE status NOT IN ('cancelled', 'no_show');
```

---

## 2. Elérhetőség Kalkuláció

### 2.1 TypeScript Implementáció

```typescript
// lib/availability.ts

import { addMinutes, addHours, format, parse, isWithinInterval,
         areIntervalsOverlapping, eachHourOfInterval, startOfDay, endOfDay } from 'date-fns'
import { hu } from 'date-fns/locale'

interface OpeningHours {
  day_of_week: number
  open_time: string    // "09:00"
  close_time: string   // "18:00"
  is_closed: boolean
  break_start?: string
  break_end?: string
}

interface SpecialDate {
  date: string
  type: 'holiday' | 'closed' | 'special_hours'
  name?: string
  open_time?: string
  close_time?: string
}

interface InternalBlock {
  start_datetime: string
  end_datetime: string
  block_type: string
  title: string
}

interface Booking {
  start_datetime: string
  end_datetime: string
  buffer_minutes_before: number
  buffer_minutes_after: number
  status: string
}

interface TimeSlot {
  start: Date
  end: Date
  available: boolean
  reason?: string  // Ha nem elérhető, miért
}

interface AvailabilityConfig {
  slotDurationMinutes: number      // 60 = óránkénti foglalás
  bufferBetweenSlots: number       // 15 perc takarításra
  minAdvanceBookingHours: number   // Min. X órával előre kell foglalni
  maxAdvanceBookingDays: number    // Max. X nappal előre lehet foglalni
}

const DEFAULT_CONFIG: AvailabilityConfig = {
  slotDurationMinutes: 60,
  bufferBetweenSlots: 15,
  minAdvanceBookingHours: 24,
  maxAdvanceBookingDays: 90,
}

/**
 * Elérhetőség kalkulátor osztály
 */
export class AvailabilityCalculator {
  private config: AvailabilityConfig
  private openingHours: OpeningHours[]
  private specialDates: SpecialDate[]
  private internalBlocks: InternalBlock[]
  private bookings: Booking[]

  constructor(
    openingHours: OpeningHours[],
    specialDates: SpecialDate[],
    internalBlocks: InternalBlock[],
    bookings: Booking[],
    config: Partial<AvailabilityConfig> = {}
  ) {
    this.openingHours = openingHours
    this.specialDates = specialDates
    this.internalBlocks = internalBlocks
    this.bookings = bookings.filter(b => !['cancelled', 'no_show'].includes(b.status))
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Adott nap nyitvatartásának lekérése
   */
  getOpeningHoursForDate(date: Date): { open: Date; close: Date } | null {
    const dateStr = format(date, 'yyyy-MM-dd')

    // 1. Először ellenőrizzük a speciális napokat
    const specialDate = this.specialDates.find(sd => sd.date === dateStr)

    if (specialDate) {
      if (specialDate.type === 'holiday' || specialDate.type === 'closed') {
        return null // Zárva
      }
      if (specialDate.type === 'special_hours' && specialDate.open_time && specialDate.close_time) {
        return {
          open: this.parseTime(date, specialDate.open_time),
          close: this.parseTime(date, specialDate.close_time),
        }
      }
    }

    // 2. Normál nyitvatartás a hét napja alapján
    const dayOfWeek = date.getDay() // 0 = Vasárnap
    const hours = this.openingHours.find(oh => oh.day_of_week === dayOfWeek)

    if (!hours || hours.is_closed) {
      return null // Zárva
    }

    return {
      open: this.parseTime(date, hours.open_time),
      close: this.parseTime(date, hours.close_time),
    }
  }

  /**
   * Időpont string parse-olása Date objektummá
   */
  private parseTime(date: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const result = new Date(date)
    result.setHours(hours, minutes, 0, 0)
    return result
  }

  /**
   * Ellenőrzi, hogy egy időintervallum ütközik-e belső blokkolással
   */
  private isBlockedByInternal(start: Date, end: Date): { blocked: boolean; reason?: string } {
    for (const block of this.internalBlocks) {
      const blockStart = new Date(block.start_datetime)
      const blockEnd = new Date(block.end_datetime)

      if (areIntervalsOverlapping(
        { start, end },
        { start: blockStart, end: blockEnd }
      )) {
        return {
          blocked: true,
          reason: `${block.block_type}: ${block.title}`
        }
      }
    }
    return { blocked: false }
  }

  /**
   * Ellenőrzi, hogy egy időintervallum ütközik-e meglévő foglalással
   */
  private isBlockedByBooking(start: Date, end: Date): { blocked: boolean; reason?: string } {
    for (const booking of this.bookings) {
      const bookingStart = addMinutes(
        new Date(booking.start_datetime),
        -booking.buffer_minutes_before
      )
      const bookingEnd = addMinutes(
        new Date(booking.end_datetime),
        booking.buffer_minutes_after
      )

      if (areIntervalsOverlapping(
        { start, end },
        { start: bookingStart, end: bookingEnd }
      )) {
        return { blocked: true, reason: 'Foglalt' }
      }
    }
    return { blocked: false }
  }

  /**
   * Ellenőrzi, hogy egy időintervallum ebédszünetbe esik-e
   */
  private isInBreakTime(date: Date, start: Date, end: Date): boolean {
    const dayOfWeek = date.getDay()
    const hours = this.openingHours.find(oh => oh.day_of_week === dayOfWeek)

    if (!hours?.break_start || !hours?.break_end) {
      return false
    }

    const breakStart = this.parseTime(date, hours.break_start)
    const breakEnd = this.parseTime(date, hours.break_end)

    return areIntervalsOverlapping(
      { start, end },
      { start: breakStart, end: breakEnd }
    )
  }

  /**
   * Adott nap összes szabad időpontjának lekérése
   */
  getAvailableSlotsForDate(date: Date): TimeSlot[] {
    const slots: TimeSlot[] = []
    const now = new Date()

    // Nyitvatartás lekérése
    const openingHours = this.getOpeningHoursForDate(date)
    if (!openingHours) {
      return [] // Zárva van
    }

    // Időpontok generálása
    const slotDuration = this.config.slotDurationMinutes
    const buffer = this.config.bufferBetweenSlots
    let currentStart = openingHours.open

    while (currentStart < openingHours.close) {
      const slotEnd = addMinutes(currentStart, slotDuration)

      // Ha túlnyúlik a zárási időn, skip
      if (slotEnd > openingHours.close) {
        break
      }

      let available = true
      let reason: string | undefined

      // 1. Ellenőrzés: Múltbeli időpont?
      const minBookingTime = addHours(now, this.config.minAdvanceBookingHours)
      if (currentStart < minBookingTime) {
        available = false
        reason = 'Túl közeli időpont'
      }

      // 2. Ellenőrzés: Túl távoli időpont?
      const maxBookingDate = addMinutes(now, this.config.maxAdvanceBookingDays * 24 * 60)
      if (currentStart > maxBookingDate) {
        available = false
        reason = 'Túl távoli időpont'
      }

      // 3. Ellenőrzés: Ebédszünet?
      if (available && this.isInBreakTime(date, currentStart, slotEnd)) {
        available = false
        reason = 'Ebédszünet'
      }

      // 4. Ellenőrzés: Belső blokkolás?
      if (available) {
        const internalCheck = this.isBlockedByInternal(currentStart, slotEnd)
        if (internalCheck.blocked) {
          available = false
          reason = internalCheck.reason
        }
      }

      // 5. Ellenőrzés: Meglévő foglalás?
      if (available) {
        const bookingCheck = this.isBlockedByBooking(currentStart, slotEnd)
        if (bookingCheck.blocked) {
          available = false
          reason = bookingCheck.reason
        }
      }

      slots.push({
        start: new Date(currentStart),
        end: new Date(slotEnd),
        available,
        reason: available ? undefined : reason,
      })

      // Következő slot (slot + buffer)
      currentStart = addMinutes(slotEnd, buffer)
    }

    return slots
  }

  /**
   * Naptár nézet generálása (hónap)
   */
  getCalendarMonth(year: number, month: number): CalendarDay[] {
    const days: CalendarDay[] = []
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)

    let currentDate = startDate
    while (currentDate <= endDate) {
      const openingHours = this.getOpeningHoursForDate(currentDate)
      const slots = this.getAvailableSlotsForDate(currentDate)
      const availableSlots = slots.filter(s => s.available)

      days.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        dayOfWeek: currentDate.getDay(),
        isOpen: openingHours !== null,
        totalSlots: slots.length,
        availableSlots: availableSlots.length,
        isFullyBooked: openingHours !== null && availableSlots.length === 0,
        specialDate: this.specialDates.find(
          sd => sd.date === format(currentDate, 'yyyy-MM-dd')
        ),
      })

      currentDate = new Date(currentDate)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }

  /**
   * Foglalás validálása
   */
  validateBooking(start: Date, end: Date): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const date = startOfDay(start)

    // 1. Nyitvatartás ellenőrzése
    const openingHours = this.getOpeningHoursForDate(date)
    if (!openingHours) {
      errors.push('A kiválasztott napon zárva vagyunk')
      return { valid: false, errors }
    }

    // 2. Nyitvatartási időn belül van?
    if (start < openingHours.open || end > openingHours.close) {
      errors.push('A foglalás a nyitvatartási időn kívül esik')
    }

    // 3. Minimum előrefoglalás
    const now = new Date()
    const minBookingTime = addHours(now, this.config.minAdvanceBookingHours)
    if (start < minBookingTime) {
      errors.push(`Minimum ${this.config.minAdvanceBookingHours} órával előre kell foglalni`)
    }

    // 4. Maximum előrefoglalás
    const maxBookingDate = addMinutes(now, this.config.maxAdvanceBookingDays * 24 * 60)
    if (start > maxBookingDate) {
      errors.push(`Maximum ${this.config.maxAdvanceBookingDays} nappal előre lehet foglalni`)
    }

    // 5. Ebédszünet
    if (this.isInBreakTime(date, start, end)) {
      errors.push('A foglalás ebédszünetbe esik')
    }

    // 6. Belső blokkolás
    const internalCheck = this.isBlockedByInternal(start, end)
    if (internalCheck.blocked) {
      errors.push('Ez az időpont nem foglalható (belső esemény)')
    }

    // 7. Ütközés más foglalással
    const bookingCheck = this.isBlockedByBooking(start, end)
    if (bookingCheck.blocked) {
      errors.push('Ez az időpont már foglalt')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

interface CalendarDay {
  date: string
  dayOfWeek: number
  isOpen: boolean
  totalSlots: number
  availableSlots: number
  isFullyBooked: boolean
  specialDate?: SpecialDate
}
```

### 2.2 API Endpoint Példa

```typescript
// app/api/calendar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AvailabilityCalculator } from '@/lib/availability'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
  const month = parseInt(searchParams.get('month') || new Date().getMonth().toString())

  // Adatok lekérése párhuzamosan
  const [
    { data: openingHours },
    { data: specialDates },
    { data: internalBlocks },
    { data: bookings },
    { data: settings },
  ] = await Promise.all([
    supabase.from('opening_hours').select('*'),
    supabase.from('special_dates').select('*'),
    supabase.from('internal_blocks').select('*'),
    supabase.from('bookings')
      .select('start_datetime, end_datetime, buffer_minutes_before, buffer_minutes_after, status')
      .gte('start_datetime', new Date(year, month, 1).toISOString())
      .lte('start_datetime', new Date(year, month + 2, 0).toISOString()),
    supabase.from('settings').select('*').eq('key', 'booking_settings').single(),
  ])

  const calculator = new AvailabilityCalculator(
    openingHours || [],
    specialDates || [],
    internalBlocks || [],
    bookings || [],
    settings?.value
  )

  const calendar = calculator.getCalendarMonth(year, month)

  return NextResponse.json({ calendar })
}
```

### 2.3 Napi Időpontok Endpoint

```typescript
// app/api/calendar/[date]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AvailabilityCalculator } from '@/lib/availability'

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  const supabase = await createClient()
  const date = new Date(params.date)

  const [
    { data: openingHours },
    { data: specialDates },
    { data: internalBlocks },
    { data: bookings },
    { data: settings },
  ] = await Promise.all([
    supabase.from('opening_hours').select('*'),
    supabase.from('special_dates').select('*').eq('date', params.date),
    supabase.from('internal_blocks')
      .select('*')
      .lte('start_datetime', `${params.date}T23:59:59`)
      .gte('end_datetime', `${params.date}T00:00:00`),
    supabase.from('bookings')
      .select('*')
      .eq('booking_date', params.date)
      .not('status', 'in', '("cancelled","no_show")'),
    supabase.from('settings').select('*').eq('key', 'booking_settings').single(),
  ])

  const calculator = new AvailabilityCalculator(
    openingHours || [],
    specialDates || [],
    internalBlocks || [],
    bookings || [],
    settings?.value
  )

  const slots = calculator.getAvailableSlotsForDate(date)
  const openingHoursForDate = calculator.getOpeningHoursForDate(date)

  return NextResponse.json({
    date: params.date,
    isOpen: openingHoursForDate !== null,
    openingHours: openingHoursForDate ? {
      open: openingHoursForDate.open.toISOString(),
      close: openingHoursForDate.close.toISOString(),
    } : null,
    slots: slots.map(slot => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
      available: slot.available,
      reason: slot.reason,
    })),
  })
}
```

---

## 3. Admin Felület

### 3.1 Nyitvatartás Kezelés

```typescript
// app/admin/beallitasok/nyitvatartas/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const DAYS = [
  'Vasárnap', 'Hétfő', 'Kedd', 'Szerda',
  'Csütörtök', 'Péntek', 'Szombat'
]

interface OpeningHoursForm {
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean
  break_start: string | null
  break_end: string | null
}

export default function OpeningHoursAdmin() {
  const [hours, setHours] = useState<OpeningHoursForm[]>([])
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadOpeningHours()
  }, [])

  async function loadOpeningHours() {
    const { data } = await supabase
      .from('opening_hours')
      .select('*')
      .order('day_of_week')

    if (data) {
      setHours(data)
    }
  }

  async function saveOpeningHours() {
    setSaving(true)

    for (const hour of hours) {
      await supabase
        .from('opening_hours')
        .upsert(hour, { onConflict: 'day_of_week' })
    }

    setSaving(false)
  }

  function updateHour(index: number, field: string, value: any) {
    const updated = [...hours]
    updated[index] = { ...updated[index], [field]: value }
    setHours(updated)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nyitvatartás beállítások</h1>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left">Nap</th>
              <th className="px-4 py-3 text-left">Nyitás</th>
              <th className="px-4 py-3 text-left">Zárás</th>
              <th className="px-4 py-3 text-left">Szünet</th>
              <th className="px-4 py-3 text-left">Zárva?</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((hour, index) => (
              <tr key={hour.day_of_week} className="border-b">
                <td className="px-4 py-3 font-medium">
                  {DAYS[hour.day_of_week]}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={hour.open_time}
                    onChange={(e) => updateHour(index, 'open_time', e.target.value)}
                    disabled={hour.is_closed}
                    className="border rounded px-2 py-1"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={hour.close_time}
                    onChange={(e) => updateHour(index, 'close_time', e.target.value)}
                    disabled={hour.is_closed}
                    className="border rounded px-2 py-1"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={hour.break_start || ''}
                      onChange={(e) => updateHour(index, 'break_start', e.target.value || null)}
                      disabled={hour.is_closed}
                      className="border rounded px-2 py-1 w-24"
                      placeholder="Kezdet"
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={hour.break_end || ''}
                      onChange={(e) => updateHour(index, 'break_end', e.target.value || null)}
                      disabled={hour.is_closed}
                      className="border rounded px-2 py-1 w-24"
                      placeholder="Vég"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={hour.is_closed}
                    onChange={(e) => updateHour(index, 'is_closed', e.target.checked)}
                    className="w-5 h-5"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={saveOpeningHours}
        disabled={saving}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Mentés...' : 'Mentés'}
      </button>
    </div>
  )
}
```

### 3.2 Szabadnapok Kezelés

```typescript
// app/admin/beallitasok/szabadnapok/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'

interface SpecialDate {
  id: string
  date: string
  type: 'holiday' | 'closed' | 'special_hours'
  name: string | null
  open_time: string | null
  close_time: string | null
  reason: string | null
}

export default function SpecialDatesAdmin() {
  const [dates, setDates] = useState<SpecialDate[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingDate, setEditingDate] = useState<Partial<SpecialDate>>({})
  const supabase = createClient()

  useEffect(() => {
    loadSpecialDates()
  }, [])

  async function loadSpecialDates() {
    const { data } = await supabase
      .from('special_dates')
      .select('*')
      .order('date', { ascending: true })

    if (data) setDates(data)
  }

  async function saveSpecialDate() {
    if (editingDate.id) {
      await supabase
        .from('special_dates')
        .update(editingDate)
        .eq('id', editingDate.id)
    } else {
      await supabase
        .from('special_dates')
        .insert(editingDate)
    }

    setShowModal(false)
    setEditingDate({})
    loadSpecialDates()
  }

  async function deleteSpecialDate(id: string) {
    if (confirm('Biztosan törlöd?')) {
      await supabase.from('special_dates').delete().eq('id', id)
      loadSpecialDates()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Szabadnapok és speciális napok</h1>
        <button
          onClick={() => {
            setEditingDate({ type: 'holiday' })
            setShowModal(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + Új nap hozzáadása
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Dátum</th>
              <th className="px-4 py-3 text-left">Típus</th>
              <th className="px-4 py-3 text-left">Megnevezés</th>
              <th className="px-4 py-3 text-left">Nyitvatartás</th>
              <th className="px-4 py-3 text-left">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {dates.map((date) => (
              <tr key={date.id} className="border-t">
                <td className="px-4 py-3">
                  {format(new Date(date.date), 'yyyy. MMM d. (EEEE)', { locale: hu })}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-sm ${
                    date.type === 'holiday' ? 'bg-red-100 text-red-800' :
                    date.type === 'closed' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {date.type === 'holiday' ? 'Ünnepnap' :
                     date.type === 'closed' ? 'Zárva' : 'Speciális'}
                  </span>
                </td>
                <td className="px-4 py-3">{date.name || '-'}</td>
                <td className="px-4 py-3">
                  {date.type === 'special_hours'
                    ? `${date.open_time} - ${date.close_time}`
                    : 'Zárva'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      setEditingDate(date)
                      setShowModal(true)
                    }}
                    className="text-blue-600 hover:underline mr-3"
                  >
                    Szerkesztés
                  </button>
                  <button
                    onClick={() => deleteSpecialDate(date.id)}
                    className="text-red-600 hover:underline"
                  >
                    Törlés
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingDate.id ? 'Nap szerkesztése' : 'Új nap hozzáadása'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Dátum</label>
                <input
                  type="date"
                  value={editingDate.date || ''}
                  onChange={(e) => setEditingDate({...editingDate, date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Típus</label>
                <select
                  value={editingDate.type || 'holiday'}
                  onChange={(e) => setEditingDate({
                    ...editingDate,
                    type: e.target.value as any
                  })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="holiday">Ünnepnap</option>
                  <option value="closed">Rendkívüli zárva tartás</option>
                  <option value="special_hours">Speciális nyitvatartás</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Megnevezés</label>
                <input
                  type="text"
                  value={editingDate.name || ''}
                  onChange={(e) => setEditingDate({...editingDate, name: e.target.value})}
                  placeholder="pl. Karácsony"
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              {editingDate.type === 'special_hours' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nyitás</label>
                    <input
                      type="time"
                      value={editingDate.open_time || ''}
                      onChange={(e) => setEditingDate({...editingDate, open_time: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Zárás</label>
                    <input
                      type="time"
                      value={editingDate.close_time || ''}
                      onChange={(e) => setEditingDate({...editingDate, close_time: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingDate({})
                }}
                className="px-4 py-2 border rounded"
              >
                Mégse
              </button>
              <button
                onClick={saveSpecialDate}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Mentés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 3.3 Belső Foglalások Kezelés

```typescript
// app/admin/beallitasok/belso-foglalasok/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'

const BLOCK_TYPES = {
  maintenance: { label: 'Karbantartás', color: 'bg-yellow-100 text-yellow-800' },
  internal_event: { label: 'Belső esemény', color: 'bg-purple-100 text-purple-800' },
  private_booking: { label: 'Privát foglalás', color: 'bg-blue-100 text-blue-800' },
  preparation: { label: 'Előkészület', color: 'bg-gray-100 text-gray-800' },
  other: { label: 'Egyéb', color: 'bg-orange-100 text-orange-800' },
}

interface InternalBlock {
  id: string
  start_datetime: string
  end_datetime: string
  block_type: keyof typeof BLOCK_TYPES
  title: string
  description: string | null
}

export default function InternalBlocksAdmin() {
  const [blocks, setBlocks] = useState<InternalBlock[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingBlock, setEditingBlock] = useState<Partial<InternalBlock>>({})
  const supabase = createClient()

  useEffect(() => {
    loadBlocks()
  }, [])

  async function loadBlocks() {
    const { data } = await supabase
      .from('internal_blocks')
      .select('*')
      .gte('end_datetime', new Date().toISOString())
      .order('start_datetime', { ascending: true })

    if (data) setBlocks(data)
  }

  async function saveBlock() {
    if (editingBlock.id) {
      await supabase
        .from('internal_blocks')
        .update(editingBlock)
        .eq('id', editingBlock.id)
    } else {
      await supabase
        .from('internal_blocks')
        .insert(editingBlock)
    }

    setShowModal(false)
    setEditingBlock({})
    loadBlocks()
  }

  async function deleteBlock(id: string) {
    if (confirm('Biztosan törlöd ezt a blokkolást?')) {
      await supabase.from('internal_blocks').delete().eq('id', id)
      loadBlocks()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Belső foglalások és blokkolások</h1>
        <button
          onClick={() => {
            setEditingBlock({ block_type: 'internal_event' })
            setShowModal(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + Új blokkolás
        </button>
      </div>

      <div className="grid gap-4">
        {blocks.map((block) => (
          <div
            key={block.id}
            className="bg-white rounded-lg shadow p-4 flex justify-between items-start"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 rounded text-sm ${BLOCK_TYPES[block.block_type].color}`}>
                  {BLOCK_TYPES[block.block_type].label}
                </span>
                <h3 className="font-semibold">{block.title}</h3>
              </div>
              <p className="text-gray-600 text-sm">
                {format(new Date(block.start_datetime), 'yyyy. MMM d. (EEEE) HH:mm', { locale: hu })}
                {' - '}
                {format(new Date(block.end_datetime), 'HH:mm', { locale: hu })}
              </p>
              {block.description && (
                <p className="text-gray-500 text-sm mt-1">{block.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingBlock(block)
                  setShowModal(true)
                }}
                className="text-blue-600 hover:underline text-sm"
              >
                Szerkesztés
              </button>
              <button
                onClick={() => deleteBlock(block.id)}
                className="text-red-600 hover:underline text-sm"
              >
                Törlés
              </button>
            </div>
          </div>
        ))}

        {blocks.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            Nincs aktív belső foglalás vagy blokkolás.
          </p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingBlock.id ? 'Blokkolás szerkesztése' : 'Új blokkolás'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Típus</label>
                <select
                  value={editingBlock.block_type || 'internal_event'}
                  onChange={(e) => setEditingBlock({
                    ...editingBlock,
                    block_type: e.target.value as any
                  })}
                  className="w-full border rounded px-3 py-2"
                >
                  {Object.entries(BLOCK_TYPES).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Megnevezés</label>
                <input
                  type="text"
                  value={editingBlock.title || ''}
                  onChange={(e) => setEditingBlock({...editingBlock, title: e.target.value})}
                  placeholder="pl. Takarítás"
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Kezdés</label>
                <input
                  type="datetime-local"
                  value={editingBlock.start_datetime?.slice(0, 16) || ''}
                  onChange={(e) => setEditingBlock({
                    ...editingBlock,
                    start_datetime: new Date(e.target.value).toISOString()
                  })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Befejezés</label>
                <input
                  type="datetime-local"
                  value={editingBlock.end_datetime?.slice(0, 16) || ''}
                  onChange={(e) => setEditingBlock({
                    ...editingBlock,
                    end_datetime: new Date(e.target.value).toISOString()
                  })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Megjegyzés (opcionális)</label>
                <textarea
                  value={editingBlock.description || ''}
                  onChange={(e) => setEditingBlock({...editingBlock, description: e.target.value})}
                  className="w-full border rounded px-3 py-2 h-20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingBlock({})
                }}
                className="px-4 py-2 border rounded"
              >
                Mégse
              </button>
              <button
                onClick={saveBlock}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Mentés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 4. Ütközéskezelés Adatbázis Szinten

### 4.1 PostgreSQL EXCLUSION Constraint

A legbiztosabb ütközésvédelem az adatbázis szintű constraint:

```sql
-- Szükséges extension
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Ütközés megelőzés constraint
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
  EXCLUDE USING gist (
    tstzrange(
      start_datetime - (buffer_minutes_before || ' minutes')::interval,
      end_datetime + (buffer_minutes_after || ' minutes')::interval
    ) WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'no_show'));
```

### 4.2 Tranzakciós Foglalás

```typescript
// lib/booking.ts
export async function createBooking(
  supabase: SupabaseClient,
  bookingData: CreateBookingData
): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  // 1. Ellenőrzés az AvailabilityCalculator-ral
  const calculator = await createAvailabilityCalculator(supabase, bookingData.date)
  const validation = calculator.validateBooking(
    new Date(bookingData.start_datetime),
    new Date(bookingData.end_datetime)
  )

  if (!validation.valid) {
    return { success: false, error: validation.errors.join(', ') }
  }

  // 2. Foglalás mentése (a constraint megakadályozza az ütközést)
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      ...bookingData,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    // EXCLUSION constraint hiba kezelése
    if (error.code === '23P01') {
      return { success: false, error: 'Ez az időpont már foglalt' }
    }
    return { success: false, error: error.message }
  }

  return { success: true, booking: data }
}
```

---

## 5. Fontos Megfontolások

### 5.1 Időzónák

```typescript
// Mindig UTC-ben tároljuk az adatbázisban
// Frontend-en konvertáljuk a felhasználó időzónájára

import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

const TIMEZONE = 'Europe/Budapest'

// UTC → Budapest
function toLocalTime(utcDate: Date): Date {
  return toZonedTime(utcDate, TIMEZONE)
}

// Budapest → UTC (mentéskor)
function toUTC(localDate: Date): Date {
  return zonedTimeToUtc(localDate, TIMEZONE)
}
```

### 5.2 Konkurens Foglalások Kezelése

```typescript
// Optimista lock verzióval
const { data, error } = await supabase
  .from('bookings')
  .insert(bookingData)
  .select()
  .single()

// Ha sikertelen (ütközés), újratöltjük a naptárat
if (error?.code === '23P01') {
  await refreshCalendar()
  showError('Az időpont közben foglalttá vált. Kérlek válassz másikat.')
}
```

### 5.3 Buffer Idők

```typescript
// Foglalások közötti buffer (takarítás, előkészület)
const BUFFER_BEFORE = 0    // Nincs buffer előtte
const BUFFER_AFTER = 15    // 15 perc takarításra

// A buffer NEM látszik a felhasználónak, de foglalja az időt
// Pl.: 10:00-11:00 foglalás → valójában 10:00-11:15 blokkolva
```

---

## 6. Összefoglaló

| Funkció | Megoldás |
|---------|----------|
| **Nyitvatartás** | `opening_hours` tábla, napra bontva |
| **Szabadnapok** | `special_dates` tábla, ünnepnapok és zárva tartás |
| **Belső blokkolások** | `internal_blocks` tábla, admin által |
| **Ütközéskezelés** | PostgreSQL EXCLUSION constraint + app szintű validáció |
| **Buffer idők** | Foglalás mezők: `buffer_minutes_before`, `buffer_minutes_after` |
| **Elérhetőség** | `AvailabilityCalculator` osztály |

---

**Verzió**: 1.0.0
