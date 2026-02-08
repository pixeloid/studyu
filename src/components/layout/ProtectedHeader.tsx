'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StudyULogo } from '@/components/ui/StudyULogo'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface ProtectedHeaderProps {
  user: User
  profile: Profile | null
}

export function ProtectedHeader({ user, profile }: ProtectedHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <header className="bg-white border-b-[3px] border-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <StudyULogo className="h-8" />
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <NavLink href="/dashboard">Áttekintés</NavLink>
              <NavLink href="/foglalas">Új foglalás</NavLink>
              <NavLink href="/dashboard/foglalasaim">Foglalásaim</NavLink>
              {isAdmin && <NavLink href="/admin">Admin</NavLink>}
            </nav>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 border-[3px] border-black flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
              style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="square" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="square" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Desktop user dropdown */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 px-4 py-2 border-[3px] border-black bg-white hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
                style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
              >
                <div
                  className="h-8 w-8 rounded-full border-[2px] border-black flex items-center justify-center font-bugrino text-sm"
                  style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
                >
                  {(profile?.full_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                </div>
                <span className="font-bugrino text-sm uppercase tracking-wider">
                  {profile?.full_name || user.email?.split('@')[0]}
                </span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="square" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div
                    className="absolute right-0 z-20 mt-2 w-56 bg-white border-[3px] border-black"
                    style={{ boxShadow: '4px 4px 0 var(--bauhaus-black)' }}
                  >
                    <div className="px-4 py-3 border-b-[2px] border-black bg-gray-50">
                      <p className="font-bugrino text-sm uppercase tracking-wider truncate">
                        {profile?.full_name || 'Felhasználó'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard/profil"
                      className="block px-4 py-3 text-sm font-bugrino uppercase tracking-wider hover:bg-gray-50 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profil beállítások
                    </Link>
                    <Link
                      href="/dashboard/foglalasaim"
                      className="block px-4 py-3 text-sm font-bugrino uppercase tracking-wider hover:bg-gray-50 transition-colors border-t-[2px] border-gray-200"
                      onClick={() => setMenuOpen(false)}
                    >
                      Foglalásaim
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full px-4 py-3 text-left text-sm font-bugrino uppercase tracking-wider border-t-[2px] border-black hover:bg-red-50 transition-colors"
                      style={{ color: 'var(--bauhaus-red)' }}
                    >
                      Kijelentkezés
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-[3px] border-black py-4">
            <nav className="flex flex-col gap-2">
              <MobileNavLink href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                Áttekintés
              </MobileNavLink>
              <MobileNavLink href="/foglalas" onClick={() => setMobileMenuOpen(false)}>
                Új foglalás
              </MobileNavLink>
              <MobileNavLink href="/dashboard/foglalasaim" onClick={() => setMobileMenuOpen(false)}>
                Foglalásaim
              </MobileNavLink>
              <MobileNavLink href="/dashboard/profil" onClick={() => setMobileMenuOpen(false)}>
                Profil
              </MobileNavLink>
              {isAdmin && (
                <MobileNavLink href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  Admin
                </MobileNavLink>
              )}
              <button
                onClick={handleSignOut}
                className="mt-2 px-4 py-3 text-left font-bugrino text-sm uppercase tracking-wider border-[3px] border-[var(--bauhaus-red)] text-[var(--bauhaus-red)] hover:bg-red-50 transition-colors"
              >
                Kijelentkezés
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative font-bugrino text-sm uppercase tracking-wider text-gray-700 hover:text-black transition-colors group"
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-black group-hover:w-full transition-all duration-200" />
    </Link>
  )
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-4 py-3 font-bugrino text-sm uppercase tracking-wider hover:bg-gray-50 transition-colors"
    >
      {children}
    </Link>
  )
}
