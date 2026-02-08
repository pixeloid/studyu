import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { format, addDays } from 'date-fns'
import { hu } from 'date-fns/locale'
import { sendBookingReminder } from '@/lib/email'

// This endpoint should be called by a cron job daily
// It sends reminders for bookings happening tomorrow

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get tomorrow's date
  const tomorrow = addDays(new Date(), 1)
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd')

  // Get bookings for tomorrow that haven't been reminded
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      profiles (full_name, email:id),
      time_slots (name, start_time, end_time)
    `)
    .eq('booking_date', tomorrowStr)
    .in('status', ['confirmed', 'paid'])

  if (error) {
    console.error('Failed to fetch bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }

  // Get contact info for studio address
  const { data: settings } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'contact_info')
    .single()

  const studioAddress = (settings?.value as { address?: string } | null)?.address || 'StudyU Stúdió'

  // Get user emails from auth.users
  const userIds = bookings?.map(b => b.user_id) || []
  const { data: users } = await supabase.auth.admin.listUsers()
  const userEmailMap = new Map(
    users?.users?.map(u => [u.id, u.email]) || []
  )

  const results = []

  for (const booking of bookings || []) {
    const email = userEmailMap.get(booking.user_id)
    if (!email) continue

    const result = await sendBookingReminder({
      to: email,
      customerName: booking.profiles?.full_name || 'Kedves Vendégünk',
      bookingDate: format(new Date(booking.booking_date), 'yyyy. MMMM d., EEEE', { locale: hu }),
      timeSlot: `${booking.time_slots?.name} (${booking.time_slots?.start_time} - ${booking.time_slots?.end_time})`,
      studioAddress,
    })

    results.push({
      bookingId: booking.id,
      email,
      success: result.success,
    })
  }

  return NextResponse.json({
    date: tomorrowStr,
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  })
}
