'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { StudyULogo } from '@/components/ui/StudyULogo'

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      // Check if we already have a session (e.g., after callback redirect)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSessionReady(true)
        return
      }

      // Listen for PASSWORD_RECOVERY event (hash-based flow)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSessionReady(true)
        }
      })

      return () => subscription.unsubscribe()
    }
    init()
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('A jelszavak nem egyeznek')
      return
    }

    if (password.length < 8) {
      setError('A jelszónak legalább 8 karakter hosszúnak kell lennie')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
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
          <BauhausCard padding="lg" accentColor="yellow" hasCornerAccent>
            <div className="w-14 h-14 rounded-full border-[3px] border-black mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: 'var(--bauhaus-yellow)' }}>
              <svg className="h-7 w-7 text-black" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="font-bugrino text-xl uppercase tracking-wider mb-2">Jelszó módosítva!</h2>
            <p className="text-gray-600 text-sm mb-4">
              A jelszavad sikeresen megváltozott. Most már bejelentkezhetsz az új jelszavaddal.
            </p>
            <BauhausButton variant="primary" fullWidth onClick={() => router.push('/auth/login')}>
              Bejelentkezés
            </BauhausButton>
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
          <h1 className="font-bugrino text-4xl uppercase tracking-wider text-white mb-4">Új jelszó</h1>
          <p className="text-white/70 text-lg">Add meg az új jelszavadat a fiókod visszaállításához.</p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 lg:py-0 bg-white">
        <div className="lg:hidden text-center mb-4">
          <Link href="/"><StudyULogo className="h-8" /></Link>
          <h2 className="font-bugrino text-lg uppercase tracking-wider mt-2">Új jelszó beállítása</h2>
        </div>

        <div className="w-full max-w-sm">
          {error && (
            <div className="mb-4 p-3 border-[3px] border-[var(--bauhaus-red)] bg-red-50" style={{ boxShadow: '3px 3px 0 var(--bauhaus-red)' }}>
              <p className="text-sm text-[var(--bauhaus-red)] font-medium">{error}</p>
            </div>
          )}

          {!sessionReady && (
            <div className="mb-4 p-3 border-[3px] border-[var(--bauhaus-yellow)] bg-yellow-50" style={{ boxShadow: '3px 3px 0 var(--bauhaus-yellow)' }}>
              <p className="text-sm text-gray-700 font-medium">Jelszó-visszaállítás betöltése...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block font-bugrino text-xs uppercase tracking-wider mb-1">Új jelszó</label>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border-[3px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
              <p className="mt-0.5 text-xs text-gray-400">Min. 8 karakter</p>
            </div>

            <div>
              <label className="block font-bugrino text-xs uppercase tracking-wider mb-1">Új jelszó megerősítése</label>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border-[3px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>

            <BauhausButton type="submit" variant="accent" fullWidth disabled={loading || !sessionReady}>
              {loading ? 'Mentés...' : 'Jelszó módosítása'}
            </BauhausButton>
          </form>
        </div>
      </div>
    </div>
  )
}
