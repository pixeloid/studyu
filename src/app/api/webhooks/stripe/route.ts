import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe/client'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Only handle checkout.session.completed
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const bookingId = session.metadata?.booking_id

  if (!bookingId) {
    console.error('No booking_id in checkout session metadata')
    return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 })
  }

  // Use service role for DB updates
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Get booking - idempotency check
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      profiles (full_name, phone, company_name, tax_number, billing_address),
      time_slots (name, start_time, end_time, duration_hours),
      booking_extras (quantity, unit_price, total_price, extras (name))
    `)
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    console.error('Booking not found:', bookingId)
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Idempotency: skip if already paid
  if (booking.status === 'paid') {
    return NextResponse.json({ received: true, already_paid: true })
  }

  // Update booking status to paid
  const { error: updateError } = await supabaseAdmin
    .from('bookings')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: 'card',
      stripe_payment_intent_id: session.payment_intent as string,
    })
    .eq('id', bookingId)

  if (updateError) {
    console.error('Failed to update booking:', updateError)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }

  // Generate final invoice with payment_method: 'card'
  try {
    const { format } = await import('date-fns')
    const { hu } = await import('date-fns/locale')
    const { createInvoice } = await import('@/lib/szamlazz')

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(booking.user_id)
    const billingAddress = booking.profiles?.billing_address as { zip?: string; city?: string; street?: string } | null

    const slotLabel = booking.time_slots?.name
      || `Egyedi időpont (${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)})`

    const items = [
      {
        name: `Stúdió bérlés - ${slotLabel} (${format(new Date(booking.booking_date), 'yyyy. MMMM d.', { locale: hu })})`,
        quantity: 1,
        unit: 'db',
        unitPriceNet: Math.round(booking.base_price / 1.27),
        vatRate: '27',
      },
    ]

    if (booking.booking_extras) {
      for (const be of booking.booking_extras) {
        items.push({
          name: be.extras?.name || 'Kiegészítő szolgáltatás',
          quantity: be.quantity,
          unit: 'db',
          unitPriceNet: Math.round(be.unit_price / 1.27),
          vatRate: '27',
        })
      }
    }

    const result = await createInvoice({
      buyerName: booking.profiles?.company_name || booking.profiles?.full_name || 'Vevő',
      buyerZip: billingAddress?.zip || '0000',
      buyerCity: billingAddress?.city || 'Budapest',
      buyerAddress: billingAddress?.street || '-',
      buyerEmail: userData?.user?.email,
      buyerPhone: booking.profiles?.phone || undefined,
      buyerTaxNumber: booking.profiles?.tax_number || undefined,
      items,
      paymentMethod: 'card',
      currency: 'HUF',
      language: 'hu',
      comment: `Foglalás azonosító: ${booking.id}`,
      orderNumber: booking.id,
      proformaNumber: booking.proforma_number || undefined,
      paid: true,
    })

    if (result.success) {
      await supabaseAdmin
        .from('bookings')
        .update({
          invoice_id: result.invoiceId,
          invoice_number: result.invoiceId,
          invoice_url: result.customerUrl,
        })
        .eq('id', bookingId)
    } else {
      console.error('Invoice generation failed:', result.error)
    }
  } catch (invoiceError) {
    console.error('Invoice generation error:', invoiceError)
    // Payment is still processed, invoice can be generated manually
  }

  // Send payment confirmation email
  try {
    // Reload booking to get invoice info
    const { data: updatedBooking } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        profiles (full_name),
        time_slots (name, start_time, end_time)
      `)
      .eq('id', bookingId)
      .single()

    if (updatedBooking) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(updatedBooking.user_id)
      const userEmail = userData?.user?.email
      const userName = updatedBooking.profiles?.full_name || 'Kedves Ügyfelünk'

      if (userEmail) {
        const bookingDate = new Date(updatedBooking.booking_date).toLocaleDateString('hu-HU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        })

        const timeSlot = updatedBooking.time_slots
          ? `${updatedBooking.time_slots.name} (${updatedBooking.time_slots.start_time?.slice(0, 5)} - ${updatedBooking.time_slots.end_time?.slice(0, 5)})`
          : `Egyedi időpont (${updatedBooking.start_time?.slice(0, 5)} - ${updatedBooking.end_time?.slice(0, 5)})`

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://studyu.hu'
        const brandColor = '#0000FF'
        const redColor = '#E53935'
        const yellowColor = '#F5A623'

        const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 3px solid #000;">
          <div style="background: #000; padding: 24px 32px; text-align: left;">
            <img src="${siteUrl}/logo-white.svg" alt="StudyU" height="32" style="height: 32px; width: auto;" />
          </div>
          <div style="padding: 32px;">
            <h1 style="color: #000; font-size: 22px; margin: 0 0 20px 0;">Kedves ${userName}!</h1>
            <div style="background: #059669; color: #fff; padding: 12px 20px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">
              Fizetve
            </div>
            <p style="margin-top: 16px;">Köszönjük, a bankkártyás fizetésed sikeres volt!</p>
            <div style="border: 3px solid #000; padding: 24px; margin: 24px 0; box-shadow: 6px 6px 0 ${yellowColor};">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 2px solid #eee;">
                    <span style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Dátum</span><br>
                    <strong style="font-size: 16px;">${bookingDate}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 2px solid #eee;">
                    <span style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Időpont</span><br>
                    <strong style="font-size: 16px;">${timeSlot}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Összeg</span><br>
                    <strong style="font-size: 20px;">${updatedBooking.total_price.toLocaleString('hu-HU')} Ft</strong>
                  </td>
                </tr>
              </table>
            </div>
            ${updatedBooking.invoice_number ? `
            <div style="border: 3px solid #000; padding: 16px; background: #f9f9f9; margin: 16px 0;">
              <span style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Számla száma</span><br>
              <strong style="font-size: 18px;">${updatedBooking.invoice_number}</strong>
            </div>
            ${updatedBooking.invoice_url ? `
            <p style="margin: 24px 0;">
              <a href="${updatedBooking.invoice_url}" style="display: inline-block; background: ${brandColor}; color: #fff; padding: 14px 32px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; border: 3px solid #000; box-shadow: 4px 4px 0 #000;">Számla megtekintése</a>
            </p>` : ''}` : ''}
            <p>Várunk a foglalt időpontban!</p>
            <div style="margin-top: 32px; padding-top: 24px; border-top: 3px solid #000;">
              <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="width: 12px; height: 12px; background: ${redColor}; border-radius: 50%;"></td>
                <td style="width: 8px;"></td>
                <td style="width: 12px; height: 12px; background: ${yellowColor}; border-radius: 50%;"></td>
                <td style="width: 8px;"></td>
                <td style="width: 12px; height: 12px; background: ${brandColor}; border-radius: 50%;"></td>
              </tr></table>
              <p style="margin-top: 16px; color: #666; font-size: 13px;">
                Üdvözlettel,<br>
                <strong style="color: #000;">StudyU Fotóstúdió</strong>
              </p>
            </div>
          </div>
        </div>`

        const isLocalDev = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1') ||
                           process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')

        if (isLocalDev) {
          const nodemailer = await import('nodemailer')
          const transporter = nodemailer.default.createTransport({
            host: '127.0.0.1',
            port: 54325,
            secure: false,
            tls: { rejectUnauthorized: false },
          })
          await transporter.sendMail({
            from: 'StudyU Fotóstúdió <admin@studyu.hu>',
            to: userEmail,
            subject: 'Fizetés beérkezett - StudyU Fotóstúdió',
            html: emailHtml,
          })
        } else if (process.env.RESEND_API_KEY) {
          const { Resend } = await import('resend')
          const resend = new Resend(process.env.RESEND_API_KEY)
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'StudyU <noreply@studyu.hu>',
            to: userEmail,
            subject: 'Fizetés beérkezett - StudyU Fotóstúdió',
            html: emailHtml,
          })
        }
      }
    }
  } catch (emailError) {
    console.error('Email sending failed (payment still processed):', emailError)
  }

  // Google Calendar sync
  try {
    const { data: gcalTokens } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'google_calendar_tokens')
      .single()

    if (gcalTokens?.value) {
      // Trigger calendar sync via internal fetch if available
      // This is best-effort; calendar sync is non-critical
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      await fetch(`${siteUrl}/api/admin/bookings/calendar-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action: 'update' }),
      }).catch(() => {
        // Calendar sync is non-critical
      })
    }
  } catch {
    // Calendar sync is non-critical
  }

  return NextResponse.json({ received: true, booking_id: bookingId })
}
