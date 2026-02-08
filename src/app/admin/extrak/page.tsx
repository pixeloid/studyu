'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'

interface Extra {
  id: string
  name: string
  description: string | null
  price: number
  price_type: string
  is_active: boolean | null
  sort_order: number | null
}

const priceTypes = [
  { value: 'fixed', label: 'Fix ár' },
  { value: 'per_hour', label: 'Óránként' },
  { value: 'per_person', label: 'Személyenként' },
]

export default function ExtrasPage() {
  const [extras, setExtras] = useState<Extra[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newExtra, setNewExtra] = useState<Partial<Extra> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadExtras()
  }, [])

  const loadExtras = async () => {
    const { data } = await supabase
      .from('extras')
      .select('*')
      .order('sort_order')

    if (data) {
      setExtras(data)
    }
    setLoading(false)
  }

  const updateExtra = async (extra: Extra) => {
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('extras')
      .update({
        name: extra.name,
        description: extra.description,
        price: extra.price,
        price_type: extra.price_type,
        is_active: extra.is_active,
        sort_order: extra.sort_order,
      })
      .eq('id', extra.id)

    if (error) {
      setMessage({ type: 'error', text: 'Hiba történt a mentés során' })
    } else {
      setMessage({ type: 'success', text: 'Extra sikeresen mentve!' })
      setEditingId(null)
    }
    setSaving(false)
  }

  const createExtra = async () => {
    if (!newExtra?.name || !newExtra?.price) {
      setMessage({ type: 'error', text: 'Kérjük töltse ki a kötelező mezőket' })
      return
    }

    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('extras')
      .insert({
        name: newExtra.name,
        description: newExtra.description || null,
        price: newExtra.price,
        price_type: newExtra.price_type || 'fixed',
        is_active: true,
        sort_order: extras.length,
      })

    if (error) {
      setMessage({ type: 'error', text: 'Hiba történt a létrehozás során' })
    } else {
      setMessage({ type: 'success', text: 'Extra sikeresen létrehozva!' })
      setNewExtra(null)
      loadExtras()
    }
    setSaving(false)
  }

  const deleteExtra = async (id: string) => {
    if (!confirm('Biztosan törli ezt az extrát?')) return

    const { error } = await supabase
      .from('extras')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage({ type: 'error', text: 'Hiba történt a törlés során' })
    } else {
      setMessage({ type: 'success', text: 'Extra törölve' })
      loadExtras()
    }
  }

  const handleChange = (id: string, field: keyof Extra, value: string | number | boolean | null) => {
    setExtras(prev =>
      prev.map(e => (e.id === id ? { ...e, [field]: value } : e))
    )
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
          <h1 className="text-bauhaus-heading mb-2">Kiegészítő szolgáltatások</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[3px] bg-black" />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-yellow)' }} />
          </div>
        </div>
        <BauhausButton
          onClick={() => setNewExtra({ name: '', description: '', price: 0, price_type: 'fixed' })}
          variant="primary"
        >
          + Új extra
        </BauhausButton>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 border-[3px] ${
            message.type === 'success'
              ? 'border-green-500 bg-green-50'
              : 'border-[var(--bauhaus-red)] bg-red-50'
          }`}
          style={{
            boxShadow: message.type === 'success'
              ? '4px 4px 0 #22c55e'
              : '4px 4px 0 var(--bauhaus-red)'
          }}
        >
          <p className={`text-sm font-medium ${
            message.type === 'success' ? 'text-green-700' : 'text-[var(--bauhaus-red)]'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      <BauhausCard padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead style={{ backgroundColor: 'var(--bauhaus-yellow)' }}>
              <tr className="border-b-[3px] border-black">
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Név
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Leírás
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Ár
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Típus
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Aktív
                </th>
                <th className="px-6 py-4 text-right font-bugrino text-xs uppercase tracking-wider">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody>
              {newExtra && (
                <tr className="border-b-[2px] border-black" style={{ backgroundColor: 'rgba(245, 166, 35, 0.1)' }}>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={newExtra.name || ''}
                      onChange={(e) => setNewExtra({ ...newExtra, name: e.target.value })}
                      placeholder="Extra neve"
                      className="w-full px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={newExtra.description || ''}
                      onChange={(e) => setNewExtra({ ...newExtra, description: e.target.value })}
                      placeholder="Leírás (opcionális)"
                      className="w-full px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={newExtra.price || ''}
                      onChange={(e) => setNewExtra({ ...newExtra, price: parseInt(e.target.value) })}
                      placeholder="Ár"
                      className="w-28 px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={newExtra.price_type || 'fixed'}
                      onChange={(e) => setNewExtra({ ...newExtra, price_type: e.target.value })}
                      className="px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    >
                      {priceTypes.map((pt) => (
                        <option key={pt.value} value={pt.value}>
                          {pt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">-</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={createExtra}
                      disabled={saving}
                      className="font-bugrino text-xs uppercase tracking-wider text-green-600 hover:underline"
                    >
                      Mentés
                    </button>
                    <button
                      onClick={() => setNewExtra(null)}
                      className="font-bugrino text-xs uppercase tracking-wider text-gray-600 hover:underline"
                    >
                      Mégse
                    </button>
                  </td>
                </tr>
              )}
              {extras.map((extra, index) => (
                <tr
                  key={extra.id}
                  className={`border-b-[2px] border-gray-200 ${
                    !(extra.is_active ?? true) ? 'bg-gray-100 opacity-60' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="px-6 py-4">
                    {editingId === extra.id ? (
                      <input
                        type="text"
                        value={extra.name}
                        onChange={(e) => handleChange(extra.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                      />
                    ) : (
                      <span className="font-bugrino text-sm uppercase tracking-wider">{extra.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === extra.id ? (
                      <input
                        type="text"
                        value={extra.description || ''}
                        onChange={(e) => handleChange(extra.id, 'description', e.target.value || null)}
                        className="w-full px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">{extra.description || '-'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === extra.id ? (
                      <input
                        type="number"
                        value={extra.price}
                        onChange={(e) => handleChange(extra.id, 'price', parseInt(e.target.value))}
                        className="w-28 px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                      />
                    ) : (
                      <span className="font-bugrino">{extra.price.toLocaleString('hu-HU')} Ft</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === extra.id ? (
                      <select
                        value={extra.price_type}
                        onChange={(e) => handleChange(extra.id, 'price_type', e.target.value)}
                        className="px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                      >
                        {priceTypes.map((pt) => (
                          <option key={pt.value} value={pt.value}>
                            {pt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {priceTypes.find((pt) => pt.value === extra.price_type)?.label || extra.price_type}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        handleChange(extra.id, 'is_active', !(extra.is_active ?? true))
                        if (editingId !== extra.id) {
                          updateExtra({ ...extra, is_active: !(extra.is_active ?? true) })
                        }
                      }}
                      className={`
                        w-14 h-8 border-[3px] border-black relative
                        transition-all
                        ${extra.is_active ?? true ? 'bg-green-500' : 'bg-gray-200'}
                      `}
                      style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
                    >
                      <div
                        className={`
                          absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-[2px] border-black
                          transition-all
                          ${extra.is_active ?? true ? 'left-7' : 'left-1'}
                        `}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {editingId === extra.id ? (
                      <>
                        <button
                          onClick={() => updateExtra(extra)}
                          disabled={saving}
                          className="font-bugrino text-xs uppercase tracking-wider text-green-600 hover:underline"
                        >
                          Mentés
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            loadExtras()
                          }}
                          className="font-bugrino text-xs uppercase tracking-wider text-gray-600 hover:underline"
                        >
                          Mégse
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingId(extra.id)}
                          className="font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
                        >
                          Szerkesztés
                        </button>
                        <button
                          onClick={() => deleteExtra(extra.id)}
                          className="font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-red)] hover:underline"
                        >
                          Törlés
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BauhausCard>
    </div>
  )
}
