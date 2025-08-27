import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

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
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed';

    // Size variants - responsive
    const sizeStyles = {
      xs: 'btn-responsive-sm',
      sm: 'btn-responsive-sm', 
      md: 'btn-responsive-md',
      lg: 'btn-responsive-lg',
      xl: 'btn-responsive-lg'
    };

    // Rounded variants
    const roundedStyles = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    };

    // Color variants
    const variantStyles = {
      primary: 'bg-brown text-white hover:bg-brown/90 focus:ring-brown/20 disabled:bg-brown/50 disabled:text-white/70',
      secondary: 'bg-beige text-brown hover:bg-beige/80 focus:ring-beige/20 disabled:bg-beige/50 disabled:text-brown/50',
      outline: 'border border-brown text-brown bg-white hover:bg-brown hover:text-white focus:ring-brown/20 disabled:border-brown/30 disabled:text-brown/30 disabled:hover:bg-white disabled:hover:text-brown/30',
      ghost: 'text-brown hover:bg-brown/10 focus:ring-brown/20 disabled:text-brown/30 disabled:hover:bg-transparent',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/20 disabled:bg-red-600/50 disabled:text-white/70',
      success: 'bg-olive text-white hover:bg-olive/90 focus:ring-olive/20 disabled:bg-olive/50 disabled:text-white/70',
      warning: 'bg-gold text-white hover:bg-gold/90 focus:ring-gold/20 disabled:bg-gold/50 disabled:text-white/70',
      info: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500/20 disabled:bg-gray-600/50 disabled:text-white/70'
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
      className
    ].filter(Boolean).join(' ');

    // Icon spacing
    const iconSpacing = children ? (iconPosition === 'left' ? 'mr-2' : 'ml-2') : '';

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className={`w-4 h-4 animate-spin ${children ? 'mr-2' : ''}`} />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className={iconSpacing}>{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className={iconSpacing}>{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
