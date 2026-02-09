'use client'

import { useState, useMemo } from 'react'
import type { OpeningHours, SpecialDate, Booking, TimeSlot } from '@/types/database'
import { format } from 'date-fns'

interface HourlySlotSelectorProps {
  openingHours: OpeningHours[]
  specialDates: SpecialDate[]
  selectedDate: Date
  existingBookings: Booking[]
  timeSlots: TimeSlot[]
  hourlyRate: number
  minHours: number
  maxHours: number
  onSelect: (start: string, end: string, duration: number, price: number) => void
}

interface TimeRange {
  start: string
  end: string
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function HourlySlotSelector({
  openingHours,
  specialDates,
  selectedDate,
  existingBookings,
  timeSlots,
  hourlyRate,
  minHours,
  maxHours,
  onSelect,
}: HourlySlotSelectorProps) {
  const [selectedStart, setSelectedStart] = useState<string | null>(null)
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null)

  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  // Get opening hours for the selected day
  const dayOfWeek = selectedDate.getDay()
  const hours = openingHours.find(oh => oh.day_of_week === dayOfWeek)
  const special = specialDates.find(sd => sd.date === dateStr)

  const openTime = special?.open_time || hours?.open_time || '09:00'
  const closeTime = special?.close_time || hours?.close_time || '18:00'

  // Collect all booked time ranges for this date
  const bookedRanges: TimeRange[] = useMemo(() => {
    const ranges: TimeRange[] = []
    const dayBookings = existingBookings.filter(
      b => b.booking_date === dateStr && !['cancelled', 'no_show'].includes(b.status)
    )

    for (const booking of dayBookings) {
      if (booking.booking_type === 'hourly' && booking.start_time && booking.end_time) {
        ranges.push({
          start: booking.start_time.slice(0, 5),
          end: booking.end_time.slice(0, 5),
        })
      } else if (booking.time_slot_id) {
        const slot = timeSlots.find(s => s.id === booking.time_slot_id)
        if (slot) {
          ranges.push({
            start: slot.start_time.slice(0, 5),
            end: slot.end_time.slice(0, 5),
          })
        }
      }
    }

    return ranges.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
  }, [existingBookings, dateStr, timeSlots])

  // Check if a time range overlaps with any booked range
  const overlapsBooking = (start: string, end: string): boolean => {
    const startMin = timeToMinutes(start)
    const endMin = timeToMinutes(end)
    return bookedRanges.some(r => {
      const rStart = timeToMinutes(r.start)
      const rEnd = timeToMinutes(r.end)
      return startMin < rEnd && endMin > rStart
    })
  }

  // Generate available start times
  const startOptions = useMemo(() => {
    const options: string[] = []
    const openMin = timeToMinutes(openTime)
    const closeMin = timeToMinutes(closeTime)
    const minEndMin = minHours * 60

    for (let m = openMin; m <= closeMin - minEndMin; m += 60) {
      const time = minutesToTime(m)
      // Check that at least minHours of continuous time is available from this start
      const minEnd = minutesToTime(m + minEndMin)
      if (!overlapsBooking(time, minEnd)) {
        options.push(time)
      }
    }
    return options
  }, [openTime, closeTime, minHours, bookedRanges])

  // Generate available end times based on selected start
  const endOptions = useMemo(() => {
    if (!selectedStart) return []
    const options: string[] = []
    const startMin = timeToMinutes(selectedStart)
    const closeMin = timeToMinutes(closeTime)
    const minEnd = startMin + minHours * 60
    const maxEnd = Math.min(startMin + maxHours * 60, closeMin)

    // Find the next booked range after start
    let nextBookingStart = closeMin
    for (const r of bookedRanges) {
      const rStart = timeToMinutes(r.start)
      if (rStart > startMin) {
        nextBookingStart = Math.min(nextBookingStart, rStart)
        break
      }
    }

    const effectiveMaxEnd = Math.min(maxEnd, nextBookingStart)

    for (let m = minEnd; m <= effectiveMaxEnd; m += 60) {
      const time = minutesToTime(m)
      if (!overlapsBooking(selectedStart, time)) {
        options.push(time)
      }
    }
    return options
  }, [selectedStart, closeTime, minHours, maxHours, bookedRanges])

