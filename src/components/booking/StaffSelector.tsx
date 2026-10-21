'use client'

import { useState } from 'react'
import type { StaffWithTiers, StaffPackageWithRelations } from '@/types/database'
import { cheapestStaffPrice } from '@/lib/booking/staff-pricing'
import {
  beautyEnd,
  startOptions,
  type BeautySelection,
  type StaffSelection,
} from '@/lib/booking/beauty'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausBadge } from '@/components/ui/bauhaus/BauhausBadge'

interface BeautySelectorProps {
  packages: StaffPackageWithRelations[]
  staff: StaffWithTiers[]
  value: BeautySelection
  onChange: (v: BeautySelection) => void
  /** A stúdióbérlés kezdése – ez az alapértelmezett kezdés (a beauty óraszám ettől független). */
  defaultStart: string
  /** Visszaadja, hogy a sáv foglalt-e (a kijelölt munkatársakra). */
  checkBusy: (staffIds: string[], start: string, hours: number) => Promise<boolean>
}

const ft = (n: number) => `${n.toLocaleString('hu-HU')} Ft`
const selectCls = 'px-3 py-2 border-[2px] border-black bg-white text-sm outline-none'

export function StaffSelector({ packages, staff, value, onChange, defaultStart, checkBusy }: BeautySelectorProps) {
  const [openBio, setOpenBio] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  // Még nem hozzáadott csapat óraszám/kezdés vázlata
  const [teamDraft, setTeamDraft] = useState<Record<string, { hours: number; start: string }>>({})

  const setTeam = async (packageId: string, hours: number, start: string) => {
    const pkg = packages.find((p) => p.id === packageId)
    if (!pkg) return
    const ids = pkg.staff_package_members.map((m) => m.staff_id)
    if (await checkBusy(ids, start, hours)) {
      setNotice('A csapat ebben az idősávban foglalt. Válassz másik kezdést vagy óraszámot.')
      return
    }
    setNotice(null)
    // A csapat foglalása kizárja a tagok külön foglalását (úgyis lefoglalja őket)
    onChange({ team: { packageId, hours, start }, staff: value.staff.filter((s) => !ids.includes(s.staffId)) })
  }

  const patchTeam = (p: Partial<{ hours: number; start: string }>) => {
    if (!value.team) return
    const hours = p.hours ?? value.team.hours
    let start = p.start ?? value.team.start
    if (!beautyEnd(start, hours)) start = startOptions(defaultStart, hours).slice(-1)[0]
    void setTeam(value.team.packageId, hours, start)
  }

  const addStaff = async (staffId: string) => {
    const sel: StaffSelection = { staffId, hours: 2, start: defaultStart.slice(0, 5) }
    if (await checkBusy([staffId], sel.start, sel.hours)) {
      setNotice('Ez a szakember a stúdió kezdési idejénél foglalt – add hozzá, és válassz másik kezdést.')
    } else {
      setNotice(null)
    }
    onChange({ ...value, staff: [...value.staff, sel] })
  }

  const patchStaff = async (staffId: string, p: Partial<StaffSelection>) => {
    const next = value.staff.map((s) => {
      if (s.staffId !== staffId) return s
      const merged = { ...s, ...p }
      if (!beautyEnd(merged.start, merged.hours)) merged.start = startOptions(defaultStart, merged.hours).slice(-1)[0]
      return merged
    })
    onChange({ ...value, staff: next })
    const cur = next.find((s) => s.staffId === staffId)!
    setNotice((await checkBusy([staffId], cur.start, cur.hours)) ? 'A kiválasztott idősávban ez a szakember foglalt.' : null)
  }

  const removeStaff = (staffId: string) => onChange({ ...value, staff: value.staff.filter((s) => s.staffId !== staffId) })

  const teamIds = new Set(
    (value.team ? packages.find((p) => p.id === value.team!.packageId)?.staff_package_members.map((m) => m.staff_id) : []) ?? []
  )

  return (
    <div className="space-y-10">
      {notice && (
        <div className="p-3 border-[3px] border-[var(--bauhaus-red)] bg-red-50 text-sm text-[var(--bauhaus-red)]">{notice}</div>
      )}

      {/* ELSŐDLEGES: csapat egyben */}
      {packages.map((pkg) => {
        const selected = value.team?.packageId === pkg.id
        const draft = teamDraft[pkg.id]
        const hours = selected ? value.team!.hours : (draft?.hours ?? pkg.allowed_hours[0])
        const start = selected ? value.team!.start : (draft?.start ?? defaultStart.slice(0, 5))
        const setDraft = (p: Partial<{ hours: number; start: string }>) => {
          const h = p.hours ?? hours
          let st = p.start ?? start
          if (!beautyEnd(st, h)) st = startOptions(defaultStart, h).slice(-1)[0]
          setTeamDraft((d) => ({ ...d, [pkg.id]: { hours: h, start: st } }))
        }
        const q = cheapestStaffPrice(hours, pkg.hourly_rate, pkg.staff_package_tiers)
        const tiers = [...pkg.staff_package_tiers].sort((a, b) => a.hours - b.hours)
        const members = staff.filter((m) => pkg.staff_package_members.some((x) => x.staff_id === m.id))
        return (
          <div
            key={pkg.id}
            className="border-[3px] border-black bg-white"
            style={{ boxShadow: selected ? '6px 6px 0 var(--bauhaus-blue)' : '4px 4px 0 var(--bauhaus-black)' }}
          >
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bugrino text-xl uppercase tracking-wider">{pkg.name}</h3>
                  {pkg.description && <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>}
                </div>
                <BauhausBadge variant="yellow">Egyben foglalva kedvezőbb</BauhausBadge>
              </div>

              <div className="flex gap-3">
                {members.map((m) => (
                  m.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={m.id} src={m.image_url} alt={m.name} title={m.name} className="w-16 h-20 object-cover border-[2px] border-black" />
                  ) : null
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <label className="text-xs font-bugrino uppercase tracking-wider">
                  Óraszám
                  <select
                    className={selectCls + ' w-full mt-1'}
                    value={hours}
                    onChange={(e) => (selected ? patchTeam({ hours: Number(e.target.value) }) : setDraft({ hours: Number(e.target.value) }))}
                  >
                    {pkg.allowed_hours.map((h) => (
                      <option key={h} value={h}>{h} óra</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bugrino uppercase tracking-wider">
                  Kezdés
                  <select
                    className={selectCls + ' w-full mt-1'}
                    value={start}
                    onChange={(e) => (selected ? patchTeam({ start: e.target.value }) : setDraft({ start: e.target.value }))}
                  >
                    {startOptions(defaultStart, hours).map((s) => (
                      <option key={s} value={s}>{s} – {beautyEnd(s, hours)}</option>
                    ))}
                  </select>
                </label>
                <div>
                  <p className="font-bugrino text-xl">{ft(q.total)}</p>
                  {q.label && <p className="text-xs text-gray-500">{q.label} ár</p>}
                </div>
              </div>

              <ul className="text-sm space-y-1 text-gray-700">
                <li>Óradíj (csapat): <strong>{ft(pkg.hourly_rate)}</strong></li>
                {tiers.map((t) => (
                  <li key={t.id}>
                    {t.label} ({t.hours} óra): <strong>{ft(t.price)}</strong>
                    {t.note && <span className="text-gray-500"> – {t.note}</span>}
                  </li>
                ))}
              </ul>

              <div className="flex justify-end">
                {selected ? (
                  <BauhausButton size="sm" onClick={() => onChange({ ...value, team: null })}>Csapat eltávolítása</BauhausButton>
                ) : (
                  <BauhausButton variant="primary" size="sm" onClick={() => setTeam(pkg.id, hours, start)}>Csapat hozzáadása</BauhausButton>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* MÁSODLAGOS: külön-külön, óradíjjal */}
      <div>
        <h3 className="font-bugrino text-lg uppercase tracking-wider mb-1">Vagy külön-külön</h3>
        <p className="text-sm text-gray-500 mb-4">
          Egy szakembert órára is foglalhatsz. Az óraszámot és a kezdést itt kell megadni – nem függ a stúdióbérlés hosszától.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {staff.map((m) => {
            const sel = value.staff.find((s) => s.staffId === m.id)
            const inTeam = teamIds.has(m.id)
            const expanded = openBio === m.id
            const hours = sel?.hours ?? 2
            const q = cheapestStaffPrice(hours, m.hourly_rate, m.staff_rate_tiers)
            return (
              <div
                key={m.id}
                className={`border-[3px] border-black bg-white flex flex-col ${inTeam ? 'opacity-50' : ''}`}
                style={{ boxShadow: sel ? '6px 6px 0 var(--bauhaus-blue)' : '4px 4px 0 var(--bauhaus-black)' }}
              >
                {m.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.image_url} alt={m.name} className="w-full aspect-[4/5] object-cover border-b-[3px] border-black" />
                )}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <h4 className="font-bugrino text-lg uppercase tracking-wider">{m.name}</h4>
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
                  <p className="text-sm">Óradíj: <strong>{ft(m.hourly_rate)}</strong></p>

                  {sel && (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs font-bugrino uppercase tracking-wider">
                        Óraszám
                        <select className={selectCls + ' w-full mt-1'} value={sel.hours} onChange={(e) => patchStaff(m.id, { hours: Number(e.target.value) })}>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                            <option key={h} value={h}>{h} óra</option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-bugrino uppercase tracking-wider">
                        Kezdés
                        <select className={selectCls + ' w-full mt-1'} value={sel.start} onChange={(e) => patchStaff(m.id, { start: e.target.value })}>
                          {startOptions(defaultStart, sel.hours).map((s) => (
                            <option key={s} value={s}>{s} – {beautyEnd(s, sel.hours)}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}

                  <div className="mt-auto pt-2 flex items-center justify-between gap-3">
                    <p className="font-bugrino text-lg">{ft(q.total)}{!sel && <span className="text-xs text-gray-500"> / {hours} óra</span>}</p>
                    {inTeam ? (
                      <BauhausBadge variant="outline">A csapatban</BauhausBadge>
                    ) : sel ? (
                      <BauhausButton size="sm" onClick={() => removeStaff(m.id)}>Eltávolítás</BauhausButton>
                    ) : (
                      <BauhausButton variant="primary" size="sm" onClick={() => addStaff(m.id)}>Hozzáadás</BauhausButton>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
