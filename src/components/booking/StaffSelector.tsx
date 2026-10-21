'use client'

import { useState } from 'react'
import type { StaffWithTiers, StaffPackageWithRelations } from '@/types/database'
import { cheapestStaffPrice } from '@/lib/booking/staff-pricing'
import {
  beautyEnd,
  startOptions,
  teamTiers,
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
const HOUR_CHOICES = Array.from({ length: 12 }, (_, i) => i + 1)

function Chip({ active, onClick, children, disabled }: { active: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-w-[44px] min-h-[44px] px-3 border-[3px] border-black font-bugrino text-sm ${
        active ? 'bg-[var(--bauhaus-blue)] text-white' : 'bg-white text-black hover:bg-[var(--bauhaus-yellow)]'
      } disabled:opacity-40`}
      style={active ? { boxShadow: '3px 3px 0 var(--bauhaus-black)' } : undefined}
    >
      {children}
    </button>
  )
}

export function StaffSelector({ packages, staff, value, onChange, defaultStart, checkBusy }: BeautySelectorProps) {
  const [openBio, setOpenBio] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  // Még nem hozzáadott választások vázlata (óraszám + kezdés)
  const [teamDraft, setTeamDraft] = useState<Record<string, { hours: number; start: string }>>({})
  const [staffDraft, setStaffDraft] = useState<Record<string, { hours: number; start: string }>>({})

  const defStart = defaultStart.slice(0, 5)
  const fitStart = (start: string, hours: number) =>
    beautyEnd(start, hours) ? start : startOptions(defaultStart, hours).slice(-1)[0]

  // ---------- Csapat egyben ----------
  const commitTeam = async (packageId: string, hours: number, start: string) => {
    const pkg = packages.find((p) => p.id === packageId)
    if (!pkg) return
    const ids = pkg.staff_package_members.map((m) => m.staff_id)
    if (await checkBusy(ids, start, hours)) {
      setNotice('Bence és Barbara ebben az idősávban nem érhető el együtt. Válassz másik kezdést vagy óraszámot.')
      return
    }
    setNotice(null)
    // Ha a csapatot foglalja, külön a tagokat nem kell (és nem lehet) még egyszer
    onChange({ team: { packageId, hours, start }, staff: value.staff.filter((s) => !ids.includes(s.staffId)) })
  }

  // ---------- Külön-külön ----------
  const addStaff = async (staffId: string, hours: number, start: string) => {
    if (await checkBusy([staffId], start, hours)) {
      setNotice('Ebben az idősávban ő nem érhető el. Válassz másik kezdést vagy óraszámot.')
      return
    }
    setNotice(null)
    onChange({ ...value, staff: [...value.staff, { staffId, hours, start }] })
  }

  const patchStaff = async (staffId: string, p: Partial<StaffSelection>) => {
    const cur = value.staff.find((s) => s.staffId === staffId)
    if (!cur) return
    const merged = { ...cur, ...p }
    merged.start = fitStart(merged.start, merged.hours)
    onChange({ ...value, staff: value.staff.map((s) => (s.staffId === staffId ? merged : s)) })
    setNotice((await checkBusy([staffId], merged.start, merged.hours)) ? 'Ebben az idősávban ő nem érhető el.' : null)
  }

  const teamIds = new Set(
    (value.team ? packages.find((p) => p.id === value.team!.packageId)?.staff_package_members.map((m) => m.staff_id) : []) ?? []
  )

  return (
    <div className="space-y-10">
      {notice && (
        <div className="p-3 border-[3px] border-[var(--bauhaus-red)] bg-red-50 text-sm text-[var(--bauhaus-red)]">{notice}</div>
      )}

      {/* ELSŐDLEGES: a csapat együtt */}
      {packages.map((pkg) => {
        const members = staff.filter((m) => pkg.staff_package_members.some((x) => x.staff_id === m.id))
        const tiers = teamTiers(pkg)
        if (tiers.length === 0) return null
        const selected = value.team?.packageId === pkg.id
        const draft = teamDraft[pkg.id]
        const hours = selected ? value.team!.hours : (draft?.hours ?? tiers[0].hours)
        const start = selected ? value.team!.start : (draft?.start ?? defStart)
        const tier = tiers.find((t) => t.hours === hours) ?? tiers[0]

        const pickHours = (h: number) => {
          const st = fitStart(start, h)
          if (selected) void commitTeam(pkg.id, h, st)
          else setTeamDraft((d) => ({ ...d, [pkg.id]: { hours: h, start: st } }))
        }
        const pickStart = (st: string) => {
          if (selected) void commitTeam(pkg.id, hours, st)
          else setTeamDraft((d) => ({ ...d, [pkg.id]: { hours, start: st } }))
        }

        return (
          <div
            key={pkg.id}
            className="border-[3px] border-black bg-white"
            style={{ boxShadow: selected ? '6px 6px 0 var(--bauhaus-blue)' : '4px 4px 0 var(--bauhaus-black)' }}
          >
            <div className="p-5 sm:p-6 space-y-5">
              <div>
                <h3 className="font-bugrino text-xl uppercase tracking-wider">Bence és Barbara együtt</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {members.map((m) => m.name).join(' és ')} – sminkes és hair stylist a fotózásodon, hosszabb időtartamra.
                </p>
              </div>

              <div className="flex gap-4">
                {members.map((m) => (
                  <div key={m.id} className="w-24 sm:w-28">
                    {m.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.image_url} alt={m.name} className="w-full aspect-[4/5] object-cover border-[3px] border-black" />
                    )}
                    <p className="text-sm font-medium mt-1 leading-tight">{m.name}</p>
                    <p className="text-xs text-gray-500 leading-tight">{m.role_name}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="font-bugrino text-xs uppercase tracking-wider mb-2">Mennyi időre?</p>
                <div className="flex flex-wrap gap-3">
                  {tiers.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => pickHours(t.hours)}
                      className={`text-left px-4 py-3 border-[3px] border-black min-h-[44px] ${
                        hours === t.hours ? 'bg-[var(--bauhaus-blue)] text-white' : 'bg-white hover:bg-[var(--bauhaus-yellow)]'
                      }`}
                      style={hours === t.hours ? { boxShadow: '3px 3px 0 var(--bauhaus-black)' } : undefined}
                    >
                      <span className="block font-bugrino text-sm uppercase tracking-wider">{t.label} · {t.hours} óra</span>
                      <span className="block text-lg font-bugrino">{ft(t.price)}</span>
                      {t.note && <span className="block text-xs opacity-80">{t.note}</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-4">
                <label className="text-xs font-bugrino uppercase tracking-wider">
                  Kezdés
                  <select className={selectCls + ' block mt-1'} value={start} onChange={(e) => pickStart(e.target.value)}>
                    {startOptions(defaultStart, hours).map((s) => (
                      <option key={s} value={s}>{s} – {beautyEnd(s, hours)}</option>
                    ))}
                  </select>
                </label>
                {selected ? (
                  <BauhausButton size="sm" onClick={() => onChange({ ...value, team: null })}>Eltávolítás</BauhausButton>
                ) : (
                  <BauhausButton variant="primary" onClick={() => commitTeam(pkg.id, hours, start)}>
                    Mindkettőjüket kérem · {ft(tier.price)}
                  </BauhausButton>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* MÁSODLAGOS: külön-külön, óradíjjal – az óraszámot itt kell megadni */}
      <div>
        <h3 className="font-bugrino text-lg uppercase tracking-wider mb-1">Vagy külön-külön</h3>
        <p className="text-sm text-gray-500 mb-4">
          Válaszd ki, hány órára kéred őket – ez független a stúdióbérlés hosszától.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {staff.map((m) => {
            const sel = value.staff.find((s) => s.staffId === m.id)
            const inTeam = teamIds.has(m.id)
            const draft = staffDraft[m.id]
            const hours = sel?.hours ?? draft?.hours ?? 2
            const start = sel?.start ?? draft?.start ?? defStart
            const expanded = openBio === m.id
            const q = cheapestStaffPrice(hours, m.hourly_rate, m.staff_rate_tiers)

            const pickHours = (h: number) => {
              if (sel) void patchStaff(m.id, { hours: h })
              else setStaffDraft((d) => ({ ...d, [m.id]: { hours: h, start: fitStart(start, h) } }))
            }
            const pickStart = (st: string) => {
              if (sel) void patchStaff(m.id, { start: st })
              else setStaffDraft((d) => ({ ...d, [m.id]: { hours, start: st } }))
            }

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

                  {inTeam ? (
                    <BauhausBadge variant="outline">A csapatban már foglalva</BauhausBadge>
                  ) : (
                    <>
                      <div>
                        <p className="font-bugrino text-xs uppercase tracking-wider mb-2">Hány órára? ({ft(m.hourly_rate)} / óra)</p>
                        <div className="flex flex-wrap gap-2">
                          {HOUR_CHOICES.map((h) => (
                            <Chip key={h} active={hours === h} onClick={() => pickHours(h)}>{h}</Chip>
                          ))}
                        </div>
                      </div>
                      <label className="text-xs font-bugrino uppercase tracking-wider">
                        Kezdés
                        <select className={selectCls + ' w-full mt-1'} value={start} onChange={(e) => pickStart(e.target.value)}>
                          {startOptions(defaultStart, hours).map((s) => (
                            <option key={s} value={s}>{s} – {beautyEnd(s, hours)}</option>
                          ))}
                        </select>
                      </label>
                      <div className="mt-auto pt-2 flex items-center justify-between gap-3">
                        <p className="font-bugrino text-lg">{ft(q.total)}</p>
                        {sel ? (
                          <BauhausButton size="sm" onClick={() => onChange({ ...value, staff: value.staff.filter((s) => s.staffId !== m.id) })}>
                            Eltávolítás
                          </BauhausButton>
                        ) : (
                          <BauhausButton variant="primary" size="sm" onClick={() => addStaff(m.id, hours, start)}>
                            Hozzáadás
                          </BauhausButton>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
