'use client';

import { type ReactNode } from 'react';

interface BauhausHeroProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  decorations?: boolean;
}

export function BauhausHero({
  title,
  subtitle,
  children,
  decorations = true,
}: BauhausHeroProps) {
  return (
    <section
      className="relative overflow-hidden py-20 px-6"
      style={{ backgroundColor: 'var(--bauhaus-blue)' }}
    >
      {/* Geometric decorations */}
      {decorations && (
        <>
          {/* Large circle - top right */}
          <div
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20"
            style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
          />

          {/* Medium circle - bottom left */}
          <div
            className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-30"
            style={{ backgroundColor: 'var(--bauhaus-red)' }}
          />

          {/* Triangle - center right */}
          <div
            className="absolute top-1/2 right-10 -translate-y-1/2 opacity-20"
            style={{
              width: 0,
              height: 0,
              borderLeft: '100px solid transparent',
              borderRight: '100px solid transparent',
              borderBottom: '173px solid var(--bauhaus-black)',
            }}
          />

          {/* Small circles */}
          <div
            className="absolute top-20 left-1/4 w-8 h-8 rounded-full"
            style={{ backgroundColor: 'var(--bauhaus-white)' }}
          />
          <div
            className="absolute bottom-20 right-1/3 w-6 h-6 rounded-full"
            style={{ backgroundColor: 'var(--bauhaus-yellow)' }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h1 className="text-bauhaus-display text-white mb-4">
          {title}
        </h1>

        {subtitle && (
          <p className="text-bauhaus-subheading text-white/80 mb-8">
            {subtitle}
          </p>
        )}

        {children && (
          <div className="mt-8">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
