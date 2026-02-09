import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { z } from 'zod'
import { createInvoice, stornoInvoice } from '@/lib/szamlazz'
import { calculateCancellationFee, defaultCancellationPolicy, type CancellationRule } from '@/lib/cancellation/calculate-fee'

const requestSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  reason: z.string().optional(),
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

    const { bookingId, reason } = validation.data

    // Auth - user session
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
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Booking lekérés - user_id szűrővel
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles (full_name, phone, company_name, tax_number, billing_address),
        time_slots (name, start_time, end_time, duration_hours),
        booking_extras (quantity, unit_price, total_price, extras (name))
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

    // Validáció
    if (!['pending', 'confirmed', 'paid'].includes(booking.status)) {
      return NextResponse.json(
        { success: false, error: 'Ez a foglalás nem mondható le' },
        { status: 400 }
      )
    }

    const bookingDate = new Date(booking.booking_date)
    if (bookingDate < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Múltbeli foglalás nem mondható le' },
        { status: 400 }
      )
    }

    // Policy betöltés
    let policy: CancellationRule[] = defaultCancellationPolicy
    const { data: policySetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'cancellation_policy')
      .single()

    if (policySetting?.value && typeof policySetting.value === 'object' && 'rules' in policySetting.value) {
      const policyData = policySetting.value as unknown as { rules: CancellationRule[] }
      policy = policyData.rules
    }

    // Díj számítás
    const { fee } = calculateCancellationFee(bookingDate, booking.total_price, policy)

    // Service role client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // User email
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(booking.user_id)
    if (authError || !authUser?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'User email not found' },
        { status: 404 }
      )
    }

    const userEmail = authUser.user.email
    const userName = booking.profiles?.full_name || 'Kedves Ügyfelünk'

    // Billing address
    const billingAddress = booking.profiles?.billing_address as { zip?: string; city?: string; street?: string } | null

    const isPaid = booking.status === 'paid' && booking.invoice_number
    let stornoInvoiceNumber: string | undefined
    let cancellationInvoiceNumber: string | undefined
    let cancellationInvoiceUrl: string | undefined
    let refundAmount = 0

    // === Szcenárió A: Fizetett foglalás ===
    if (isPaid) {
      // Sztornó az eredeti számláról
      const stornoResult = await stornoInvoice({ invoiceNumber: booking.invoice_number })
      if (!stornoResult.success) {
        console.error('Storno failed:', stornoResult.error)
        return NextResponse.json(
          { success: false, error: `Sztornó hiba: ${stornoResult.error}` },
          { status: 500 }
        )
      }
      stornoInvoiceNumber = stornoResult.invoiceId

      refundAmount = booking.total_price - fee

      // Lemondási díj számla (ha van díj)
      if (fee > 0) {
        const cancellationInvoiceResult = await createInvoice({
          buyerName: booking.profiles?.company_name || booking.profiles?.full_name || 'Vevő',
          buyerZip: billingAddress?.zip || '0000',
          buyerCity: billingAddress?.city || 'Budapest',
          buyerAddress: billingAddress?.street || '-',
          buyerEmail: userEmail,
          buyerPhone: booking.profiles?.phone || undefined,
          buyerTaxNumber: booking.profiles?.tax_number || undefined,
          items: [{
            name: `Lemondási díj - ${booking.time_slots?.name} (${format(bookingDate, 'yyyy. MMMM d.', { locale: hu })})`,
            quantity: 1,
            unit: 'db',
            unitPriceNet: Math.round(fee / 1.27),
            vatRate: '27',
          }],
          paymentMethod: 'transfer',
          currency: 'HUF',
          language: 'hu',
          comment: `Lemondási díj - Foglalás: ${booking.id}`,
          orderNumber: `CANCEL-${booking.id}`,
          paid: true,
        })

        if (cancellationInvoiceResult.success) {
          cancellationInvoiceNumber = cancellationInvoiceResult.invoiceId
          cancellationInvoiceUrl = cancellationInvoiceResult.customerUrl
        } else {
          console.error('Cancellation invoice failed:', cancellationInvoiceResult.error)
          // Lemondás megtörténik, de warning
        }
      }

      // Booking update
      await supabaseAdmin
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_fee: fee,
          cancellation_reason: reason || null,
          storno_invoice_number: stornoInvoiceNumber,
          cancellation_invoice_number: cancellationInvoiceNumber || null,
          cancellation_invoice_url: cancellationInvoiceUrl || null,
        })
        .eq('id', bookingId)
    }
    // === Szcenárió B: Nem fizetett foglalás ===
    else {
      // Lemondási díj számla (ha van díj)
      if (fee > 0) {
        const cancellationInvoiceResult = await createInvoice({
          buyerName: booking.profiles?.company_name || booking.profiles?.full_name || 'Vevő',
          buyerZip: billingAddress?.zip || '0000',
          buyerCity: billingAddress?.city || 'Budapest',
          buyerAddress: billingAddress?.street || '-',
          buyerEmail: userEmail,
          buyerPhone: booking.profiles?.phone || undefined,
          buyerTaxNumber: booking.profiles?.tax_number || undefined,
          items: [{
            name: `Lemondási díj - ${booking.time_slots?.name} (${format(bookingDate, 'yyyy. MMMM d.', { locale: hu })})`,
            quantity: 1,
            unit: 'db',
            unitPriceNet: Math.round(fee / 1.27),
            vatRate: '27',
          }],
          paymentMethod: 'transfer',
          paymentDeadlineDays: 8,
          currency: 'HUF',
          language: 'hu',
          comment: `Lemondási díj - Foglalás: ${booking.id}`,
          orderNumber: `CANCEL-${booking.id}`,
        })

        if (cancellationInvoiceResult.success) {
          cancellationInvoiceNumber = cancellationInvoiceResult.invoiceId
          cancellationInvoiceUrl = cancellationInvoiceResult.customerUrl
        } else {
          console.error('Cancellation invoice failed:', cancellationInvoiceResult.error)
        }
      }

      // Booking update
      await supabaseAdmin
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_fee: fee,
          cancellation_reason: reason || null,
          cancellation_invoice_number: cancellationInvoiceNumber || null,
          cancellation_invoice_url: cancellationInvoiceUrl || null,
        })
        .eq('id', bookingId)
    }

    // === Email küldés ===
    const bookingDateFormatted = format(bookingDate, 'yyyy. MMMM d., EEEE', { locale: hu })
    const timeSlot = booking.time_slots
      ? `${booking.time_slots.name} (${booking.time_slots.start_time?.slice(0, 5)} - ${booking.time_slots.end_time?.slice(0, 5)})`
      : ''

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://studyu.hu'
    const brandColor = '#0000FF'
    const redColor = '#E53935'
    const yellowColor = '#F5A623'

    const emailHeader = `
      <div style="background: #000; padding: 24px 32px; text-align: left;">
        <img src="${siteUrl}/logo-white.svg" alt="StudyU" height="32" style="height: 32px; width: auto;" />
      </div>`

    const footer = `
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
    </div>`

    // Booking details block
    const bookingDetailsBlock = `
      <div style="border: 3px solid #000; padding: 24px; margin: 24px 0; box-shadow: 6px 6px 0 ${redColor};">
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 2px solid #eee;">
              <span style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Dátum</span><br>
              <strong style="font-size: 16px;">${bookingDateFormatted}</strong>
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
              <span style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Foglalás összege</span><br>
              <strong style="font-size: 20px;">${booking.total_price.toLocaleString('hu-HU')} Ft</strong>
            </td>
          </tr>
        </table>
      </div>`

    // Build email body based on scenario
    let emailBody: string

    if (isPaid) {
      // Szcenárió A: fizetett foglalás
      emailBody = `
        <div style="background: ${redColor}; color: #fff; padding: 12px 20px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">
          Foglalás lemondva
        </div>
        <p style="margin-top: 16px;">Az alábbi foglalása lemondásra került.</p>
        ${bookingDetailsBlock}
        <div style="border: 3px solid #000; padding: 16px; background: #f9f9f9; margin: 16px 0;">
          <span style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Eredeti számla</span><br>
          <strong style="font-size: 16px;">${booking.invoice_number}</strong>
          <span style="color: ${redColor}; font-size: 14px; font-weight: bold;"> - Sztornózva</span>
        </div>
        ${fee > 0 ? `
        <div style="border: 3px solid #000; padding: 16px; margin: 16px 0;">
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
            <tr>
              <td style="padding: 4px 0;">
                <span style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Lemondási díj</span><br>
                <strong style="font-size: 18px; color: ${redColor};">${fee.toLocaleString('hu-HU')} Ft</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">
                <span style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Visszatérítés összege</span><br>
                <strong style="font-size: 18px; color: #059669;">${refundAmount.toLocaleString('hu-HU')} Ft</strong>
              </td>
            </tr>
          </table>
        </div>
        ${cancellationInvoiceUrl ? `
        <p style="margin: 24px 0;">
          <a href="${cancellationInvoiceUrl}" style="display: inline-block; background: ${brandColor}; color: #fff; padding: 14px 32px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; border: 3px solid #000; box-shadow: 4px 4px 0 #000;">Lemondási díj számla</a>
        </p>` : ''}
        <p>A visszatérítés az eredeti fizetési módon történik.</p>
        ` : `
        <p style="color: #059669; font-weight: bold;">A teljes összeg visszatérítésre kerül.</p>
        <p>A visszatérítés az eredeti fizetési módon történik.</p>
        `}`
    } else if (fee > 0) {
      // Szcenárió B: nem fizetett, van díj
      emailBody = `
        <div style="background: ${redColor}; color: #fff; padding: 12px 20px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">
          Foglalás lemondva
        </div>
        <p style="margin-top: 16px;">Az alábbi foglalása lemondásra került.</p>
        ${bookingDetailsBlock}
        <div style="border: 3px solid #000; padding: 16px; margin: 16px 0;">
          <span style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Lemondási díj</span><br>
          <strong style="font-size: 18px; color: ${redColor};">${fee.toLocaleString('hu-HU')} Ft</strong>
        </div>
        ${cancellationInvoiceUrl ? `
        <p style="margin: 24px 0;">
          <a href="${cancellationInvoiceUrl}" style="display: inline-block; background: ${brandColor}; color: #fff; padding: 14px 32px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; border: 3px solid #000; box-shadow: 4px 4px 0 #000;">Számla megtekintése</a>
        </p>` : ''}
        <p>Kérjük, a számlán feltüntetett határidőig szíveskedjen az összeget átutalni.</p>`
    } else {
      // Szcenárió B: nem fizetett, nincs díj
      emailBody = `
        <div style="background: ${redColor}; color: #fff; padding: 12px 20px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">
          Foglalás lemondva
        </div>
        <p style="margin-top: 16px;">Az alábbi foglalása sikeresen lemondásra került. A lemondás ingyenes volt.</p>
        ${bookingDetailsBlock}`
    }

    const emailSubject = 'Foglalás lemondva - StudyU Fotóstúdió'
    const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 3px solid #000;">
      ${emailHeader}
      <div style="padding: 32px;">
        <h1 style="color: #000; font-size: 22px; margin: 0 0 20px 0;">Kedves ${userName}!</h1>
        ${emailBody}
        ${footer}`

    // Admin notification email
    const adminEmailBody = `Foglalás lemondva

