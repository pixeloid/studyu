'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'default' | 'primary' | 'accent' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BauhausButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: 'bg-white text-black',
  primary: 'bg-[var(--bauhaus-blue)] text-white',
  accent: 'bg-[var(--bauhaus-yellow)] text-black',
  danger: 'bg-[var(--bauhaus-red)] text-white',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export const BauhausButton = forwardRef<HTMLButtonElement, BauhausButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      fullWidth = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          font-bugrino uppercase tracking-wider
          border-[3px] border-black
          relative cursor-pointer
          transition-transform duration-100 ease-out
          hover:translate-x-[-2px] hover:translate-y-[-2px]
          active:translate-x-0 active:translate-y-0
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        style={{
          boxShadow: '4px 4px 0 var(--bauhaus-black)',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.boxShadow = '6px 6px 0 var(--bauhaus-black)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '4px 4px 0 var(--bauhaus-black)';
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

BauhausButton.displayName = 'BauhausButton';
