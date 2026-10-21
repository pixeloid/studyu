/**
 * Munkatárs (beauty csapat) árazása: az óradíj és a fix áras sávak (fél nap, egész nap)
 * legolcsóbb kombinációja. A `staff_price` SQL függvény tükörképe – a foglalás
 * tényleges árát az adatbázis trigger számolja, ez csak a kijelzéshez kell.
 */
export interface StaffTier {
  label: string
  hours: number
  price: number
}

export function cheapestStaffPrice(
  hours: number,
  hourlyRate: number,
  tiers: StaffTier[] = []
): { total: number; label: string | null } {
  const best: number[] = [0]
  const labels: string[] = ['']
  for (let h = 1; h <= hours; h++) {
    best[h] = h * hourlyRate
    labels[h] = ''
    for (const t of tiers) {
      const prev = Math.max(h - t.hours, 0)
      const cand = t.price + best[prev]
      if (cand < best[h]) {
        best[h] = cand
        labels[h] = t.label + (labels[prev] ? ` + ${labels[prev]}` : '')
      }
    }
  }
  return { total: best[hours], label: labels[hours] || null }
}

/** Foglalás időtartama órában (a DB trigger is felfelé kerekít). */
export function bookingHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.ceil((eh * 60 + em - (sh * 60 + sm)) / 60)
}
