import React from 'react';
import { Eye } from 'lucide-react';
import KeyTurnLoader from '../../ui/base/KeyTurnLoader';

export interface CardViewDetailsButtonProps {
  /** Click handler */
  onClick: () => void;
  /** Loading state */
  loading?: boolean;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'muted';
  /** Full width button */
  fullWidth?: boolean;
  /** Button text */
  text?: string;
  /** Show icon */
  showIcon?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

const CardViewDetailsButton: React.FC<CardViewDetailsButtonProps> = ({
  onClick,
  loading = false,
  size = 'md',
  variant = 'primary',
  fullWidth = false,
  text = 'View Details',
  showIcon = true,
  disabled = false,
  className = ''
}) => {
  // Size variants using utilities.css classes
  const sizeStyles = {
    sm: {
      padding: 'px-responsive-sm py-responsive-xs',
      text: 'btn-text-responsive',
      icon: 'mobile-icon-xs'
    },
    md: {
      padding: 'px-responsive-md py-responsive-sm',
      text: 'btn-text-responsive',
      icon: 'mobile-icon-sm'
    },
    lg: {
      padding: 'px-responsive-lg py-responsive-md',
      text: 'text-responsive-md',
      icon: 'mobile-icon-md'
    }
  };

  // Variant styles
  const variantStyles = {
    primary: 'bg-brown text-white hover:bg-brown/90 border-brown',
    secondary: 'bg-white text-brown border-brown hover:bg-brown/5',
    muted: 'muted-button-primary'
  };

  const currentSizeStyles = sizeStyles[size];
  const currentVariantStyles = variantStyles[variant];

  const buttonClasses = [
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
    'border touch-friendly disabled:opacity-50 disabled:cursor-not-allowed',
    currentSizeStyles.padding,
    currentSizeStyles.text,
    currentVariantStyles,
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  const iconClasses = `${currentSizeStyles.icon} ${showIcon && text ? 'mr-1 sm:mr-2' : ''}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
    >
      {loading ? (
        <>
          <div className={text ? 'mr-1 sm:mr-2' : ''}>
            <KeyTurnLoader message="" />
          </div>
          {text && <span>Loading...</span>}
        </>
      ) : (
        <>
          {showIcon && <Eye className={iconClasses} />}
          {text && <span>{text}</span>}
        </>
      )}
    </button>
  );
};

export default CardViewDetailsButton;
