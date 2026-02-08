import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createBookingEvent,
  updateBookingEvent,
  deleteBookingEvent,
  isConnected,
} from '@/lib/google-calendar'

const requestSchema = z.object({
  bookingId: z.string().uuid(),
  action: z.enum(['create', 'update', 'delete']),
})

export async function POST(request: NextRequest) {
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

  // Check admin permission
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if Google Calendar is connected
  const connected = await isConnected()
  if (!connected) {
    return NextResponse.json({ success: true, skipped: true, message: 'Google Calendar not connected' })
  }

  // Validate request
  const body = await request.json()
  const validation = requestSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0]?.message || 'Invalid request' },
      { status: 400 }
    )
  }

  const { bookingId, action } = validation.data

  // Get booking with related data
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      *,
      profiles (full_name),
      time_slots (name, start_time, end_time)
    `)
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const eventData = {
    clientName: (booking.profiles as { full_name: string } | null)?.full_name || 'Ismeretlen',
    bookingDate: booking.booking_date,
    startTime: (booking.time_slots as { start_time: string } | null)?.start_time || '09:00',
    endTime: (booking.time_slots as { end_time: string } | null)?.end_time || '17:00',
    status: booking.status,
    totalPrice: booking.total_price,
    timeSlotName: (booking.time_slots as { name: string } | null)?.name || undefined,
    userNotes: booking.user_notes,
    adminNotes: booking.admin_notes,
  }

  try {
    if (action === 'delete' && booking.google_calendar_event_id) {
      await deleteBookingEvent(booking.google_calendar_event_id)
      await supabase
        .from('bookings')
        .update({ google_calendar_event_id: null })
        .eq('id', bookingId)
      return NextResponse.json({ success: true, action: 'deleted' })
    }

    if (action === 'update' && booking.google_calendar_event_id) {
      await updateBookingEvent(booking.google_calendar_event_id, eventData)
      return NextResponse.json({ success: true, action: 'updated' })
    }

    if (action === 'create' || (action === 'update' && !booking.google_calendar_event_id)) {
      const eventId = await createBookingEvent(eventData)
      if (eventId) {
        await supabase
          .from('bookings')
          .update({ google_calendar_event_id: eventId })
          .eq('id', bookingId)
      }
      return NextResponse.json({ success: true, action: 'created', eventId })
    }

    return NextResponse.json({ success: true, action: 'noop' })
  } catch (err) {
    console.error('Calendar sync error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
