'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type CookiePreferences = {
  necessary: true
  analytics: boolean
  marketing: boolean
}

const COOKIE_CONSENT_KEY = 'studyu_cookie_consent'

function getStoredConsent(): CookiePreferences | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveConsent(prefs: CookiePreferences) {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs))
  // Dispatch event so other scripts (analytics, etc.) can listen
  window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: prefs }))
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const consent = getStoredConsent()
    if (!consent) {
      setVisible(true)
    }
  }, [])

  const acceptAll = () => {
    const prefs: CookiePreferences = { necessary: true, analytics: true, marketing: true }
    saveConsent(prefs)
    setVisible(false)
  }

  const acceptNecessaryOnly = () => {
    const prefs: CookiePreferences = { necessary: true, analytics: false, marketing: false }
    saveConsent(prefs)
    setVisible(false)
  }

  const saveCustom = () => {
    const prefs: CookiePreferences = { necessary: true, analytics, marketing }
    saveConsent(prefs)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div
        className="mx-auto max-w-2xl border-[3px] border-black bg-white p-5 sm:p-6"
        style={{ boxShadow: '4px 4px 0 var(--bauhaus-black)' }}
      >
        {!showSettings ? (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-8 h-8 flex-shrink-0 rounded-full border-[3px] border-black flex items-center justify-center"
                style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bugrino text-sm uppercase tracking-wider mb-1">Cookie beállítások</h3>
                <p className="text-sm text-gray-600">
                  Az oldal sütiket használ a megfelelő működéshez, statisztikai elemzéshez és marketing célokra.{' '}
                  <Link href="/adatvedelem#cookie-tajekoztato" className="text-[var(--bauhaus-blue)] hover:underline">
                    Részletek
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={acceptAll}
                className="flex-1 px-4 py-2.5 border-[3px] border-black bg-[var(--bauhaus-blue)] text-white font-bugrino text-xs uppercase tracking-wider hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
                style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
              >
                Mindent elfogadok
              </button>
              <button
                onClick={acceptNecessaryOnly}
                className="flex-1 px-4 py-2.5 border-[3px] border-black bg-white font-bugrino text-xs uppercase tracking-wider hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
                style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
              >
                Csak szükséges
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="flex-1 px-4 py-2.5 border-[3px] border-black bg-white font-bugrino text-xs uppercase tracking-wider hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
                style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
              >
                Beállítások
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-bugrino text-sm uppercase tracking-wider mb-4">Cookie beállítások</h3>

            <div className="space-y-3 mb-5">
              {/* Necessary - always on */}
              <div className="flex items-center justify-between p-3 border-[2px] border-gray-200 bg-gray-50">
                <div>
                  <p className="font-bugrino text-xs uppercase tracking-wider">Elengedhetetlen</p>
                  <p className="text-xs text-gray-500">Működéshez szükséges sütik</p>
                </div>
                <div className="w-10 h-6 rounded-full bg-[var(--bauhaus-blue)] flex items-center justify-end px-0.5 opacity-60 cursor-not-allowed">
                  <div className="w-5 h-5 rounded-full bg-white border-[2px] border-[var(--bauhaus-blue)]" />
                </div>
              </div>

              {/* Analytics */}
              <label className="flex items-center justify-between p-3 border-[2px] border-gray-200 cursor-pointer hover:bg-gray-50">
                <div>
                  <p className="font-bugrino text-xs uppercase tracking-wider">Statisztikai</p>
                  <p className="text-xs text-gray-500">Google Analytics, látogatói mérés</p>
                </div>
                <button
                  onClick={() => setAnalytics(!analytics)}
                  className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${
                    analytics ? 'bg-[var(--bauhaus-blue)] justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white border-[2px] transition-colors ${
                    analytics ? 'border-[var(--bauhaus-blue)]' : 'border-gray-300'
                  }`} />
                </button>
              </label>

              {/* Marketing */}
              <label className="flex items-center justify-between p-3 border-[2px] border-gray-200 cursor-pointer hover:bg-gray-50">
                <div>
                  <p className="font-bugrino text-xs uppercase tracking-wider">Marketing</p>
                  <p className="text-xs text-gray-500">Meta Pixel, Google Ads, remarketing</p>
                </div>
                <button
                  onClick={() => setMarketing(!marketing)}
                  className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${
                    marketing ? 'bg-[var(--bauhaus-blue)] justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white border-[2px] transition-colors ${
                    marketing ? 'border-[var(--bauhaus-blue)]' : 'border-gray-300'
                  }`} />
                </button>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2.5 border-[3px] border-black bg-white font-bugrino text-xs uppercase tracking-wider hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
                style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
              >
                Vissza
              </button>
              <button
                onClick={saveCustom}
                className="flex-1 px-4 py-2.5 border-[3px] border-black bg-[var(--bauhaus-blue)] text-white font-bugrino text-xs uppercase tracking-wider hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
                style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
              >
                Mentés
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** Hook to check cookie consent from other components */
export function useCookieConsent(): CookiePreferences | null {
  const [consent, setConsent] = useState<CookiePreferences | null>(null)

  useEffect(() => {
    setConsent(getStoredConsent())

    const handler = (e: Event) => {
      setConsent((e as CustomEvent).detail)
    }
    window.addEventListener('cookie-consent-changed', handler)
    return () => window.removeEventListener('cookie-consent-changed', handler)
  }, [])

  return consent
}
