import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausBadge } from '@/components/ui/bauhaus/BauhausBadge'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'

export const metadata: Metadata = {
  title: 'Foglalás részletei',
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string }>
}

export default async function BookingDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { success } = await searchParams

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      time_slots (name, start_time, end_time, duration_hours),
      booking_extras (
        id,
        quantity,
        unit_price,
        total_price,
        extras (name, description)
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !booking) {
    notFound()
  }

  const isPast = new Date(booking.booking_date) < new Date()
  const canCancel = !isPast && ['pending', 'confirmed'].includes(booking.status)

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
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
      {success && (
        <div
          className="mb-6 p-4 border-[3px] border-green-500 bg-green-50"
          style={{ boxShadow: '4px 4px 0 #22c55e' }}
        >
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
              <p className="font-bugrino text-sm uppercase tracking-wider text-green-800">Foglalás sikeresen létrehozva!</p>
              <p className="text-sm text-green-600">Hamarosan emailben visszaigazolást küldünk.</p>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/foglalasaim"
            className="w-10 h-10 border-[3px] border-black flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
            style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-bauhaus-heading">Foglalás részletei</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-[3px] bg-black" />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-yellow)' }} />
            </div>
          </div>
        </div>
        <BauhausBadge variant={statusVariants[booking.status] || 'outline'}>
          {statusLabels[booking.status] || booking.status}
        </BauhausBadge>
      </div>

      {/* Main card */}
      <BauhausCard padding="none" className="overflow-hidden">
        {/* Date and time */}
        <div className="p-6 border-b-[3px] border-gray-200">
          <h2 className="font-bugrino text-sm uppercase tracking-wider text-gray-500 mb-3">Időpont</h2>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full border-[3px] border-black flex flex-col items-center justify-center font-bugrino"
              style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
            >
              <span className="text-lg font-bold leading-none">{format(new Date(booking.booking_date), 'd')}</span>
              <span className="text-xs uppercase">{format(new Date(booking.booking_date), 'MMM', { locale: hu })}</span>
            </div>
            <div>
              <p className="text-lg font-semibold">
                {format(new Date(booking.booking_date), 'EEEE', { locale: hu })}
              </p>
              <p className="text-gray-600">
                {booking.time_slots?.name} ({booking.time_slots?.start_time?.slice(0, 5)} - {booking.time_slots?.end_time?.slice(0, 5)})
              </p>
              <p className="text-sm text-gray-500">
                {booking.time_slots?.duration_hours} óra
              </p>
            </div>
          </div>
        </div>

        {/* Extras */}
        {booking.booking_extras && booking.booking_extras.length > 0 && (
          <div className="p-6 border-b-[3px] border-gray-200">
            <h2 className="font-bugrino text-sm uppercase tracking-wider text-gray-500 mb-3">Kiegészítők</h2>
            <div className="space-y-3">
              {booking.booking_extras.map((be: any) => (
                <div key={be.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{be.extras?.name}</p>
                    {be.extras?.description && (
                      <p className="text-sm text-gray-500">{be.extras.description}</p>
                    )}
                    {be.quantity > 1 && (
                      <p className="text-sm text-gray-500">{be.quantity} db</p>
                    )}
                  </div>
                  <p className="font-bugrino">
                    {be.total_price.toLocaleString('hu-HU')} Ft
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {booking.user_notes && (
          <div className="p-6 border-b-[3px] border-gray-200">
            <h2 className="font-bugrino text-sm uppercase tracking-wider text-gray-500 mb-2">Megjegyzés</h2>
            <p>{booking.user_notes}</p>
          </div>
        )}

        {/* Total */}
        <div className="p-6" style={{ backgroundColor: 'var(--bauhaus-yellow)', opacity: 0.9 }}>
          <div className="flex justify-between items-center">
            <span className="font-bugrino text-lg uppercase tracking-wider">Összesen</span>
            <span className="font-bugrino text-2xl font-bold">
              {booking.total_price.toLocaleString('hu-HU')} Ft
            </span>
          </div>
        </div>
      </BauhausCard>

      {/* Payment info */}
      {booking.status === 'confirmed' && booking.proforma_url && (
        <div
          className="mt-6 p-4 border-[3px] border-[var(--bauhaus-yellow)] bg-yellow-50"
          style={{ boxShadow: '4px 4px 0 var(--bauhaus-yellow)' }}
        >
          <p className="text-yellow-800">
            Díjbekérő kiállítva. Kérjük, fizesse be a foglalás véglegesítéséhez.
          </p>
          <a
            href={booking.proforma_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 font-bugrino text-sm uppercase tracking-wider text-yellow-800 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Díjbekérő letöltése
          </a>
        </div>
      )}

      {booking.status === 'paid' && booking.invoice_url && (
        <div
          className="mt-6 p-4 border-[3px] border-green-500 bg-green-50"
          style={{ boxShadow: '4px 4px 0 #22c55e' }}
        >
          <p className="text-green-800">
            A foglalás fizetve. Számláját alább töltheti le.
          </p>
          <a
            href={booking.invoice_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 font-bugrino text-sm uppercase tracking-wider text-green-800 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Számla letöltése
          </a>
        </div>
      )}

      {/* Cancellation info */}
      {booking.status === 'cancelled' && (
        <div
          className="mt-6 p-4 border-[3px] border-[var(--bauhaus-red)] bg-red-50"
          style={{ boxShadow: '4px 4px 0 var(--bauhaus-red)' }}
        >
          <p className="text-[var(--bauhaus-red)]">
            <span className="font-bugrino uppercase tracking-wider">A foglalás lemondva.</span>
          </p>
          {booking.cancellation_reason && (
            <p className="mt-1 text-sm text-red-700">
              Lemondás oka: {booking.cancellation_reason}
            </p>
          )}
          {booking.cancellation_fee && booking.cancellation_fee > 0 && (
            <p className="mt-1 text-sm text-red-700">
              Lemondási díj: {booking.cancellation_fee.toLocaleString('hu-HU')} Ft
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-4">
        <Link href="/dashboard/foglalasaim" className="flex-1">
          <BauhausButton variant="default" className="w-full">
            Vissza a foglalásokhoz
          </BauhausButton>
        </Link>
        {canCancel && (
          <Link href={`/dashboard/foglalasaim/${booking.id}/lemondas`}>
            <BauhausButton variant="danger">
              Foglalás lemondása
            </BauhausButton>
          </Link>
        )}
      </div>

      {/* Booking ID for reference */}
      <p className="mt-8 text-center text-xs text-gray-400">
        Foglalás azonosító: {booking.id}
      </p>
    </div>
  )
}
