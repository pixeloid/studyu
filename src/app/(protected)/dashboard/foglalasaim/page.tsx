import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausBadge } from '@/components/ui/bauhaus/BauhausBadge'

export const metadata: Metadata = {
  title: 'Foglalásaim',
}

export default async function UserBookingsPage() {
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

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      time_slots (name, start_time, end_time),
      booking_extras (
        id,
        quantity,
        unit_price,
        total_price,
        extras (name)
      )
    `)
    .eq('user_id', user!.id)
    .order('booking_date', { ascending: false })

  const upcomingBookings = bookings?.filter(
    (b) => new Date(b.booking_date) >= new Date() && !['cancelled', 'completed', 'no_show'].includes(b.status)
  ) || []

  const pastBookings = bookings?.filter(
    (b) => new Date(b.booking_date) < new Date() || ['completed', 'no_show'].includes(b.status)
  ) || []

  const cancelledBookings = bookings?.filter((b) => b.status === 'cancelled') || []

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-bauhaus-heading mb-2">Foglalásaim</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[3px] bg-black" />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-yellow)' }} />
          </div>
        </div>
        <Link href="/foglalas">
          <BauhausButton variant="primary">Új foglalás</BauhausButton>
        </Link>
      </div>

      {/* Upcoming bookings */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: 'var(--bauhaus-blue)' }}
          />
          <h2 className="font-bugrino text-lg uppercase tracking-wider">Közelgő foglalások</h2>
        </div>
        {upcomingBookings.length > 0 ? (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <BauhausCard padding="lg">
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full border-[3px] border-gray-200 flex items-center justify-center mx-auto mb-4"
              >
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <p className="text-gray-500 font-bugrino uppercase tracking-wider text-sm mb-4">
                Nincs közelgő foglalása
              </p>
              <Link href="/foglalas">
                <BauhausButton variant="primary" size="sm">Foglaljon most</BauhausButton>
              </Link>
            </div>
          </BauhausCard>
        )}
      </section>

      {/* Past bookings */}
      {pastBookings.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
            />
            <h2 className="font-bugrino text-lg uppercase tracking-wider">Korábbi foglalások</h2>
          </div>
          <div className="space-y-4">
            {pastBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} isPast />
            ))}
          </div>
        </section>
      )}

      {/* Cancelled bookings */}
      {cancelledBookings.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: 'var(--bauhaus-red)' }}
            />
            <h2 className="font-bugrino text-lg uppercase tracking-wider">Lemondott foglalások</h2>
          </div>
          <div className="space-y-4">
            {cancelledBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} isCancelled />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function BookingCard({ booking, isPast = false, isCancelled = false }: { booking: any; isPast?: boolean; isCancelled?: boolean }) {
  const canCancel = !isPast && !isCancelled && ['pending', 'confirmed'].includes(booking.status)

  return (
    <BauhausCard
      padding="lg"
      className={isPast || isCancelled ? 'opacity-75' : ''}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Date circle */}
          <div
            className="w-14 h-14 rounded-full border-[3px] border-black flex flex-col items-center justify-center flex-shrink-0"
            style={{ backgroundColor: isCancelled ? 'var(--bauhaus-red)' : isPast ? '#e5e7eb' : 'var(--bauhaus-yellow)' }}
          >
            <span className={`font-bugrino text-lg leading-none ${isCancelled ? 'text-white' : ''}`}>
              {format(new Date(booking.booking_date), 'd')}
            </span>
            <span className={`font-bugrino text-[10px] uppercase ${isCancelled ? 'text-white' : 'text-gray-600'}`}>
              {format(new Date(booking.booking_date), 'MMM', { locale: hu })}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="font-bugrino uppercase tracking-wider">
                {format(new Date(booking.booking_date), 'EEEE', { locale: hu })}
              </p>
              <StatusBadge status={booking.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {booking.time_slots?.name} ({booking.time_slots?.start_time} - {booking.time_slots?.end_time})
            </p>

            {booking.booking_extras && booking.booking_extras.length > 0 && (
              <div className="mt-3">
                <p className="font-bugrino text-xs uppercase tracking-wider text-gray-700">Kiegészítők:</p>
                <ul className="mt-1 text-sm text-gray-500">
                  {booking.booking_extras.map((be: any) => (
                    <li key={be.id}>
                      {be.extras?.name} {be.quantity > 1 && `(${be.quantity}x)`} - {be.total_price.toLocaleString('hu-HU')} Ft
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {booking.user_notes && (
              <p className="mt-3 text-sm text-gray-600">
                <span className="font-bugrino uppercase tracking-wider text-xs">Megjegyzés:</span> {booking.user_notes}
              </p>
            )}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="font-bugrino text-xl">
            {booking.total_price.toLocaleString('hu-HU')}
            <span className="text-sm ml-1">Ft</span>
          </p>
          {booking.status === 'paid' && booking.invoice_url && (
            <a
              href={booking.invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
            >
              Számla letöltése
            </a>
          )}
          {canCancel && (
            <Link
              href={`/dashboard/foglalasaim/${booking.id}/lemondas`}
              className="mt-2 inline-block font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-red)] hover:underline"
            >
              Lemondás
            </Link>
          )}
        </div>
      </div>

      {/* Invoice/payment info */}
      {booking.status === 'confirmed' && booking.proforma_url && (
        <div
          className="mt-4 p-4 border-[3px] border-[var(--bauhaus-yellow)]"
          style={{ backgroundColor: 'rgba(245, 166, 35, 0.1)' }}
        >
          <p className="text-sm" style={{ color: 'var(--bauhaus-yellow)' }}>
            Díjbekérő kiállítva. Kérjük, fizesse be a foglalás véglegesítéséhez.
          </p>
          <a
            href={booking.proforma_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-bugrino text-xs uppercase tracking-wider hover:underline"
            style={{ color: 'var(--bauhaus-yellow)' }}
          >
            Díjbekérő letöltése
          </a>
        </div>
      )}

      {booking.status === 'cancelled' && booking.cancellation_reason && (
        <div
          className="mt-4 p-4 border-[3px] border-[var(--bauhaus-red)]"
          style={{ backgroundColor: 'rgba(229, 57, 53, 0.1)' }}
        >
          <p className="text-sm" style={{ color: 'var(--bauhaus-red)' }}>
            <span className="font-bugrino uppercase tracking-wider">Lemondás oka:</span> {booking.cancellation_reason}
          </p>
          {booking.cancellation_fee && booking.cancellation_fee > 0 && (
            <p className="mt-1 text-sm" style={{ color: 'var(--bauhaus-red)' }}>
              <span className="font-bugrino uppercase tracking-wider">Lemondási díj:</span> {booking.cancellation_fee.toLocaleString('hu-HU')} Ft
            </p>
          )}
        </div>
      )}
    </BauhausCard>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'yellow' | 'blue' | 'red' | 'outline' | 'black'> = {
    pending: 'yellow',
    confirmed: 'blue',
    paid: 'blue',
    completed: 'black',
    cancelled: 'red',
    no_show: 'red',
  }

  const labels: Record<string, string> = {
    pending: 'Függőben',
    confirmed: 'Visszaigazolva',
    paid: 'Fizetve',
    completed: 'Teljesítve',
    cancelled: 'Lemondva',
    no_show: 'Nem jelent meg',
  }

  return (
    <BauhausBadge variant={variants[status] || 'outline'}>
      {labels[status] || status}
    </BauhausBadge>
  )
}
