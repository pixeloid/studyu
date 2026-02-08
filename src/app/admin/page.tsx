import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { hu } from 'date-fns/locale'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausBadge } from '@/components/ui/bauhaus/BauhausBadge'

export const metadata: Metadata = {
  title: 'Admin - Áttekintés',
}

export default async function AdminDashboard() {
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

  const today = new Date()
  const thisMonthStart = format(startOfMonth(today), 'yyyy-MM-dd')
  const thisMonthEnd = format(endOfMonth(today), 'yyyy-MM-dd')
  const lastMonthStart = format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd')
  const lastMonthEnd = format(endOfMonth(subMonths(today, 1)), 'yyyy-MM-dd')

  // Stats queries
  const [
    pendingBookings,
    thisMonthBookings,
    lastMonthBookings,
    totalUsers,
    upcomingBookings,
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('id', { count: 'exact' })
      .eq('status', 'pending'),
    supabase
      .from('bookings')
      .select('total_price')
      .gte('booking_date', thisMonthStart)
      .lte('booking_date', thisMonthEnd)
      .in('status', ['confirmed', 'paid', 'completed']),
    supabase
      .from('bookings')
      .select('total_price')
      .gte('booking_date', lastMonthStart)
      .lte('booking_date', lastMonthEnd)
      .in('status', ['confirmed', 'paid', 'completed']),
    supabase
      .from('profiles')
      .select('id', { count: 'exact' }),
    supabase
      .from('bookings')
      .select(`
        *,
        profiles (full_name, phone),
        time_slots (name, start_time, end_time)
      `)
      .gte('booking_date', format(today, 'yyyy-MM-dd'))
      .in('status', ['pending', 'confirmed', 'paid'])
      .order('booking_date', { ascending: true })
      .limit(10),
  ])

  const thisMonthRevenue = thisMonthBookings.data?.reduce((sum, b) => sum + b.total_price, 0) || 0
  const lastMonthRevenue = lastMonthBookings.data?.reduce((sum, b) => sum + b.total_price, 0) || 0
  const revenueChange = lastMonthRevenue > 0
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : 0

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-bauhaus-heading mb-2">Áttekintés</h1>
        <div className="flex items-center gap-2">
          <div className="w-8 h-[3px] bg-black" />
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
          />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Függő foglalások"
          value={pendingBookings.count || 0}
          href="/admin/foglalasok?status=pending"
          accentColor="yellow"
          icon={<ClockIcon />}
        />
        <StatCard
          title="Havi bevétel"
          value={`${thisMonthRevenue.toLocaleString('hu-HU')} Ft`}
          change={revenueChange}
          accentColor="blue"
          icon={<CurrencyIcon />}
        />
        <StatCard
          title="Foglalások (hónap)"
          value={thisMonthBookings.data?.length || 0}
          accentColor="red"
          icon={<CalendarIcon />}
        />
        <StatCard
          title="Felhasználók"
          value={totalUsers.count || 0}
          accentColor="blue"
          icon={<UsersIcon />}
        />
      </div>

      {/* Upcoming bookings table */}
      <BauhausCard padding="none">
        <div className="px-6 py-4 border-b-[3px] border-black flex items-center justify-between">
          <h2 className="font-bugrino text-lg uppercase tracking-wider">
            Közelgő foglalások
          </h2>
          <Link
            href="/admin/foglalasok"
            className="text-sm text-[var(--bauhaus-blue)] hover:underline font-medium"
          >
            Összes megtekintése
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b-[2px] border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-bugrino uppercase tracking-wider text-gray-500">
                  Dátum
                </th>
                <th className="px-6 py-4 text-left text-xs font-bugrino uppercase tracking-wider text-gray-500">
                  Időpont
                </th>
                <th className="px-6 py-4 text-left text-xs font-bugrino uppercase tracking-wider text-gray-500">
                  Ügyfél
                </th>
                <th className="px-6 py-4 text-left text-xs font-bugrino uppercase tracking-wider text-gray-500">
                  Összeg
                </th>
                <th className="px-6 py-4 text-left text-xs font-bugrino uppercase tracking-wider text-gray-500">
                  Státusz
                </th>
              </tr>
            </thead>
            <tbody>
              {upcomingBookings.data?.map((booking, index) => (
                <tr
                  key={booking.id}
                  className={`
                    hover:bg-gray-50 transition-colors
                    ${index !== (upcomingBookings.data?.length ?? 0) - 1 ? 'border-b border-gray-100' : ''}
                  `}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full border-[2px] border-black flex items-center justify-center font-bugrino text-sm"
                        style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
                      >
                        {format(new Date(booking.booking_date), 'd')}
                      </div>
                      <span className="text-sm text-gray-900">
                        {format(new Date(booking.booking_date), 'MMM', { locale: hu })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {booking.time_slots?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.profiles?.full_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {booking.profiles?.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bugrino text-sm">
                      {booking.total_price.toLocaleString('hu-HU')} Ft
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={booking.status} />
                  </td>
                </tr>
              ))}
              {(!upcomingBookings.data || upcomingBookings.data.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-16 h-16 rounded-full border-[3px] border-gray-200 flex items-center justify-center mb-4"
                      >
                        <CalendarIcon className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500">Nincs közelgő foglalás</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </BauhausCard>
    </div>
  )
}

function StatCard({
  title,
  value,
  change,
  href,
  accentColor,
  icon,
}: {
  title: string
  value: string | number
  change?: number
  href?: string
  accentColor: 'yellow' | 'blue' | 'red'
  icon: React.ReactNode
}) {
  const colors = {
    yellow: 'var(--bauhaus-yellow)',
    blue: 'var(--bauhaus-blue)',
    red: 'var(--bauhaus-red)',
  }

  const content = (
    <BauhausCard
      padding="md"
      accentColor={accentColor}
      hasCornerAccent
      accentPosition="top-right"
      className={href ? 'hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform' : ''}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-full border-[3px] border-black flex items-center justify-center ${accentColor === 'yellow' ? 'text-black' : 'text-white'}`}
          style={{ backgroundColor: colors[accentColor] }}
        >
          {icon}
        </div>
        {change !== undefined && (
          <span
            className={`font-bugrino text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</p>
      <p className="font-bugrino text-2xl">{value}</p>
    </BauhausCard>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'yellow' | 'blue' | 'red' | 'outline'> = {
    pending: 'yellow',
    confirmed: 'blue',
    paid: 'blue',
    completed: 'outline',
    cancelled: 'red',
  }

  const labels: Record<string, string> = {
    pending: 'Függőben',
    confirmed: 'Visszaigazolva',
    paid: 'Fizetve',
    completed: 'Teljesítve',
    cancelled: 'Lemondva',
  }

  return (
    <BauhausBadge variant={variants[status] || 'outline'}>
      {labels[status] || status}
    </BauhausBadge>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}
