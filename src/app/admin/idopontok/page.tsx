'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'

interface TimeSlot {
  id: string
  name: string
  start_time: string
  end_time: string
  duration_hours: number
  base_price: number
  is_active: boolean | null
  sort_order: number | null
}

export default function TimeSlotsPage() {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newSlot, setNewSlot] = useState<Partial<TimeSlot> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadSlots()
  }, [])

  const loadSlots = async () => {
    const { data } = await supabase
      .from('time_slots')
      .select('*')
      .order('sort_order')

    if (data) {
      setSlots(data)
    }
    setLoading(false)
  }

  const updateSlot = async (slot: TimeSlot) => {
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('time_slots')
      .update({
        name: slot.name,
        start_time: slot.start_time,
        end_time: slot.end_time,
        duration_hours: slot.duration_hours,
        base_price: slot.base_price,
        is_active: slot.is_active,
        sort_order: slot.sort_order,
      })
      .eq('id', slot.id)

    if (error) {
      setMessage({ type: 'error', text: 'Hiba történt a mentés során' })
    } else {
      setMessage({ type: 'success', text: 'Időpont sikeresen mentve!' })
      setEditingId(null)
    }
    setSaving(false)
  }

  const createSlot = async () => {
    if (!newSlot?.name || !newSlot?.start_time || !newSlot?.end_time) {
      setMessage({ type: 'error', text: 'Kérjük töltse ki az összes mezőt' })
      return
    }

    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('time_slots')
      .insert({
        name: newSlot.name,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        duration_hours: newSlot.duration_hours || 1,
        base_price: newSlot.base_price || 0,
        is_active: true,
        sort_order: slots.length,
      })

    if (error) {
      setMessage({ type: 'error', text: 'Hiba történt a létrehozás során' })
    } else {
      setMessage({ type: 'success', text: 'Időpont sikeresen létrehozva!' })
      setNewSlot(null)
      loadSlots()
    }
    setSaving(false)
  }

  const deleteSlot = async (id: string) => {
    if (!confirm('Biztosan törli ezt az időpontot?')) return

    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage({ type: 'error', text: 'Hiba történt a törlés során' })
    } else {
      setMessage({ type: 'success', text: 'Időpont törölve' })
      loadSlots()
    }
  }

  const handleChange = (id: string, field: keyof TimeSlot, value: string | number | boolean) => {
    setSlots(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
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
          <h1 className="text-bauhaus-heading mb-2">Időpontok</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[3px] bg-black" />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-blue)' }} />
          </div>
        </div>
        <BauhausButton
          onClick={() => setNewSlot({ name: '', start_time: '09:00', end_time: '13:00', duration_hours: 4, base_price: 35000 })}
          variant="primary"
        >
          + Új időpont
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
            <thead style={{ backgroundColor: 'var(--bauhaus-blue)' }}>
              <tr className="border-b-[3px] border-black text-white">
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Név
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Kezdés
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Vége
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Időtartam
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Ár
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
              {newSlot && (
                <tr className="border-b-[2px] border-black" style={{ backgroundColor: 'rgba(0, 0, 255, 0.05)' }}>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={newSlot.name || ''}
                      onChange={(e) => setNewSlot({ ...newSlot, name: e.target.value })}
                      placeholder="Időpont neve"
                      className="w-full px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="time"
                      value={newSlot.start_time || ''}
                      onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                      className="px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="time"
                      value={newSlot.end_time || ''}
                      onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                      className="px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={newSlot.duration_hours || ''}
                      onChange={(e) => setNewSlot({ ...newSlot, duration_hours: parseInt(e.target.value) })}
                      className="w-20 px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={newSlot.base_price || ''}
                      onChange={(e) => setNewSlot({ ...newSlot, base_price: parseInt(e.target.value) })}
                      className="w-28 px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    />
                  </td>
                  <td className="px-6 py-4">-</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={createSlot}
                      disabled={saving}
                      className="font-bugrino text-xs uppercase tracking-wider text-green-600 hover:underline"
                    >
                      Mentés
                    </button>
                    <button
                      onClick={() => setNewSlot(null)}
                      className="font-bugrino text-xs uppercase tracking-wider text-gray-600 hover:underline"
                    >
                      Mégse
                    </button>
                  </td>
                </tr>
              )}
              {slots.map((slot, index) => (
                <tr
                  key={slot.id}
                  className={`border-b-[2px] border-gray-200 ${
                    !(slot.is_active ?? true) ? 'bg-gray-100 opacity-60' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="px-6 py-4">
                    {editingId === slot.id ? (
                      <input
                        type="text"
                        value={slot.name}
                        onChange={(e) => handleChange(slot.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full border-[2px] border-black flex items-center justify-center font-bugrino text-sm"
                          style={{ backgroundColor: slot.is_active ?? true ? 'var(--bauhaus-yellow)' : '#d1d5db' }}
                        >
                          {slot.duration_hours}h
                        </div>
                        <span className="font-bugrino text-sm uppercase tracking-wider">{slot.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === slot.id ? (
                      <input
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => handleChange(slot.id, 'start_time', e.target.value)}
                        className="px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                      />
                    ) : (
                      <span className="text-sm">{slot.start_time}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === slot.id ? (
                      <input
                        type="time"
                        value={slot.end_time}
                        onChange={(e) => handleChange(slot.id, 'end_time', e.target.value)}
                        className="px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                      />
                    ) : (
                      <span className="text-sm">{slot.end_time}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === slot.id ? (
                      <input
                        type="number"
                        value={slot.duration_hours}
                        onChange={(e) => handleChange(slot.id, 'duration_hours', parseInt(e.target.value))}
                        className="w-20 px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                      />
                    ) : (
                      <span className="text-sm">{slot.duration_hours} óra</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === slot.id ? (
                      <input
                        type="number"
                        value={slot.base_price}
                        onChange={(e) => handleChange(slot.id, 'base_price', parseInt(e.target.value))}
                        className="w-28 px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                      />
                    ) : (
                      <span className="font-bugrino">{slot.base_price.toLocaleString('hu-HU')} Ft</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        handleChange(slot.id, 'is_active', !(slot.is_active ?? true))
                        if (editingId !== slot.id) {
                          updateSlot({ ...slot, is_active: !(slot.is_active ?? true) })
                        }
                      }}
                      className={`
                        w-14 h-8 border-[3px] border-black relative
                        transition-all
                        ${slot.is_active ?? true ? 'bg-green-500' : 'bg-gray-200'}
                      `}
                      style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
                    >
                      <div
                        className={`
                          absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-[2px] border-black
                          transition-all
                          ${slot.is_active ?? true ? 'left-7' : 'left-1'}
                        `}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {editingId === slot.id ? (
                      <>
                        <button
                          onClick={() => updateSlot(slot)}
                          disabled={saving}
                          className="font-bugrino text-xs uppercase tracking-wider text-green-600 hover:underline"
                        >
                          Mentés
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            loadSlots()
                          }}
                          className="font-bugrino text-xs uppercase tracking-wider text-gray-600 hover:underline"
                        >
                          Mégse
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingId(slot.id)}
                          className="font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
                        >
                          Szerkesztés
                        </button>
                        <button
                          onClick={() => deleteSlot(slot.id)}
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
