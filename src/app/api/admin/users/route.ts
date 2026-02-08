import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse query params
  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = 20
  const offset = (page - 1) * perPage

  // Fetch profiles with filter/pagination
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (role && role !== 'all') {
    query = query.eq('role', role)
  }

  if (search) {
    query = query.ilike('full_name', `%${search}%`)
  }

  const { data: profiles, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Use service role to get emails from auth.users
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Fetch auth users for the profile IDs to get emails
  const userIds = (profiles || []).map(p => p.id)
  const emailMap: Record<string, string> = {}

  if (userIds.length > 0) {
    const { data: authData } = await serviceClient.auth.admin.listUsers({
      perPage: 1000,
    })

    if (authData?.users) {
      for (const u of authData.users) {
        if (userIds.includes(u.id)) {
          emailMap[u.id] = u.email || ''
        }
      }
    }
  }

  // Merge email into profiles
  const users = (profiles || []).map(p => ({
    ...p,
    email: emailMap[p.id] || '',
  }))

  return NextResponse.json({
    users,
    total: count || 0,
    page,
    perPage,
    totalPages: Math.ceil((count || 0) / perPage),
  })
}
