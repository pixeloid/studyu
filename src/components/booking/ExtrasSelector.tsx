'use client'

import type { Extra } from '@/types/database'

interface SelectedExtra {
  extra: Extra
  quantity: number
}

interface ExtrasSelectorProps {
  extras: Extra[]
  selectedExtras: SelectedExtra[]
  onExtrasChange: (extras: SelectedExtra[]) => void
  durationHours?: number
}

export function ExtrasSelector({
  extras,
  selectedExtras,
  onExtrasChange,
  durationHours = 1,
}: ExtrasSelectorProps) {
  const toggleExtra = (extra: Extra) => {
    const existing = selectedExtras.find(e => e.extra.id === extra.id)
    if (existing) {
      onExtrasChange(selectedExtras.filter(e => e.extra.id !== extra.id))
    } else {
      const quantity = extra.price_type === 'per_hour' ? durationHours : 1
      onExtrasChange([...selectedExtras, { extra, quantity }])
    }
  }

  const updateQuantity = (extraId: string, quantity: number) => {
    if (quantity < 1) {
      onExtrasChange(selectedExtras.filter(e => e.extra.id !== extraId))
      return
    }
    onExtrasChange(
      selectedExtras.map(e =>
        e.extra.id === extraId ? { ...e, quantity } : e
      )
    )
  }

  const calculatePrice = (extra: Extra, quantity: number): number => {
    return extra.price * quantity
  }

  if (extras.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">Nincs elérhető kiegészítő</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="font-bugrino text-lg uppercase tracking-wider mb-1">
          Kiegészítők
        </h3>
        <p className="text-sm text-gray-500">
          Válassza ki a kívánt extra szolgáltatásokat
        </p>
      </div>

      <div className="space-y-3">
        {extras.map(extra => {
          const selected = selectedExtras.find(e => e.extra.id === extra.id)
          const isSelected = !!selected

          return (
            <div
              key={extra.id}
              className={`
                p-5 border-[3px] bg-white transition-all
                ${isSelected
                  ? 'border-black translate-x-[-2px] translate-y-[-2px]'
                  : 'border-black'
                }
              `}
              style={{
                boxShadow: isSelected
                  ? '6px 6px 0 var(--bauhaus-yellow)'
                  : '4px 4px 0 var(--bauhaus-black)',
              }}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => toggleExtra(extra)}
                  className={`
                    mt-1 w-6 h-6 border-[3px] flex items-center justify-center transition-colors flex-shrink-0
                    ${isSelected
                      ? 'bg-[var(--bauhaus-yellow)] border-black'
                      : 'bg-white border-black hover:bg-gray-50'
                    }
                  `}
                >
                  {isSelected && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor">
                      <path strokeLinecap="square" strokeLinejoin="miter" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bugrino uppercase tracking-wide">{extra.name}</p>
                  {extra.description && (
                    <p className="text-sm text-gray-500 mt-1">{extra.description}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-bugrino">{extra.price.toLocaleString('hu-HU')} Ft</span>
                    {extra.price_type === 'per_hour' && ' / óra'}
                    {extra.price_type === 'per_person' && ' / fő'}
                  </p>
                </div>

                {/* Quantity controls */}
                {isSelected && extra.price_type !== 'fixed' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(extra.id, (selected?.quantity || 1) - 1)}
                      className="w-8 h-8 border-[2px] border-black flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M19.5 12h-15" />
                      </svg>
                    </button>
                    <span className="w-10 text-center font-bugrino text-lg">
                      {selected?.quantity || 1}
                    </span>
                    <button
                      onClick={() => updateQuantity(extra.id, (selected?.quantity || 1) + 1)}
                      className="w-8 h-8 border-[2px] border-black flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Price */}
                {isSelected && (
                  <div className="text-right flex-shrink-0">
                    <p className="font-bugrino text-lg">
                      {calculatePrice(extra, selected?.quantity || 1).toLocaleString('hu-HU')}
                      <span className="text-sm ml-1">Ft</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
