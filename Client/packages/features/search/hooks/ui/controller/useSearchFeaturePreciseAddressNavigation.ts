import { useCallback } from "react";

import type { PreciseStreetAddressPayload } from "packages/features/search/components/header/location-bar/searchLocationBarTypes";
import type { SearchResult } from "packages/features/search/types/domain/result";
import { simpleHash } from "packages/utils";

/**
 * Builds a minimal SearchResult from geocoder payload and opens property details.
 */
export function useSearchFeaturePreciseAddressNavigation(
  handleViewPropertyDetails: (p: SearchResult) => void | Promise<void>
): (payload: PreciseStreetAddressPayload) => void {
  return useCallback(
    (payload: PreciseStreetAddressPayload) => {
      const id =
        payload.placeId && payload.placeId.length > 0
          ? payload.placeId
          : `geocode:${simpleHash(payload.formattedAddress)}`;
      const property: SearchResult = {
        id,
        address: payload.formattedAddress,
        price: "",
        bedrooms: 0,
        bathrooms: 0,
        sqft: 0,
        lat: payload.lat,
        lng: payload.lng,
        propertyType: "SINGLE_FAMILY",
        listingStatus: "FOR_SALE",
      };
      void handleViewPropertyDetails(property);
    },
    [handleViewPropertyDetails]
  );
}
