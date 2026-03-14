'use client'

import { useState } from 'react'

export default function PaymentButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })

      const result = await res.json()

      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else {
        setError(result.error || 'Hiba történt')
      }
    } catch {
      setError('Hiba a fizetési link létrehozása során')
    }

    setLoading(false)
  }

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="inline-block px-8 py-4 bg-[#059669] text-white font-bugrino text-sm uppercase tracking-wider border-[3px] border-black hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform disabled:opacity-50"
        style={{ boxShadow: '4px 4px 0 #000' }}
      >
        {loading ? 'Átirányítás...' : 'Fizetés bankkártyával'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
