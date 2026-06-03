/**
 * Helpers for useMapMarkers: isochrone render, map center, and pin batch.
 */

import { getMapFocusedProperty } from "packages/features/search/types/search/map/mapCardFocus";
import { calculatePropertyCardCenter } from "packages/features/search/types/search/map/propertyCardCenter";
import { applyListingFocusCamera } from "packages/features/search/utils/googleMaps";
import { log } from "packages/logger";
import type { SearchResult } from "packages/types";
import { getWindow } from "packages/utils/platform";

import type { GoogleAdvancedMarkerElement } from "./types";

type MapRef = {
  current: {
    setCenter: (c: { lat: number; lng: number }) => void;
    setZoom: (z: number) => void;
  } | null;
};
export type EnsureIsochroneParams = {
  isochroneData: unknown;
  setIsochroneData: (data: unknown) => void;
  fetchIsochroneForMapOnly: () => Promise<unknown>;
  onRenderImportant: (data: unknown) => void;
};

export async function ensureIsochroneAndRender(params: EnsureIsochroneParams): Promise<void> {
  const { isochroneData, setIsochroneData, fetchIsochroneForMapOnly, onRenderImportant } = params;
  if (isochroneData) {
    onRenderImportant(isochroneData);
    return;
  }
  const data = await fetchIsochroneForMapOnly();
  if (data && typeof data === "object") {
    setIsochroneData(data);
    onRenderImportant(data);
  }
}

export function centerMapOnFocusedProperty(
  results: SearchResult[],
  currentPage: number,
  googleMapRef: MapRef
): void {
  const focusedProperty = getMapFocusedProperty(results, currentPage);
  if (
    !focusedProperty ||
    !googleMapRef.current ||
    focusedProperty.lat == null ||
    focusedProperty.lng == null
  ) {
    return;
  }
  const center = calculatePropertyCardCenter(
    focusedProperty.lat,
    focusedProperty.lng,
    focusedProperty.id
  );
  applyListingFocusCamera(googleMapRef.current, center);
}

export function getAdvancedMarkerElement():
  | (new (opts: {
      map: google.maps.Map;
      position: { lat: number; lng: number };
      title: string;
      content: HTMLElement;
      zIndex?: number | null;
    }) => GoogleAdvancedMarkerElement)
  | null {
  const win = getWindow() as (Window & { google: typeof google }) | null;
  if (!win?.google?.maps?.marker?.AdvancedMarkerElement) {
    log.error(
      "MAP_RENDERING",
      "❌ [MARKER POSITION UPDATE] AdvancedMarkerElement not available, skipping marker update"
    );
    return null;
  }
  return win.google.maps.marker.AdvancedMarkerElement as new (opts: {
    map: google.maps.Map;
    position: { lat: number; lng: number };
    title: string;
    content: HTMLElement;
    zIndex?: number | null;
  }) => GoogleAdvancedMarkerElement;
}
