'use client'

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { hu } from 'date-fns/locale'

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isAvailable: boolean
  isHoliday: boolean
  holidayName?: string
}

interface CalendarProps {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  availabilityData?: Record<string, { isOpen: boolean; isHoliday: boolean; holidayName?: string }>
  minDate?: Date
  maxDate?: Date
  currentMonth: Date
  onMonthChange: (date: Date) => void
}

const weekDays = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V']

export function Calendar({
  selectedDate,
  onDateSelect,
  availabilityData = {},
  minDate,
  maxDate,
  currentMonth,
  onMonthChange,
}: CalendarProps) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const calendarDays: CalendarDay[] = days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const availability = availabilityData[dateStr]
    const isBeforeMin = minDate ? date < minDate : false
    const isAfterMax = maxDate ? date > maxDate : false

    return {
      date,
      isCurrentMonth: isSameMonth(date, currentMonth),
      isToday: isToday(date),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      isAvailable: !isBeforeMin && !isAfterMax && (availability?.isOpen ?? true),
      isHoliday: availability?.isHoliday ?? false,
      holidayName: availability?.holidayName,
    }
  })

  const goToPreviousMonth = () => onMonthChange(subMonths(currentMonth, 1))
  const goToNextMonth = () => onMonthChange(addMonths(currentMonth, 1))

  return (
    <div className="w-full">
      {/* Header - Bauhaus style */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="w-10 h-10 flex items-center justify-center border-[3px] border-black bg-white hover:bg-gray-50 transition-colors"
          style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="square" strokeLinejoin="miter" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <h2 className="font-bugrino text-xl uppercase tracking-wider">
          {format(currentMonth, 'yyyy. MMMM', { locale: hu })}
        </h2>

        <button
          onClick={goToNextMonth}
          className="w-10 h-10 flex items-center justify-center border-[3px] border-black bg-white hover:bg-gray-50 transition-colors"
          style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="square" strokeLinejoin="miter" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`
              text-center font-bugrino text-sm uppercase tracking-wider py-2
              ${index >= 5 ? 'text-[var(--bauhaus-red)]' : 'text-gray-500'}
            `}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - Dugattyus inspired */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          const isDisabled = !day.isAvailable || !day.isCurrentMonth
          const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6

          return (
            <button
              key={index}
              onClick={() => !isDisabled && onDateSelect(day.date)}
              disabled={isDisabled}
              className={`
                relative aspect-square flex flex-col items-center justify-center
                transition-all duration-150
                ${!day.isCurrentMonth ? 'opacity-20' : ''}
                ${isDisabled && day.isCurrentMonth ? 'opacity-40 cursor-not-allowed' : ''}
                ${!isDisabled ? 'hover:scale-105 cursor-pointer' : ''}
              `}
              title={day.holidayName}
            >
              {/* Circle background */}
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  border-[3px] transition-all
                  ${day.isSelected
                    ? 'border-black bg-[var(--bauhaus-blue)] text-white'
                    : day.isToday
                      ? 'border-[var(--bauhaus-yellow)] bg-white'
                      : day.isHoliday
                        ? 'border-[var(--bauhaus-red)] bg-white'
                        : isWeekend && day.isCurrentMonth
                          ? 'border-gray-300 bg-gray-50'
                          : 'border-black bg-white'
                  }
                `}
                style={day.isSelected ? { boxShadow: '3px 3px 0 var(--bauhaus-black)' } : undefined}
              >
                <span
                  className={`
                    font-bugrino text-lg
                    ${day.isSelected ? 'text-white' : ''}
                    ${day.isHoliday && !day.isSelected ? 'text-[var(--bauhaus-red)]' : ''}
                  `}
                >
                  {format(day.date, 'd')}
                </span>
              </div>

              {/* Holiday indicator - small triangle */}
              {day.isHoliday && day.isCurrentMonth && !day.isSelected && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2"
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: '10px solid var(--bauhaus-red)',
                  }}
                />
              )}

              {/* Today indicator - yellow dot */}
              {day.isToday && !day.isSelected && (
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend - Bauhaus style */}
      <div className="mt-6 pt-4 border-t-[2px] border-gray-200 flex flex-wrap items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full border-[2px] border-black"
            style={{ backgroundColor: 'var(--bauhaus-blue)' }}
          />
          <span className="text-gray-600">Kiválasztott</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border-[2px] border-[var(--bauhaus-yellow)] bg-white relative">
            <div
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
            />
          </div>
          <span className="text-gray-600">Ma</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border-[2px] border-[var(--bauhaus-red)] bg-white" />
          <span className="text-gray-600">Ünnepnap</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border-[2px] border-gray-300 bg-gray-100 opacity-40" />
          <span className="text-gray-600">Nem elérhető</span>
        </div>
      </div>
    </div>
  )
}