Ügyfél: ${userName} (${userEmail})
Dátum: ${bookingDateFormatted}
Időpont: ${timeSlot}
Eredeti összeg: ${booking.total_price.toLocaleString('hu-HU')} Ft
Lemondási díj: ${fee.toLocaleString('hu-HU')} Ft
${isPaid ? `Visszatérítés: ${refundAmount.toLocaleString('hu-HU')} Ft` : ''}
${isPaid ? `Sztornó számlaszám: ${stornoInvoiceNumber || '-'}` : ''}
${cancellationInvoiceNumber ? `Lemondási díj számla: ${cancellationInvoiceNumber}` : ''}
${reason ? `Lemondás oka: ${reason}` : ''}

Foglalás ID: ${booking.id}`

    // Send emails using dual pattern (Mailpit dev / Resend prod)
    const isLocalDev = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')

    try {
      if (isLocalDev) {
        const nodemailer = await import('nodemailer')
        const transporter = nodemailer.default.createTransport({
          host: '127.0.0.1',
          port: 54325,
          secure: false,
          tls: { rejectUnauthorized: false }
        })

        // User email
        await transporter.sendMail({
          from: 'StudyU Fotóstúdió <admin@studyu.hu>',
          to: userEmail,
          subject: emailSubject,
          html: emailHtml,
        })

        // Admin email
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@studyu.hu'
        await transporter.sendMail({
          from: 'StudyU Fotóstúdió <admin@studyu.hu>',
          to: adminEmail,
          subject: `[Admin] Foglalás lemondva - ${userName}`,
          text: adminEmailBody,
        })
      } else if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'StudyU <noreply@studyu.hu>'

        // User email
        await resend.emails.send({
          from: fromEmail,
          to: userEmail,
          subject: emailSubject,
          html: emailHtml,
        })

        // Admin email
        const adminEmail = process.env.ADMIN_EMAIL
        if (adminEmail) {
          await resend.emails.send({
            from: fromEmail,
            to: adminEmail,
            subject: `[Admin] Foglalás lemondva - ${userName}`,
            text: adminEmailBody,
          })
        }
      }
    } catch (emailError) {
      console.error('Email sending failed (cancellation still processed):', emailError)
    }

    return NextResponse.json({
      success: true,
      cancellationFee: fee,
      refundAmount: isPaid ? refundAmount : 0,
      cancellationInvoiceNumber: cancellationInvoiceNumber || null,
      stornoInvoiceNumber: stornoInvoiceNumber || null,
    })
  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
