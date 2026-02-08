'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausBadge } from '@/components/ui/bauhaus/BauhausBadge'

interface SpecialDate {
  id: string
  date: string
  type: string
  name: string | null
  open_time: string | null
  close_time: string | null
  reason: string | null
}

const dateTypes = [
  { value: 'holiday', label: 'Ünnepnap' },
  { value: 'closed', label: 'Zárva' },
  { value: 'special_hours', label: 'Speciális nyitvatartás' },
]

export default function SpecialDatesPage() {
  const [dates, setDates] = useState<SpecialDate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newDate, setNewDate] = useState<Partial<SpecialDate> | null>(null)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())
  const supabase = createClient()

  useEffect(() => {
    loadDates()
  }, [yearFilter])

  const loadDates = async () => {
    const { data } = await supabase
      .from('special_dates')
      .select('*')
      .gte('date', `${yearFilter}-01-01`)
      .lte('date', `${yearFilter}-12-31`)
      .order('date')

    if (data) {
      setDates(data)
    }
    setLoading(false)
  }

  const updateDate = async (specialDate: SpecialDate) => {
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('special_dates')
      .update({
        date: specialDate.date,
        type: specialDate.type,
        name: specialDate.name,
        open_time: specialDate.open_time,
        close_time: specialDate.close_time,
        reason: specialDate.reason,
      })
      .eq('id', specialDate.id)

    if (error) {
      setMessage({ type: 'error', text: 'Hiba történt a mentés során' })
    } else {
      setMessage({ type: 'success', text: 'Speciális nap sikeresen mentve!' })
      setEditingId(null)
    }
    setSaving(false)
  }

  const createDate = async () => {
    if (!newDate?.date || !newDate?.type) {
      setMessage({ type: 'error', text: 'Kérjük töltse ki a kötelező mezőket' })
      return
    }

    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('special_dates')
      .insert({
        date: newDate.date,
        type: newDate.type,
        name: newDate.name || null,
        open_time: newDate.open_time || null,
        close_time: newDate.close_time || null,
        reason: newDate.reason || null,
      })

    if (error) {
      if (error.code === '23505') {
        setMessage({ type: 'error', text: 'Ez a dátum már létezik' })
      } else {
        setMessage({ type: 'error', text: 'Hiba történt a létrehozás során' })
      }
    } else {
      setMessage({ type: 'success', text: 'Speciális nap sikeresen létrehozva!' })
      setNewDate(null)
      loadDates()
    }
    setSaving(false)
  }

  const deleteDate = async (id: string) => {
    if (!confirm('Biztosan törli ezt a speciális napot?')) return

    const { error } = await supabase
      .from('special_dates')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage({ type: 'error', text: 'Hiba történt a törlés során' })
    } else {
      setMessage({ type: 'success', text: 'Speciális nap törölve' })
      loadDates()
    }
  }

  const handleChange = (id: string, field: keyof SpecialDate, value: string | null) => {
    setDates(prev =>
      prev.map(d => (d.id === id ? { ...d, [field]: value } : d))
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
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-bauhaus-heading mb-2">Ünnepnapok és speciális napok</h1>
            <div className="flex items-center gap-2">
              <div className="w-8 h-[3px] bg-black" />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-red)' }} />
            </div>
          </div>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(parseInt(e.target.value))}
            className="px-4 py-2 border-[3px] border-black bg-white font-bugrino text-sm uppercase tracking-wider focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
          >
            {[2024, 2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <BauhausButton
          onClick={() => setNewDate({ date: '', type: 'holiday', name: '' })}
          variant="primary"
        >
          + Új speciális nap
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
            <thead style={{ backgroundColor: 'var(--bauhaus-red)' }}>
              <tr className="border-b-[3px] border-black text-white">
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Dátum
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Típus
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Megnevezés
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Nyitvatartás
                </th>
                <th className="px-6 py-4 text-right font-bugrino text-xs uppercase tracking-wider">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody>
              {newDate && (
                <tr className="border-b-[2px] border-black" style={{ backgroundColor: 'rgba(229, 57, 53, 0.1)' }}>
                  <td className="px-6 py-4">
                    <input
                      type="date"
                      value={newDate.date || ''}
                      onChange={(e) => setNewDate({ ...newDate, date: e.target.value })}
                      className="px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={newDate.type || 'holiday'}
                      onChange={(e) => setNewDate({ ...newDate, type: e.target.value })}
                      className="px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    >
                      {dateTypes.map((dt) => (
                        <option key={dt.value} value={dt.value}>
                          {dt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={newDate.name || ''}
                      onChange={(e) => setNewDate({ ...newDate, name: e.target.value })}
                      placeholder="Megnevezés"
                      className="w-full px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                    />
                  </td>
                  <td className="px-6 py-4">
                    {newDate.type === 'special_hours' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={newDate.open_time || ''}
                          onChange={(e) => setNewDate({ ...newDate, open_time: e.target.value })}
                          className="px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                        />
                        <span className="font-bugrino">-</span>
                        <input
                          type="time"
                          value={newDate.close_time || ''}
                          onChange={(e) => setNewDate({ ...newDate, close_time: e.target.value })}
                          className="px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={createDate}
                      disabled={saving}
                      className="font-bugrino text-xs uppercase tracking-wider text-green-600 hover:underline"
                    >
                      Mentés
                    </button>
                    <button
                      onClick={() => setNewDate(null)}
                      className="font-bugrino text-xs uppercase tracking-wider text-gray-600 hover:underline"
                    >
                      Mégse
                    </button>
                  </td>
                </tr>
              )}
              {dates.map((specialDate, index) => (
                <tr
                  key={specialDate.id}
                  className={`border-b-[2px] border-gray-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="px-6 py-4">
                    {editingId === specialDate.id ? (
                      <input
                        type="date"
                        value={specialDate.date}
                        onChange={(e) => handleChange(specialDate.id, 'date', e.target.value)}
                        className="px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full border-[2px] border-black flex items-center justify-center font-bugrino text-sm"
                          style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
                        >
                          {format(new Date(specialDate.date), 'd')}
                        </div>
                        <span className="text-sm">
                          {format(new Date(specialDate.date), 'MMMM', { locale: hu })}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === specialDate.id ? (
                      <select
                        value={specialDate.type}
                        onChange={(e) => handleChange(specialDate.id, 'type', e.target.value)}
                        className="px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                      >
                        {dateTypes.map((dt) => (
                          <option key={dt.value} value={dt.value}>
                            {dt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <BauhausBadge
                        variant={
                          specialDate.type === 'holiday'
                            ? 'red'
                            : specialDate.type === 'closed'
                            ? 'outline'
                            : 'blue'
                        }
                      >
                        {dateTypes.find((dt) => dt.value === specialDate.type)?.label}
                      </BauhausBadge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === specialDate.id ? (
                      <input
                        type="text"
                        value={specialDate.name || ''}
                        onChange={(e) => handleChange(specialDate.id, 'name', e.target.value || null)}
                        className="w-full px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                      />
                    ) : (
                      <span className="font-bugrino text-sm uppercase tracking-wider">
                        {specialDate.name || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === specialDate.id && specialDate.type === 'special_hours' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={specialDate.open_time || ''}
                          onChange={(e) => handleChange(specialDate.id, 'open_time', e.target.value || null)}
                          className="px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                        />
                        <span className="font-bugrino">-</span>
                        <input
                          type="time"
                          value={specialDate.close_time || ''}
                          onChange={(e) => handleChange(specialDate.id, 'close_time', e.target.value || null)}
                          className="px-3 py-2 border-[2px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                        />
                      </div>
                    ) : specialDate.type === 'special_hours' ? (
                      <span className="text-sm text-gray-500">
                        {specialDate.open_time} - {specialDate.close_time}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {editingId === specialDate.id ? (
                      <>
                        <button
                          onClick={() => updateDate(specialDate)}
                          disabled={saving}
                          className="font-bugrino text-xs uppercase tracking-wider text-green-600 hover:underline"
                        >
                          Mentés
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            loadDates()
                          }}
                          className="font-bugrino text-xs uppercase tracking-wider text-gray-600 hover:underline"
                        >
                          Mégse
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingId(specialDate.id)}
                          className="font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
                        >
                          Szerkesztés
                        </button>
                        <button
                          onClick={() => deleteDate(specialDate.id)}
                          className="font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-red)] hover:underline"
                        >
                          Törlés
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {dates.length === 0 && !newDate && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div
                      className="w-16 h-16 rounded-full border-[3px] border-gray-200 flex items-center justify-center mx-auto mb-4"
                    >
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                    </div>
                    <p className="font-bugrino text-sm uppercase tracking-wider text-gray-500">
                      Nincs speciális nap ebben az évben
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </BauhausCard>
    </div>
  )
}
