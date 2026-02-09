'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausBadge } from '@/components/ui/bauhaus/BauhausBadge'

interface BookingDetail {
  id: string
  booking_date: string
  booking_type: string
  base_price: number
  extras_price: number | null
  discount_percent: number | null
  total_price: number
  status: string
  user_notes: string | null
  admin_notes: string | null
  start_time: string | null
  end_time: string | null
  duration_hours: number | null
  proforma_sent_at: string | null
  proforma_number: string | null
  proforma_url: string | null
  invoice_number: string | null
  invoice_url: string | null
  paid_at: string | null
  cancelled_at: string | null
  cancellation_fee: number | null
  cancellation_reason: string | null
  created_at: string | null
  profiles: {
    id: string
    full_name: string
    phone: string | null
    company_name: string | null
    tax_number: string | null
  } | null
  time_slots: {
    name: string
    start_time: string
    end_time: string
  } | null
  booking_extras: {
    id: string
    quantity: number | null
    unit_price: number
    total_price: number
    extras: {
      name: string
    } | null
  }[]
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadBooking()
  }, [])

  const loadBooking = async () => {
    const { id } = await params
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles (id, full_name, phone, company_name, tax_number),
        time_slots (name, start_time, end_time),
        booking_extras (
          id,
          quantity,
          unit_price,
          total_price,
          extras (name)
        )
      `)
      .eq('id', id)
      .single()

    if (data) {
      setBooking(data as BookingDetail)
      setAdminNotes(data.admin_notes || '')
    }
    setLoading(false)
  }

  const updateStatus = async (newStatus: string) => {
    if (!booking) return
    setSaving(true)
    setMessage(null)

    const updateData: Record<string, any> = { status: newStatus }

    if (newStatus === 'paid') {
      updateData.paid_at = new Date().toISOString()
    } else if (newStatus === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', booking.id)

    if (error) {
      setMessage({ type: 'error', text: 'Hiba történt a státusz módosítása során' })
      setSaving(false)
      return
    }

    const messages: string[] = ['Státusz módosítva!']

    // Helper to send typed email
    const sendEmail = async (type: string) => {
      try {
        const emailRes = await fetch('/api/admin/bookings/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id, type }),
        })
        const emailResult = await emailRes.json()
        if (emailResult.success) {
          messages.push('Email elküldve')
        } else {
          messages.push(`Email hiba: ${emailResult.error}`)
        }
      } catch {
        messages.push('Email küldése sikertelen')
      }
    }

    // Helper to sync with Google Calendar
    const syncCalendar = async (action: 'create' | 'update' | 'delete') => {
      try {
        const calRes = await fetch('/api/admin/bookings/calendar-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id, action }),
        })
        const calResult = await calRes.json()
        if (calResult.success && !calResult.skipped) {
          messages.push('Naptár szinkronizálva')
        }
      } catch {
        // Calendar sync is non-critical, don't show error
      }
    }

    // Confirmed: generate proforma + send confirmation email + send proforma email
    if (newStatus === 'confirmed') {
      if (!booking.proforma_number) {
        try {
          const proformaRes = await fetch('/api/invoices/proforma', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: booking.id }),
          })
          const proformaResult = await proformaRes.json()
          if (proformaResult.success) {
            messages.push(`Díjbekérő: ${proformaResult.proformaNumber}`)
          } else {
            messages.push(`Díjbekérő hiba: ${proformaResult.error}`)
          }
        } catch {
          messages.push('Díjbekérő generálása sikertelen')
        }
      }
      await sendEmail('confirmed')
      // Reload to get proforma_url before sending proforma email
      const { data: freshBooking } = await supabase
        .from('bookings')
        .select('proforma_number, proforma_url')
        .eq('id', booking.id)
        .single()
      if (freshBooking?.proforma_number) {
        await sendEmail('proforma')
      }
      await syncCalendar('create')
    }

    // Paid: generate final invoice + send payment confirmation email
    if (newStatus === 'paid') {
      if (!booking.invoice_number) {
        try {
          const invoiceRes = await fetch('/api/invoices/final', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: booking.id }),
          })
          const invoiceResult = await invoiceRes.json()
          if (invoiceResult.success) {
            messages.push(`Számla: ${invoiceResult.invoiceNumber}`)
          } else {
            messages.push(`Számla hiba: ${invoiceResult.error}`)
          }
        } catch {
          messages.push('Számla generálása sikertelen')
        }
      }
      await sendEmail('paid')
      await syncCalendar('update')
    }

    // Completed: send thank you email
    if (newStatus === 'completed') {
      await sendEmail('completed')
      await syncCalendar('update')
    }

    // Cancelled: delete calendar event
    if (newStatus === 'cancelled') {
      await syncCalendar('delete')
    }

    setMessage({ type: 'success', text: messages.join(' | ') })

    loadBooking()
    setSaving(false)
  }

  const saveAdminNotes = async () => {
    if (!booking) return
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('bookings')
      .update({ admin_notes: adminNotes || null })
      .eq('id', booking.id)

    if (error) {
      setMessage({ type: 'error', text: 'Hiba történt a megjegyzés mentése során' })
    } else {
      setMessage({ type: 'success', text: 'Megjegyzés mentve!' })
    }
    setSaving(false)
  }

  const generateProforma = async () => {
    if (!booking) return
    setGeneratingInvoice(true)
    setMessage(null)

    try {
      const response = await fetch('/api/invoices/proforma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: `Díjbekérő sikeresen generálva: ${result.proformaNumber}` })
        loadBooking()
      } else {
        setMessage({ type: 'error', text: result.error || 'Hiba a díjbekérő generálása során' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Hiba a díjbekérő generálása során' })
    }

    setGeneratingInvoice(false)
  }

  const generateFinalInvoice = async () => {
    if (!booking) return
    setGeneratingInvoice(true)
    setMessage(null)

    try {
      const response = await fetch('/api/invoices/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: `Számla sikeresen generálva: ${result.invoiceNumber}` })
        loadBooking()
      } else {
        setMessage({ type: 'error', text: result.error || 'Hiba a számla generálása során' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Hiba a számla generálása során' })
    }

    setGeneratingInvoice(false)
  }

  const sendConfirmationEmail = async () => {
    if (!booking) return
    setSendingEmail(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/bookings/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Visszaigazoló email sikeresen elküldve!'
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'Hiba az email küldése során' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Hiba az email küldése során' })
    }

    setSendingEmail(false)
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 w-48 bg-gray-200 mb-8" />
        <div className="h-96 bg-gray-100 border-[3px] border-gray-200" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <div
          className="w-16 h-16 rounded-full border-[3px] border-gray-200 flex items-center justify-center mx-auto mb-4"
        >
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <p className="font-bugrino text-sm uppercase tracking-wider text-gray-500">Foglalás nem található</p>
        <Link href="/admin/foglalasok" className="mt-4 inline-block font-bugrino text-sm uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline">
          Vissza a foglalásokhoz
        </Link>
      </div>
    )
  }

  const statusVariants: Record<string, 'yellow' | 'blue' | 'red' | 'outline' | 'black'> = {
    pending: 'yellow',
    confirmed: 'blue',
    paid: 'blue',
    completed: 'black',
    cancelled: 'red',
    no_show: 'red',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Függőben',
    confirmed: 'Visszaigazolva',
    paid: 'Fizetve',
    completed: 'Teljesítve',
    cancelled: 'Lemondva',
    no_show: 'Nem jelent meg',
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/foglalasok"
            className="w-10 h-10 border-[3px] border-black flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
            style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div>
            <h1 className="text-bauhaus-heading">Foglalás részletei</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-[3px] bg-black" />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-blue)' }} />
            </div>
          </div>
          <BauhausBadge variant={statusVariants[booking.status] || 'outline'}>
            {statusLabels[booking.status] || booking.status}
          </BauhausBadge>
        </div>
      </div>

      {/* Workflow progress */}
      {booking.status !== 'cancelled' && booking.status !== 'no_show' && (
        <div className="mb-8">
          <div className="flex items-center">
            {[
              { key: 'pending', label: 'Függőben', icon: '1' },
              { key: 'confirmed', label: 'Visszaigazolva', icon: '2', detail: booking.proforma_number ? `Díjbekérő: ${booking.proforma_number}` : null },
              { key: 'paid', label: 'Fizetve', icon: '3', detail: booking.invoice_number ? `Számla: ${booking.invoice_number}` : null },
              { key: 'completed', label: 'Teljesítve', icon: '4' },
            ].map((step, i, arr) => {
              const statusOrder = ['pending', 'confirmed', 'paid', 'completed']
              const currentIndex = statusOrder.indexOf(booking.status)
              const stepIndex = statusOrder.indexOf(step.key)
              const isDone = stepIndex < currentIndex
              const isCurrent = stepIndex === currentIndex
              const isUpcoming = stepIndex > currentIndex

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full border-[3px] flex items-center justify-center font-bugrino text-sm transition-all ${
                        isDone
                          ? 'border-black bg-black text-white'
                          : isCurrent
                          ? 'border-[var(--bauhaus-blue)] bg-[var(--bauhaus-blue)] text-white'
                          : 'border-gray-300 bg-white text-gray-300'
                      }`}
                    >
                      {isDone ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span className={`mt-2 text-xs font-bugrino uppercase tracking-wider ${
                      isDone || isCurrent ? 'text-black' : 'text-gray-300'
                    }`}>
                      {step.label}
                    </span>
                    {step.detail && (isDone || isCurrent) && (
                      <span className="text-[10px] text-gray-500 mt-0.5">{step.detail}</span>
                    )}
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`h-[3px] flex-1 -mt-6 ${
                      isDone ? 'bg-black' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking details */}
          <BauhausCard accentColor="yellow" hasCornerAccent accentPosition="top-left">
            <h2 className="font-bugrino text-lg uppercase tracking-wider mb-4">Foglalás adatai</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Dátum</dt>
                <dd className="flex items-center gap-3 mt-1">
                  <div
                    className="w-10 h-10 rounded-full border-[2px] border-black flex items-center justify-center font-bugrino text-sm"
                    style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
                  >
                    {format(new Date(booking.booking_date), 'd')}
                  </div>
                  <span className="text-sm font-medium">
                    {format(new Date(booking.booking_date), 'MMMM, EEEE', { locale: hu })}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Időpont</dt>
                <dd className="text-sm font-medium mt-1">
                  {booking.time_slots?.name || `Egyedi időpont`}<br />
                  <span className="text-gray-500">
                    ({booking.time_slots
                      ? `${booking.time_slots.start_time?.slice(0, 5)} - ${booking.time_slots.end_time?.slice(0, 5)}`
                      : `${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)}`
                    })
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Létrehozva</dt>
                <dd className="text-sm font-medium mt-1">
                  {booking.created_at && format(new Date(booking.created_at), 'yyyy.MM.dd HH:mm')}
                </dd>
              </div>
              {booking.paid_at && (
                <div>
                  <dt className="text-sm text-gray-500">Fizetve</dt>
                  <dd className="text-sm font-medium mt-1 text-green-600">
                    {format(new Date(booking.paid_at), 'yyyy.MM.dd HH:mm')}
                  </dd>
                </div>
              )}
            </dl>

            {booking.user_notes && (
              <div className="mt-4 p-4 border-[2px] border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ügyfél megjegyzése:</p>
                <p className="text-sm text-gray-900">{booking.user_notes}</p>
              </div>
            )}
          </BauhausCard>

          {/* Customer info */}
          <BauhausCard accentColor="blue" hasCornerAccent accentPosition="top-right">
            <h2 className="font-bugrino text-lg uppercase tracking-wider mb-4">Ügyfél adatai</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Név</dt>
                <dd className="text-sm font-medium mt-1">{booking.profiles?.full_name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Telefon</dt>
                <dd className="text-sm font-medium mt-1">{booking.profiles?.phone || '-'}</dd>
              </div>
              {booking.profiles?.company_name && (
                <>
                  <div>
                    <dt className="text-sm text-gray-500">Cégnév</dt>
                    <dd className="text-sm font-medium mt-1">{booking.profiles.company_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Adószám</dt>
                    <dd className="text-sm font-medium mt-1">{booking.profiles.tax_number || '-'}</dd>
                  </div>
                </>
              )}
            </dl>
          </BauhausCard>

          {/* Admin notes */}
          <BauhausCard>
            <h2 className="font-bugrino text-lg uppercase tracking-wider mb-4">Admin megjegyzés</h2>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Belső megjegyzés (csak adminok látják)"
              className="w-full px-4 py-3 border-[3px] border-black bg-white focus:shadow-[4px_4px_0_var(--bauhaus-black)] outline-none transition-shadow resize-none"
            />
            <BauhausButton
              onClick={saveAdminNotes}
              disabled={saving}
              className="mt-3"
            >
              Mentés
            </BauhausButton>
          </BauhausCard>

          {/* Cancellation info */}
          {booking.status === 'cancelled' && (
            <BauhausCard accentColor="red" hasCornerAccent accentPosition="bottom-left">
              <h2 className="font-bugrino text-lg uppercase tracking-wider mb-4 text-[var(--bauhaus-red)]">Lemondás információ</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-500">Lemondva</dt>
                  <dd className="text-sm font-medium mt-1">
                    {booking.cancelled_at && format(new Date(booking.cancelled_at), 'yyyy.MM.dd HH:mm')}
                  </dd>
                </div>
                {booking.cancellation_reason && (
                  <div>
                    <dt className="text-sm text-gray-500">Ok</dt>
                    <dd className="text-sm font-medium mt-1">{booking.cancellation_reason}</dd>
                  </div>
                )}
                {booking.cancellation_fee !== null && (
                  <div>
                    <dt className="text-sm text-gray-500">Lemondási díj</dt>
                    <dd className="text-sm font-medium mt-1 text-[var(--bauhaus-red)]">
                      {booking.cancellation_fee.toLocaleString('hu-HU')} Ft
                    </dd>
                  </div>
                )}
              </dl>
            </BauhausCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price breakdown */}
          <BauhausCard accentColor="yellow">
            <h2 className="font-bugrino text-lg uppercase tracking-wider mb-4">Árak</h2>
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Alapár</dt>
                <dd className="font-bugrino">{booking.base_price.toLocaleString('hu-HU')} Ft</dd>
              </div>
              {booking.booking_extras.map((be) => (
                <div key={be.id} className="flex justify-between text-sm">
                  <dt className="text-gray-500">
                    {be.extras?.name} {(be.quantity ?? 1) > 1 && `(${be.quantity}x)`}
                  </dt>
                  <dd className="font-bugrino">{be.total_price.toLocaleString('hu-HU')} Ft</dd>
                </div>
              ))}
              {(booking.discount_percent ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <dt>Kedvezmény ({booking.discount_percent}%)</dt>
                  <dd className="font-bugrino">-{Math.round(booking.total_price * (booking.discount_percent ?? 0) / 100).toLocaleString('hu-HU')} Ft</dd>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold border-t-[3px] border-black pt-3 mt-3">
                <dt>Összesen</dt>
                <dd className="font-bugrino">{booking.total_price.toLocaleString('hu-HU')} Ft</dd>
              </div>
            </dl>
          </BauhausCard>

          {/* Actions */}
          <BauhausCard accentColor="blue">
            <h2 className="font-bugrino text-lg uppercase tracking-wider mb-4">Műveletek</h2>
            <div className="space-y-3">
              {booking.status === 'pending' && (
                <BauhausButton
                  onClick={() => updateStatus('confirmed')}
                  disabled={saving}
                  variant="primary"
                  className="w-full"
                >
                  Visszaigazolás
                </BauhausButton>
              )}
              {booking.status === 'confirmed' && (
                <BauhausButton
                  onClick={() => updateStatus('paid')}
                  disabled={saving}
                  variant="primary"
                  className="w-full"
                >
                  Fizetett megjelölése
                </BauhausButton>
              )}
              {booking.status === 'paid' && (
                <BauhausButton
                  onClick={() => updateStatus('completed')}
                  disabled={saving}
                  variant="default"
                  className="w-full"
                >
                  Teljesített megjelölése
                </BauhausButton>
              )}
              {['pending', 'confirmed'].includes(booking.status) && (
                <BauhausButton
                  onClick={() => {
                    if (confirm('Biztosan lemondja ezt a foglalást?')) {
                      updateStatus('cancelled')
                    }
                  }}
                  disabled={saving}
                  variant="danger"
                  className="w-full"
                >
                  Lemondás
                </BauhausButton>
              )}
              {/* Resend confirmation email */}
              {['pending', 'confirmed', 'paid'].includes(booking.status) && (
                <button
                  onClick={sendConfirmationEmail}
                  disabled={sendingEmail}
                  className="w-full px-4 py-3 border-[3px] border-black bg-white text-black font-bugrino text-sm uppercase tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {sendingEmail ? 'Küldés...' : 'Email újraküldése'}
                </button>
              )}
            </div>
          </BauhausCard>

          {/* Invoicing */}
          <BauhausCard accentColor="red">
            <h2 className="font-bugrino text-lg uppercase tracking-wider mb-4">Számlázás</h2>
            <div className="space-y-4 text-sm">
              {booking.proforma_number ? (
                <div>
                  <p className="text-gray-500">Díjbekérő</p>
                  <p className="font-bugrino font-medium">{booking.proforma_number}</p>
                  {booking.proforma_url && (
                    <a
                      href={booking.proforma_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
                    >
                      Letöltés
                    </a>
                  )}
                </div>
              ) : (
                <button
                  onClick={generateProforma}
                  disabled={generatingInvoice}
                  className="w-full px-4 py-3 border-[3px] border-black bg-white text-black font-bugrino text-sm uppercase tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform disabled:opacity-50"
                  style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
                >
                  {generatingInvoice ? 'Generálás...' : 'Díjbekérő generálása'}
                </button>
              )}
              {booking.invoice_number ? (
                <div>
                  <p className="text-gray-500">Számla</p>
                  <p className="font-bugrino font-medium">{booking.invoice_number}</p>
                  {booking.invoice_url && (
                    <a
                      href={booking.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
                    >
                      Letöltés
                    </a>
                  )}
                </div>
              ) : booking.status === 'paid' ? (
                <button
                  onClick={generateFinalInvoice}
                  disabled={generatingInvoice}
                  className="w-full px-4 py-3 border-[3px] border-black bg-white text-black font-bugrino text-sm uppercase tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform disabled:opacity-50"
                  style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
                >
                  {generatingInvoice ? 'Generálás...' : 'Számla generálása'}
                </button>
              ) : null}
            </div>
          </BauhausCard>
        </div>
      </div>
    </div>
  )
}
