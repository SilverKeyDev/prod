import type { ViewportPolygonPoint } from "packages/types/domain/api";

type GeoJsonGeometry = {
  type?: string;
  coordinates?: unknown;
};

/** Extract outer ring from isochrone GeoJSON Polygon / MultiPolygon for viewport_polygon. */
export function extractViewportRingFromIsochroneGeometry(
  geometry: GeoJsonGeometry | null | undefined
): ViewportPolygonPoint[] | null {
  if (!geometry?.coordinates) {
    return null;
  }
  let ring: number[][] | undefined;
  if (geometry.type === "Polygon") {
    const coords = geometry.coordinates as number[][][];
    ring = coords[0];
  } else if (geometry.type === "MultiPolygon") {
    const coords = geometry.coordinates as number[][][][];
    ring = coords[0]?.[0];
  }
  if (!ring || ring.length < 4) {
    return null;
  }
  const points: ViewportPolygonPoint[] = ring.map(([lng, lat]) => ({
    lat,
    lng,
  }));
  const first = points[0];
  const last = points[points.length - 1];
  if (first && last && (first.lat !== last.lat || first.lng !== last.lng)) {
    points.push({ ...first });
  }
  return points;
}
