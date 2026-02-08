'use client';

import { type ReactNode, useEffect } from 'react';

interface BauhausModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  accentColor?: 'red' | 'yellow' | 'blue';
}

const accentColorMap = {
  red: 'var(--bauhaus-red)',
  yellow: 'var(--bauhaus-yellow)',
  blue: 'var(--bauhaus-blue)',
};

export function BauhausModal({
  isOpen,
  onClose,
  title,
  children,
  accentColor = 'blue',
}: BauhausModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal content */}
      <div
        className="
          relative bg-white
          border-[3px] border-black
          w-full max-w-lg max-h-[90vh]
          overflow-auto
        "
        style={{
          boxShadow: '12px 12px 0 var(--bauhaus-black)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div
            className="px-6 py-4 border-b-[3px] border-black"
            style={{ backgroundColor: accentColorMap[accentColor] }}
          >
            <h2
              className={`
                font-bugrino text-xl uppercase tracking-wider
                ${accentColor === 'yellow' ? 'text-black' : 'text-white'}
              `}
            >
              {title}
            </h2>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="
            absolute top-4 right-4
            w-10 h-10 rounded-full
            bg-black text-white
            flex items-center justify-center
            font-bugrino text-xl
            hover:bg-[var(--bauhaus-red)]
            transition-colors
          "
          aria-label="Close"
        >
          X
        </button>

        {/* Body */}
        <div className={`p-6 ${title ? '' : 'pt-14'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
