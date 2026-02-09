'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  getDay,
} from 'date-fns'
import { hu } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { BauhausBadge } from '@/components/ui/bauhaus/BauhausBadge'
import type { BookingStatus } from '@/types/database'

interface CalendarBooking {
  id: string
  booking_date: string
  status: BookingStatus
  total_price: number
  start_time: string | null
  end_time: string | null
  profiles: { full_name: string } | null
  time_slots: { name: string; start_time: string; end_time: string } | null
}

type ViewMode = 'week' | 'month'

const STATUS_BADGE_VARIANT: Record<string, 'yellow' | 'blue' | 'red' | 'outline' | 'black'> = {
  pending: 'yellow',
  confirmed: 'blue',
  paid: 'blue',
  completed: 'black',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Függőben',
  confirmed: 'Visszaigazolva',
  paid: 'Fizetve',
  completed: 'Teljesítve',
}

const STATUS_DOT_COLOR: Record<string, string> = {
  pending: 'var(--bauhaus-yellow)',
  confirmed: 'var(--bauhaus-blue)',
  paid: '#22c55e',
  completed: '#6b7280',
}

const DAY_NAMES = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap']
const DAY_NAMES_SHORT = ['H', 'K', 'Sz', 'Cs', 'P', 'Szo', 'V']

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

function getWeekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 })
}

