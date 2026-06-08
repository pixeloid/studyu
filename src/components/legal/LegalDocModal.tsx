'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { AszfContent } from './AszfContent'
import { AdatvedelemContent } from './AdatvedelemContent'
import { HazirendContent } from './HazirendContent'
import { FizetesiContent } from './FizetesiContent'

export type LegalDocKey = 'aszf' | 'adatvedelem' | 'hazirend' | 'fizetesi-tajekoztato'

type DocConfig = {
  title: string
  href: string
  accent: string
  Content: () => ReactNode
}

const DOCS: Record<LegalDocKey, DocConfig> = {
  aszf: {
    title: 'Általános Szerződési Feltételek',
    href: '/aszf',
    accent: 'var(--bauhaus-blue)',
    Content: AszfContent,
  },
  adatvedelem: {
    title: 'Adatkezelési és Cookie Tájékoztató',
    href: '/adatvedelem',
    accent: 'var(--bauhaus-red)',
    Content: AdatvedelemContent,
  },
  hazirend: {
    title: 'Stúdió Házirend',
    href: '/hazirend',
    accent: 'var(--bauhaus-red)',
    Content: HazirendContent,
  },
  'fizetesi-tajekoztato': {
    title: 'Online Fizetési Tájékoztató',
    href: '/fizetesi-tajekoztato',
    accent: 'var(--bauhaus-yellow)',
    Content: FizetesiContent,
  },
}

/**
 * Inline szöveges trigger, ami modalban nyitja meg a megadott jogi dokumentumot.
 * Pl. a foglalási checkbox címkéjében: <LegalLink doc="aszf">ÁSZF</LegalLink>
 */
export function LegalLink({ doc, children }: { doc: LegalDocKey; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[var(--bauhaus-blue)] hover:underline font-medium underline-offset-2"
      >
        {children}
      </button>
      <LegalDocModal doc={doc} isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}

export function LegalDocModal({
  doc,
  isOpen,
  onClose,
}: {
  doc: LegalDocKey
  isOpen: boolean
  onClose: () => void
}) {
  const config = DOCS[doc]

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const { title, href, accent, Content } = config

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal */}
      <div
        className="relative bg-white border-[3px] border-black w-full max-w-3xl max-h-[90vh] flex flex-col"
        style={{ boxShadow: '12px 12px 0 var(--bauhaus-black)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-4 px-6 py-4 border-b-[3px] border-black flex-shrink-0"
          style={{ backgroundColor: accent }}
        >
          <h2
            className={`font-bugrino text-base sm:text-xl uppercase tracking-wider ${
              accent === 'var(--bauhaus-yellow)' ? 'text-black' : 'text-white'
            }`}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bugrino hover:bg-[var(--bauhaus-red)] transition-colors flex-shrink-0"
            aria-label="Bezárás"
          >
            X
          </button>
        </div>

        {/* Body */}
        <div className="overflow-auto px-6 py-6">
          <Content />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t-[3px] border-black flex-shrink-0 bg-white">
          <Link
            href={href}
            target="_blank"
            className="text-sm text-[var(--bauhaus-blue)] hover:underline font-medium"
          >
            Teljes oldal megnyitása →
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border-[3px] border-black bg-black text-white font-bugrino text-xs uppercase tracking-wider hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
            style={{ boxShadow: '2px 2px 0 var(--bauhaus-black)' }}
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  )
}