  const duration = selectedStart && selectedEnd
    ? (timeToMinutes(selectedEnd) - timeToMinutes(selectedStart)) / 60
    : 0

  const totalPrice = duration * hourlyRate

  const handleStartChange = (start: string) => {
    setSelectedStart(start)
    setSelectedEnd(null)
  }

  const handleEndChange = (end: string) => {
    setSelectedEnd(end)
    if (selectedStart) {
      const dur = (timeToMinutes(end) - timeToMinutes(selectedStart)) / 60
      onSelect(selectedStart, end, dur, dur * hourlyRate)
    }
  }

  if (!hours || hours.is_closed) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 font-bugrino uppercase tracking-wider text-sm">
          Ez a nap zárva van
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info */}
      <div
        className="p-4 border-[3px] border-[var(--bauhaus-blue)]"
        style={{ backgroundColor: 'rgba(0, 0, 255, 0.05)' }}
      >
        <p className="font-bugrino text-sm uppercase tracking-wider mb-1">Óradíj</p>
        <p className="font-bugrino text-xl">
          {hourlyRate.toLocaleString('hu-HU')} <span className="text-sm">Ft/óra</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Minimum {minHours} óra, maximum {maxHours} óra
        </p>
      </div>

      {/* Start time */}
      <div>
        <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
          Kezdés
        </label>
        {startOptions.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {startOptions.map(time => (
              <button
                key={time}
                onClick={() => handleStartChange(time)}
                className={`
                  py-3 px-2 text-center border-[3px] font-bugrino text-sm transition-all
                  ${selectedStart === time
                    ? 'border-black bg-[var(--bauhaus-blue)] text-white translate-x-[-2px] translate-y-[-2px]'
                    : 'border-black bg-white hover:translate-x-[-2px] hover:translate-y-[-2px]'
                  }
                `}
                style={{
                  boxShadow: selectedStart === time
                    ? '4px 4px 0 var(--bauhaus-black)'
                    : '3px 3px 0 var(--bauhaus-black)',
                }}
              >
                {time}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Nincs elérhető kezdési időpont ezen a napon</p>
        )}
      </div>

      {/* End time */}
      {selectedStart && (
        <div>
          <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
            Befejezés
          </label>
          {endOptions.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {endOptions.map(time => (
                <button
                  key={time}
                  onClick={() => handleEndChange(time)}
                  className={`
                    py-3 px-2 text-center border-[3px] font-bugrino text-sm transition-all
                    ${selectedEnd === time
                      ? 'border-black bg-[var(--bauhaus-yellow)] translate-x-[-2px] translate-y-[-2px]'
                      : 'border-black bg-white hover:translate-x-[-2px] hover:translate-y-[-2px]'
                    }
                  `}
                  style={{
                    boxShadow: selectedEnd === time
                      ? '4px 4px 0 var(--bauhaus-black)'
                      : '3px 3px 0 var(--bauhaus-black)',
                  }}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nincs elérhető befejezési időpont</p>
          )}
        </div>
      )}

      {/* Summary */}
      {selectedStart && selectedEnd && (
        <div
          className="p-4 border-[3px] border-black"
          style={{ boxShadow: '4px 4px 0 var(--bauhaus-yellow)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bugrino text-sm uppercase tracking-wider text-gray-500">Kiválasztott időpont</p>
              <p className="font-bugrino text-lg">
                {selectedStart} - {selectedEnd}
              </p>
              <p className="text-sm text-gray-500">{duration} óra</p>
            </div>
            <div className="text-right">
              <p className="font-bugrino text-sm uppercase tracking-wider text-gray-500">Ár</p>
              <p className="font-bugrino text-xl">
                {totalPrice.toLocaleString('hu-HU')} <span className="text-sm">Ft</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Booked ranges indicator */}
      {bookedRanges.length > 0 && (
        <div className="text-xs text-gray-400">
          <p className="font-bugrino uppercase tracking-wider mb-1">Foglalt időszakok:</p>
          {bookedRanges.map((r, i) => (
            <span key={i} className="inline-block mr-3">
              {r.start} - {r.end}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
