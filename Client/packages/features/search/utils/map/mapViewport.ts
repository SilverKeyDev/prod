import type { ViewportPolygonPoint } from "packages/types/domain/api";

/** Build viewport ring from react-native-maps region (or any lat/lng + deltas). */
export function mapViewportFromLatLngDeltas(region: {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}): ViewportPolygonPoint[] {
  const north = region.latitude + region.latitudeDelta / 2;
  const south = region.latitude - region.latitudeDelta / 2;
  const east = region.longitude + region.longitudeDelta / 2;
  const west = region.longitude - region.longitudeDelta / 2;
  return [
    { lat: north, lng: west },
    { lat: north, lng: east },
    { lat: south, lng: east },
    { lat: south, lng: west },
    { lat: north, lng: west },
  ];
}

/**
 * Build a closed ring from the visible map bounds for `viewport_polygon` (map search).
 */
export function boundsToViewportPolygon(bounds: google.maps.LatLngBounds): ViewportPolygonPoint[] {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const north = ne.lat();
  const south = sw.lat();
  const east = ne.lng();
  const west = sw.lng();
  return [
    { lat: north, lng: west },
    { lat: north, lng: east },
    { lat: south, lng: east },
    { lat: south, lng: west },
    { lat: north, lng: west },
  ];
}

export function centroidOfViewportRing(ring: ViewportPolygonPoint[]): {
  lat: number;
  lng: number;
} {
  const unique =
    ring.length > 1 && ring[0]?.lat === ring[ring.length - 1]?.lat ? ring.slice(0, -1) : ring;
  let slat = 0;
  let slng = 0;
  const n = Math.max(1, unique.length);
  for (const p of unique) {
    slat += p.lat;
    slng += p.lng ?? p.lon ?? 0;
  }
  return { lat: slat / n, lng: slng / n };
}
