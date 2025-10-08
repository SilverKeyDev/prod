import React from "react";

import { useWhyRender } from "../../../../packages/hooks/ui/useWhy";

import {
  CardAddressDisplay,
  CardPropertyDetails,
  CardMatchScore,
} from "./base";
import { StyledImage } from "./base/CardImageStyles";
import BaseCard from "./BaseCard";

export type PropertyCardProps = {
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
  /** Whether to hide the image section (for mobile carousel) */
  hideImage?: boolean;
};

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
    hideImage = false,
  } = props;

  if (import.meta.env.DEV) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useWhyRender({ id, address, price, score });

    // count only when mounted (not every render)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const mounted = React.useRef(false);
    if (!mounted.current) {
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
      {/* Image container - only render if imageUrl is provided and not hidden */}
      {imageUrl && !hideImage && (
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
            className="h-full w-full"
          />

          {/* Status Badge */}
          {status && (
            <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium sm:px-3 sm:py-1.5 sm:text-sm ${status.className}`}
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
              } rounded-full border border-neutral-200/50 bg-neutral-50/95 px-2 py-1 backdrop-blur-sm sm:px-3 sm:py-1.5`}
            >
              <span className="text-xs font-medium text-brown sm:text-sm">
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

      <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
        {/* Price display when image is hidden - show prominently at top */}
        {hideImage && (
          <div className="flex w-full items-center justify-between">
            <div className="text-lg font-bold text-brown sm:text-xl">
              {formatPrice(price)}
            </div>
            {topContent && <div className="flex-shrink-0">{topContent}</div>}
          </div>
        )}

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
          <div className="flex w-full items-center gap-2">
            {showScore && score !== undefined ? (
              // When there's a score, use the original layout
              <>
                <div className="flex flex-1 items-center gap-2">
                  <div className="text-lg font-bold text-brown sm:text-xl">
                    {formatPrice(price)}
                  </div>
                  <div className="mr-[2px]">
                    <CardMatchScore
                      score={score}
                      size="xs"
                      useColorStyling={true}
                    />
                  </div>
                </div>
                {topContent && (
                  <div className="flex-shrink-0">{topContent}</div>
                )}
              </>
            ) : (
              // When there's no score, center the price
              <>
                {topContent && (
                  <div className="flex-shrink-0">{topContent}</div>
                )}
                <div className="flex flex-1 justify-center">
                  <div className="text-lg font-bold text-brown sm:text-xl">
                    {formatPrice(price)}
                  </div>
                </div>
                <div className="flex-shrink-0 w-6"></div>{" "}
                {/* Spacer to balance the heart button */}
              </>
            )}
          </div>
        )}

        <div className="flex items-center">
          <CardPropertyDetails
            bedrooms={bedrooms}
            bathrooms={bathrooms}
            sqft={sqft}
            lotSize={lotSize}
            variant="horizontal"
            hideSquareFootage={hideSquareFootage ?? isOnMap}
          />
        </div>

        {/* Bottom Content */}
        {bottomContent && <div>{bottomContent}</div>}
      </div>

      {/* Triangle Pointer for Map Cards - 8px tall, full width */}
      {showTrianglePointer && (
        <div className="relative w-full" style={{ height: "8px" }}>
          <div
            className="absolute left-0 top-0 w-full bg-white shadow-sm"
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

export const PropertyCard = PropertyCardImpl;
export default PropertyCard;
