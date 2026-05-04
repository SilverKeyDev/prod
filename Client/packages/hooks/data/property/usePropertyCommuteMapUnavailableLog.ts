import { useEffect, useRef } from "react";

import { log, LOG_CATEGORIES } from "packages/logger";
import type { ListingCoordsInput } from "packages/utils/propertyDetails/location/listingCoords";
import { getListingCoordsUnavailableDiagnostics } from "packages/utils/propertyDetails/location/listingCoords";

type CommuteLike = {
  travel_times?: unknown;
} | null
  | undefined;

/**
 * Logs once per listing when commute routes exist but listing coordinates are missing.
 * Shared by web and native PropertyCommute to avoid duplicated effect blocks.
 */
export function usePropertyCommuteMapUnavailableLog(params: {
  commute: CommuteLike;
  hasTravelTimes: boolean;
  listingCoords: { lat: number; lng: number } | null | undefined;
  property: ListingCoordsInput | Record<string, unknown>;
}): void {
  const { commute, hasTravelTimes, listingCoords, property } = params;
  const loggedCommuteMapUnavailableKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!commute || !hasTravelTimes || listingCoords) {
      if (!commute || !hasTravelTimes) {
        loggedCommuteMapUnavailableKeyRef.current = null;
      }
      return;
    }
    const diagnostics = getListingCoordsUnavailableDiagnostics(property);
    if (!diagnostics) return;
    const listingId = typeof property.id === "string" ? property.id : undefined;
    const dedupeKey = `commute:${listingId ?? ""}:${diagnostics.reason}:${diagnostics.parsedLat}:${
      diagnostics.parsedLng
    }:${diagnostics.fields.lat}:${diagnostics.fields.latitude}:${diagnostics.fields.lng}:${
      diagnostics.fields.longitude
    }`;
    if (loggedCommuteMapUnavailableKeyRef.current === dedupeKey) return;
    loggedCommuteMapUnavailableKeyRef.current = dedupeKey;
    log.info(LOG_CATEGORIES.PROPERTY_DETAILS, "Property commute map unavailable (no listing coords)", {
      listingId,
      ...diagnostics,
    });
  }, [commute, hasTravelTimes, listingCoords, property]);
}
