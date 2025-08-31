import React from 'react';
import { Bed, Bath } from 'lucide-react';
import CardSquareFootage from './CardSquareFootage';

export interface CardPropertyDetailsProps {
  /** Number of bedrooms */
  bedrooms?: number;
  /** Number of bathrooms */
  bathrooms?: number;
  /** Square footage */
  sqft?: number;
  /** Display variant */
  variant?: 'horizontal' | 'vertical' | 'grid' | 'modal';
  /** Text size */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Whether to show icons */
  showIcons?: boolean;
  /** Additional className */
  className?: string;
}

const CardPropertyDetails: React.FC<CardPropertyDetailsProps> = ({
  bedrooms,
  bathrooms,
  sqft,
  variant = 'horizontal',
  size = 'sm',
  showIcons = true,
  className = ''
}) => {
  // Size variants using utilities.css classes with scaling support
  const sizeStyles = {
    xs: {
      text: 'text-xs sm:text-sm',
      icon: 'w-3 h-3 sm:w-3.5 sm:h-3.5',
      gap: 'gap-1 sm:gap-1.5'
    },
    sm: {
      text: 'text-sm sm:text-base',
      icon: 'w-3.5 h-3.5 sm:w-4 sm:h-4',
      gap: 'gap-1.5 sm:gap-2'
    },
    md: {
      text: 'text-base sm:text-lg',
      icon: 'w-4 h-4 sm:w-5 sm:h-5',
      gap: 'gap-2 sm:gap-2.5'
    },
    lg: {
      text: 'text-lg sm:text-xl',
      icon: 'w-5 h-5 sm:w-6 sm:h-6',
      gap: 'gap-2.5 sm:gap-3'
    }
  };

  // Layout variants - ensuring rigid single-row structure
  const layoutStyles = {
    horizontal: 'flex items-center flex-nowrap',
    vertical: 'flex items-center flex-nowrap', // Changed to single row
    grid: 'flex items-center flex-nowrap',      // Changed to single row
    modal: 'flex items-center flex-nowrap'     // Changed to single row
  };

  const currentSizeStyles = sizeStyles[size];
  const currentLayoutStyles = layoutStyles[variant];

  const containerClasses = [
    currentLayoutStyles,
    currentSizeStyles.gap,
    className
  ].filter(Boolean).join(' ');

  if (bedrooms === undefined && bathrooms === undefined && sqft === undefined) return null;

  return (
    <div className={containerClasses}>
      {bedrooms !== undefined && (
        <div className="flex items-center flex-shrink-0">
          {showIcons && <Bed className={`${currentSizeStyles.icon} text-brown mr-1 flex-shrink-0`} />}
          <span className={`${currentSizeStyles.text} text-gray-600 whitespace-nowrap`}>
            {variant === 'modal' ? bedrooms : `${bedrooms} bed${bedrooms !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}
      
      {bathrooms !== undefined && (
        <div className="flex items-center flex-shrink-0">
          {showIcons && <Bath className={`${currentSizeStyles.icon} text-brown mr-1 flex-shrink-0`} />}
          <span className={`${currentSizeStyles.text} text-gray-600 whitespace-nowrap`}>
            {variant === 'modal' ? bathrooms : `${bathrooms} bath${bathrooms !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}
      
      <CardSquareFootage 
        sqft={sqft}
        variant={variant === 'modal' ? 'modal' : 'default'}
        size={size}
        showIcon={showIcons}
        showSuffix={variant !== 'modal'}
        textColor="text-gray-600"
        iconColor="text-brown"
      />
    </div>
  );
};

export default CardPropertyDetails;
