'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'

interface CouponData {
  id: string
  code: string
  discount_percent: number
}

interface CouponInputProps {
  onCouponApplied: (coupon: CouponData | null) => void
  appliedCoupon: CouponData | null
}

export function CouponInput({ onCouponApplied, appliedCoupon }: CouponInputProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleApply = async () => {
    if (!code.trim()) return

    setLoading(true)
    setError(null)

    const { data, error: rpcError } = await supabase
      .rpc('validate_coupon', { coupon_code_input: code.trim() })

    if (rpcError) {
      setError('Hiba történt a kupon ellenőrzése közben')
      setLoading(false)
      return
    }

    if (data && data.length > 0) {
      const result = data[0]
      if (result.is_valid) {
        onCouponApplied({
          id: result.coupon_id,
          code: result.code,
          discount_percent: result.discount_percent,
        })
        setCode('')
      } else {
        setError(result.error_message || 'Érvénytelen kuponkód')
      }
    } else {
      setError('Érvénytelen kuponkód')
    }

    setLoading(false)
  }

  const handleRemove = () => {
    onCouponApplied(null)
    setError(null)
  }

  if (appliedCoupon) {
    return (
      <div
        className="p-4 border-[3px] border-green-500"
        style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-[2px] border-green-600 flex items-center justify-center"
              style={{ backgroundColor: '#22c55e' }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-mono font-bold text-green-700">{appliedCoupon.code}</p>
              <p className="text-sm text-green-600">
                {appliedCoupon.discount_percent}% kedvezmény alkalmazva
              </p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <label className="block font-bugrino text-xs uppercase tracking-wider text-gray-500">
        Kuponkód
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="KUPONKOD"
          className="flex-1 px-4 py-2 border-[2px] border-gray-300 bg-white focus:border-black outline-none transition-colors font-mono uppercase text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />
        <BauhausButton
          onClick={handleApply}
          disabled={loading || !code.trim()}
          variant="default"
          size="sm"
        >
          {loading ? '...' : 'Alkalmaz'}
        </BauhausButton>
      </div>
      {error && (
        <p className="text-sm text-[var(--bauhaus-red)]">{error}</p>
      )}
    </div>
  )
}
