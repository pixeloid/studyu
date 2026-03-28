'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'
import { StudyULogo } from '@/components/ui/StudyULogo'

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  )
}

function RegisterContent() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const nextUrl = searchParams.get('next')

  const handleRegister = async (e: React.FormEvent) => {
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

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: nextUrl
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`
          : `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setError(null)
    setLoading(true)

    const callbackUrl = nextUrl
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`
      : `${window.location.origin}/auth/callback`

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const loginUrl = `/auth/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`

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
            <h2 className="font-bugrino text-xl uppercase tracking-wider mb-2">Sikeres regisztráció!</h2>
            <p className="text-gray-600 text-sm mb-4">
              Küldtünk egy megerősítő emailt a(z) <strong>{email}</strong> címre.
            </p>
            <Link href="/auth/login">
              <BauhausButton variant="primary" fullWidth>Bejelentkezés</BauhausButton>
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
        className="hidden lg:flex lg:w-5/12 flex-col items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
      >
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ backgroundColor: 'var(--bauhaus-red)' }} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 opacity-20" style={{ backgroundColor: 'var(--bauhaus-black)', transform: 'rotate(45deg)' }} />
        <div className="relative z-10 text-center px-12">
          <Link href="/">
            <StudyULogo className="h-14 mx-auto mb-6" />
          </Link>
          <h1 className="font-bugrino text-4xl uppercase tracking-wider text-black mb-4">Csatlakozz!</h1>
          <p className="text-black/60 text-lg mb-8">Hozd létre a fiókodat és foglalj időpontot a stúdióba.</p>
          <div className="border-t-[3px] border-black/20 pt-8 mt-8">
            <p className="text-black/50 text-lg mb-3">Már van fiókod?</p>
            <Link
              href={loginUrl}
              className="inline-block px-8 py-3 border-[3px] border-black font-bugrino text-base uppercase tracking-wider text-black hover:bg-black hover:text-[var(--bauhaus-yellow)] transition-all"
              style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.3)' }}
            >
              Bejelentkezés &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 lg:py-0 bg-white">
        {/* Mobile header */}
        <div className="lg:hidden text-center mb-4" style={{ color: 'var(--bauhaus-red)' }}>
          <Link href="/"><StudyULogo className="h-8 mx-auto" /></Link>
          <h2 className="font-bugrino text-lg uppercase tracking-wider mt-2">Regisztráció</h2>
        </div>

        <div className="w-full max-w-lg">
          {error && (
            <div className="mb-3 p-3 border-[3px] border-[var(--bauhaus-red)] bg-red-50" style={{ boxShadow: '3px 3px 0 var(--bauhaus-red)' }}>
              <p className="text-sm text-[var(--bauhaus-red)] font-medium">{error}</p>
            </div>
          )}

          {/* OAuth - side by side */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-3 py-2.5 border-[3px] border-black bg-white font-bugrino text-xs uppercase tracking-wider hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button
              onClick={() => handleOAuthLogin('facebook')}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-3 py-2.5 border-[3px] border-black font-bugrino text-xs uppercase tracking-wider text-white hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform disabled:opacity-50"
              style={{ backgroundColor: '#1877F2', boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
              Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-[2px] border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400 font-bugrino uppercase tracking-wider">vagy</span>
            </div>
          </div>

          {/* Registration form - 2col on desktop */}
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <label className="block font-bugrino text-xs uppercase tracking-wider mb-1">Teljes név</label>
                <input
                  type="text" autoComplete="name" required value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Kovács János"
                  className="w-full px-3 py-2 border-[3px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block font-bugrino text-xs uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email" autoComplete="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pelda@email.hu"
                  className="w-full px-3 py-2 border-[3px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <label className="block font-bugrino text-xs uppercase tracking-wider mb-1">Jelszó</label>
                <input
                  type="password" autoComplete="new-password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border-[3px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                />
                <p className="mt-0.5 text-xs text-gray-400">Min. 8 karakter</p>
              </div>
              <div>
                <label className="block font-bugrino text-xs uppercase tracking-wider mb-1">Jelszó újra</label>
                <input
                  type="password" autoComplete="new-password" required value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border-[3px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
                />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                id="terms" name="terms" type="checkbox" required
                className="mt-0.5 w-4 h-4 border-[2px] border-black accent-[var(--bauhaus-red)]"
              />
              <label htmlFor="terms" className="text-xs text-gray-600">
                Elfogadom az{' '}
                <Link href="/aszf" className="text-[var(--bauhaus-red)] hover:underline font-medium">ÁSZF</Link>-et
                és az{' '}
                <Link href="/adatvedelem" className="text-[var(--bauhaus-red)] hover:underline font-medium">Adatvédelmi Tájékoztatót</Link>
              </label>
            </div>

            <BauhausButton type="submit" variant="accent" fullWidth disabled={loading}>
              {loading ? 'Regisztráció...' : 'Fiók létrehozása'}
            </BauhausButton>
          </form>

          {/* Mobile login link */}
          <p className="lg:hidden text-center text-sm text-gray-600 mt-3">
            Már van fiókod?{' '}
            <Link href={loginUrl} className="text-[var(--bauhaus-red)] hover:underline font-medium">Bejelentkezés</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
