import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BauhausBadge } from '@/components/ui/bauhaus/BauhausBadge'

export const metadata: Metadata = {
  title: 'Admin - Foglalások',
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const params = await searchParams
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

  const statusFilter = params.status || 'all'
  const page = parseInt(params.page || '1')
  const perPage = 20
  const offset = (page - 1) * perPage

  let query = supabase
    .from('bookings')
    .select(`
      *,
      profiles (full_name, phone, email:id),
      time_slots (name, start_time, end_time)
    `, { count: 'exact' })
    .order('booking_date', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: bookings, count } = await query

  const totalPages = Math.ceil((count || 0) / perPage)

  const statuses = [
    { value: 'all', label: 'Összes' },
    { value: 'pending', label: 'Függőben' },
    { value: 'confirmed', label: 'Visszaigazolva' },
    { value: 'paid', label: 'Fizetve' },
    { value: 'completed', label: 'Teljesítve' },
    { value: 'cancelled', label: 'Lemondva' },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-bauhaus-heading mb-2">Foglalások</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[3px] bg-black" />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-blue)' }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="bg-white p-4 border-[3px] border-black mb-6"
        style={{ boxShadow: '4px 4px 0 var(--bauhaus-black)' }}
      >
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <Link
              key={s.value}
              href={`/admin/foglalasok${s.value !== 'all' ? `?status=${s.value}` : ''}`}
              className={`
                px-4 py-2 font-bugrino text-sm uppercase tracking-wider border-[2px] border-black
                transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]
                ${statusFilter === s.value
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-50'
                }
              `}
              style={{ boxShadow: statusFilter === s.value ? '3px 3px 0 var(--bauhaus-blue)' : 'none' }}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="bg-white border-[3px] border-black overflow-hidden"
        style={{ boxShadow: '4px 4px 0 var(--bauhaus-black)' }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead style={{ backgroundColor: 'var(--bauhaus-yellow)' }}>
              <tr className="border-b-[3px] border-black">
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Dátum
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Időpont
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Ügyfél
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Összeg
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Státusz
                </th>
                <th className="px-6 py-4 text-left font-bugrino text-xs uppercase tracking-wider">
                  Létrehozva
                </th>
                <th className="px-6 py-4 text-right font-bugrino text-xs uppercase tracking-wider">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings?.map((booking, index) => (
                <tr
                  key={booking.id}
                  className={`border-b-[2px] border-gray-200 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full border-[2px] border-black flex items-center justify-center font-bugrino text-sm"
                        style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
                      >
                        {format(new Date(booking.booking_date), 'd')}
                      </div>
                      <span className="font-bugrino text-sm">
                        {format(new Date(booking.booking_date), 'MMM', { locale: hu })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium">
                      {booking.time_slots?.name || `Egyedi (${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)})`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.time_slots
                        ? `${booking.time_slots.start_time?.slice(0, 5)} - ${booking.time_slots.end_time?.slice(0, 5)}`
                        : `${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)}`
                      }
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium">{booking.profiles?.full_name}</p>
                    <p className="text-xs text-gray-500">{booking.profiles?.phone}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bugrino">
                      {booking.total_price.toLocaleString('hu-HU')} Ft
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.created_at && format(new Date(booking.created_at), 'yyyy.MM.dd HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      href={`/admin/foglalasok/${booking.id}`}
                      className="font-bugrino text-xs uppercase tracking-wider text-[var(--bauhaus-blue)] hover:underline"
                    >
                      Részletek
                    </Link>
                  </td>
                </tr>
              ))}
              {(!bookings || bookings.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div
                      className="w-16 h-16 rounded-full border-[3px] border-gray-200 flex items-center justify-center mx-auto mb-4"
                    >
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    </div>
                    <p className="font-bugrino text-sm uppercase tracking-wider text-gray-500">
                      Nincs találat
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t-[3px] border-black flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-600">
              Összesen <span className="font-bugrino">{count}</span> foglalás
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/foglalasok?${statusFilter !== 'all' ? `status=${statusFilter}&` : ''}page=${page - 1}`}
                  className="px-4 py-2 text-sm font-bugrino uppercase tracking-wider border-[2px] border-black bg-white hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
                  style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
                >
                  Előző
                </Link>
              )}
              <span className="px-4 py-2 text-sm font-bugrino">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/admin/foglalasok?${statusFilter !== 'all' ? `status=${statusFilter}&` : ''}page=${page + 1}`}
                  className="px-4 py-2 text-sm font-bugrino uppercase tracking-wider border-[2px] border-black bg-white hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
                  style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
                >
                  Következő
                </Link>
              )}
            </div>
          </div>
        )}
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
