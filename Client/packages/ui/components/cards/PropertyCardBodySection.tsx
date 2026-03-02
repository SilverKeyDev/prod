import React from "react";

import { spacing } from "packages/design-tokens";
import type { Property } from "packages/schemas/property";

import type { SearchResult } from "@/features/search/types";

import {
  CardAddressDisplay,
  CardMatchScore,
  CardNotInterested,
  CardPropertyDetails,
} from "./base/index.web";

function formatPriceDisplay(price: string): string {
  return price.startsWith("$") ? price : `$${price}`;
}

export function PropertyCardHideImageHeader({
  price,
  topContent,
  showNotInterested,
  property,
  onMarkNotInterested,
}: {
  price: string;
  topContent?: React.ReactNode;
  showNotInterested: boolean;
  property?: SearchResult | Property;
  onMarkNotInterested: () => void;
}) {
  return (
    <div className="relative flex w-full items-center justify-center">
      <div className="text-olive text-lg font-bold sm:text-xl">{formatPriceDisplay(price)}</div>
      {(topContent || (showNotInterested && property)) && (
        <div className="absolute right-0 flex-shrink-0">
          {showNotInterested && property && (
            <CardNotInterested
              property={property}
              size="sm"
              position="top-left"
              onMarkNotInterested={onMarkNotInterested}
            />
          )}
          {topContent}
        </div>
      )}
    </div>
  );
}

export function PropertyCardPriceRow({
  pricePosition,
  price,
  showScore,
  score,
  isOnMap,
  address,
  addressClassName,
}: {
  pricePosition: "top-left" | "top-right" | "below-address";
  price: string;
  showScore: boolean;
  score?: number;
  isOnMap: boolean;
  address: string;
  addressClassName: string;
}) {
  return (
    <>
      {!isOnMap && (
        <div className="w-full">
          <CardAddressDisplay
            address={address}
            size="sm"
            variant="compact"
            className={addressClassName}
          />
        </div>
      )}
      {pricePosition === "below-address" && (
        <div className="flex w-full items-center gap-2">
          {showScore && score !== undefined ? (
            <div className="flex flex-1 items-center gap-2">
              <div className="text-olive text-lg font-bold sm:text-xl">
                {formatPriceDisplay(price)}
              </div>
              <div className="mr-3 sm:mr-4">
                <CardMatchScore score={score} size="xs" useColorStyling={true} />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 justify-center">
              <div className="text-olive text-lg font-bold sm:text-xl">
                {formatPriceDisplay(price)}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function PropertyCardDetailsRow({
  bedrooms,
  bathrooms,
  sqft,
  lotSize,
  propertyType,
  hideSquareFootage,
  isOnMap,
}: {
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lotSize?: string;
  propertyType?: string;
  hideSquareFootage: boolean;
  isOnMap: boolean;
}) {
  return (
    <div className="flex items-center">
      <CardPropertyDetails
        bedrooms={bedrooms}
        bathrooms={bathrooms}
        sqft={sqft}
        lotSize={lotSize}
        propertyType={propertyType}
        variant="horizontal"
        hideSquareFootage={hideSquareFootage ?? isOnMap}
      />
    </div>
  );
}

export function PropertyCardTrianglePointer() {
  return (
    <div className="relative w-full" style={{ height: spacing(2) }}>
      <div
        className="absolute left-0 top-0 w-full bg-white shadow-sm"
        style={{
          height: spacing(2),
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
        }}
      />
    </div>
  );
}
