import React, { forwardRef } from 'react';
import { getCardHoverClasses, getInteractiveCardClasses } from './base/CardHoverStyles';

export interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
  loading?: boolean;
  cardType?: 'searchpage' | 'regular';
  width?: 'auto' | 'full' | 'standard' | 'wide' | 'narrow' | string;
  height?: 'auto' | 'full' | 'standard' | 'tall' | 'compact' | string;
  scale?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
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
      cardType = 'regular',
      width,
      height,
      scale,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Base styles that apply to all cards
    const baseStyles = 'bg-neutral-50 transition-all duration-200';

    // Variant styles
    const variantStyles = {
      default: 'border border-neutral-200/50',
      elevated: 'border-0',
      outlined: 'border-2 border-neutral-300',
      flat: 'border-0 shadow-none'
    };

    // Padding variants - using standardized card spacing
    const paddingStyles = {
      none: 'p-0',
      sm: 'card-content-spacing space-responsive-xs',
      md: 'card-content-spacing space-responsive-sm',
      lg: 'card-content-spacing space-responsive-md',
      xl: 'card-content-spacing space-responsive-lg'
    };

    // Rounded variants
    const roundedStyles = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl'
    };

    // Shadow variants - muted shadows
    const shadowStyles = {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl'
    };

    // Hover effects - standardized hover
    const hoverStyles = hover ? getCardHoverClasses() : '';

    // Interactive styles - standardized interactive
    const interactiveStyles = interactive ? getInteractiveCardClasses() : '';

    // Loading styles
    const loadingStyles = loading ? 'opacity-60 pointer-events-none' : '';

    // Card type presets - searchpage vs regular
    const getCardTypeDefaults = (cardType: 'searchpage' | 'regular') => {
      if (cardType === 'searchpage') {
        return {
          width: width || 'standard', // Current dimensions work for searchpage
          height: height || 'auto',
          scale: scale || 'md'
        };
      } else {
        return {
          width: width || 'wide', // Wider for regular pages
          height: height || 'standard', // More height for regular cards
          scale: scale || 'lg' // Slightly larger scale
        };
      }
    };

    const cardDefaults = getCardTypeDefaults(cardType);

    // Width variants
    const getWidthStyles = (width: string) => {
      if (typeof width === 'string' && width.includes('w-')) return width;
      
      const widthStyles = {
        auto: 'w-auto',
        full: 'w-full',
        standard: 'card-width-standard', // 75% of available width - perfect for searchpage
        wide: 'w-full max-w-2xl mx-auto sm:mx-0', // Better for regular pages
        narrow: 'w-[60%] max-w-xs mx-auto sm:mx-0'
      };
      
      return widthStyles[width as keyof typeof widthStyles] || widthStyles.standard;
    };

    // Height variants
    const getHeightStyles = (height: string) => {
      if (typeof height === 'string' && height.includes('h-')) return height;
      
      const heightStyles = {
        auto: 'h-auto',
        full: 'h-full',
        standard: 'h-auto min-h-[200px]', // Good for regular cards
        tall: 'h-auto min-h-[300px]',
        compact: 'h-auto min-h-[150px]'
      };
      
      return heightStyles[height as keyof typeof heightStyles] || heightStyles.auto;
    };

    // Scale variants
    const getScaleStyles = (scale: string | number) => {
      if (typeof scale === 'number') return `scale-[${scale}]`;
      
      const scaleStyles = {
        xs: 'scale-75',
        sm: 'scale-90',
        md: 'scale-100', // Good for searchpage
        lg: 'scale-110', // Better for regular pages
        xl: 'scale-125'
      };
      
      return scaleStyles[scale as keyof typeof scaleStyles] || scaleStyles.md;
    };

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
      getWidthStyles(cardDefaults.width),
      getHeightStyles(cardDefaults.height),
      getScaleStyles(cardDefaults.scale),
      className
    ].filter(Boolean).join(' ');

    return (
      <div
        ref={ref}
        className={cardClasses}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BaseCard.displayName = 'BaseCard';

export default BaseCard;
