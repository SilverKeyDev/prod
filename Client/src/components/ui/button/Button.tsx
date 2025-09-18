import React, { forwardRef } from 'react';

import KeyTurnLoader from '../loading/KeyTurnLoader';

export type ButtonProps = {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'success'
    | 'warning'
    | 'info'
    | 'filter'
    | 'sort'
    | 'olive';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      rounded = 'lg',
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles that apply to all buttons
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer hover:cursor-pointer disabled:cursor-not-allowed';

    // Size variants - responsive
    const sizeStyles = {
      xs: 'btn-responsive-sm',
      sm: 'btn-responsive-sm',
      md: 'btn-responsive-md',
      lg: 'btn-responsive-lg',
      xl: 'btn-responsive-lg',
    };

    // Rounded variants
    const roundedStyles = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    };

    // Color variants - muted design system
    const variantStyles = {
      primary:
        'bg-brand-accent text-white hover:bg-brand-accent/90 focus:ring-brand-accent/20 disabled:bg-brand-accent/50 disabled:text-white/70',
      secondary:
        'bg-brand-tertiary text-brand-primary hover:bg-brand-tertiary/80 focus:ring-brand-tertiary/20 disabled:bg-brand-tertiary/50 disabled:text-brand-primary/50',
      outline:
        'border border-brand-accent text-brand-accent bg-neutral-50 hover:bg-brand-accent hover:text-white focus:ring-brand-accent/20 disabled:border-brand-accent/30 disabled:text-brand-accent/30 disabled:hover:bg-neutral-50 disabled:hover:text-brand-accent/30',
      ghost:
        'text-brand-accent hover:bg-brand-accent/10 focus:ring-brand-accent/20 disabled:text-brand-accent/30 disabled:hover:bg-transparent',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/20 disabled:bg-red-600/50 disabled:text-white/70',
      success:
        'bg-brand-secondary text-white hover:bg-brand-secondary/90 focus:ring-brand-secondary/20 disabled:bg-brand-secondary/50 disabled:text-white/70',
      warning:
        'bg-gold-muted text-white hover:bg-gold-muted/90 focus:ring-gold-muted/20 disabled:bg-gold-muted/50 disabled:text-white/70',
      info: 'bg-neutral-600 text-white hover:bg-neutral-700 focus:ring-neutral-500/20 disabled:bg-neutral-600/50 disabled:text-white/70',
      filter:
        'border border-beige text-gray-600 bg-white hover:bg-brown/5 hover:border-brown focus:ring-brown/20 focus:border-brown disabled:bg-gray-50 disabled:text-gray-400',
      sort: 'border border-beige text-gray-600 bg-white hover:bg-brown/5 hover:border-brown focus:ring-brown/20 focus:border-brown disabled:bg-gray-50 disabled:text-gray-400',
      olive:
        'bg-olive text-white hover:bg-olive-light focus:ring-olive/20 disabled:bg-olive/50 disabled:text-white/70',
    };

    // Touch-friendly class for mobile
    const touchFriendlyClass = 'touch-friendly';

    // Full width class
    const widthClass = fullWidth ? 'w-full' : '';

    // Combine all classes
    const buttonClasses = [
      baseStyles,
      sizeStyles[size],
      roundedStyles[rounded],
      variantStyles[variant],
      touchFriendlyClass,
      widthClass,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Icon spacing with responsive sizing
    const iconSpacing = children ? (iconPosition === 'left' ? 'mr-1 sm:mr-2' : 'ml-1 sm:ml-2') : '';

    // Responsive icon sizing based on button size
    const getResponsiveIconClass = (iconElement: React.ReactNode) => {
      if (!React.isValidElement(iconElement)) return iconElement;

      const sizeToIconClass = {
        xs: 'w-3 h-3 sm:w-4 sm:h-4',
        sm: 'w-3 h-3 sm:w-4 sm:h-4',
        md: 'w-4 h-4 sm:w-5 sm:h-5',
        lg: 'w-4 h-4 sm:w-5 sm:h-5',
        xl: 'w-5 h-5 sm:w-6 sm:h-6',
      };

      const existingClassName = (iconElement.props as { className?: string })?.className ?? '';
      const newClassName = `${existingClassName} ${sizeToIconClass[size]} flex-shrink-0`.trim();

      return React.cloneElement(iconElement as React.ReactElement<{ className?: string }>, {
        className: newClassName,
      });
    };

    return (
      <button ref={ref} className={buttonClasses} disabled={disabled ?? loading} {...props}>
        <div className="flex w-full flex-col items-center justify-center">
          <div className="flex items-center justify-center">
            {loading && (
              <div className={children ? 'mr-1 sm:mr-2' : ''}>
                <KeyTurnLoader message="" />
              </div>
            )}
            {!loading && icon && iconPosition === 'left' && (
              <span className={`${iconSpacing} flex-shrink-0`}>{getResponsiveIconClass(icon)}</span>
            )}
            {children && (
              <span className="break-words text-center text-xs leading-tight sm:text-sm md:text-base">
                {children}
              </span>
            )}
            {!loading && icon && iconPosition === 'right' && (
              <span className={`${iconSpacing} flex-shrink-0`}>{getResponsiveIconClass(icon)}</span>
            )}
          </div>
        </div>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
