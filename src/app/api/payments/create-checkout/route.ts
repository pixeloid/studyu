import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { createCheckoutSession } from '@/lib/stripe/checkout'

const requestSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = requestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { bookingId } = validation.data

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

    // Auth check - user must own the booking
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles (full_name),
        time_slots (name)
      `)
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Foglalás nem található' },
        { status: 404 }
      )
    }

    // Only confirmed bookings can be paid
    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { success: false, error: 'Csak visszaigazolt foglalás fizethető' },
        { status: 400 }
      )
    }

    // Check if online payment is enabled
    const { data: onlinePaymentSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'online_payment')
      .single()

    const onlinePaymentEnabled = (onlinePaymentSetting?.value as any)?.enabled === true
    if (!onlinePaymentEnabled) {
      return NextResponse.json(
        { success: false, error: 'Online fizetés nincs engedélyezve' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout Session
    const session = await createCheckoutSession(booking, user.email!)

    // Update booking with checkout session info
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      await supabaseAdmin
        .from('bookings')
        .update({
          stripe_checkout_session_id: session.id,
          payment_link_url: session.url,
          payment_method: 'card',
        })
        .eq('id', bookingId)
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
    })
  } catch (error) {
    console.error('Create checkout error:', error)
    const message = error instanceof Error ? error.message : 'Hiba a fizetési link létrehozása során'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
