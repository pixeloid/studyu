'use client'

import { useState } from 'react'
import type { StaffWithTiers } from '@/types/database'
import { cheapestStaffPrice } from '@/lib/booking/staff-pricing'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausBadge } from '@/components/ui/bauhaus/BauhausBadge'

interface StaffSelectorProps {
  staff: StaffWithTiers[]
  busyIds: Set<string>
  selectedIds: string[]
  onChange: (ids: string[]) => void
  hours: number
}

const ft = (n: number) => `${n.toLocaleString('hu-HU')} Ft`

export function StaffSelector({ staff, busyIds, selectedIds, onChange, hours }: StaffSelectorProps) {
  const [openBio, setOpenBio] = useState<string | null>(null)

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {staff.map((m) => {
        const busy = busyIds.has(m.id)
        const selected = selectedIds.includes(m.id)
        const tiers = [...m.staff_rate_tiers].sort((a, b) => a.hours - b.hours)
        const quote = cheapestStaffPrice(hours, m.hourly_rate, tiers)
        const expanded = openBio === m.id

        return (
          <div
            key={m.id}
            className={`border-[3px] border-black bg-white flex flex-col ${busy ? 'opacity-60' : ''}`}
            style={{ boxShadow: selected ? '6px 6px 0 var(--bauhaus-blue)' : '4px 4px 0 var(--bauhaus-black)' }}
          >
            {m.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.image_url} alt={m.name} className="w-full aspect-[4/5] object-cover border-b-[3px] border-black" />
            )}
            <div className="p-4 flex flex-col gap-3 flex-1">
              <div>
                <h3 className="font-bugrino text-lg uppercase tracking-wider">{m.name}</h3>
                <p className="text-sm text-gray-600">{m.role_name}</p>
              </div>

              {m.bio && (
                <div>
                  <p className={`text-sm text-gray-700 ${expanded ? '' : 'line-clamp-3'}`}>{m.bio}</p>
                  <button
                    type="button"
                    onClick={() => setOpenBio(expanded ? null : m.id)}
                    className="mt-1 font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
                  >
                    {expanded ? 'Kevesebb' : 'Bővebben'}
                  </button>
                </div>
              )}

              <ul className="text-sm space-y-1">
                <li>Óradíj: <strong>{ft(m.hourly_rate)}</strong></li>
                {tiers.map((t) => (
                  <li key={t.id}>
                    {t.label} ({t.hours} óra): <strong>{ft(t.price)}</strong>
                    {t.note && <span className="text-gray-500"> – {t.note}</span>}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500">A foglalásod ({hours} óra)</p>
                  <p className="font-bugrino text-lg">{ft(quote.total)}</p>
                  {quote.label && <p className="text-xs text-gray-500">{quote.label} ár alkalmazva</p>}
                </div>
                {busy ? (
                  <BauhausBadge variant="red">Foglalt</BauhausBadge>
                ) : (
                  <BauhausButton variant={selected ? 'default' : 'primary'} size="sm" onClick={() => toggle(m.id)}>
                    {selected ? 'Eltávolítás' : 'Hozzáadás'}
                  </BauhausButton>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
