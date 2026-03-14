import Link from 'next/link'
import type { Metadata } from 'next'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'

export const metadata: Metadata = {
  title: 'Fizetés meghiúsult - StudyU',
}

interface PageProps {
  searchParams: Promise<{ booking_id?: string }>
}

export default async function PaymentFailedPage({ searchParams }: PageProps) {
  const { booking_id } = await searchParams

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 py-12">
      <BauhausCard padding="lg" accentColor="red" hasCornerAccent accentPosition="top-left">
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-full border-[3px] border-[var(--bauhaus-red)] flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'var(--bauhaus-red)' }}
          >
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-bauhaus-heading mb-4">Fizetés meghiúsult</h1>
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-[3px] bg-black" />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--bauhaus-red)' }} />
            <div className="w-8 h-[3px] bg-black" />
          </div>

          <p className="text-gray-600 mb-8">
            A fizetés nem sikerült vagy megszakítottad. A foglalásod továbbra is aktív, bármikor újra próbálkozhatsz.
          </p>

          <div className="flex flex-col gap-3">
            {booking_id && (
              <Link href={`/dashboard/foglalasaim/${booking_id}`}>
                <BauhausButton variant="primary" className="w-full">
                  Vissza a foglaláshoz
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
