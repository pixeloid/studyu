'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { calculateCancellationFee, defaultCancellationPolicy, type CancellationRule } from '@/lib/cancellation/calculate-fee'

interface Booking {
  id: string
  booking_date: string
  base_price: number
  extras_price: number
  total_price: number
  status: string
  invoice_number: string | null
  booking_type: string
  start_time: string | null
  end_time: string | null
  duration_hours: number | null
  time_slots: {
    name: string
    start_time: string
    end_time: string
  } | null
  booking_extras: Array<{
    id: string
    quantity: number
    total_price: number
    extras: { name: string } | null
  }>
}

export default function CancellationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [policy, setPolicy] = useState<CancellationRule[]>(defaultCancellationPolicy)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadBooking()
    loadPolicy()
  }, [id])

  const loadBooking = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, booking_date, base_price, extras_price, total_price, status, invoice_number,
        time_slots (name, start_time, end_time),
        booking_extras (
          id, quantity, total_price,
          extras (name)
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      setError('Foglalás nem található')
      setLoading(false)
      return
    }

    // Check if booking can be cancelled
    if (!['pending', 'confirmed', 'paid'].includes(data.status)) {
      setError('Ez a foglalás már nem mondható le')
      setLoading(false)
      return
    }

    const bookingDate = new Date(data.booking_date)
    if (bookingDate < new Date()) {
      setError('Múltbeli foglalás nem mondható le')
      setLoading(false)
      return
    }

    setBooking(data as Booking)
    setLoading(false)
  }

  const loadPolicy = async () => {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'cancellation_policy')
      .single()

    if (data?.value && typeof data.value === 'object' && 'rules' in data.value) {
      const policyData = data.value as unknown as { rules: CancellationRule[] }
      setPolicy(policyData.rules)
    }
  }

  const handleCancel = async () => {
    if (!booking || !confirmed) return

    setCancelling(true)
    setError(null)

    try {
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          reason: reason || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Hiba történt a lemondás során')
        setCancelling(false)
        return
      }

      router.push('/dashboard/foglalasaim?cancelled=true')
    } catch {
      setError('Hiba történt a lemondás során')
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-10 w-48 bg-gray-200 mb-8" />
          <div className="h-96 bg-gray-100 border-[3px] border-gray-200" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <BauhausCard accentColor="red" hasCornerAccent accentPosition="top-left">
          <div className="py-8 text-center">
            <div
              className="w-16 h-16 rounded-full border-[3px] border-[var(--bauhaus-red)] flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(229, 57, 53, 0.1)' }}
            >
              <svg className="w-8 h-8 text-[var(--bauhaus-red)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <p className="font-bugrino text-sm uppercase tracking-wider text-[var(--bauhaus-red)]">{error}</p>
            <Link
              href="/dashboard/foglalasaim"
              className="mt-4 inline-block font-bugrino text-sm uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
            >
              Vissza a foglalásokhoz
            </Link>
          </div>
        </BauhausCard>
      </div>
    )
  }

  if (!booking) return null

  const { fee, feePercent, daysUntil } = calculateCancellationFee(
    new Date(booking.booking_date),
    booking.total_price,
    policy
  )

  const refundAmount = booking.total_price - fee

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/dashboard/foglalasaim"
          className="inline-flex items-center gap-2 font-bugrino text-sm uppercase tracking-wider text-gray-500 hover:text-black"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Vissza a foglalásokhoz
        </Link>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-bauhaus-heading mb-2">Foglalás lemondása</h1>
        <div className="flex items-center gap-2">
          <div className="w-8 h-[3px] bg-black" />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-red)' }} />
        </div>
      </div>

      {/* Booking summary */}
      <BauhausCard className="mb-6" accentColor="yellow" hasCornerAccent accentPosition="top-left">
        <h2 className="font-bugrino text-lg uppercase tracking-wider mb-4">Foglalás adatai</h2>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500">Dátum</dt>
            <dd className="font-medium flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full border-[2px] border-black flex items-center justify-center font-bugrino text-xs"
                style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
              >
                {format(new Date(booking.booking_date), 'd')}
              </div>
              {format(new Date(booking.booking_date), 'MMMM, EEEE', { locale: hu })}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Időpont</dt>
            <dd>
              {booking.time_slots
                ? `${booking.time_slots.name} (${booking.time_slots.start_time?.slice(0, 5)} - ${booking.time_slots.end_time?.slice(0, 5)})`
                : `Egyedi (${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)})`
              }
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Foglalás összege</dt>
            <dd className="font-bugrino font-medium">
              {booking.total_price.toLocaleString('hu-HU')} Ft
            </dd>
          </div>
          {booking.status === 'paid' && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Állapot</dt>
              <dd className="font-bugrino font-medium text-green-600">Fizetve</dd>
            </div>
          )}
        </dl>
      </BauhausCard>

      {/* Cancellation fee calculation */}
      <BauhausCard className="mb-6" accentColor="red" hasCornerAccent accentPosition="top-right">
        <h2 className="font-bugrino text-lg uppercase tracking-wider mb-4 text-[var(--bauhaus-red)]">Lemondási feltételek</h2>

        <div className="mb-4 p-3 border-[2px] border-gray-200 bg-gray-50">
          <p className="text-sm">
            A foglalás <span className="font-bugrino font-bold">{daysUntil} nap</span> múlva esedékes.
          </p>
        </div>

        <div className="mb-4 p-4 border-[2px] border-black bg-white">
          <h3 className="font-bugrino text-sm uppercase tracking-wider mb-3">Lemondási díjszabás:</h3>
          <ul className="text-sm space-y-2">
            <li className={`flex justify-between ${daysUntil >= 7 ? 'font-semibold text-green-700' : ''}`}>
              <span>7+ nap előtt:</span>
              <span className="font-bugrino">0% (ingyenes)</span>
            </li>
            <li className={`flex justify-between ${daysUntil >= 3 && daysUntil < 7 ? 'font-semibold text-[var(--bauhaus-yellow)]' : ''}`}>
              <span>3-7 nap előtt:</span>
              <span className="font-bugrino">50%</span>
            </li>
            <li className={`flex justify-between ${daysUntil >= 2 && daysUntil < 3 ? 'font-semibold text-orange-600' : ''}`}>
              <span>2-3 nap előtt:</span>
              <span className="font-bugrino">70%</span>
            </li>
            <li className={`flex justify-between ${daysUntil < 2 ? 'font-semibold text-[var(--bauhaus-red)]' : ''}`}>
              <span>24 órán belül:</span>
              <span className="font-bugrino">100%</span>
            </li>
          </ul>
        </div>

        <div className="border-t-[3px] border-gray-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Lemondási díj ({feePercent}%)</span>
            <span className="font-bugrino font-medium text-[var(--bauhaus-red)]">
              {fee.toLocaleString('hu-HU')} Ft
            </span>
          </div>
          {booking.status === 'paid' ? (
            <div className="flex justify-between text-lg">
              <span className="font-bugrino uppercase tracking-wider">Visszatérítés</span>
              <span className="font-bugrino font-bold text-green-600">
                {refundAmount.toLocaleString('hu-HU')} Ft
              </span>
            </div>
          ) : fee > 0 ? (
            <div className="mt-2 p-3 border-[2px] border-[var(--bauhaus-red)] bg-red-50">
              <p className="text-sm text-[var(--bauhaus-red)]">
                A lemondási díjról számlát állítunk ki, amelyet átutalással kell kiegyenlíteni.
              </p>
            </div>
          ) : null}
        </div>
      </BauhausCard>

      {/* Reason */}
      <BauhausCard className="mb-6">
        <label className="block font-bugrino text-sm uppercase tracking-wider mb-2">
          Lemondás oka (opcionális)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Kérjük, adja meg a lemondás okát..."
          rows={3}
          className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow resize-none"
        />
      </BauhausCard>

      {/* Confirmation */}
      <BauhausCard className="mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="relative mt-1">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-6 h-6 border-[3px] border-black transition-colors ${
                confirmed ? 'bg-[var(--bauhaus-red)]' : 'bg-white'
              }`}
            >
              {confirmed && (
                <svg className="w-4 h-4 text-white absolute top-0.5 left-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-gray-700">
            Megértettem és elfogadom, hogy a foglalás lemondása esetén{' '}
            {fee > 0 ? (
              <>
                <strong className="text-[var(--bauhaus-red)]">{fee.toLocaleString('hu-HU')} Ft</strong> lemondási díjat kell fizetnem
                {booking.status === 'paid' && (
                  <>, az eredeti számla sztornózásra kerül, és a visszatérítés összege <strong className="text-green-600">{refundAmount.toLocaleString('hu-HU')} Ft</strong></>
                )}
              </>
            ) : (
              'nincs lemondási díj'
            )}
            . A lemondás végleges és nem vonható vissza.
          </span>
        </label>
      </BauhausCard>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Link
          href="/dashboard/foglalasaim"
          className="font-bugrino text-sm uppercase tracking-wider text-gray-600 hover:text-black"
        >
          Mégsem
        </Link>
        <BauhausButton
          onClick={handleCancel}
          disabled={!confirmed || cancelling}
          variant="danger"
          size="lg"
        >
          {cancelling ? 'Lemondás folyamatban...' : 'Foglalás lemondása'}
        </BauhausButton>
      </div>
    </div>
  )
}
