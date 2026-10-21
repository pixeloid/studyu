interface BookingStaffRow {
  staff_name: string
  role_name: string
  hours: number
  tier_label: string | null
  total_price: number
  is_active: boolean
  package_id?: string | null
  package_name?: string | null
}

export const STAFF_SELECT =
  'booking_staff (id, staff_name, role_name, hours, tier_label, total_price, is_active, package_id, package_name)'

/** Megjelenítési sorok: a csapatcsomag tagjai egy sorba vonva, az egyéni foglalások külön sorok. */
export function groupBookingStaff<T extends BookingStaffRow>(rows: T[] | null | undefined) {
  const active = (rows || []).filter((r) => r.is_active)
  const lines: { key: string; label: string; detail: string; hours: number; price: number }[] = []
  const packages = new Map<string, T[]>()

  for (const r of active) {
    if (r.package_id) {
      packages.set(r.package_id, [...(packages.get(r.package_id) || []), r])
    } else {
      lines.push({
        key: r.staff_name,
        label: `${r.role_name} - ${r.staff_name}`,
        detail: r.role_name,
        hours: r.hours,
        price: r.total_price,
      })
    }
  }
  for (const [id, members] of packages) {
    lines.unshift({
      key: id,
      label: `${members[0].package_name || 'Beauty csapat'} - ${members.map((m) => m.staff_name).join(' + ')}`,
      detail: members.map((m) => m.staff_name).join(' + '),
      hours: members[0].hours,
      price: members.reduce((sum, m) => sum + m.total_price, 0),
    })
  }
  return lines
}

/** Számlasorok a foglaláshoz rendelt munkatársakból / csapatból (bruttó → nettó 27% ÁFA). */
export function staffInvoiceItems(rows: BookingStaffRow[] | null | undefined) {
  const tierByKey = new Map<string, string | null>()
  for (const r of rows || []) tierByKey.set(r.package_id || r.staff_name, r.tier_label)
  return groupBookingStaff(rows).map((l) => {
    const tier = tierByKey.get(l.key)
    return {
      name: `${l.label}, ${l.hours} óra${tier ? ` (${tier})` : ''}`,
      quantity: 1,
      unit: 'db',
      unitPriceNet: Math.round(l.price / 1.27),
      vatRate: '27',
    }
  })
}
