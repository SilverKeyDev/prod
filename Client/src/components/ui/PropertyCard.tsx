import React from 'react';
import { MapPin, Bed, Bath, Square } from 'lucide-react';
import BaseCard from './BaseCard';

export interface PropertyCardProps {
  /** Property image URL */
  imageUrl?: string;
  /** Property address or display name */
  address: string;
  /** Property price */
  price: string | number;
  /** Number of bedrooms */
  bedrooms?: number;
  /** Number of bathrooms */
  bathrooms?: number;
  /** Square footage */
  sqft?: number;
  /** Property type */
  propertyType?: string;
  /** Lot size */
  lotSize?: string | number;
  /** Status badge content */
  status?: {
    text: string;
    className: string;
  };
  /** Price badge position */
  pricePosition?: 'top-left' | 'top-right';
  /** Additional content in the top section */
  topContent?: React.ReactNode;
  /** Additional content in the bottom section */
  bottomContent?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  imageUrl,
  address,
  price,
  bedrooms,
  bathrooms,
  sqft,
  propertyType,
  lotSize,
  status,
  pricePosition = 'top-right',
  topContent,
  bottomContent,
  loading = false,
  onClick,
  className = ''
}) => {
  const placeholder = "https://placehold.co/600x400?text=No+Image";
  
  // Format price
  const formatPrice = (price: string | number): string => {
    if (typeof price === 'string') {
      return price.startsWith('$') ? price : `$${price}`;
    }
    return `$${price?.toLocaleString() || 'N/A'}`;
  };

  return (
    <BaseCard
      hover
      interactive={!!onClick}
      loading={loading}
      padding="none"
      className={className}
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="relative h-32 sm:h-40 md:h-48 overflow-hidden">
        <img
          src={imageUrl || placeholder}
          alt={address}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Status Badge */}
        {status && (
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${status.className}`}>
              {status.text}
            </span>
          </div>
        )}

        {/* Price Badge */}
        <div className={`absolute top-2 sm:top-3 ${pricePosition === 'top-left' ? 'left-2 sm:left-3' : 'right-2 sm:right-3'} bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full`}>
          <span className="text-xs sm:text-sm font-semibold text-navy">
            {formatPrice(price)}
          </span>
        </div>

        {/* Top Content (e.g., Heart Save Button) */}
        {topContent && (
          <div className={`absolute top-2 sm:top-3 ${pricePosition === 'top-left' ? 'right-2 sm:right-3' : 'left-2 sm:left-3'}`}>
            {topContent}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-4">
        {/* Address */}
        <div className="flex items-start gap-2 mb-2 sm:mb-3">
          <MapPin className="h-3 sm:h-4 w-3 sm:w-4 text-brown mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs sm:text-sm font-medium text-navy leading-tight line-clamp-2">
              {address}
            </p>
          </div>
        </div>

        {/* Property Details */}
        {(bedrooms !== undefined || bathrooms !== undefined || sqft !== undefined) && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2 sm:mb-3">
            {bedrooms !== undefined && (
              <div className="flex items-center gap-1">
                <Bed className="h-3 w-3 text-brown flex-shrink-0" />
                <span className="btn-text-sm text-gray-600 truncate">
                  {bedrooms} bed{bedrooms !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {bathrooms !== undefined && (
              <div className="flex items-center gap-1">
                <Bath className="h-3 w-3 text-brown flex-shrink-0" />
                <span className="btn-text-sm text-gray-600 truncate">
                  {bathrooms} bath{bathrooms !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {sqft !== undefined && sqft > 0 && (
              <div className="flex items-center gap-1">
                <Square className="h-3 w-3 text-brown flex-shrink-0" />
                <span className="btn-text-sm text-gray-600 truncate">
                  {sqft.toLocaleString()} sqft
                </span>
              </div>
            )}
          </div>
        )}

        {/* Additional Details */}
        {(propertyType || lotSize) && (
          <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-3">
            {/* Property Type */}
            {propertyType && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 flex-shrink-0">Type:</span>
                <span className="text-xs font-medium text-navy truncate">
                  {propertyType
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              </div>
            )}

            {/* Lot Size */}
            {lotSize && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 flex-shrink-0">Lot:</span>
                <span className="text-xs font-medium text-navy truncate">
                  {lotSize}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Bottom Content (e.g., Action Buttons) */}
        {bottomContent}
      </div>
    </BaseCard>
  );
};

export default PropertyCard;
