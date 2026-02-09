import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { z } from 'zod'

const requestSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  type: z.enum(['confirmed', 'proforma', 'paid', 'completed']).optional().default('confirmed'),
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

    const { bookingId, type } = validation.data

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

    // Get booking with user details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles (id, full_name),
        time_slots (name, start_time, end_time)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Use service role client to get user email from auth.users
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

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(booking.user_id)

    if (authError || !authUser?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'User email not found' },
        { status: 404 }
      )
    }

    const userEmail = authUser.user.email
    const userName = booking.profiles?.full_name || 'Kedves Ügyfelünk'

    const bookingDate = new Date(booking.booking_date).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })

    const timeSlot = booking.time_slots
      ? `${booking.time_slots.name} (${booking.time_slots.start_time?.slice(0, 5)} - ${booking.time_slots.end_time?.slice(0, 5)})`
      : `Egyedi időpont (${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)})`

    // Bauhaus-style email components
    const brandColor = '#0000FF'
    const redColor = '#E53935'
    const yellowColor = '#F5A623'

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://studyu.hu'

    const emailHeader = `
      <div style="background: #000; padding: 24px 32px; text-align: left;">
        <img src="${siteUrl}/logo-white.svg" alt="StudyU" height="32" style="height: 32px; width: auto;" />
      </div>`

    const bookingDetailsBlock = `
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
              <strong style="font-size: 20px;">${booking.total_price.toLocaleString('hu-HU')} Ft</strong>
            </td>
          </tr>
        </table>
      </div>`

    const makeButton = (url: string, label: string) => `
      <p style="margin: 24px 0;">
        <a href="${url}" style="display: inline-block; background: ${brandColor}; color: #fff; padding: 14px 32px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; border: 3px solid #000; box-shadow: 4px 4px 0 #000;">${label}</a>
      </p>`

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

    let emailSubject: string
    let emailBody: string

    switch (type) {
      case 'confirmed':
        emailSubject = 'Foglalás visszaigazolva - StudyU Fotóstúdió'
        emailBody = `
          <div style="background: ${brandColor}; color: #fff; padding: 12px 20px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">
            Visszaigazolva
          </div>
          <p style="margin-top: 16px;">Foglalása visszaigazolásra került! Hamarosan elküldjük a díjbekérőt.</p>
          ${bookingDetailsBlock}`
        break

      case 'proforma':
        emailSubject = 'Díjbekérő - StudyU Fotóstúdió'
        emailBody = `
          <p>Elkészítettük foglalásához a díjbekérőt.</p>
          ${bookingDetailsBlock}
          <div style="border: 3px solid #000; padding: 16px; background: #f9f9f9; margin: 16px 0;">
            <span style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Díjbekérő száma</span><br>
            <strong style="font-size: 18px;">${booking.proforma_number || '-'}</strong>
          </div>
          ${booking.proforma_url ? makeButton(booking.proforma_url, 'Díjbekérő megtekintése') : ''}
          <p>Kérjük, a díjbekérőn feltüntetett határidőig szíveskedjen az összeget átutalni.</p>`
        break

      case 'paid':
        emailSubject = 'Fizetés beérkezett - StudyU Fotóstúdió'
        emailBody = `
          <div style="background: #059669; color: #fff; padding: 12px 20px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">
            Fizetve
          </div>
          <p style="margin-top: 16px;">Köszönjük, fizetését megkaptuk!</p>
          ${bookingDetailsBlock}
          <div style="border: 3px solid #000; padding: 16px; background: #f9f9f9; margin: 16px 0;">
            <span style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Számla száma</span><br>
            <strong style="font-size: 18px;">${booking.invoice_number || '-'}</strong>
          </div>
          ${booking.invoice_url ? makeButton(booking.invoice_url, 'Számla megtekintése') : ''}
          <p>Várjuk Önt a foglalt időpontban!</p>`
        break

      case 'completed':
        emailSubject = 'Köszönjük, hogy nálunk járt! - StudyU Fotóstúdió'
        emailBody = `
          <div style="background: ${yellowColor}; color: #000; padding: 12px 20px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">
            Köszönjük!
          </div>
          <p style="margin-top: 16px;">Köszönjük, hogy a StudyU Fotóstúdiót választotta!</p>
          ${bookingDetailsBlock}
          <p>Reméljük, elégedett volt a szolgáltatásunkkal. Ha bármilyen kérdése van, vagy újra szeretne időpontot foglalni, keressen minket bizalommal!</p>
          ${makeButton((process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/foglalas', 'Új foglalás')}`
        break
    }

    const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 3px solid #000;">
      ${emailHeader}
      <div style="padding: 32px;">
        <h1 style="color: #000; font-size: 22px; margin: 0 0 20px 0;">Kedves ${userName}!</h1>
        ${emailBody}
        ${footer}`

    // Use local SMTP (Mailpit) for development, Resend for production
    const isLocalDev = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1') ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')

    if (isLocalDev) {
      // Use local Supabase Mailpit SMTP
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.default.createTransport({
        host: '127.0.0.1',
        port: 54325,
        secure: false,
        tls: { rejectUnauthorized: false }
      })

      try {
        await transporter.sendMail({
          from: 'StudyU Fotóstúdió <admin@studyu.hu>',
          to: userEmail,
          subject: emailSubject,
          html: emailHtml,
        })

        // Update booking to track confirmation sent
        await supabaseAdmin
          .from('bookings')
          .update({ confirmation_sent_at: new Date().toISOString() })
          .eq('id', bookingId)

        return NextResponse.json({
          success: true,
          message: `Email elküldve Mailpit-be: ${userEmail}`,
        })
      } catch (smtpError) {
        console.error('SMTP error:', smtpError)
        return NextResponse.json(
          { success: false, error: 'Hiba az email küldésekor. Ellenőrizze, hogy fut-e a Supabase.' },
          { status: 500 }
        )
      }
    } else if (process.env.RESEND_API_KEY) {
      // Use Resend for production
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      const emailResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'StudyU <noreply@studyu.hu>',
        to: userEmail,
        subject: emailSubject,
        html: emailHtml,
      })

      if (emailResult.error) {
        console.error('Resend error:', emailResult.error)
        return NextResponse.json(
          { success: false, error: 'Failed to send email' },
          { status: 500 }
        )
      }

      // Update booking to track confirmation sent
      await supabaseAdmin
        .from('bookings')
        .update({ confirmation_sent_at: new Date().toISOString() })
        .eq('id', bookingId)

      return NextResponse.json({
        success: true,
        message: `Email sikeresen elküldve: ${userEmail}`,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Email küldés nincs konfigurálva (RESEND_API_KEY hiányzik)',
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Send confirmation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
