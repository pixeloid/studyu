'use client';

import { type ReactNode } from 'react';

type AccentColor = 'red' | 'yellow' | 'blue' | 'none';
type AccentPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface BauhausCardProps {
  children: ReactNode;
  accentColor?: AccentColor;
  accentPosition?: AccentPosition;
  hasCornerAccent?: boolean;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const accentColorMap: Record<Exclude<AccentColor, 'none'>, string> = {
  red: 'var(--bauhaus-red)',
  yellow: 'var(--bauhaus-yellow)',
  blue: 'var(--bauhaus-blue)',
};

const accentPositionStyles: Record<AccentPosition, string> = {
  'top-left': 'top-[-12px] left-[-12px] sm:top-[-20px] sm:left-[-20px]',
  'top-right': 'top-[-12px] right-[-12px] sm:top-[-20px] sm:right-[-20px]',
  'bottom-left': 'bottom-[-12px] left-[-12px] sm:bottom-[-20px] sm:left-[-20px]',
  'bottom-right': 'bottom-[-12px] right-[-12px] sm:bottom-[-20px] sm:right-[-20px]',
};

const paddingStyles = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-5 sm:p-8',
};

export function BauhausCard({
  children,
  accentColor = 'none',
  accentPosition = 'top-right',
  hasCornerAccent = false,
  className = '',
  padding = 'md',
}: BauhausCardProps) {
  return (
    <div
      className={`
        relative bg-white
        border-[2px] sm:border-[3px] border-black
        ${paddingStyles[padding]}
        ${className}
      `}
      style={{
        boxShadow: '4px 4px 0 var(--bauhaus-black)',
      }}
    >
      {hasCornerAccent && accentColor !== 'none' && (
        <div
          className={`
            absolute w-6 h-6 sm:w-10 sm:h-10 rounded-full z-10
            ${accentPositionStyles[accentPosition]}
          `}
          style={{
            backgroundColor: accentColorMap[accentColor],
          }}
        />
      )}
      {children}
    </div>
  );
}
