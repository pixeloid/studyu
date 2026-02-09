import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { z } from 'zod'
import { createProformaInvoice } from '@/lib/szamlazz'

const requestSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
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

  // Validate request body
  const body = await request.json()
  const validation = requestSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0]?.message || 'Invalid request' },
      { status: 400 }
    )
  }

  const { bookingId } = validation.data

  // Get booking with related data
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      *,
      profiles (full_name, phone, company_name, tax_number, billing_address),
      time_slots (name, duration_hours),
      booking_extras (quantity, unit_price, total_price, extras (name))
    `)
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Get user email
  const { data: userData } = await supabase.auth.admin.getUserById(booking.user_id)

  // Build billing address
  const billingAddress = booking.profiles?.billing_address as { zip?: string; city?: string; street?: string } | null

  // Build invoice items
  const slotLabel = booking.time_slots?.name
    || `Egyedi időpont (${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)})`
  const items = [
    {
      name: `Stúdió bérlés - ${slotLabel} (${format(new Date(booking.booking_date), 'yyyy. MMMM d.', { locale: hu })})`,
      quantity: 1,
      unit: 'db',
      unitPriceNet: Math.round(booking.base_price / 1.27), // Remove 27% VAT
      vatRate: '27',
    },
  ]

  // Add extras
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

  // Create proforma invoice
  const result = await createProformaInvoice({
    buyerName: booking.profiles?.company_name || booking.profiles?.full_name || 'Vevő',
    buyerZip: billingAddress?.zip || '0000',
    buyerCity: billingAddress?.city || 'Budapest',
    buyerAddress: billingAddress?.street || '-',
    buyerEmail: userData?.user?.email,
    buyerPhone: booking.profiles?.phone || undefined,
    buyerTaxNumber: booking.profiles?.tax_number || undefined,
    items,
    paymentMethod: 'transfer',
    paymentDeadlineDays: 8,
    currency: 'HUF',
    language: 'hu',
    comment: `Foglalás azonosító: ${booking.id}`,
    orderNumber: booking.id,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // Update booking with proforma info
  await supabase
    .from('bookings')
    .update({
      proforma_number: result.invoiceId,
      proforma_url: result.customerUrl,
      proforma_sent_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  return NextResponse.json({
    success: true,
    proformaNumber: result.invoiceId,
    grossPrice: result.grossPrice,
  })
}
