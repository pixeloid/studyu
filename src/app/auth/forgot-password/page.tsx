'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { StudyULogo } from '@/components/ui/StudyULogo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-md text-center">
          <Link href="/"><StudyULogo className="h-10 mx-auto mb-6" /></Link>
          <BauhausCard padding="lg" accentColor="blue" hasCornerAccent>
            <div className="w-14 h-14 rounded-full border-[3px] border-black mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: 'var(--bauhaus-blue)' }}>
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="font-bugrino text-xl uppercase tracking-wider mb-2">Email elküldve!</h2>
            <p className="text-gray-600 text-sm mb-4">
              Ha a(z) <strong>{email}</strong> cím regisztrálva van, küldtünk egy jelszó-visszaállító linket.
            </p>
            <Link href="/auth/login">
              <BauhausButton variant="primary" fullWidth>Vissza a bejelentkezéshez</BauhausButton>
            </Link>
          </BauhausCard>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left: Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: 'var(--bauhaus-red)' }}
      >
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-20" style={{ backgroundColor: 'var(--bauhaus-yellow)' }} />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 opacity-20" style={{ backgroundColor: 'var(--bauhaus-black)', transform: 'rotate(45deg)' }} />
        <div className="relative z-10 text-center px-16">
          <Link href="/">
            <StudyULogo className="h-14 mx-auto mb-6" color="#FFFFFF" />
          </Link>
          <h1 className="font-bugrino text-4xl uppercase tracking-wider text-white mb-4">Elfelejtett jelszó?</h1>
          <p className="text-white/70 text-lg mb-8">Nem baj, segítünk visszaállítani!</p>
          <div className="border-t-[3px] border-white/30 pt-8 mt-8">
            <p className="text-white/60 text-lg mb-3">Emlékszel a jelszavadra?</p>
            <Link
              href="/auth/login"
              className="inline-block px-8 py-3 border-[3px] border-white font-bugrino text-base uppercase tracking-wider text-white hover:bg-white hover:text-[var(--bauhaus-red)] transition-all"
              style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.3)' }}
            >
              Bejelentkezés &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 lg:py-0 bg-white">
        <div className="lg:hidden text-center mb-4">
          <Link href="/"><StudyULogo className="h-8" /></Link>
          <h2 className="font-bugrino text-lg uppercase tracking-wider mt-2">Elfelejtett jelszó</h2>
        </div>

        <div className="w-full max-w-sm">
          {error && (
            <div className="mb-4 p-3 border-[3px] border-[var(--bauhaus-red)] bg-red-50" style={{ boxShadow: '3px 3px 0 var(--bauhaus-red)' }}>
              <p className="text-sm text-[var(--bauhaus-red)] font-medium">{error}</p>
            </div>
          )}

          <p className="text-gray-600 text-sm mb-4">
            Add meg az email címedet, és küldünk egy linket a jelszavad visszaállításához.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block font-bugrino text-xs uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pelda@email.hu"
                className="w-full px-3 py-2 border-[3px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>

            <BauhausButton type="submit" variant="accent" fullWidth disabled={loading}>
              {loading ? 'Küldés...' : 'Visszaállító link küldése'}
            </BauhausButton>
          </form>

          <p className="lg:hidden text-center text-sm text-gray-600 mt-4">
            <Link href="/auth/login" className="text-[var(--bauhaus-blue)] hover:underline font-medium">Vissza a bejelentkezéshez</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
