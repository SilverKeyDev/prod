import React from 'react';
import { MapPin } from 'lucide-react';

export interface AddressDisplayProps {
  /** Primary address line (street address) */
  address: string;
  /** Secondary address line (city, state, zip) */
  secondaryAddress?: string;
  /** Region or neighborhood name */
  region?: string;
  /** Display variant */
  variant?: 'default' | 'compact' | 'detailed';
  /** Text size */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Whether to show map pin icon */
  showIcon?: boolean;
  /** Icon position */
  iconPosition?: 'left' | 'top';
  /** Additional className */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({
  address,
  secondaryAddress,
  region,
  variant = 'default',
  size = 'sm',
  showIcon = true,
  iconPosition = 'left',
  className = '',
  onClick
}) => {
  // Size variants - mobile responsive
  const sizeStyles = {
    xs: {
      primary: 'text-xs',
      secondary: 'text-xs',
      icon: 'h-3 w-3'
    },
    sm: {
      primary: 'text-xs sm:text-sm',
      secondary: 'text-xs',
      icon: 'h-4 w-4 sm:h-4 sm:w-4'
    },
    md: {
      primary: 'text-sm sm:text-base',
      secondary: 'text-xs sm:text-sm',
      icon: 'h-4 w-4 sm:h-5 sm:w-5'
    },
    lg: {
      primary: 'text-base sm:text-lg',
      secondary: 'text-sm sm:text-base',
      icon: 'h-5 w-5 sm:h-6 sm:w-6'
    }
  };

  // Layout variants - mobile responsive
  const layoutStyles = {
    default: iconPosition === 'left' ? 'flex items-start gap-1 sm:gap-2' : 'flex flex-col items-start gap-1',
    compact: 'flex items-center gap-1',
    detailed: iconPosition === 'left' ? 'flex items-start gap-1 sm:gap-2' : 'flex flex-col items-start gap-1 sm:gap-2'
  };

  const currentSizeStyles = sizeStyles[size];
  const currentLayoutStyles = layoutStyles[variant];

  const containerClasses = [
    currentLayoutStyles,
    onClick ? 'cursor-pointer hover:text-brown transition-colors' : '',
    className
  ].filter(Boolean).join(' ');

  const iconClasses = `${currentSizeStyles.icon} text-brown ${iconPosition === 'top' ? 'mt-0.5' : 'mt-0.5'} flex-shrink-0`;

  return (
    <div className={containerClasses} onClick={onClick}>
      {showIcon && iconPosition === 'left' && (
        <MapPin className={iconClasses} />
      )}
      
      <div className="flex-1">
        {showIcon && iconPosition === 'top' && (
          <MapPin className={`${iconClasses} mb-1`} />
        )}
        
        {/* Primary Address */}
        <p className={`${currentSizeStyles.primary} font-medium text-navy leading-tight truncate`}>
          {address}
        </p>
        
        {/* Secondary Address */}
        {secondaryAddress && (
          <p className={`${currentSizeStyles.secondary} text-gray-600 ${variant === 'compact' ? 'ml-1' : ''} truncate`}>
            {secondaryAddress}
          </p>
        )}
        
        {/* Region */}
        {region && (
          <p className={`${currentSizeStyles.secondary} text-brown font-medium ${variant === 'detailed' ? 'mt-1' : ''} truncate`}>
            {region}
          </p>
        )}
      </div>
    </div>
  );
};

export default AddressDisplay;
