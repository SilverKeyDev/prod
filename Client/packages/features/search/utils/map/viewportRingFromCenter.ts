import type { ViewportPolygonPoint } from "packages/types/domain/api";

/** Build a closed viewport ring from center + lat/lng deltas (web map or native region). */
export function viewportRingFromCenter(
  center: { lat: number; lng: number },
  latitudeDelta: number,
  longitudeDelta: number
): ViewportPolygonPoint[] {
  const north = center.lat + latitudeDelta / 2;
  const south = center.lat - latitudeDelta / 2;
  const east = center.lng + longitudeDelta / 2;
  const west = center.lng - longitudeDelta / 2;
  return [
    { lat: north, lng: west },
    { lat: north, lng: east },
    { lat: south, lng: east },
    { lat: south, lng: west },
    { lat: north, lng: west },
  ];
}

/** Default span around a geolocation point (~15 km). */
export const GEOLOCATION_SEARCH_LAT_DELTA = 0.14;
export const GEOLOCATION_SEARCH_LNG_DELTA = 0.18;

export function viewportRingFromGeolocation(lat: number, lng: number): ViewportPolygonPoint[] {
  return viewportRingFromCenter(
    { lat, lng },
    GEOLOCATION_SEARCH_LAT_DELTA,
    GEOLOCATION_SEARCH_LNG_DELTA
  );
}
