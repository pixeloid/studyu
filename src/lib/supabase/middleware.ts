import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/admin']
const authRoutes = ['/auth/login', '/auth/register']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Redirect to login if accessing protected route without auth
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // For logged-in users, check role for proper routing
  if (user) {
    const needsRoleCheck =
      authRoutes.some(route => pathname.startsWith(route)) ||
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/admin')

    if (needsRoleCheck) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isAdmin = profile?.role === 'admin'

      // Redirect away from auth routes to the right home
      if (authRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(
          new URL(isAdmin ? '/admin' : '/dashboard', request.url)
        )
      }

      // Admin should not see user pages — redirect to admin panel
      if (isAdmin && pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }

      // Non-admin cannot access admin routes
      if (!isAdmin && pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return supabaseResponse
}
