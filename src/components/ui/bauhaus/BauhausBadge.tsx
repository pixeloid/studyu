'use client';

import { type ReactNode } from 'react';

type BadgeVariant = 'red' | 'yellow' | 'blue' | 'outline' | 'black';

interface BauhausBadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  red: 'bg-[var(--bauhaus-red)] text-white border-transparent',
  yellow: 'bg-[var(--bauhaus-yellow)] text-black border-transparent',
  blue: 'bg-[var(--bauhaus-blue)] text-white border-transparent',
  black: 'bg-black text-white border-transparent',
  outline: 'bg-transparent text-black border-black',
};

export function BauhausBadge({
  variant = 'outline',
  children,
  className = '',
}: BauhausBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        px-3 py-1
        font-bugrino text-xs uppercase tracking-wider
        border-2
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
