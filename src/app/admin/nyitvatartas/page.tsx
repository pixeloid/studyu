'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'

const dayNames = [
  'Vasárnap',
  'Hétfő',
  'Kedd',
  'Szerda',
  'Csütörtök',
  'Péntek',
  'Szombat',
]

interface OpeningHour {
  id: string
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean | null
  break_start: string | null
  break_end: string | null
}

export default function OpeningHoursPage() {
  const [hours, setHours] = useState<OpeningHour[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadHours()
  }, [])

  const loadHours = async () => {
    const { data, error } = await supabase
      .from('opening_hours')
      .select('*')
      .order('day_of_week')

    if (data) {
      setHours(data)
    }
    setLoading(false)
  }

  const updateHour = (index: number, field: keyof OpeningHour, value: string | boolean | null) => {
    setHours(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const saveChanges = async () => {
    setSaving(true)
    setMessage(null)

    try {
      for (const hour of hours) {
        const { error } = await supabase
          .from('opening_hours')
          .update({
            open_time: hour.open_time,
            close_time: hour.close_time,
            is_closed: hour.is_closed,
            break_start: hour.break_start,
            break_end: hour.break_end,
          })
          .eq('id', hour.id)

        if (error) throw error
      }

      setMessage({ type: 'success', text: 'Nyitvatartás sikeresen mentve!' })
    } catch {
      setMessage({ type: 'error', text: 'Hiba történt a mentés során' })
    } finally {
      setSaving(false)
    }
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
          <h1 className="text-bauhaus-heading mb-2">Nyitvatartás</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[3px] bg-black" />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-yellow)' }} />
          </div>
        </div>
        <BauhausButton
          onClick={saveChanges}
          disabled={saving}
          variant="primary"
        >
          {saving ? 'Mentés...' : 'Változtatások mentése'}
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
                  Nap
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Nyitás
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Zárás
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Szünet
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Zárva
                </th>
              </tr>
            </thead>
            <tbody>
              {hours.map((hour, index) => {
                const isWeekend = hour.day_of_week === 0 || hour.day_of_week === 6

                return (
                  <tr
                    key={hour.id}
                    className={`border-b-[2px] border-gray-200 ${
                      hour.is_closed
                        ? 'bg-red-50'
                        : isWeekend
                          ? 'bg-gray-50'
                          : 'bg-white'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full border-[2px] border-black flex items-center justify-center font-bugrino text-xs ${
                            isWeekend && !hour.is_closed ? 'text-black' : 'text-white'
                          }`}
                          style={{
                            backgroundColor: hour.is_closed
                              ? 'var(--bauhaus-red)'
                              : isWeekend
                                ? 'var(--bauhaus-yellow)'
                                : 'var(--bauhaus-blue)'
                          }}
                        >
                          {dayNames[hour.day_of_week].substring(0, 2)}
                        </div>
                        <span className="font-bugrino text-sm uppercase tracking-wider">
                          {dayNames[hour.day_of_week]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="time"
                        value={hour.open_time}
                        onChange={(e) => updateHour(index, 'open_time', e.target.value)}
                        disabled={hour.is_closed ?? false}
                        className="px-3 py-2 border-[2px] border-black bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="time"
                        value={hour.close_time}
                        onChange={(e) => updateHour(index, 'close_time', e.target.value)}
                        disabled={hour.is_closed ?? false}
                        className="px-3 py-2 border-[2px] border-black bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={hour.break_start || ''}
                          onChange={(e) => updateHour(index, 'break_start', e.target.value || null)}
                          disabled={hour.is_closed ?? false}
                          placeholder="--:--"
                          className="w-24 px-3 py-2 border-[2px] border-black bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                        />
                        <span className="font-bugrino">-</span>
                        <input
                          type="time"
                          value={hour.break_end || ''}
                          onChange={(e) => updateHour(index, 'break_end', e.target.value || null)}
                          disabled={hour.is_closed ?? false}
                          placeholder="--:--"
                          className="w-24 px-3 py-2 border-[2px] border-black bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => updateHour(index, 'is_closed', !(hour.is_closed ?? false))}
                        className={`
                          w-14 h-8 border-[3px] border-black relative
                          transition-all
                          ${hour.is_closed ? 'bg-[var(--bauhaus-red)]' : 'bg-gray-200'}
                        `}
                        style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
                      >
                        <div
                          className={`
                            absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-[2px] border-black
                            transition-all
                            ${hour.is_closed ? 'left-7' : 'left-1'}
                          `}
                        />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </BauhausCard>
    </div>
  )
}
