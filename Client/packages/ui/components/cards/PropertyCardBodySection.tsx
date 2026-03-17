import React from "react";

import { spacing } from "packages/design-tokens";
import type { Property } from "packages/schemas/property";
import { Box } from "packages/ui/components/primitives";

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
    <Box className="relative flex w-full items-center justify-center">
      <Box className="text-primary text-lg font-bold sm:text-xl">{formatPriceDisplay(price)}</Box>
      {(topContent || (showNotInterested && property)) && (
        <Box className="absolute right-0 flex-shrink-0">
          {showNotInterested && property && (
            <CardNotInterested
              property={property}
              size="sm"
              position="top-left"
              onMarkNotInterested={onMarkNotInterested}
            />
          )}
          {topContent}
        </Box>
      )}
    </Box>
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
        <Box className="w-full">
          <CardAddressDisplay
            address={address}
            size="sm"
            variant="compact"
            className={addressClassName}
          />
        </Box>
      )}
      {pricePosition === "below-address" && (
        <Box className="flex w-full items-center gap-2">
          {showScore && score !== undefined ? (
            <Box className="flex flex-1 items-center gap-2">
              <Box className="text-primary text-lg font-bold sm:text-xl">
                {formatPriceDisplay(price)}
              </Box>
              <Box className="mr-3 sm:mr-4">
                <CardMatchScore score={score} size="xs" useColorStyling={true} />
              </Box>
            </Box>
          ) : (
            <Box className="flex flex-1 justify-center">
              <Box className="text-primary text-lg font-bold sm:text-xl">
                {formatPriceDisplay(price)}
              </Box>
            </Box>
          )}
        </Box>
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
    <Box className="flex items-center">
      <CardPropertyDetails
        bedrooms={bedrooms}
        bathrooms={bathrooms}
        sqft={sqft}
        lotSize={lotSize}
        propertyType={propertyType}
        variant="horizontal"
        hideSquareFootage={hideSquareFootage ?? isOnMap}
      />
    </Box>
  );
}

export function PropertyCardTrianglePointer() {
  return (
    <Box className="relative w-full" style={{ height: spacing(2) }}>
      <Box
        className="absolute left-0 top-0 w-full bg-white shadow-sm"
        style={{
          height: spacing(2),
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
        }}
      />
    </Box>
  );
}
