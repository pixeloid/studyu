'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { StudyULogo } from '@/components/ui/StudyULogo'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const nextUrl = searchParams.get('next')

  const getRedirectUrl = async () => {
    if (nextUrl) return nextUrl
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role === 'admin') return '/admin'
    }
    return '/dashboard'
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const redirect = await getRedirectUrl()
    router.push(redirect)
    router.refresh()
  }

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setError(null)
    setLoading(true)

    const callbackUrl = nextUrl
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`
      : `${window.location.origin}/auth/callback`

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const registerUrl = `/auth/register${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left: Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: 'var(--bauhaus-blue)' }}
      >
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-20" style={{ backgroundColor: 'var(--bauhaus-yellow)' }} />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 opacity-20" style={{ backgroundColor: 'var(--bauhaus-red)', transform: 'rotate(45deg)' }} />
        <div className="relative z-10 text-center px-16">
          <Link href="/">
            <StudyULogo className="h-14 mx-auto mb-6" color="#FFFFFF" />
          </Link>
          <h1 className="font-bugrino text-4xl uppercase tracking-wider text-white mb-4">Üdv újra!</h1>
          <p className="text-white/70 text-lg mb-8">Jelentkezz be és foglalj időpontot a stúdióba.</p>
          <div className="border-t-[3px] border-white/30 pt-8 mt-8">
            <p className="text-white/60 text-lg mb-3">Még nincs fiókod?</p>
            <Link
              href={registerUrl}
              className="inline-block px-8 py-3 border-[3px] border-white font-bugrino text-base uppercase tracking-wider text-white hover:bg-white hover:text-[var(--bauhaus-blue)] transition-all"
              style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.3)' }}
            >
              Regisztrálj &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 lg:py-0 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-4">
          <Link href="/"><StudyULogo className="h-8" /></Link>
          <h2 className="font-bugrino text-lg uppercase tracking-wider mt-2">Bejelentkezés</h2>
        </div>

        <div className="w-full max-w-sm">
          {error && (
            <div className="mb-4 p-3 border-[3px] border-[var(--bauhaus-red)] bg-red-50" style={{ boxShadow: '3px 3px 0 var(--bauhaus-red)' }}>
              <p className="text-sm text-[var(--bauhaus-red)] font-medium">{error}</p>
            </div>
          )}

          {/* OAuth - side by side */}
          <div className="grid grid-cols-2 gap-3 mb-4">
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
              className="flex items-center justify-center gap-2 px-3 py-2.5 border-[3px] border-black bg-white font-bugrino text-xs uppercase tracking-wider hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
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

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
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

            <div>
              <label className="block font-bugrino text-xs uppercase tracking-wider mb-1">Jelszó</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border-[3px] border-black bg-white text-sm focus:shadow-[3px_3px_0_var(--bauhaus-black)] outline-none transition-shadow"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 border-[2px] border-black accent-[var(--bauhaus-blue)]" />
                <span className="text-gray-600">Emlékezz rám</span>
              </label>
              <Link href="/auth/forgot-password" className="text-[var(--bauhaus-blue)] hover:underline font-medium">
                Elfelejtett jelszó?
              </Link>
            </div>

            <BauhausButton type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
            </BauhausButton>
          </form>

          {/* Mobile register link */}
          <p className="lg:hidden text-center text-sm text-gray-600 mt-4">
            Még nincs fiókod?{' '}
            <Link href={registerUrl} className="text-[var(--bauhaus-blue)] hover:underline font-medium">Regisztrálj</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
