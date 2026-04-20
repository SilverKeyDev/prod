import type { SearchResult } from "packages/types";

import type { GoogleAdvancedMarkerElement } from "./types";

const COORD_EPS = 1e-5;

function hasUsableCoords(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    !(lat === 0 && lng === 0)
  );
}

function findPinMarker(
  markers: GoogleAdvancedMarkerElement[],
  listingId: string
): GoogleAdvancedMarkerElement | undefined {
  return markers.find((m) => {
    const c = (m as unknown as { content?: HTMLElement }).content;
    return c?.dataset?.markerType === "pin" && c.dataset.listingId === listingId;
  });
}

/**
 * Removes pins whose listing id is not in `results`, then returns listings that
 * need a new pin (missing or moved). Existing pins with matching coords are kept.
 */
export function removeOrphanPinsAndListMissingForPins(
  markersRef: { current: GoogleAdvancedMarkerElement[] },
  results: SearchResult[],
  teardownMarker: (marker: GoogleAdvancedMarkerElement) => void
): SearchResult[] {
  const desired = new Set(results.map((r) => r.id));

  markersRef.current = markersRef.current.filter((marker) => {
    const content = (marker as unknown as { content?: HTMLElement }).content;
    if (content?.dataset?.markerType !== "pin") {
      return true;
    }
    const id = content.dataset.listingId;
    if (!id || !desired.has(id)) {
      teardownMarker(marker);
      return false;
    }
    return true;
  });

  const missing: SearchResult[] = [];

  for (const result of results) {
    const marker = findPinMarker(markersRef.current, result.id);
    const lat = result.lat;
    const lng = result.lng;

    if (hasUsableCoords(lat, lng)) {
      if (!marker) {
        missing.push(result);
        continue;
      }
      const el = (marker as unknown as { content: HTMLElement }).content;
      const pLat = Number(el.dataset.pinLat);
      const pLng = Number(el.dataset.pinLng);
      if (
        Number.isNaN(pLat) ||
        Number.isNaN(pLng) ||
        Math.abs(pLat - lat) > COORD_EPS ||
        Math.abs(pLng - lng) > COORD_EPS
      ) {
        teardownMarker(marker);
        markersRef.current = markersRef.current.filter((m) => m !== marker);
        missing.push(result);
      }
      continue;
    }

    if (!marker) {
      missing.push(result);
    }
  }

  return missing;
}
