import React from 'react';
import { MapPin } from "lucide-react";
import PropertyDetailsCompact from "./PropertyDetailsCompact";
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
            <span className={`space-responsive-xs rounded-full text-responsive-xs font-medium ${status.className}`}>
              {status.text}
            </span>
          </div>
        )}

        {/* Price Badge */}
        <div className={`absolute top-2 sm:top-3 ${pricePosition === 'top-left' ? 'left-2 sm:left-3' : 'right-2 sm:right-3'} bg-white/90 backdrop-blur-sm space-responsive-xs rounded-full`}>
          <span className="text-responsive-xs font-semibold text-navy">
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
      <div className="space-responsive-sm">
        {/* Address */}
        <div className="flex items-start gap-responsive-sm mb-2 sm:mb-3">
          <MapPin className="mobile-icon-sm text-brown mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-responsive-sm font-medium text-navy leading-tight line-clamp-2">
              {address}
            </p>
          </div>
        </div>

        {/* Property Details */}
        <PropertyDetailsCompact
          bedrooms={bedrooms}
          bathrooms={bathrooms}
          sqft={sqft}
          variant="horizontal"
          size="xs"
          className="mb-2 sm:mb-3"
        />

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
