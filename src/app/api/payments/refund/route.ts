import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getStripe } from '@/lib/stripe/client'

const requestSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  amount: z.number().optional(), // Partial refund amount in HUF (zero-decimal)
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

    const { bookingId, amount } = validation.data

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

    // Admin check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, stripe_payment_intent_id, payment_method, total_price')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Foglalás nem található' },
        { status: 404 }
      )
    }

    if (booking.payment_method !== 'card' || !booking.stripe_payment_intent_id) {
      return NextResponse.json(
        { success: false, error: 'Ez a foglalás nem bankkártyával lett fizetve' },
        { status: 400 }
      )
    }

    // Create Stripe refund
    const stripe = getStripe()
    const refundParams: { payment_intent: string; amount?: number } = {
      payment_intent: booking.stripe_payment_intent_id,
    }

    if (amount !== undefined) {
      refundParams.amount = amount * 100 // HUF: amount in fillér
    }

    const refund = await stripe.refunds.create(refundParams)

    // Update booking with refund info
    await supabase
      .from('bookings')
      .update({
        stripe_refund_id: refund.id,
      })
      .eq('id', bookingId)

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
    })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { success: false, error: 'Hiba a visszatérítés során' },
      { status: 500 }
    )
  }
}
