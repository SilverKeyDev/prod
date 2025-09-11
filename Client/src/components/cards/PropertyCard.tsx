import React from "react";
import BaseCard from "./BaseCard";
import {
  CardAddressDisplay,
  CardPropertyDetails,
  CardMatchScore,
} from "./base";
import { StyledImage } from "./base/CardImageStyles";
import { useWhyRender } from "../../hooks/useWhy";

export interface PropertyCardProps {
  /** Stable ID for memoization */
  id: string;
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
  status?: { text: string; className: string };
  /** Card actions */
  onSave?: () => void;
  onUnsave?: () => void;
  onViewDetails?: () => void;
  /** Card state */
  isSaved?: boolean;
  loading?: boolean;
  /** Card type for appropriate sizing */
  cardType?: "searchpage" | "regular";
  /** Price position */
  pricePosition?: "top-left" | "top-right" | "below-address";
  /** Top content (e.g., heart save button) */
  topContent?: React.ReactNode;
  /** Bottom content (e.g., Unlock button) */
  bottomContent?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Custom styling */
  className?: string;
  showScore?: boolean;
  /** Whether to hide square footage */
  hideSquareFootage?: boolean;
  /** Whether to show triangle pointer for map cards */
  showTrianglePointer?: boolean;
  /** Whether this card is displayed on the map */
  isOnMap?: boolean;
}

function PropertyCardImpl(props: PropertyCardProps) {
  const {
    id,
    imageUrl,
    address,
    price,
    score,
    bedrooms,
    bathrooms,
    sqft,
    lotSize,
    status,
    cardType = "regular",
    pricePosition = "top-right",
    topContent,
    bottomContent,
    loading = false,
    onClick,
    className = "",
    showScore = true,
    hideSquareFootage = false,
    showTrianglePointer = false,
    isOnMap = false,
  } = props;

  if (import.meta.env.DEV) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useWhyRender(`PropertyCard-${id}`, props);

    // count only when mounted (not every render)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const mounted = React.useRef(false);
    if (!mounted.current) {
      console.log("🏠 [PROPERTY_CARD_DEBUG] mounted", id);
      mounted.current = true;
    }
  }

  const placeholder = "/api/placeholder/400/300";

  const formatPrice = (price: string | number): string => {
    if (typeof price === "number") {
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
      {/* Image container - only render if imageUrl is provided */}
      {imageUrl && (
        <div
          className={`relative overflow-hidden ${
            cardType === "searchpage"
              ? "h-24 sm:h-28 md:h-32"
              : "h-32 sm:h-40 md:h-48"
          }`}
        >
          <StyledImage
            src={imageUrl}
            alt={address}
            variant="professional"
            placeholder={placeholder}
            className="w-full h-full"
          />

          {/* Status Badge */}
          {status && (
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
              <span
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${status.className}`}
              >
                {status.text}
              </span>
            </div>
          )}

          {/* Price Badge - only show if not below-address */}
          {pricePosition !== "below-address" && (
            <div
              className={`absolute top-3 sm:top-4 ${
                pricePosition === "top-left"
                  ? "left-3 sm:left-4"
                  : "right-3 sm:right-4"
              } bg-neutral-50/95 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-neutral-200/50`}
            >
              <span className="text-xs sm:text-sm font-semibold text-brand-primary">
                {formatPrice(price)}
              </span>
            </div>
          )}

          {/* Top Content (e.g., HeartSave) - only show if price not below-address */}
          {topContent && pricePosition !== "below-address" && (
            <div
              className={`absolute top-3 sm:top-4 ${
                pricePosition === "top-left"
                  ? "right-3 sm:right-4"
                  : "left-3 sm:left-4"
              }`}
            >
              {topContent}
            </div>
          )}
        </div>
      )}

      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Address row: full width + proper truncate - hide on map */}
        {!isOnMap && (
          <div className="w-full">
            <CardAddressDisplay
              address={address}
              size="sm"
              variant="compact"
              className={
                pricePosition === "below-address"
                  ? "mb-0 w-full"
                  : "mb-1 w-full"
              }
            />
          </div>
        )}

        {/* Price and Heart Section - when price goes below address */}
        {pricePosition === "below-address" && (
          <div className="flex items-center w-full gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="text-lg sm:text-xl font-bold text-brown">
                {formatPrice(price)}
              </div>
              {showScore && score !== undefined && (
                <div className="mr-[2px]">
                  <CardMatchScore
                    score={score}
                    size="xs"
                    useColorStyling={true}
                  />
                </div>
              )}
            </div>
            {topContent && <div className="flex-shrink-0">{topContent}</div>}
          </div>
        )}

        <div className="flex items-center">
          <CardPropertyDetails
            bedrooms={bedrooms}
            bathrooms={bathrooms}
            sqft={sqft}
            lotSize={lotSize}
            variant="horizontal"
            hideSquareFootage={hideSquareFootage || isOnMap}
          />
        </div>

        {/* Bottom Content */}
        {bottomContent && <div>{bottomContent}</div>}
      </div>

      {/* Triangle Pointer for Map Cards - 8px tall, full width */}
      {showTrianglePointer && (
        <div className="w-full relative" style={{ height: "8px" }}>
          <div
            className="absolute top-0 left-0 w-full bg-white shadow-sm"
            style={{
              height: "8px",
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            }}
          />
        </div>
      )}
    </BaseCard>
  );
}

// shallow compare only the visual props
function equal(prev: PropertyCardProps, next: PropertyCardProps) {
  return (
    prev.id === next.id &&
    prev.address === next.address &&
    prev.price === next.price &&
    prev.bedrooms === next.bedrooms &&
    prev.bathrooms === next.bathrooms &&
    prev.sqft === next.sqft &&
    prev.lotSize === next.lotSize &&
    prev.imageUrl === next.imageUrl &&
    prev.loading === next.loading &&
    prev.cardType === next.cardType &&
    prev.pricePosition === next.pricePosition &&
    prev.showScore === next.showScore &&
    prev.hideSquareFootage === next.hideSquareFootage &&
    prev.showTrianglePointer === next.showTrianglePointer &&
    prev.isOnMap === next.isOnMap &&
    prev.className === next.className &&
    prev.score === next.score &&
    // Compare status object properties
    prev.status?.text === next.status?.text &&
    prev.status?.className === next.status?.className
    // Note: We intentionally skip callback props (onClick, onSave, etc.) as they often change identity
    // but don't affect the visual rendering. If callbacks are needed for memoization, they should be
    // memoized at the parent level.
  );
}

export const PropertyCard = React.memo(PropertyCardImpl, equal);
export default PropertyCard;
