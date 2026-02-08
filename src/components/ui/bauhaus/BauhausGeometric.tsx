'use client';

type GeometricShape = 'circle' | 'triangle' | 'triangle-right' | 'square';
type GeometricColor = 'red' | 'yellow' | 'blue' | 'black' | 'white';

interface BauhausGeometricProps {
  shape: GeometricShape;
  color?: GeometricColor;
  size?: number;
  className?: string;
  rotate?: number;
}

const colorMap: Record<GeometricColor, string> = {
  red: 'var(--bauhaus-red)',
  yellow: 'var(--bauhaus-yellow)',
  blue: 'var(--bauhaus-blue)',
  black: 'var(--bauhaus-black)',
  white: 'var(--bauhaus-white)',
};

export function BauhausGeometric({
  shape,
  color = 'black',
  size = 40,
  className = '',
  rotate = 0,
}: BauhausGeometricProps) {
  const colorValue = colorMap[color];

  const baseStyle = {
    transform: rotate ? `rotate(${rotate}deg)` : undefined,
  };

  if (shape === 'circle') {
    return (
      <div
        className={`rounded-full ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: colorValue,
          ...baseStyle,
        }}
      />
    );
  }

  if (shape === 'square') {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          backgroundColor: colorValue,
          ...baseStyle,
        }}
      />
    );
  }

  if (shape === 'triangle') {
    return (
      <div
        className={className}
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size * 0.866}px solid ${colorValue}`,
          ...baseStyle,
        }}
      />
    );
  }

  if (shape === 'triangle-right') {
    return (
      <div
        className={className}
        style={{
          width: 0,
          height: 0,
          borderTop: `${size / 2}px solid transparent`,
          borderBottom: `${size / 2}px solid transparent`,
          borderLeft: `${size * 0.866}px solid ${colorValue}`,
          ...baseStyle,
        }}
      />
    );
  }

  return null;
}

// Composed decorative elements
interface BauhausDecorationProps {
  variant: 'corner' | 'divider' | 'accent';
  className?: string;
}

export function BauhausDecoration({
  variant,
  className = '',
}: BauhausDecorationProps) {
  if (variant === 'corner') {
    return (
      <div className={`relative ${className}`}>
        <BauhausGeometric shape="circle" color="yellow" size={48} />
        <BauhausGeometric
          shape="triangle-right"
          color="black"
          size={32}
          className="absolute -right-6 top-1/2 -translate-y-1/2"
        />
      </div>
    );
  }

  if (variant === 'divider') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex-1 h-[3px] bg-black" />
        <BauhausGeometric shape="circle" color="red" size={16} />
        <BauhausGeometric shape="square" color="yellow" size={16} />
        <BauhausGeometric shape="circle" color="blue" size={16} />
        <div className="flex-1 h-[3px] bg-black" />
      </div>
    );
  }

  if (variant === 'accent') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <BauhausGeometric shape="circle" color="red" size={12} />
        <BauhausGeometric shape="circle" color="yellow" size={12} />
        <BauhausGeometric shape="circle" color="blue" size={12} />
      </div>
    );
  }

  return null;
}
