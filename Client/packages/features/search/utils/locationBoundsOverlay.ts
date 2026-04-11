import type { IsochroneData } from "packages/features/search/types/isochrone";
import type { ViewportPolygonPoint } from "packages/types/api";

/**
 * Convert a viewport ring (lat/lng per point, closed) to GeoJSON Polygon outer ring coordinates.
 * GeoJSON uses [longitude, latitude]; output is one-element array for Polygon.coordinates.
 */
export function viewportRingToPolygonCoordinates(
  ring: ViewportPolygonPoint[],
): number[][][] {
  if (!ring.length) {
    return [[]];
  }
  const open =
    ring.length > 1 &&
    ring[0]?.lat === ring[ring.length - 1]?.lat &&
    (ring[0]?.lng ?? ring[0]?.lon) ===
      (ring[ring.length - 1]?.lng ?? ring[ring.length - 1]?.lon)
      ? ring.slice(0, -1)
      : [...ring];

  const lngLat: number[][] = open.map((p) => {
    const lng = p.lng ?? p.lon ?? 0;
    return [lng, p.lat];
  });

  if (lngLat.length === 0) {
    return [[]];
  }

  const first = lngLat[0];
  const last = lngLat[lngLat.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    lngLat.push([first[0], first[1]]);
  }

  return [lngLat];
}

/** Minimal IsochroneData shape for renderIsochronePolygon / native map parsers. */
export function buildIsochroneOverlayFromViewportRing(
  ring: ViewportPolygonPoint[],
  center: { lat: number; lng: number },
  label?: string,
): IsochroneData {
  const coordinates = viewportRingToPolygonCoordinates(ring);
  return {
    isochrone: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates,
      },
    },
    center: {
      lat: center.lat,
      lon: center.lng,
      address: label ?? "",
    },
  };
}
