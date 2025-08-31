import React from 'react';
import BaseCard from './BaseCard';
import { CardAddressDisplay, CardPropertyDetails, CardMatchScore } from './base';
import { StyledImage } from './base/CardImageStyles';

export interface PropertyCardProps {
  /** Property image URL */
  imageUrl?: string;
  /** Property address */
  address: string;
  /** Match score (0-100) */
  score?: number;
  /** Property price */
  price: string;
  /** Property details */
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lotSize?: string;
  propertyType?: string;
  status?: { text: string; className: string };
  /** Card actions */
  onSave?: () => void;
  onUnsave?: () => void;
  onViewDetails?: () => void;
  /** Card state */
  isSaved?: boolean;
  loading?: boolean;
  /** Card type for appropriate sizing */
  cardType?: 'searchpage' | 'regular';
  /** Price position */
  pricePosition?: 'top-left' | 'top-right' | 'below-address';
  /** Top content (e.g., heart save button) */
  topContent?: React.ReactNode;
  /** Bottom content (e.g., view details button) */
  bottomContent?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Custom styling */
  className?: string;
  showScore?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  imageUrl,
  address,
  price,
  score,
  bedrooms,
  bathrooms,
  sqft,
  propertyType,
  lotSize,
  status,
  cardType = 'regular',
  pricePosition = 'top-right',
  topContent,
  bottomContent,
  loading = false,
  onClick,
  className = '',
  showScore = true
}) => {
  const placeholder = '/api/placeholder/400/300';

  const formatPrice = (price: string | number): string => {
    if (typeof price === 'number') {
      return `$${price.toLocaleString()}`;
    }
    return price.toString();
  };

  return (
    <BaseCard 
      hover 
      interactive 
      loading={loading} 
      padding="none" 
      cardType={cardType}
      className={className} 
      onClick={onClick}
    >
      <div className="relative h-32 sm:h-40 md:h-48 overflow-hidden">
        <StyledImage
          src={imageUrl}
          alt={address}
          variant="professional"
          placeholder={placeholder}
          className="w-full h-full"
        />
        
        {/* Status Badge */}
        {status && (
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
            <span className={`space-responsive-xs rounded-full text-responsive-xs font-medium ${status.className}`}>
              {status.text}
            </span>
          </div>
        )}
        
        {/* Price Badge - only show if not below-address */}
        {pricePosition !== 'below-address' && (
          <div className={`absolute top-2 sm:top-3 ${pricePosition === 'top-left' ? 'left-2 sm:left-3' : 'right-2 sm:right-3'} bg-neutral-50/95 backdrop-blur-sm space-responsive-xs rounded-full border border-neutral-200/50`}>
            <span className="text-responsive-xs font-semibold text-brand-primary">
              {formatPrice(price)}
            </span>
          </div>
        )}
        
        {/* Top Content (e.g., HeartSave) - only show if price not below-address */}
        {topContent && pricePosition !== 'below-address' && (
          <div className={`absolute top-2 sm:top-3 ${pricePosition === 'top-left' ? 'right-2 sm:right-3' : 'left-2 sm:left-3'}`}>
            {topContent}
          </div>
        )}
      </div>
      
      <div className="card-content-spacing">
        {/* Address row: full width + single-line truncate */}
        <div className="w-full">
          <CardAddressDisplay 
            address={address}
            size="sm"
            className={
              pricePosition === 'below-address'
                ? 'mb-0 block w-full overflow-hidden text-ellipsis whitespace-nowrap'
                : 'mb-1 block w-full overflow-hidden text-ellipsis whitespace-nowrap'
            }
          />
        </div>
        
        {/* Price and Heart Section - when price goes below address */}
        {pricePosition === 'below-address' && (
          <div className="flex items-center justify-between mb-1">
            <div className="text-lg sm:text-xl font-bold text-brown">
              {formatPrice(price)}
            </div>
            {topContent && (
              <div className="flex-shrink-0">
                {topContent}
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <CardPropertyDetails 
            bedrooms={bedrooms} 
            bathrooms={bathrooms} 
            sqft={sqft} 
            lotSize={lotSize}
            variant="horizontal" 
            size="xs" 
          />
          {showScore && score !== undefined && (
            <CardMatchScore score={score} size="xs" />
          )}
        </div>
        
        {/* Property Type */}
        {propertyType && (
          <div className="text-responsive-xs text-gray-500 mb-2 sm:mb-3">
            <span>{propertyType}</span>
          </div>
        )}
        
        {/* Bottom Content */}
        {bottomContent && (
          <div className="mt-3">
            {bottomContent}
          </div>
        )}
      </div>
    </BaseCard>
  );
};

export default PropertyCard;
