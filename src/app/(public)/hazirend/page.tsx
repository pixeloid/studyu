import { Metadata } from 'next'
import Link from 'next/link'
import { HazirendContent } from '@/components/legal'

export const metadata: Metadata = {
  title: 'Stúdió Házirend',
  description: 'A StudyU Fotóstúdió házirendje és foglalási szabályzata.',
}

export default function HazirendPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden py-12 sm:py-24 lg:py-32">
        <div
          className="absolute top-20 right-10 w-32 h-32 rounded-full opacity-20"
          style={{ backgroundColor: 'var(--bauhaus-red)' }}
        />
        <div
          className="absolute bottom-10 left-10 w-24 h-24 rotate-45 opacity-20"
          style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-bauhaus-display mb-4">Stúdió Házirend</h1>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-[3px] bg-black" />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--bauhaus-red)' }} />
              <div className="w-12 h-[3px] bg-black" />
            </div>
            <p className="text-gray-600">
              A foglalás véglegesítésével a bérlő elfogadja az alábbi stúdióhasználati szabályokat.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 lg:px-8 pb-24">
        <HazirendContent />

        <div className="mt-8 pt-8 border-t-[3px] border-gray-200">
          <p className="text-sm text-gray-500">
            Kapcsolódó dokumentumok:{' '}
            <Link href="/aszf" className="text-[var(--bauhaus-blue)] hover:underline">ÁSZF</Link>
            {' | '}
            <Link href="/adatvedelem" className="text-[var(--bauhaus-blue)] hover:underline">Adatvédelmi Tájékoztató</Link>
            {' | '}
            <Link href="/gyik" className="text-[var(--bauhaus-blue)] hover:underline">GYIK</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
