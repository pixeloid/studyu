interface BookingStaffRow {
  staff_name: string
  role_name: string
  hours: number
  tier_label: string | null
  total_price: number
  is_active: boolean
}

/** Számlasorok a foglaláshoz rendelt munkatársakból (bruttó → nettó 27% ÁFA). */
export function staffInvoiceItems(rows: BookingStaffRow[] | null | undefined) {
  return (rows || [])
    .filter((r) => r.is_active)
    .map((r) => ({
      name: `${r.role_name} - ${r.staff_name}, ${r.hours} óra${r.tier_label ? ` (${r.tier_label})` : ''}`,
      quantity: 1,
      unit: 'db',
      unitPriceNet: Math.round(r.total_price / 1.27),
      vatRate: '27',
    }))
}

export const STAFF_SELECT = 'booking_staff (staff_name, role_name, hours, tier_label, total_price, is_active)'
