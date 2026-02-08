'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

interface BauhausInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const BauhausInput = forwardRef<HTMLInputElement, BauhausInputProps>(
  ({ label, error, fullWidth = false, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block font-bugrino text-sm uppercase tracking-wider mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-3
            border-[3px] bg-white
            font-sans text-base
            outline-none
            transition-shadow duration-200 ease-out
            focus:shadow-[4px_4px_0_var(--bauhaus-black)]
            placeholder:text-gray-400
            ${error
              ? 'border-[var(--bauhaus-red)] shadow-[4px_4px_0_var(--bauhaus-red)]'
              : 'border-black'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-[var(--bauhaus-red)] font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

BauhausInput.displayName = 'BauhausInput';
