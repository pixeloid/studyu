'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausBadge } from '@/components/ui/bauhaus/BauhausBadge'

interface Coupon {
  id: string
  code: string
  discount_percent: number
  description: string | null
  is_active: boolean | null
  valid_from: string | null
  valid_until: string | null
  max_uses: number | null
  current_uses: number | null
  created_at: string | null
}

const DISCOUNT_OPTIONS = [10, 20, 30, 50]

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    discount_percent: 10,
    description: '',
    is_active: true,
    valid_from: '',
    valid_until: '',
    max_uses: '',
  })
  const supabase = createClient()

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setCoupons(data)
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discount_percent: 10,
      description: '',
      is_active: true,
      valid_from: '',
      valid_until: '',
      max_uses: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      discount_percent: coupon.discount_percent,
      description: coupon.description || '',
      is_active: coupon.is_active ?? true,
      valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      max_uses: coupon.max_uses?.toString() || '',
    })
    setEditingId(coupon.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const couponData = {
      code: formData.code.toUpperCase(),
      discount_percent: formData.discount_percent,
      description: formData.description || null,
      is_active: formData.is_active,
      valid_from: formData.valid_from || null,
      valid_until: formData.valid_until || null,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
    }

    if (editingId) {
      await supabase
        .from('coupons')
        .update(couponData)
        .eq('id', editingId)
    } else {
      await supabase
        .from('coupons')
        .insert(couponData)
    }

    await loadCoupons()
    resetForm()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Biztosan törölni szeretné ezt a kupont?')) return

    await supabase
      .from('coupons')
      .delete()
      .eq('id', id)

    await loadCoupons()
  }

  const toggleActive = async (coupon: Coupon) => {
    await supabase
      .from('coupons')
      .update({ is_active: !coupon.is_active })
      .eq('id', coupon.id)

    await loadCoupons()
  }

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code })
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 w-48 bg-gray-200 mb-8" />
        <div className="h-96 bg-gray-100 border-[3px] border-gray-200" />
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-bauhaus-heading mb-2">Kuponkódok</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[3px] bg-black" />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-yellow)' }} />
          </div>
        </div>
        {!showForm && (
          <BauhausButton onClick={() => setShowForm(true)} variant="primary">
            + Új kupon
          </BauhausButton>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <BauhausCard className="mb-8" padding="lg" accentColor="yellow" hasCornerAccent accentPosition="top-left">
          <h2 className="font-bugrino text-lg uppercase tracking-wider mb-6">
            {editingId ? 'Kupon szerkesztése' : 'Új kupon létrehozása'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Code */}
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Kuponkód
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="NYITAS2024"
                  className="flex-1 px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow font-mono uppercase"
                  required
                />
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="px-4 py-3 border-[3px] border-black bg-gray-100 font-bugrino text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors"
                >
                  Generálás
                </button>
              </div>
            </div>

            {/* Discount */}
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Kedvezmény mértéke
              </label>
              <div className="flex gap-3 flex-wrap">
                {DISCOUNT_OPTIONS.map((discount) => (
                  <button
                    key={discount}
                    type="button"
                    onClick={() => setFormData({ ...formData, discount_percent: discount })}
                    className={`px-6 py-3 border-[3px] font-bugrino text-lg transition-all ${
                      formData.discount_percent === discount
                        ? 'border-black bg-[var(--bauhaus-yellow)] shadow-[4px_4px_0_var(--bauhaus-black)]'
                        : 'border-gray-300 bg-white hover:border-black'
                    }`}
                  >
                    {discount}%
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
                  className="w-24 px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow text-center font-bugrino text-lg"
                />
                <span className="self-center font-bugrino text-lg">%</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Leírás (opcionális)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Pl: Nyitási akció, VIP kedvezmény stb."
                className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>

            {/* Validity period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                  Érvényesség kezdete (opcionális)
                </label>
                <input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                  Érvényesség vége (opcionális)
                </label>
                <input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
                />
              </div>
            </div>

            {/* Max uses */}
            <div>
              <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
                Maximum felhasználások (opcionális)
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_uses}
                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                placeholder="Korlátlan ha üres"
                className="w-full max-w-xs px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
              <p className="mt-2 text-sm text-gray-500">
                Ha üresen hagyja, a kupon korlátlanul felhasználható
              </p>
            </div>

            {/* Active toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="sr-only"
                  />
                  <div
                    className={`w-6 h-6 border-[3px] border-black transition-colors ${
                      formData.is_active ? 'bg-[var(--bauhaus-yellow)]' : 'bg-white'
                    }`}
                  >
                    {formData.is_active && (
                      <svg className="w-4 h-4 text-black absolute top-0.5 left-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="font-bugrino text-sm uppercase tracking-wider">
                  Aktív kupon
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t-[3px] border-gray-200">
              <BauhausButton type="button" onClick={resetForm} variant="default">
                Mégsem
              </BauhausButton>
              <BauhausButton type="submit" disabled={saving} variant="primary">
                {saving ? 'Mentés...' : (editingId ? 'Mentés' : 'Létrehozás')}
              </BauhausButton>
            </div>
          </form>
        </BauhausCard>
      )}

      {/* Coupons list */}
      {coupons.length === 0 ? (
        <BauhausCard className="text-center py-12">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full border-[3px] border-gray-300 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
          >
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
          </div>
          <p className="font-bugrino text-sm uppercase tracking-wider text-gray-500 mb-4">
            Még nincsenek kuponok
          </p>
          <BauhausButton onClick={() => setShowForm(true)} variant="primary">
            Első kupon létrehozása
          </BauhausButton>
        </BauhausCard>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => {
            const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date()
            const isNotYetValid = coupon.valid_from && new Date(coupon.valid_from) > new Date()
            const isMaxedOut = coupon.max_uses !== null && (coupon.current_uses ?? 0) >= coupon.max_uses

            return (
              <BauhausCard
                key={coupon.id}
                padding="md"
                className={`${!coupon.is_active || isExpired || isMaxedOut ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Discount badge */}
                    <div
                      className="w-16 h-16 rounded-full border-[3px] border-black flex items-center justify-center font-bugrino text-xl font-bold"
                      style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
                    >
                      -{coupon.discount_percent}%
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xl font-bold tracking-wider">{coupon.code}</span>
                        {!coupon.is_active && (
                          <BauhausBadge variant="outline">Inaktív</BauhausBadge>
                        )}
                        {coupon.is_active && isExpired && (
                          <BauhausBadge variant="red">Lejárt</BauhausBadge>
                        )}
                        {coupon.is_active && isNotYetValid && (
                          <BauhausBadge variant="yellow">Még nem érvényes</BauhausBadge>
                        )}
                        {coupon.is_active && isMaxedOut && (
                          <BauhausBadge variant="red">Elfogyott</BauhausBadge>
                        )}
                        {coupon.is_active && !isExpired && !isNotYetValid && !isMaxedOut && (
                          <BauhausBadge variant="blue">Aktív</BauhausBadge>
                        )}
                      </div>
                      {coupon.description && (
                        <p className="text-gray-500 text-sm mt-1">{coupon.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        {coupon.valid_from && (
                          <span>
                            Kezdet: {format(new Date(coupon.valid_from), 'yyyy. MMM d.', { locale: hu })}
                          </span>
                        )}
                        {coupon.valid_until && (
                          <span>
                            Lejár: {format(new Date(coupon.valid_until), 'yyyy. MMM d.', { locale: hu })}
                          </span>
                        )}
                        <span>
                          Felhasználva: {coupon.current_uses}
                          {coupon.max_uses !== null ? ` / ${coupon.max_uses}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(coupon)}
                      className={`px-4 py-2 border-[2px] font-bugrino text-xs uppercase tracking-wider transition-colors ${
                        coupon.is_active
                          ? 'border-gray-300 text-gray-500 hover:border-black hover:text-black'
                          : 'border-green-500 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {coupon.is_active ? 'Inaktiválás' : 'Aktiválás'}
                    </button>
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="px-4 py-2 border-[2px] border-[var(--bauhaus-blue)] text-[var(--bauhaus-blue)] font-bugrino text-xs uppercase tracking-wider hover:bg-blue-50 transition-colors"
                    >
                      Szerkesztés
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="px-4 py-2 border-[2px] border-[var(--bauhaus-red)] text-[var(--bauhaus-red)] font-bugrino text-xs uppercase tracking-wider hover:bg-red-50 transition-colors"
                    >
                      Törlés
                    </button>
                  </div>
                </div>
              </BauhausCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
