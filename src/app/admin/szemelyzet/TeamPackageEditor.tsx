'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import type { StaffMember, StaffPackageWithRelations } from '@/types/database'

type Tier = { label: string; hours: number; price: number; note: string | null }
type Draft = {
  id: string
  name: string
  description: string
  is_active: boolean
  tiers: Tier[]
  members: string[]
}

const inputCls =
  'w-full px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow'
const labelCls = 'block font-bugrino text-xs uppercase tracking-wider mb-1'

export function TeamPackageEditor() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    const [pk, st] = await Promise.all([
      supabase.from('staff_packages').select('*, staff_package_tiers(*), staff_package_members(staff_id)').order('sort_order'),
      supabase.from('staff_members').select('*').order('sort_order'),
    ])
    setStaff(st.data || [])
    setDrafts(
      ((pk.data || []) as StaffPackageWithRelations[]).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        is_active: p.is_active,
        tiers: [...p.staff_package_tiers].sort((a, b) => a.hours - b.hours).map((t) => ({
          label: t.label, hours: t.hours, price: t.price, note: t.note,
        })),
        members: p.staff_package_members.map((m) => m.staff_id),
      }))
    )
    setLoading(false)
  }

  const patch = (i: number, p: Partial<Draft>) => setDrafts((ds) => ds.map((d, k) => (k === i ? { ...d, ...p } : d)))
  const patchTier = (i: number, ti: number, p: Partial<Tier>) =>
    setDrafts((ds) => ds.map((d, k) => (k === i ? { ...d, tiers: d.tiers.map((t, j) => (j === ti ? { ...t, ...p } : t)) } : d)))

  const save = async (i: number) => {
    const d = drafts[i]
    const tierHours = d.tiers.map((t) => t.hours)
    if (!d.name.trim() || d.tiers.length === 0 || d.members.length === 0) {
      setMessage({ type: 'error', text: 'Név, legalább egy fix áras csomag és legalább egy tag kötelező' })
      return
    }
    if (new Set(tierHours).size !== tierHours.length || tierHours.some((h) => !Number.isInteger(h) || h < 1 || h > 12)) {
      setMessage({ type: 'error', text: 'Az óraszámok 1 és 12 közötti egész számok legyenek, és ne ismétlődjenek' })
      return
    }
    setSavingId(d.id)
    setMessage(null)
    const fail = (text: string) => {
      setSavingId(null)
      setMessage({ type: 'error', text: `Hiba: ${text}` })
    }

    const { error } = await supabase.from('staff_packages').update({
      name: d.name.trim(),
      description: d.description.trim() || null,
      is_active: d.is_active,
    }).eq('id', d.id)
    if (error) return fail(error.message)

    const delT = await supabase.from('staff_package_tiers').delete().eq('package_id', d.id)
    if (delT.error) return fail(delT.error.message)
    if (d.tiers.length > 0) {
      const ins = await supabase.from('staff_package_tiers').insert(
        d.tiers.map((t) => ({ package_id: d.id, label: t.label.trim() || `${t.hours} óra`, hours: t.hours, price: t.price, note: t.note?.trim() || null }))
      )
      if (ins.error) return fail(ins.error.message)
    }
    const delM = await supabase.from('staff_package_members').delete().eq('package_id', d.id)
    if (delM.error) return fail(delM.error.message)
    const insM = await supabase.from('staff_package_members').insert(d.members.map((staff_id) => ({ package_id: d.id, staff_id })))
    if (insM.error) return fail(insM.error.message)

    setSavingId(null)
    setMessage({ type: 'success', text: 'Csapatcsomag mentve' })
    await load()
  }

  if (loading) return null

  return (
    <div className="mb-12">
      <h2 className="font-bugrino text-lg uppercase tracking-wider mb-1">Csapatcsomag (egyben foglalható)</h2>
      <p className="text-sm text-gray-500 mb-4 max-w-2xl">
        A csapat (a tagok együtt) csak fix áras csomagokban foglalható, óradíja nincs. A választható óraszámok azok, amelyekhez itt van csomag (pl. 4, 6, 12 óra). A csomag ára a számlán egy sor, a tagok között egyenlően oszlik el. A tagok külön, óradíjjal lent foglalhatók.
      </p>
      {message && (
        <div className={`mb-4 p-3 border-[3px] ${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-[var(--bauhaus-red)] bg-red-50'}`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}
      {drafts.map((d, i) => (
        <BauhausCard key={d.id} padding="lg" accentColor="yellow" hasCornerAccent accentPosition="top-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Név</label>
              <input className={inputCls} value={d.name} onChange={(e) => patch(i, { name: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Leírás</label>
              <input className={inputCls} value={d.description} onChange={(e) => patch(i, { description: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Tagok</label>
              <div className="flex flex-wrap gap-3 pt-2">
                {staff.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-black"
                      checked={d.members.includes(m.id)}
                      onChange={(e) => patch(i, { members: e.target.checked ? [...d.members, m.id] : d.members.filter((x) => x !== m.id) })}
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls + ' mb-0'}>Csapat csomagok (fix ár, a csapatra együtt)</label>
              <button type="button" className="font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
                onClick={() => patch(i, { tiers: [...d.tiers, { label: '', hours: 6, price: 0, note: null }] })}>
                + Sáv
              </button>
            </div>
            <div className="space-y-2">
              {d.tiers.map((t, ti) => (
                <div key={ti} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center">
                  <input className={inputCls + ' sm:col-span-3'} value={t.label} onChange={(e) => patchTier(i, ti, { label: e.target.value })} placeholder="Fél nap" />
                  <input type="number" min={1} className={inputCls + ' sm:col-span-2'} value={t.hours} onChange={(e) => patchTier(i, ti, { hours: Number(e.target.value) })} title="Órák száma" />
                  <input type="number" min={0} className={inputCls + ' sm:col-span-3'} value={t.price} onChange={(e) => patchTier(i, ti, { price: Number(e.target.value) })} title="Fix ár (bruttó Ft)" />
                  <input className={inputCls + ' sm:col-span-3'} value={t.note || ''} onChange={(e) => patchTier(i, ti, { note: e.target.value })} placeholder="Megjegyzés" />
                  <button type="button" className="text-[var(--bauhaus-red)] font-bugrino sm:col-span-1" aria-label="Sáv törlése"
                    onClick={() => patch(i, { tiers: d.tiers.filter((_, j) => j !== ti) })}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={d.is_active} onChange={(e) => patch(i, { is_active: e.target.checked })} className="w-5 h-5 accent-black" />
              Aktív (foglalható és látható)
            </label>
            <BauhausButton variant="primary" disabled={savingId === d.id} onClick={() => save(i)}>
              {savingId === d.id ? 'Mentés…' : 'Mentés'}
            </BauhausButton>
          </div>
        </BauhausCard>
      ))}
    </div>
  )
}
