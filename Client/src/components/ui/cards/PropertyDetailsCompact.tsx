import React from 'react';
import { Bed, Bath, Square } from 'lucide-react';

export interface PropertyDetailsCompactProps {
  /** Number of bedrooms */
  bedrooms?: number;
  /** Number of bathrooms */
  bathrooms?: number;
  /** Square footage */
  sqft?: number;
  /** Display variant */
  variant?: 'horizontal' | 'grid' | 'modal';
  /** Text size */
  size?: 'xs' | 'sm' | 'md';
  /** Whether to show icons */
  showIcons?: boolean;
  /** Additional className */
  className?: string;
}

const PropertyDetailsCompact: React.FC<PropertyDetailsCompactProps> = ({
  bedrooms,
  bathrooms,
  sqft,
  variant = 'horizontal',
  size = 'xs',
  showIcons = true,
  className = ''
}) => {
  // Size variants
  const sizeStyles = {
    xs: {
      text: 'text-2xs sm:text-xs',
      icon: 'w-3 h-3 sm:w-4 sm:h-4'
    },
    sm: {
      text: 'text-xs sm:text-sm',
      icon: 'w-4 h-4 sm:w-5 sm:h-5'
    },
    md: {
      text: 'text-sm sm:text-base',
      icon: 'w-5 h-5 sm:w-6 sm:h-6'
    }
  };

  const currentSizeStyles = sizeStyles[size];
  const hasSqft = sqft !== undefined && sqft > 0;

  // Variant layouts
  const getLayoutClasses = () => {
    switch (variant) {
      case 'grid':
        return hasSqft ? 'grid-cols-3' : 'grid-cols-2 justify-center';
      case 'modal':
        return hasSqft ? 'grid-cols-3' : 'grid-cols-2 justify-center';
      case 'horizontal':
      default:
        return hasSqft ? 'justify-between' : 'justify-center';
    }
  };

  const getContainerClasses = () => {
    switch (variant) {
      case 'grid':
      case 'modal':
        return `grid gap-4 ${getLayoutClasses()}`;
      case 'horizontal':
      default:
        return `flex gap-2 ${getLayoutClasses()}`;
    }
  };

  const getItemClasses = () => {
    switch (variant) {
      case 'grid':
      case 'modal':
        return 'text-center';
      case 'horizontal':
      default:
        return hasSqft ? 'flex-1 min-w-0' : '';
    }
  };

  if (bedrooms === undefined && bathrooms === undefined && !hasSqft) {
    return null;
  }

  return (
    <div className={`${getContainerClasses()} ${className}`}>
      {bedrooms !== undefined && (
        <div className={`flex items-center gap-1 ${getItemClasses()}`}>
          {showIcons && <Bed className={`${currentSizeStyles.icon} text-brown flex-shrink-0`} />}
          <span className={`${currentSizeStyles.text} text-gray-600 truncate`}>
            {variant === 'modal' ? bedrooms : `${bedrooms} bed${bedrooms !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}
      
      {bathrooms !== undefined && (
        <div className={`flex items-center gap-1 ${getItemClasses()}`}>
          {showIcons && <Bath className={`${currentSizeStyles.icon} text-brown flex-shrink-0`} />}
          <span className={`${currentSizeStyles.text} text-gray-600 truncate`}>
            {variant === 'modal' ? bathrooms : `${bathrooms} bath${bathrooms !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}
      
      {hasSqft && (
        <div className={`flex items-center gap-1 ${getItemClasses()}`}>
          {showIcons && <Square className={`${currentSizeStyles.icon} text-brown flex-shrink-0`} />}
          <span className={`${currentSizeStyles.text} text-gray-600 truncate`}>
            {variant === 'modal' ? Math.round(sqft).toLocaleString() : `${Math.round(sqft).toLocaleString()} sqft`}
          </span>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailsCompact;
