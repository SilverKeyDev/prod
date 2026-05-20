/**
 * Shared Google Maps camera helpers for Search (center/zoom/snapshot).
 * Single source for listing-focus zoom so markers, persistence, and zoom buttons stay aligned.
 */

/** Zoom used when focusing the carousel listing or resetting after commute-location pins */
export const SEARCH_MAP_LISTING_FOCUS_ZOOM = 13;

/**
 * Zoom for property-details maps: tight enough to see adjacent lots / building footprints
 * (~street level; Google Maps zoom 19).
 */
export const PROPERTY_DETAILS_NEIGHBORHOOD_ZOOM = 19;

export { PROPERTY_DETAILS_MAP_REGION_DELTA } from "packages/utils/maps/native/propertyDetailsMapRegion";

/** @deprecated Prefer SEARCH_MAP_LISTING_FOCUS_ZOOM */
export const DEFAULT_ZOOM = SEARCH_MAP_LISTING_FOCUS_ZOOM;

export function applyListingFocusCamera(
  map: google.maps.Map,
  center: google.maps.LatLngLiteral
): void {
  map.setCenter(center);
  map.setZoom(SEARCH_MAP_LISTING_FOCUS_ZOOM);
}

/** Apply persisted web camera (skip zoom when invalid / zero) */
export function applyStoredMapCamera(
  map: google.maps.Map,
  camera: { lat: number; lng: number; zoom: number }
): void {
  map.setCenter({ lat: camera.lat, lng: camera.lng });
  if (camera.zoom > 0) {
    map.setZoom(camera.zoom);
  }
}

export function snapshotMapCamera(map: google.maps.Map): {
  lat: number;
  lng: number;
  zoom: number;
} | null {
  const c = map.getCenter();
  const z = map.getZoom();
  if (!c || z == null) {
    return null;
  }
  return { lat: c.lat(), lng: c.lng(), zoom: z };
}

export function adjustMapZoomByDelta(map: google.maps.Map, delta: number): void {
  const current = map.getZoom() ?? SEARCH_MAP_LISTING_FOCUS_ZOOM;
  map.setZoom(current + delta);
}

/** Reset zoom only (center unchanged); used after important-location marker setup */
export function resetMapToListingFocusZoom(map: google.maps.Map): void {
  map.setZoom(SEARCH_MAP_LISTING_FOCUS_ZOOM);
}