export default function CalendarPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<CalendarBooking[]>([])
  const [loading, setLoading] = useState(true)

  const dateRange = viewMode === 'week'
    ? { start: getWeekStart(currentDate), end: getWeekEnd(currentDate) }
    : {
        start: getWeekStart(startOfMonth(currentDate)),
        end: getWeekEnd(endOfMonth(currentDate)),
      }

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const startStr = format(dateRange.start, 'yyyy-MM-dd')
    const endStr = format(dateRange.end, 'yyyy-MM-dd')

    const { data } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        status,
        total_price,
        start_time,
        end_time,
        profiles (full_name),
        time_slots (name, start_time, end_time)
      `)
      .gte('booking_date', startStr)
      .lte('booking_date', endStr)
      .not('status', 'in', '("cancelled","no_show")')
      .order('booking_date')

    setBookings((data as CalendarBooking[] | null) ?? [])
    setLoading(false)
  }, [dateRange.start.toISOString(), dateRange.end.toISOString()])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  function goToday() {
    setCurrentDate(new Date())
  }

  function goPrev() {
    if (viewMode === 'week') {
      setCurrentDate(prev => subWeeks(prev, 1))
    } else {
      setCurrentDate(prev => subMonths(prev, 1))
    }
  }

  function goNext() {
    if (viewMode === 'week') {
      setCurrentDate(prev => addWeeks(prev, 1))
    } else {
      setCurrentDate(prev => addMonths(prev, 1))
    }
  }

  function getBookingsForDay(day: Date): CalendarBooking[] {
    return bookings.filter(b => isSameDay(new Date(b.booking_date), day))
  }

  function switchToWeekOf(day: Date) {
    setCurrentDate(day)
    setViewMode('week')
  }

  const headerLabel = viewMode === 'week'
    ? `${format(dateRange.start, 'yyyy. MMMM d.', { locale: hu })} – ${format(dateRange.end, 'd.', { locale: hu })}`
    : format(currentDate, 'yyyy. MMMM', { locale: hu })

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-bauhaus-heading mb-2">Naptár</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[3px] bg-black" />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-blue)' }} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="bg-white p-4 border-[3px] border-black mb-6 flex items-center justify-between flex-wrap gap-4"
        style={{ boxShadow: '4px 4px 0 var(--bauhaus-black)' }}
      >
        {/* Navigation arrows + label */}
        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            className="w-10 h-10 border-[2px] border-black flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="font-bugrino text-lg uppercase tracking-wider min-w-[280px] text-center">
            {headerLabel}
          </span>
          <button
            onClick={goNext}
            className="w-10 h-10 border-[2px] border-black flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* View mode + today */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 font-bugrino text-sm uppercase tracking-wider border-[2px] border-black transition-all ${
              viewMode === 'week' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'
            }`}
            style={{ boxShadow: viewMode === 'week' ? '3px 3px 0 var(--bauhaus-blue)' : 'none' }}
          >
            Hét
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 font-bugrino text-sm uppercase tracking-wider border-[2px] border-black transition-all ${
              viewMode === 'month' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'
            }`}
            style={{ boxShadow: viewMode === 'month' ? '3px 3px 0 var(--bauhaus-blue)' : 'none' }}
          >
            Hónap
          </button>
          <button
            onClick={goToday}
            className="px-4 py-2 font-bugrino text-sm uppercase tracking-wider border-[2px] border-black bg-white text-black hover:bg-gray-50 transition-all"
          >
            Ma
          </button>
        </div>
      </div>

      {/* Calendar body */}
      {loading ? (
        <CalendarSkeleton viewMode={viewMode} />
      ) : viewMode === 'week' ? (
        <WeekView
          days={eachDayOfInterval({ start: dateRange.start, end: dateRange.end })}
          getBookingsForDay={getBookingsForDay}
          onClickBooking={(id) => router.push(`/admin/foglalasok/${id}`)}
        />
      ) : (
        <MonthView
          currentDate={currentDate}
          days={eachDayOfInterval({ start: dateRange.start, end: dateRange.end })}
          getBookingsForDay={getBookingsForDay}
          onClickDay={switchToWeekOf}
        />
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-sm">
        {Object.entries(STATUS_DOT_COLOR).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-600">{STATUS_LABEL[status]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WeekView({
  days,
  getBookingsForDay,
  onClickBooking,
}: {
  days: Date[]
  getBookingsForDay: (day: Date) => CalendarBooking[]
  onClickBooking: (id: string) => void
}) {
  return (
    <div
      className="bg-white border-[3px] border-black overflow-hidden"
      style={{ boxShadow: '4px 4px 0 var(--bauhaus-black)' }}
    >
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayBookings = getBookingsForDay(day)
          const today = isToday(day)
          // getDay returns 0=Sun, convert to Mon=0 index
          const dayIndex = (getDay(day) + 6) % 7

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[200px] ${i < 6 ? 'border-r-[2px] border-gray-200' : ''} ${
                today ? 'border-t-[4px] border-t-[var(--bauhaus-blue)]' : 'border-t-[3px] border-t-black'
              }`}
            >
              {/* Day header */}
              <div
                className={`px-3 py-2 border-b-[2px] border-gray-200 ${
                  today ? 'bg-[var(--bauhaus-blue)]/5' : 'bg-gray-50'
                }`}
              >
                <span className="font-bugrino text-xs uppercase tracking-wider text-gray-500">
                  {DAY_NAMES[dayIndex]}
                </span>
                <span
                  className={`ml-2 font-bugrino text-lg ${
                    today ? 'text-[var(--bauhaus-blue)]' : ''
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Booking cards */}
              <div className="p-2 space-y-2">
                {dayBookings.length === 0 && (
                  <div className="text-center py-4 text-gray-300">
                    <div className="w-6 h-6 rounded-full border-2 border-gray-200 mx-auto" />
                  </div>
                )}
                {dayBookings.map(booking => (
                  <button
                    key={booking.id}
                    onClick={() => onClickBooking(booking.id)}
                    className="w-full text-left p-2 border-[2px] border-black bg-white hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform cursor-pointer"
                    style={{
                      borderLeftColor: STATUS_DOT_COLOR[booking.status] || '#000',
                      borderLeftWidth: '4px',
                      boxShadow: '2px 2px 0 var(--bauhaus-black)',
                    }}
                  >
                    <div className="font-bugrino text-xs text-gray-500">
                      {booking.time_slots
                        ? `${booking.time_slots.start_time?.slice(0, 5)} – ${booking.time_slots.end_time?.slice(0, 5)}`
                        : `${booking.start_time?.slice(0, 5)} – ${booking.end_time?.slice(0, 5)}`
                      }
                    </div>
                    <div className="text-sm font-medium truncate mt-0.5">
                      {booking.profiles?.full_name || 'Ismeretlen'}
                    </div>
                    <div className="mt-1">
                      <BauhausBadge variant={STATUS_BADGE_VARIANT[booking.status] || 'outline'} className="text-[10px] px-1.5 py-0.5">
                        {STATUS_LABEL[booking.status] || booking.status}
                      </BauhausBadge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MonthView({
  currentDate,
  days,
  getBookingsForDay,
  onClickDay,
}: {
  currentDate: Date
  days: Date[]
  getBookingsForDay: (day: Date) => CalendarBooking[]
  onClickDay: (day: Date) => void
}) {
  const currentMonth = currentDate.getMonth()

  return (
    <div
      className="bg-white border-[3px] border-black overflow-hidden"
      style={{ boxShadow: '4px 4px 0 var(--bauhaus-black)' }}
    >
      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b-[3px] border-black" style={{ backgroundColor: 'var(--bauhaus-yellow)' }}>
        {DAY_NAMES_SHORT.map((name, i) => (
          <div
            key={name}
            className={`px-3 py-3 text-center font-bugrino text-xs uppercase tracking-wider ${
              i < 6 ? 'border-r-[2px] border-black/20' : ''
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayBookings = getBookingsForDay(day)
          const today = isToday(day)
          const isCurrentMonth = day.getMonth() === currentMonth
          const row = Math.floor(i / 7)
          const totalRows = Math.ceil(days.length / 7)

          return (
            <button
              key={day.toISOString()}
              onClick={() => onClickDay(day)}
              className={`min-h-[100px] p-2 text-left transition-colors hover:bg-gray-50 cursor-pointer ${
                i % 7 < 6 ? 'border-r-[2px] border-gray-200' : ''
              } ${row < totalRows - 1 ? 'border-b-[2px] border-gray-200' : ''} ${
                !isCurrentMonth ? 'bg-gray-50/50' : ''
              } ${today ? 'ring-inset ring-2 ring-[var(--bauhaus-blue)]' : ''}`}
            >
              <div className={`font-bugrino text-sm ${
                !isCurrentMonth ? 'text-gray-300' : today ? 'text-[var(--bauhaus-blue)]' : ''
              }`}>
                {format(day, 'd')}
              </div>

              {/* Booking dots */}
              {dayBookings.length > 0 && (
                <div className="mt-1">
                  <div className="flex flex-wrap gap-1">
                    {dayBookings.slice(0, 5).map(b => (
                      <div
                        key={b.id}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_DOT_COLOR[b.status] || '#6b7280' }}
                      />
                    ))}
                  </div>
                  {dayBookings.length > 0 && (
                    <div className="mt-1 font-bugrino text-[10px] text-gray-500">
                      {dayBookings.length} foglalás
                    </div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CalendarSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'week') {
    return (
      <div
        className="bg-white border-[3px] border-black overflow-hidden"
        style={{ boxShadow: '4px 4px 0 var(--bauhaus-black)' }}
      >
        <div className="grid grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`min-h-[200px] ${i < 6 ? 'border-r-[2px] border-gray-200' : ''} border-t-[3px] border-t-black`}
            >
              <div className="px-3 py-2 border-b-[2px] border-gray-200 bg-gray-50">
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
              </div>
              <div className="p-2 space-y-2">
                {Array.from({ length: Math.floor(Math.random() * 2) + 1 }).map((_, j) => (
                  <div key={j} className="h-16 bg-gray-100 animate-pulse border-[2px] border-gray-200 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="bg-white border-[3px] border-black overflow-hidden"
      style={{ boxShadow: '4px 4px 0 var(--bauhaus-black)' }}
    >
      <div className="grid grid-cols-7 border-b-[3px] border-black" style={{ backgroundColor: 'var(--bauhaus-yellow)' }}>
        {DAY_NAMES_SHORT.map((name, i) => (
          <div key={name} className={`px-3 py-3 text-center font-bugrino text-xs uppercase tracking-wider ${i < 6 ? 'border-r-[2px] border-black/20' : ''}`}>
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className={`min-h-[100px] p-2 ${i % 7 < 6 ? 'border-r-[2px] border-gray-200' : ''} ${
              Math.floor(i / 7) < 4 ? 'border-b-[2px] border-gray-200' : ''
            }`}
          >
            <div className="h-4 w-6 bg-gray-200 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
