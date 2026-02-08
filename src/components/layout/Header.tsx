'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BauhausButton } from '@/components/ui/bauhaus/BauhausButton'

const navigation = [
  { name: 'Bemutatkozás', href: '/bemutatkozas' },
  { name: 'Galéria', href: '/galeria' },
  { name: 'Kapcsolat', href: '/kapcsolat' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white border-b-[3px] border-black">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-3">
            {/* Geometric logo mark */}
            <div className="relative w-10 h-10">
              <div
                className="absolute inset-0 rounded-full border-[3px] border-black"
                style={{ backgroundColor: 'var(--bauhaus-blue)' }}
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
              />
            </div>
            <span className="font-bugrino text-2xl uppercase tracking-tight">StudyU</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="relative w-10 h-10 flex items-center justify-center border-[3px] border-black bg-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ boxShadow: '3px 3px 0 var(--bauhaus-black)' }}
          >
            <span className="sr-only">Menü megnyitása</span>
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className="w-5 h-0.5 bg-black" />
                <span className="w-5 h-0.5 bg-black" />
                <span className="w-5 h-0.5 bg-black" />
              </div>
            )}
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="font-bugrino text-sm uppercase tracking-wider text-black hover:text-[var(--bauhaus-blue)] transition-colors relative group"
            >
              {item.name}
              <span className="absolute -bottom-1 left-0 w-0 h-[3px] bg-[var(--bauhaus-blue)] transition-all group-hover:w-full" />
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4 lg:items-center">
          <Link
            href="/auth/login"
            className="font-bugrino text-sm uppercase tracking-wider text-black hover:text-[var(--bauhaus-blue)] transition-colors"
          >
            Bejelentkezés
          </Link>
          <Link href="/foglalas">
            <BauhausButton variant="primary" size="sm">
              Foglalás
            </BauhausButton>
          </Link>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden border-t-[3px] border-black bg-white"
        >
          <div className="px-6 py-6 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block font-bugrino text-lg uppercase tracking-wider text-black hover:text-[var(--bauhaus-blue)] py-2 border-b-[2px] border-gray-200 hover:border-[var(--bauhaus-blue)] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 space-y-4 border-t-[3px] border-black">
              <Link
                href="/auth/login"
                className="block font-bugrino text-lg uppercase tracking-wider text-black hover:text-[var(--bauhaus-blue)] py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Bejelentkezés
              </Link>
              <Link
                href="/foglalas"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BauhausButton variant="accent" fullWidth>
                  Foglalás
                </BauhausButton>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
