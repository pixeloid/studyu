'use client'

import type { TimeSlot } from '@/types/database'

interface TimeSlotSelectorProps {
  slots: TimeSlot[]
  selectedSlot: TimeSlot | null
  onSlotSelect: (slot: TimeSlot) => void
  disabled?: boolean
}

export function TimeSlotSelector({
  slots,
  selectedSlot,
  onSlotSelect,
  disabled = false,
}: TimeSlotSelectorProps) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-12">
        <div
          className="w-16 h-16 rounded-full border-[3px] border-gray-200 flex items-center justify-center mx-auto mb-4"
        >
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 font-bugrino uppercase tracking-wider text-sm">
          Nincs elérhető időpont
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {slots.map(slot => {
        const isSelected = selectedSlot?.id === slot.id

        return (
          <button
            key={slot.id}
            onClick={() => !disabled && onSlotSelect(slot)}
            disabled={disabled}
            className={`
              w-full p-5 text-left transition-all
              border-[3px] bg-white
              ${isSelected
                ? 'border-black translate-x-[-2px] translate-y-[-2px]'
                : 'border-black hover:translate-x-[-2px] hover:translate-y-[-2px]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            style={{
              boxShadow: isSelected
                ? '6px 6px 0 var(--bauhaus-blue)'
                : '4px 4px 0 var(--bauhaus-black)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`
                    w-14 h-14 rounded-full border-[3px] flex items-center justify-center
                    ${isSelected
                      ? 'border-[var(--bauhaus-blue)] bg-[var(--bauhaus-blue)] text-white'
                      : 'border-black bg-white'
                    }
                  `}
                >
                  <span className="font-bugrino text-sm">
                    {slot.duration_hours}h
                  </span>
                </div>

                <div>
                  <p className="font-bugrino text-lg uppercase tracking-wide">{slot.name}</p>
                  <p className="text-sm text-gray-500">
                    {slot.start_time} - {slot.end_time}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bugrino text-xl">
                  {slot.base_price.toLocaleString('hu-HU')}
                  <span className="text-sm ml-1">Ft</span>
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
