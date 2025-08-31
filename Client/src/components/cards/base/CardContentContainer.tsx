import React from 'react';

interface CardContentContainerProps {
  /** Content to display */
  children: React.ReactNode;
  /** Padding variant */
  padding?: 'xs' | 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

/**
 * Reusable card content container with consistent spacing
 */
export default function CardContentContainer({
  children,
  padding = 'sm',
  className = ''
}: CardContentContainerProps) {
  const getPaddingClass = () => {
    switch (padding) {
      case 'xs':
        return 'space-responsive-xs';
      case 'sm':
        return 'space-responsive-sm';
      case 'md':
        return 'space-responsive-md';
      case 'lg':
        return 'space-responsive-lg';
      default:
        return 'space-responsive-sm';
    }
  };

  return (
    <div className={`${getPaddingClass()} card-content-spacing ${className}`}>
      {children}
    </div>
  );
}
