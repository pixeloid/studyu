import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import type { Metadata } from 'next'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausBadge } from '@/components/ui/bauhaus/BauhausBadge'

export const metadata: Metadata = {
  title: 'Áttekintés',
}

export default async function DashboardPage() {
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

  // Get upcoming bookings
  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select(`
      *,
      time_slots (name, start_time, end_time)
    `)
    .eq('user_id', user!.id)
    .gte('booking_date', new Date().toISOString().split('T')[0])
    .in('status', ['pending', 'confirmed', 'paid'])
    .order('booking_date', { ascending: true })
    .limit(5)

  // Get recent bookings
  const { data: recentBookings } = await supabase
    .from('bookings')
    .select(`
      *,
      time_slots (name, start_time, end_time)
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-bauhaus-heading mb-2">Áttekintés</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[3px] bg-black" />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-blue)' }} />
          </div>
        </div>
        <Link href="/foglalas">
          <BauhausButton variant="primary">Új foglalás</BauhausButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Upcoming bookings */}
        <BauhausCard padding="none" accentColor="blue" hasCornerAccent accentPosition="top-left">
          <div
            className="px-6 py-4 border-b-[3px] border-black"
            style={{ backgroundColor: 'var(--bauhaus-blue)' }}
          >
            <h2 className="font-bugrino text-lg uppercase tracking-wider text-white">
              Közelgő foglalások
            </h2>
          </div>
          <div className="p-6">
            {upcomingBookings && upcomingBookings.length > 0 ? (
              <ul className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex items-center justify-between p-4 border-[2px] border-black"
                    style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full border-[2px] border-black flex items-center justify-center font-bugrino"
                        style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
                      >
                        {format(new Date(booking.booking_date), 'd')}
                      </div>
                      <div>
                        <p className="font-bugrino uppercase tracking-wider">
                          {format(new Date(booking.booking_date), 'MMMM d., EEEE', { locale: hu })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {booking.time_slots
                            ? `${booking.time_slots.name} (${booking.time_slots.start_time?.slice(0, 5)} - ${booking.time_slots.end_time?.slice(0, 5)})`
                            : `Egyedi (${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)})`
                          }
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
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
                <Link href="/foglalas" className="font-bugrino text-sm uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline">
                  Foglaljon most
                </Link>
              </div>
            )}
          </div>
        </BauhausCard>

        {/* Recent activity */}
        <BauhausCard padding="none" accentColor="yellow" hasCornerAccent accentPosition="top-right">
          <div
            className="px-6 py-4 border-b-[3px] border-black"
            style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
          >
            <h2 className="font-bugrino text-lg uppercase tracking-wider">
              Legutóbbi foglalások
            </h2>
          </div>
          <div className="p-6">
            {recentBookings && recentBookings.length > 0 ? (
              <ul className="space-y-4">
                {recentBookings.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex items-center justify-between p-4 border-[2px] border-black hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
                    style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
                  >
                    <div>
                      <p className="font-bugrino uppercase tracking-wider text-sm">
                        {format(new Date(booking.booking_date), 'yyyy. MMMM d.', { locale: hu })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.time_slots?.name || `Egyedi (${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)})`}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={booking.status} />
                      <p className="mt-2 font-bugrino">
                        {booking.total_price.toLocaleString('hu-HU')} Ft
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 font-bugrino uppercase tracking-wider text-sm">
                  Még nincs foglalása
                </p>
              </div>
            )}
            {recentBookings && recentBookings.length > 0 && (
              <Link
                href="/dashboard/foglalasaim"
                className="mt-6 inline-block font-bugrino text-sm uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
              >
                Összes foglalás megtekintése
              </Link>
            )}
          </div>
        </BauhausCard>
      </div>

      {/* Quick actions */}
      <div className="mt-12">
        <h2 className="font-bugrino text-xl uppercase tracking-wider mb-6">Gyors műveletek</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href="/foglalas"
            icon={<CalendarIcon />}
            title="Új foglalás"
            description="Foglaljon időpontot a stúdióba"
            color="blue"
          />
          <QuickAction
            href="/dashboard/foglalasaim"
            icon={<ListIcon />}
            title="Foglalásaim"
            description="Tekintse meg foglalásait"
            color="yellow"
          />
          <QuickAction
            href="/dashboard/profil"
            icon={<UserIcon />}
            title="Profil"
            description="Személyes adatok szerkesztése"
            color="red"
          />
          <QuickAction
            href="/kapcsolat"
            icon={<ChatIcon />}
            title="Kapcsolat"
            description="Kérdése van? Írjon nekünk"
            color="black"
          />
        </div>
      </div>
    </div>
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

function QuickAction({
  href,
  icon,
  title,
  description,
  color,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  color: 'blue' | 'yellow' | 'red' | 'black'
}) {
  const colors = {
    blue: 'var(--bauhaus-blue)',
    yellow: 'var(--bauhaus-yellow)',
    red: 'var(--bauhaus-red)',
    black: 'var(--bauhaus-black)',
  }

  return (
    <Link
      href={href}
      className="group flex items-start gap-4 p-5 bg-white border-[3px] border-black hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
      style={{ boxShadow: '4px 4px 0 var(--bauhaus-black)' }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full border-[2px] border-black"
        style={{ backgroundColor: colors[color] }}
      >
        <span className={color === 'black' || color === 'blue' ? 'text-white' : 'text-black'}>
          {icon}
        </span>
      </div>
      <div>
        <p className="font-bugrino uppercase tracking-wider">{title}</p>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  )
}
