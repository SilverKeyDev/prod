import React, { forwardRef } from 'react';

export interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
  loading?: boolean;
}

const BaseCard = forwardRef<HTMLDivElement, BaseCardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      rounded = 'xl',
      shadow = 'sm',
      hover = false,
      interactive = false,
      loading = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Base styles that apply to all cards
    const baseStyles = 'bg-white transition-all duration-200';

    // Variant styles
    const variantStyles = {
      default: 'border border-beige/40',
      elevated: 'border-0',
      outlined: 'border-2 border-beige',
      flat: 'border-0 shadow-none'
    };

    // Padding variants - using utilities.css classes
    const paddingStyles = {
      none: 'p-0',
      sm: 'space-responsive-xs',
      md: 'space-responsive-sm',
      lg: 'space-responsive-md',
      xl: 'space-responsive-lg'
    };

    // Rounded variants
    const roundedStyles = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl'
    };

    // Shadow variants
    const shadowStyles = {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl'
    };

    // Hover effects
    const hoverStyles = hover ? 'hover:shadow-md' : '';

    // Interactive styles
    const interactiveStyles = interactive ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : '';

    // Loading styles
    const loadingStyles = loading ? 'opacity-60 pointer-events-none' : '';

    // Overflow handling for rounded cards
    const overflowStyles = rounded !== 'none' ? 'overflow-hidden' : '';

    // Combine all classes
    const cardClasses = [
      baseStyles,
      variantStyles[variant],
      paddingStyles[padding],
      roundedStyles[rounded],
      shadowStyles[shadow],
      hoverStyles,
      interactiveStyles,
      loadingStyles,
      overflowStyles,
      className
    ].filter(Boolean).join(' ');

    return (
      <div
        ref={ref}
        className={`${cardClasses} w-[90%] sm:w-full mx-auto sm:mx-0`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BaseCard.displayName = 'BaseCard';

export default BaseCard;
