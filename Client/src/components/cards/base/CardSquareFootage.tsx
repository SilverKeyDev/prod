import React from 'react';
import { Square } from 'lucide-react';

export interface CardSquareFootageProps {
  /** Square footage value */
  sqft?: number;
  /** Display variant */
  variant?: 'default' | 'modal' | 'compact' | 'inline';
  /** Text size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show the square icon */
  showIcon?: boolean;
  /** Whether to show 'sqft' suffix */
  showSuffix?: boolean;
  /** Additional className */
  className?: string;
  /** Text color override */
  textColor?: string;
  /** Icon color override */
  iconColor?: string;
}

const CardSquareFootage: React.FC<CardSquareFootageProps> = ({
  sqft,
  variant = 'default',
  size = 'sm',
  showIcon = true,
  showSuffix = true,
  className = '',
  textColor = 'text-gray-600',
  iconColor = 'text-brown'
}) => {
  // Don't render if no sqft or invalid value
  if (!sqft || sqft <= 0) return null;

  // Always round to integer and format with commas
  const formattedSqft = Math.round(sqft).toLocaleString();

  // Size variants with responsive scaling
  const sizeStyles = {
    xs: {
      text: 'text-xs sm:text-sm',
      icon: 'w-3 h-3 sm:w-3.5 sm:h-3.5'
    },
    sm: {
      text: 'text-sm sm:text-base',
      icon: 'w-3.5 h-3.5 sm:w-4 sm:h-4'
    },
    md: {
      text: 'text-base sm:text-lg',
      icon: 'w-4 h-4 sm:w-5 sm:h-5'
    },
    lg: {
      text: 'text-lg sm:text-xl',
      icon: 'w-5 h-5 sm:w-6 sm:w-6'
    },
    xl: {
      text: 'text-xl sm:text-2xl',
      icon: 'w-6 h-6 sm:w-7 sm:h-7'
    }
  };

  // Variant-specific styling
  const variantStyles = {
    default: 'flex items-center',
    modal: 'text-center',
    compact: 'flex items-center',
    inline: 'inline-flex items-center'
  };

  const currentSizeStyles = sizeStyles[size];
  const currentVariantStyles = variantStyles[variant];

  // Determine suffix text based on variant
  const getSuffixText = () => {
    if (!showSuffix) return '';
    switch (variant) {
      case 'modal':
        return 'Sq Ft';
      case 'compact':
        return 'sf';
      default:
        return 'sqft';
    }
  };

  const suffixText = getSuffixText();

  // Modal variant has special layout
  if (variant === 'modal') {
    return (
      <div className={`${currentVariantStyles} ${className}`}>
        <div className={`font-bold ${currentSizeStyles.text} ${textColor}`}>
          {formattedSqft}
        </div>
        {suffixText && (
          <div className="text-sm text-gray-600 mt-1">
            {suffixText}
          </div>
        )}
      </div>
    );
  }

  // Standard layout for other variants
  return (
    <div className={`${currentVariantStyles} flex-shrink-0 ${className}`}>
      {showIcon && (
        <Square className={`${currentSizeStyles.icon} ${iconColor} mr-1 flex-shrink-0`} />
      )}
      <span className={`${currentSizeStyles.text} ${textColor} whitespace-nowrap`}>
        {formattedSqft}
        {suffixText && ` ${suffixText}`}
      </span>
    </div>
  );
};

export default CardSquareFootage;
