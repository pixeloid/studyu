import { getStripe } from './client'

interface BookingForCheckout {
  id: string
  total_price: number
  booking_date: string
  time_slots?: { name: string } | null
  start_time?: string | null
  end_time?: string | null
  profiles?: { full_name: string | null } | null
}

export async function createCheckoutSession(booking: BookingForCheckout, customerEmail: string) {
  const stripe = getStripe()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const slotLabel = booking.time_slots?.name
    || `Egyedi időpont (${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)})`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    locale: 'hu',
    customer_email: customerEmail,
    metadata: {
      booking_id: booking.id,
    },
    line_items: [
      {
        price_data: {
          currency: 'huf',
          unit_amount: booking.total_price * 100, // HUF: amount in fillér (35000 Ft = 3500000)
          product_data: {
            name: `StudyU Fotóstúdió - ${slotLabel}`,
            description: `Foglalás: ${booking.booking_date}`,
          },
        },
        quantity: 1,
      },
    ],
    expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24h expiry
    success_url: `${siteUrl}/dashboard/fizetes/siker?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/dashboard/fizetes/meghiusult?booking_id=${booking.id}`,
  })

  return session
}
