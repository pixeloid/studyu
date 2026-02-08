'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'
import { BauhausInput } from '@/components/ui/bauhaus/BauhausInput'
import { BauhausCard } from '@/components/ui/bauhaus/BauhausCard'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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

    router.push('/dashboard')
    router.refresh()
  }

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12 relative overflow-hidden">
      {/* Geometric background decorations */}
      <div
        className="absolute top-0 left-0 w-96 h-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10"
        style={{ backgroundColor: 'var(--bauhaus-blue)' }}
      />
      <div
        className="absolute bottom-0 right-0 w-64 h-64 translate-x-1/3 translate-y-1/3 opacity-10"
        style={{
          backgroundColor: 'var(--bauhaus-yellow)',
          transform: 'rotate(45deg)',
        }}
      />
      <div
        className="absolute top-1/4 right-10 opacity-20 hidden lg:block"
        style={{
          width: 0,
          height: 0,
          borderLeft: '60px solid transparent',
          borderRight: '60px solid transparent',
          borderBottom: '104px solid var(--bauhaus-red)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative w-12 h-12">
              <div
                className="absolute inset-0 rounded-full border-[3px] border-black"
                style={{ backgroundColor: 'var(--bauhaus-blue)' }}
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full"
                style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
              />
            </div>
            <span className="font-bugrino text-3xl uppercase tracking-tight">StudyU</span>
          </Link>
        </div>

        <BauhausCard padding="lg" accentColor="blue" hasCornerAccent accentPosition="top-right">
          <h2 className="text-bauhaus-subheading text-center mb-2">
            Bejelentkezés
          </h2>
          <p className="text-center text-gray-600 text-sm mb-8">
            Még nincs fiókja?{' '}
            <Link href="/auth/register" className="text-[var(--bauhaus-blue)] hover:underline font-medium">
              Regisztráljon
            </Link>
          </p>

          {error && (
            <div
              className="mb-6 p-4 border-[3px] border-[var(--bauhaus-red)] bg-red-50"
              style={{ boxShadow: '4px 4px 0 var(--bauhaus-red)' }}
            >
              <p className="text-sm text-[var(--bauhaus-red)] font-medium">{error}</p>
            </div>
          )}

          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-[3px] border-black bg-white font-bugrino text-sm uppercase tracking-wider hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform disabled:opacity-50 disabled:transform-none"
              style={{ boxShadow: '4px 4px 0 var(--bauhaus-black)' }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Folytatás Google-lel
            </button>

            <button
              onClick={() => handleOAuthLogin('facebook')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-[3px] border-black font-bugrino text-sm uppercase tracking-wider text-white hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform disabled:opacity-50 disabled:transform-none"
              style={{
                backgroundColor: '#1877F2',
                boxShadow: '4px 4px 0 var(--bauhaus-black)',
              }}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
              Folytatás Facebookkal
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-[2px] border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-gray-500 font-bugrino uppercase tracking-wider">
                vagy
              </span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <BauhausInput
              label="Email cím"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pelda@email.hu"
              fullWidth
            />

            <BauhausInput
              label="Jelszó"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              fullWidth
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 border-[2px] border-black accent-[var(--bauhaus-blue)]"
                />
                <span className="text-sm text-gray-700">Emlékezz rám</span>
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-sm text-[var(--bauhaus-blue)] hover:underline font-medium"
              >
                Elfelejtett jelszó?
              </Link>
            </div>

            <BauhausButton
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
            </BauhausButton>
          </form>
        </BauhausCard>
      </div>
    </div>
  )
}
