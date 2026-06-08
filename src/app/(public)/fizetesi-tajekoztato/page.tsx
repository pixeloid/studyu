import { Metadata } from 'next'
import Link from 'next/link'
import { FizetesiContent } from '@/components/legal'

export const metadata: Metadata = {
  title: 'Online Fizetési Tájékoztató',
  description: 'A StudyU Fotóstúdió online fizetési tájékoztatója - Stripe fizetési rendszer.',
}

export default function FizetesiTajekoztatoPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden py-12 sm:py-24 lg:py-32">
        <div
          className="absolute top-20 right-10 w-32 h-32 rounded-full opacity-20"
          style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
        />
        <div
          className="absolute bottom-10 left-10 w-24 h-24 rotate-45 opacity-20"
          style={{ backgroundColor: 'var(--bauhaus-red)' }}
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-bauhaus-display mb-4">Online Fizetési Tájékoztató</h1>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-[3px] bg-black" />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--bauhaus-yellow)' }} />
              <div className="w-12 h-[3px] bg-black" />
            </div>
            <p className="text-sm text-gray-500">Hatályos: 2026. március 31-től</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 lg:px-8 pb-24">
        <FizetesiContent />

        <div className="mt-12 pt-8 border-t-[3px] border-gray-200">
          <p className="text-sm text-gray-500">
            Kapcsolódó dokumentumok:{' '}
            <Link href="/aszf" className="text-[var(--bauhaus-blue)] hover:underline">ÁSZF</Link>
            {' | '}
            <Link href="/adatvedelem" className="text-[var(--bauhaus-blue)] hover:underline">Adatvédelmi Tájékoztató</Link>
            {' | '}
            <Link href="/hazirend" className="text-[var(--bauhaus-blue)] hover:underline">Házirend</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
