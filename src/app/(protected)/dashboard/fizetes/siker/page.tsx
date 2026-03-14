import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'

export const metadata: Metadata = {
  title: 'Sikeres fizetés - StudyU',
}

interface PageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
  const { session_id } = await searchParams

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
    redirect('/auth/login')
  }

  // Try to find the booking by session_id
  let bookingId: string | null = null
  if (session_id) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('id')
      .eq('stripe_checkout_session_id', session_id)
      .eq('user_id', user.id)
      .single()

    bookingId = booking?.id || null
  }

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 py-12">
      <BauhausCard padding="lg" accentColor="blue" hasCornerAccent accentPosition="top-left">
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-full border-[3px] border-green-600 flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#22c55e' }}
          >
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-bauhaus-heading mb-4">Sikeres fizetés!</h1>
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-[3px] bg-black" />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-blue)' }} />
            <div className="w-8 h-[3px] bg-black" />
          </div>

          <p className="text-gray-600 mb-8">
            A bankkártyás fizetés sikeresen megtörtént. A számlát emailben elküldjük.
          </p>

          <div className="flex flex-col gap-3">
            {bookingId && (
              <Link href={`/dashboard/foglalasaim/${bookingId}`}>
                <BauhausButton variant="primary" className="w-full">
                  Foglalás megtekintése
                </BauhausButton>
              </Link>
            )}
            <Link href="/dashboard/foglalasaim">
              <BauhausButton variant="default" className="w-full">
                Foglalásaim
              </BauhausButton>
            </Link>
          </div>
        </div>
      </BauhausCard>
    </div>
  )
}
