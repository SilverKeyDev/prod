import React from 'react';

export type TitleSize = 'sm' | 'md' | 'lg' | 'xl';

export interface TitleProps {
  children: React.ReactNode;
  size?: TitleSize;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const sizeClasses: Record<TitleSize, string> = {
  sm: 'text-lg sm:text-xl',
  md: 'text-xl sm:text-2xl',
  lg: 'text-2xl sm:text-3xl',
  xl: 'text-3xl sm:text-4xl md:text-5xl',
};

export default function Title({ 
  children, 
  size = 'md', 
  className = '', 
  as: Component = 'h2' 
}: TitleProps) {
  const baseClasses = 'font-serif text-black';
  const sizeClass = sizeClasses[size];
  
  return (
    <Component className={`${baseClasses} ${sizeClass} ${className}`}>
      {children}
    </Component>
  );
}
