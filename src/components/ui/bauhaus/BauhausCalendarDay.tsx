'use client';

import { type ReactNode } from 'react';

type AccentColor = 'red' | 'yellow' | 'blue' | 'none';

interface BauhausCalendarDayProps {
  day: number;
  dayName: string;
  events?: string[];
  accentColor?: AccentColor;
  hasTriangle?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

const colorMap: Record<Exclude<AccentColor, 'none'>, string> = {
  red: 'var(--bauhaus-red)',
  yellow: 'var(--bauhaus-yellow)',
  blue: 'var(--bauhaus-blue)',
};

export function BauhausCalendarDay({
  day,
  dayName,
  events = [],
  accentColor = 'none',
  hasTriangle = true,
  isSelected = false,
  isDisabled = false,
  onClick,
  children,
}: BauhausCalendarDayProps) {
  const dayFormatted = day.toString().padStart(2, '0');
  const hasColor = accentColor !== 'none';

  return (
    <div
      className={`
        relative flex items-start gap-1
        ${onClick && !isDisabled ? 'cursor-pointer' : ''}
        ${isDisabled ? 'opacity-50' : ''}
      `}
      onClick={() => !isDisabled && onClick?.()}
    >
      {/* Circle with day number */}
      <div className="relative flex-shrink-0">
        <div
          className={`
            w-16 h-16 rounded-full
            flex items-center justify-center
            font-bugrino text-2xl
            border-[3px]
            ${hasColor
              ? 'text-white border-transparent'
              : 'text-black border-black bg-transparent'
            }
            ${isSelected ? 'ring-4 ring-black ring-offset-2' : ''}
          `}
          style={{
            backgroundColor: hasColor ? colorMap[accentColor] : 'transparent',
          }}
        >
          {dayFormatted}
        </div>

        {/* Triangle decoration */}
        {hasTriangle && (
          <div
            className="absolute -right-2 top-1/2 -translate-y-1/2"
            style={{
              width: 0,
              height: 0,
              borderTop: '20px solid transparent',
              borderBottom: '20px solid transparent',
              borderLeft: '24px solid var(--bauhaus-black)',
            }}
          />
        )}
      </div>

      {/* Content box */}
      <div
        className="
          flex-1 bg-white
          border-[3px] border-black
          min-h-[80px]
        "
        style={{
          boxShadow: '4px 4px 0 var(--bauhaus-black)',
        }}
      >
        <div className="px-3 py-2">
          <div className="font-bugrino text-sm uppercase tracking-wider mb-1">
            {dayName}
          </div>

          {events.length > 0 && (
            <div className="space-y-1">
              {events.map((event, index) => (
                <div
                  key={index}
                  className="text-xs uppercase tracking-wide text-gray-700"
                >
                  {event}
                </div>
              ))}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
