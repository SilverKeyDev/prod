import type { ViewportPolygonPoint } from "packages/types/domain/api";

/** Atlanta metro centroid — inside SUPPORTED_SERVICE_AREA_BOUNDS (Georgia pilot). */
export const DEFAULT_PILOT_SEARCH_CENTER = {
  lat: 33.749,
  lng: -84.388,
} as const;

/** ~25 km span — small enough for polygon search, large enough for initial results. */
export const DEFAULT_PILOT_SEARCH_LAT_DELTA = 0.22;
export const DEFAULT_PILOT_SEARCH_LNG_DELTA = 0.28;

/** Closed viewport ring for default-market fallback when geolocation is denied. */
export function defaultPilotSearchViewportRing(): ViewportPolygonPoint[] {
  const { lat, lng } = DEFAULT_PILOT_SEARCH_CENTER;
  const latHalf = DEFAULT_PILOT_SEARCH_LAT_DELTA / 2;
  const lngHalf = DEFAULT_PILOT_SEARCH_LNG_DELTA / 2;
  const north = lat + latHalf;
  const south = lat - latHalf;
  const east = lng + lngHalf;
  const west = lng - lngHalf;
  return [
    { lat: north, lng: west },
    { lat: north, lng: east },
    { lat: south, lng: east },
    { lat: south, lng: west },
    { lat: north, lng: west },
  ];
}
