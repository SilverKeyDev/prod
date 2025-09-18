import { Eye, ExternalLink } from 'lucide-react';
import React from 'react';

import KeyTurnLoader from '../../ui/loading/KeyTurnLoader';

export type CardViewButtonProps = {
  /** Click handler */
  onClick: () => void;
  /** Loading state */
  loading?: boolean;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'muted' | 'ghost';
  /** Button text */
  text?: string;
  /** Icon type */
  iconType?: 'eye' | 'external' | 'none';
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
};

const CardViewButton: React.FC<CardViewButtonProps> = ({
  onClick,
  loading = false,
  size = 'sm',
  variant = 'ghost',
  text = 'View',
  iconType = 'eye',
  disabled = false,
  className = '',
}) => {
  // Size variants using utilities.css classes
  const sizeStyles = {
    sm: {
      padding: 'space-responsive-xs',
      text: 'text-responsive-xs',
      icon: 'mobile-icon-xs',
    },
    md: {
      padding: 'space-responsive-sm',
      text: 'text-responsive-sm',
      icon: 'mobile-icon-sm',
    },
    lg: {
      padding: 'space-responsive-md',
      text: 'text-responsive-md',
      icon: 'mobile-icon-md',
    },
  };

  // Variant styles
  const variantStyles = {
    primary: 'bg-brown text-white hover:bg-brown/90 border-brown',
    secondary: 'bg-white text-brown border-brown hover:bg-brown/5',
    muted: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200',
    ghost: 'text-brown hover:bg-brown/10 border-transparent',
  };

  const currentSizeStyles = sizeStyles[size];
  const currentVariantStyles = variantStyles[variant];

  const buttonClasses = [
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
    'border touch-friendly disabled:opacity-50 disabled:cursor-not-allowed',
    currentSizeStyles.padding,
    currentSizeStyles.text,
    currentVariantStyles,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconClasses = `${currentSizeStyles.icon} ${text ? 'mr-1' : ''}`;

  const getIcon = () => {
    if (iconType === 'external') return ExternalLink;
    if (iconType === 'eye') return Eye;
    return null;
  };

  const Icon = getIcon();

  return (
    <button onClick={onClick} disabled={disabled ?? loading} className={buttonClasses} title={text}>
      {loading ? (
        <>
          <div className={text ? 'mr-1' : ''}>
            <KeyTurnLoader message="" />
          </div>
          {text && <span className="sr-only sm:not-sr-only">{text}</span>}
        </>
      ) : (
        <>
          {Icon && <Icon className={iconClasses} />}
          {text && <span className="sr-only sm:not-sr-only">{text}</span>}
        </>
      )}
    </button>
  );
};

export default CardViewButton;
