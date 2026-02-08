import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { z } from 'zod'

const updateSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  tax_number: z.string().optional(),
  billing_address: z.object({
    zip: z.string(),
    city: z.string(),
    street: z.string(),
    country: z.string(),
  }).optional(),
  role: z.enum(['user', 'admin']).optional(),
})

async function checkAdmin(cookieStore: Awaited<ReturnType<typeof cookies>>) {
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
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return null
  return { supabase, user }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const auth = await checkAdmin(cookieStore)

  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get profile
  const { data: profile, error } = await auth.supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Get email from auth
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: authData } = await serviceClient.auth.admin.getUserById(id)
  const email = authData?.user?.email || ''

  // Get user's bookings
  const { data: bookings } = await auth.supabase
    .from('bookings')
    .select(`
      id,
      booking_date,
      status,
      total_price,
      time_slots (name)
    `)
    .eq('user_id', id)
    .order('booking_date', { ascending: false })
    .limit(20)

  return NextResponse.json({
    ...profile,
    email,
    bookings: bookings || [],
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const auth = await checkAdmin(cookieStore)

  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const validation = updateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0]?.message || 'Invalid request' },
      { status: 400 }
    )
  }

  const updateData = validation.data

  const { error } = await auth.supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
