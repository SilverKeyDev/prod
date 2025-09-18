import React from 'react';

export type SubtitleSize = 'xs' | 'sm' | 'md' | 'lg';

export type SubtitleProps = {
  children: React.ReactNode;
  size?: SubtitleSize;
  className?: string;
  muted?: boolean;
};

const sizeClasses: Record<SubtitleSize, string> = {
  xs: 'text-xs sm:text-sm',
  sm: 'text-sm sm:text-base',
  md: 'text-base sm:text-lg',
  lg: 'text-lg sm:text-xl',
};

export default function Subtitle({
  children,
  size = 'sm',
  className = '',
  muted = false,
}: SubtitleProps) {
  const baseClasses = 'font-normal';
  const colorClass = muted ? 'text-gray-600' : 'text-black';
  const sizeClass = sizeClasses[size];

  return <p className={`${baseClasses} ${colorClass} ${sizeClass} ${className}`}>{children}</p>;
}
