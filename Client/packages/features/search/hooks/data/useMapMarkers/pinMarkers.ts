import { addressForMarkerTitle } from "packages/features/search/types/search/formatters/address";
import { searchMapOverlayBaseZIndex } from "packages/features/search/types/search/map/mapOverlayLayerOrder";
import { createScorePinElement } from "packages/features/search/types/search/map/scorePinMarker";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { SearchResult } from "packages/types";

import { geocodeAddress } from "./geocode";
import type { GoogleAdvancedMarkerElement } from "./types";

type PinMarkersOptions = {
  map: google.maps.Map;
  markersRef: { current: GoogleAdvancedMarkerElement[] };
  AdvancedMarkerElement: new (opts: {
    map: google.maps.Map;
    position: { lat: number; lng: number };
    title: string;
    content: HTMLElement;
    zIndex?: number | null;
  }) => GoogleAdvancedMarkerElement;
  calculatePropertyScore: (property: SearchResult) => number;
  onMarkerClick?: (property: SearchResult) => void;
  onBatchComplete: () => void;
};

export async function createPinMarkersBatch(
  data: SearchResult[],
  options: PinMarkersOptions,
  pinStartIndex = 0
): Promise<void> {
  const {
    map,
    markersRef,
    AdvancedMarkerElement,
    calculatePropertyScore,
    onMarkerClick,
    onBatchComplete,
  } = options;

  const batchSize = 15;
  const pinEndIndex = Math.min(pinStartIndex + batchSize, data.length);

  for (let i = pinStartIndex; i < pinEndIndex; i++) {
    const result = data[i];
    const score =
      typeof result._score === "number" && result._score >= 0
        ? result._score
        : calculatePropertyScore(result);
    let lat = result.lat;
    let lng = result.lng;
    const hasZeroOrNullCoords = lat == null || lng == null || lat === 0 || lng === 0;
    if (hasZeroOrNullCoords && result.address) {
      const coords = await geocodeAddress(result.address);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      } else {
        continue;
      }
    } else if (hasZeroOrNullCoords) {
      continue;
    }
    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
      continue;
    }

    const pinElement = createScorePinElement(score, {
      listingStatus: result.listingStatus,
      homeStatus: result.homeStatus,
    });
    pinElement.dataset.markerType = "pin";
    pinElement.dataset.listingId = result.id;
    pinElement.dataset.pinLat = String(lat);
    pinElement.dataset.pinLng = String(lng);

    try {
      const marker = new AdvancedMarkerElement({
        map,
        position: { lat, lng },
        title: addressForMarkerTitle(result.address),
        content: pinElement,
        zIndex: searchMapOverlayBaseZIndex("homeMarkers"),
      }) as unknown as GoogleAdvancedMarkerElement;

      marker.addListener("gmp-click", () => {
        if (onMarkerClick) {
          onMarkerClick(result);
        }
      });
      markersRef.current.push(marker);
    } catch (error) {
      log.error(
        LOG_CATEGORIES.MAP_RENDERING,
        `Error creating score pin marker for property ${result.id}:`,
        error
      );
    }
  }

  if (pinEndIndex < data.length) {
    requestAnimationFrame(() => createPinMarkersBatch(data, options, pinEndIndex));
  } else {
    onBatchComplete();
  }
}
