import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { StaffWithTiers, StaffPackageWithRelations } from '@/types/database'
import { cheapestStaffPrice } from './staff-pricing'

/**
 * Beauty csapat foglalás: a csapatcsomag (több munkatárs együtt) az elsődleges,
 * a munkatársak külön-külön a másodlagos. Az óraszámot és a kezdést a csapatnál /
 * munkatársnál kell megadni – nem függ a stúdióbérlés időtartamától.
 */
export interface TeamSelection {
  packageId: string
  hours: number
  start: string // HH:MM
}

export interface StaffSelection {
  staffId: string
  hours: number
  start: string // HH:MM
}

export interface BeautySelection {
  team: TeamSelection | null
  staff: StaffSelection[]
}

export const emptyBeauty: BeautySelection = { team: null, staff: [] }

export interface BeautyLine {
  key: string
  label: string
  price: number
}

const hhmm = (t: string) => t.slice(0, 5)
const toMinutes = (t: string) => {
  const [h, m] = hhmm(t).split(':').map(Number)
  return h * 60 + m
}

/** Záró idő HH:MM formában, vagy null, ha a sáv átlóg éjfélen. */
export function beautyEnd(start: string, hours: number): string | null {
  const end = toMinutes(start) + hours * 60
  if (end > 24 * 60) return null
  return `${String(Math.floor(end / 60) % 24).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`
}

/** Választható kezdések: egész órák + a stúdió kezdési ideje (alapértelmezés). */
export function startOptions(defaultStart: string, hours: number): string[] {
  const opts = new Set<string>([hhmm(defaultStart)])
  for (let h = 7; h <= 22; h++) opts.add(`${String(h).padStart(2, '0')}:00`)
  return [...opts].filter((s) => beautyEnd(s, hours) !== null).sort()
}

/** A csapatnak csak fix áras csomagjai vannak (fél nap, egész nap, ...), óradíja nincs. */
export function teamTiers(pkg: StaffPackageWithRelations) {
  return [...pkg.staff_package_tiers].sort((a, b) => a.hours - b.hours)
}

export function teamQuote(pkg: StaffPackageWithRelations, hours: number) {
  const tier = pkg.staff_package_tiers.find((t) => t.hours === hours)
  return { total: tier?.price ?? 0, label: tier?.label ?? null }
}

export function beautyLines(
  sel: BeautySelection,
  packages: StaffPackageWithRelations[],
  staff: StaffWithTiers[]
): BeautyLine[] {
  const lines: BeautyLine[] = []
  const pkg = sel.team && packages.find((p) => p.id === sel.team!.packageId)
  if (sel.team && pkg) {
    const q = teamQuote(pkg, sel.team.hours)
    const end = beautyEnd(sel.team.start, sel.team.hours)
    lines.push({
      key: `team-${pkg.id}`,
      label: `${pkg.name} (${sel.team.hours} óra, ${sel.team.start}${end ? `–${end}` : ''}${q.label ? `, ${q.label}` : ''})`,
      price: q.total,
    })
  }
  for (const s of sel.staff) {
    const m = staff.find((x) => x.id === s.staffId)
    if (!m) continue
    const q = cheapestStaffPrice(s.hours, m.hourly_rate, m.staff_rate_tiers)
    const end = beautyEnd(s.start, s.hours)
    lines.push({
      key: `staff-${m.id}`,
      label: `${m.name} (${m.role_name}, ${s.hours} óra, ${s.start}${end ? `–${end}` : ''})`,
      price: q.total,
    })
  }
  return lines
}

export const beautyTotal = (lines: BeautyLine[]) => lines.reduce((sum, l) => sum + l.price, 0)

export class BeautyError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
  }
}

/** Foglalt-e a megadott munkatársak valamelyike az adott sávban (figyelmeztetéshez; a DB a végső védelem). */
export async function anyBusy(
  supabase: SupabaseClient<Database>,
  date: string,
  staffIds: string[],
  start: string,
  hours: number
): Promise<boolean> {
  const end = beautyEnd(start, hours)
  if (!end) return true
  const { data } = await supabase.rpc('busy_staff_on', { p_date: date, p_start: start, p_end: end })
  const busy = new Set((data || []).map((r: { staff_id: string }) => r.staff_id))
  return staffIds.some((id) => busy.has(id))
}

/**
 * Elmenti a beauty foglalást a szerver oldali RPC-kkel (az árat és az időablakot az adatbázis számolja).
 * Visszaadja a szerver által számolt összárat.
 */
export async function saveBeauty(
  supabase: SupabaseClient<Database>,
  bookingId: string,
  sel: BeautySelection
): Promise<number> {
  let total = 0
  if (sel.team) {
    const { data, error } = await supabase.rpc('book_beauty_team', {
      p_booking: bookingId,
      p_package: sel.team.packageId,
      p_hours: sel.team.hours,
      p_start: sel.team.start,
    })
    if (error) throw new BeautyError(error.message, error.code)
    total += data as number
  }
  for (const s of sel.staff) {
    const { data, error } = await supabase.rpc('book_beauty_staff', {
      p_booking: bookingId,
      p_staff: s.staffId,
      p_hours: s.hours,
      p_start: s.start,
    })
    if (error) throw new BeautyError(error.message, error.code)
    total += data as number
  }
  return total
}

export function beautyErrorMessage(err: unknown): string {
  if (err instanceof BeautyError && err.code === '23P01') {
    return 'A kiválasztott beauty szakember vagy csapat időközben foglalttá vált erre az idősávra. Válassz másik időt vagy szakembert.'
  }
  return 'Hiba történt a beauty csapat foglalása közben. Próbáld újra.'
}
