import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL('/admin/beallitasok?gcal=error&message=' + encodeURIComponent(error), request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/admin/beallitasok?gcal=error&message=No+authorization+code', request.url)
    )
  }

  try {
    await exchangeCode(code)
    return NextResponse.redirect(
      new URL('/admin/beallitasok?gcal=success', request.url)
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.redirect(
      new URL('/admin/beallitasok?gcal=error&message=' + encodeURIComponent(message), request.url)
    )
  }
}
