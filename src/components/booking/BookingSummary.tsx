'use client'

import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import type { TimeSlot, Extra } from '@/types/database'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'

interface SelectedExtra {
  extra: Extra
  quantity: number
}

interface BookingSummaryProps {
  date: Date | null
  slot: TimeSlot | null
  extras: SelectedExtra[]
  discountPercent?: number
}

export function BookingSummary({
  date,
  slot,
  extras,
  discountPercent = 0,
}: BookingSummaryProps) {
  const basePrice = slot?.base_price || 0
  const extrasPrice = extras.reduce((sum, e) => sum + e.extra.price * e.quantity, 0)
  const subtotal = basePrice + extrasPrice
  const discount = Math.round(subtotal * (discountPercent / 100))
  const total = subtotal - discount

  return (
    <BauhausCard padding="none" accentColor="yellow" hasCornerAccent accentPosition="top-left">
      <div
        className="px-6 py-4 border-b-[3px] border-black"
        style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
      >
        <h3 className="font-bugrino text-lg uppercase tracking-wider">
          Összesítő
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {date && (
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full border-[2px] border-black flex items-center justify-center font-bugrino"
              style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
            >
              {format(date, 'd')}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Dátum</p>
              <p className="font-medium">
                {format(date, 'MMMM d., EEEE', { locale: hu })}
              </p>
            </div>
          </div>
        )}

        {slot && (
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full border-[2px] border-black flex items-center justify-center"
              style={{ backgroundColor: 'var(--bauhaus-blue)' }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Időpont</p>
              <p className="font-medium">
                {slot.name} ({slot.start_time} - {slot.end_time})
              </p>
            </div>
          </div>
        )}

        <div className="border-t-[2px] border-gray-200 pt-4 space-y-3">
          {slot && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Stúdió bérlés</span>
              <span className="font-bugrino">{basePrice.toLocaleString('hu-HU')} Ft</span>
            </div>
          )}

          {extras.map(({ extra, quantity }) => (
            <div key={extra.id} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {extra.name}
                {quantity > 1 && <span className="ml-1 text-gray-400">×{quantity}</span>}
              </span>
              <span className="font-bugrino">
                {(extra.price * quantity).toLocaleString('hu-HU')} Ft
              </span>
            </div>
          ))}

          {discountPercent > 0 && (
            <div className="flex justify-between text-sm" style={{ color: 'var(--bauhaus-blue)' }}>
              <span>Kedvezmény ({discountPercent}%)</span>
              <span className="font-bugrino">-{discount.toLocaleString('hu-HU')} Ft</span>
            </div>
          )}
        </div>

        <div className="border-t-[3px] border-black pt-4">
          <div className="flex justify-between items-center">
            <span className="font-bugrino text-lg uppercase tracking-wider">Összesen</span>
            <div className="text-right">
              <span className="font-bugrino text-2xl">{total.toLocaleString('hu-HU')}</span>
              <span className="font-bugrino text-lg ml-1">Ft</span>
            </div>
          </div>
        </div>

        {!date && !slot && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full border-[2px] border-gray-200 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Válasszon dátumot és időpontot</p>
          </div>
        )}
      </div>
    </BauhausCard>
  )
}
