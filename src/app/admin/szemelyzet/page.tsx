'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import type { StaffWithTiers } from '@/types/database'

type Tier = { id?: string; label: string; hours: number; price: number; note: string | null }
type Draft = {
  id?: string
  name: string
  role_name: string
  bio: string
  image_url: string
  hourly_rate: number
  is_active: boolean
  sort_order: number
  tiers: Tier[]
}

const emptyDraft = (sort: number): Draft => ({
  name: '', role_name: '', bio: '', image_url: '', hourly_rate: 20000, is_active: true, sort_order: sort,
  tiers: [],
})

const inputCls =
  'w-full px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow'
const labelCls = 'block font-bugrino text-xs uppercase tracking-wider mb-1'

export default function StaffAdminPage() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    const { data } = await supabase.from('staff_members').select('*, staff_rate_tiers(*)').order('sort_order')
    const rows = (data || []) as StaffWithTiers[]
    setDrafts(
      rows.map((m) => ({
        id: m.id,
        name: m.name,
        role_name: m.role_name,
        bio: m.bio || '',
        image_url: m.image_url || '',
        hourly_rate: m.hourly_rate,
        is_active: m.is_active,
        sort_order: m.sort_order,
        tiers: [...m.staff_rate_tiers].sort((a, b) => a.hours - b.hours).map((t) => ({
          id: t.id, label: t.label, hours: t.hours, price: t.price, note: t.note,
        })),
      }))
    )
    setLoading(false)
  }

  const patch = (idx: number, p: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d, i) => (i === idx ? { ...d, ...p } : d)))

  const patchTier = (idx: number, ti: number, p: Partial<Tier>) =>
    setDrafts((ds) =>
      ds.map((d, i) => (i === idx ? { ...d, tiers: d.tiers.map((t, j) => (j === ti ? { ...t, ...p } : t)) } : d))
    )

  const save = async (idx: number) => {
    const d = drafts[idx]
    if (!d.name.trim() || !d.role_name.trim()) {
      setMessage({ type: 'error', text: 'A név és a szerepkör kötelező' })
      return
    }
    setSavingKey(d.id || `new-${idx}`)
    setMessage(null)

    const row = {
      name: d.name.trim(),
      role_name: d.role_name.trim(),
      bio: d.bio.trim() || null,
      image_url: d.image_url.trim() || null,
      hourly_rate: d.hourly_rate,
      is_active: d.is_active,
      sort_order: d.sort_order,
    }

    let staffId = d.id
    if (staffId) {
      const { error } = await supabase.from('staff_members').update(row).eq('id', staffId)
      if (error) return fail(error.message)
    } else {
      const { data, error } = await supabase.from('staff_members').insert(row).select('id').single()
      if (error || !data) return fail(error?.message || 'Mentési hiba')
      staffId = data.id
    }

    // Sávok: egyszerűen lecseréljük a teljes készletet
    const { error: delError } = await supabase.from('staff_rate_tiers').delete().eq('staff_id', staffId)
    if (delError) return fail(delError.message)
    if (d.tiers.length > 0) {
      const { error: tierError } = await supabase.from('staff_rate_tiers').insert(
        d.tiers.map((t) => ({
          staff_id: staffId!,
          label: t.label.trim() || `${t.hours} óra`,
          hours: t.hours,
          price: t.price,
          note: t.note?.trim() || null,
        }))
      )
      if (tierError) return fail(tierError.message)
    }

    setSavingKey(null)
    setMessage({ type: 'success', text: 'Mentve' })
    await load()

    function fail(text: string) {
      setSavingKey(null)
      setMessage({ type: 'error', text: `Hiba: ${text}` })
    }
  }

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 border-[3px] border-gray-200" />

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-bauhaus-heading mb-2">Beauty csapat</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[3px] bg-black" />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-yellow)' }} />
          </div>
          <p className="text-sm text-gray-500 mt-3 max-w-2xl">
            A foglalásnál az óradíj és a fix áras sávok közül mindig a vendégnek kedvezőbb ár számít.
            Egy munkatárs egy időpontban csak egy foglalásban szerepelhet. Az inaktív munkatárs nem jelenik meg a foglalásnál és az oldalon.
          </p>
        </div>
        <BauhausButton variant="primary" onClick={() => setDrafts((ds) => [...ds, emptyDraft(ds.length + 1)])}>
          + Új munkatárs
        </BauhausButton>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 border-[3px] ${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-[var(--bauhaus-red)] bg-red-50'}`}
        >
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="space-y-8">
        {drafts.map((d, idx) => (
          <BauhausCard key={d.id || `new-${idx}`} padding="lg">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                {d.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.image_url} alt={d.name} className="w-full aspect-[4/5] object-cover border-[3px] border-black" />
                )}
                <div>
                  <label className={labelCls}>Kép URL</label>
                  <input className={inputCls} value={d.image_url} onChange={(e) => patch(idx, { image_url: e.target.value })} placeholder="/team/nev.jpeg" />
                  <p className="text-xs text-gray-400 mt-1">Fájl a public/team/ mappába, vagy teljes URL.</p>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Név *</label>
                    <input className={inputCls} value={d.name} onChange={(e) => patch(idx, { name: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Szerepkör *</label>
                    <input className={inputCls} value={d.role_name} onChange={(e) => patch(idx, { role_name: e.target.value })} placeholder="Sminkes és hair stylist" />
                  </div>
                  <div>
                    <label className={labelCls}>Óradíj (bruttó Ft)</label>
                    <input type="number" min={0} className={inputCls} value={d.hourly_rate} onChange={(e) => patch(idx, { hourly_rate: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className={labelCls}>Sorrend</label>
                    <input type="number" className={inputCls} value={d.sort_order} onChange={(e) => patch(idx, { sort_order: Number(e.target.value) })} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Bemutatkozás</label>
                  <textarea rows={6} className={inputCls} value={d.bio} onChange={(e) => patch(idx, { bio: e.target.value })} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls + ' mb-0'}>Fix áras sávok</label>
                    <button
                      type="button"
                      className="font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
                      onClick={() => patch(idx, { tiers: [...d.tiers, { label: '', hours: 6, price: 0, note: null }] })}
                    >
                      + Sáv
                    </button>
                  </div>
                  {d.tiers.length === 0 && <p className="text-sm text-gray-400">Nincs sáv – csak az óradíj érvényes.</p>}
                  <div className="space-y-2">
                    {d.tiers.map((t, ti) => (
                      <div key={ti} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center">
                        <input className={inputCls + ' sm:col-span-3'} value={t.label} onChange={(e) => patchTier(idx, ti, { label: e.target.value })} placeholder="Fél nap" />
                        <input type="number" min={1} className={inputCls + ' sm:col-span-2'} value={t.hours} onChange={(e) => patchTier(idx, ti, { hours: Number(e.target.value) })} title="Órák száma" />
                        <input type="number" min={0} className={inputCls + ' sm:col-span-3'} value={t.price} onChange={(e) => patchTier(idx, ti, { price: Number(e.target.value) })} title="Fix ár (bruttó Ft)" />
                        <input className={inputCls + ' sm:col-span-3'} value={t.note || ''} onChange={(e) => patchTier(idx, ti, { note: e.target.value })} placeholder="Megjegyzés (pl. 3-4 fő részére)" />
                        <button type="button" className="text-[var(--bauhaus-red)] font-bugrino sm:col-span-1" onClick={() => patch(idx, { tiers: d.tiers.filter((_, j) => j !== ti) })} aria-label="Sáv törlése">✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={d.is_active} onChange={(e) => patch(idx, { is_active: e.target.checked })} className="w-5 h-5 accent-black" />
                    Aktív (foglalható és látható)
                  </label>
                  <BauhausButton variant="primary" disabled={savingKey === (d.id || `new-${idx}`)} onClick={() => save(idx)}>
                    {savingKey === (d.id || `new-${idx}`) ? 'Mentés…' : 'Mentés'}
                  </BauhausButton>
                </div>
              </div>
            </div>
          </BauhausCard>
        ))}
      </div>
    </div>
  )
}
