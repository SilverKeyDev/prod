export type LatLng = { lat: number; lng: number };

const EARTH_KM = 6371;

/** Great-circle distance in kilometers (for sort only; precision adequate). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type DistanceSortMode =
  | { type: "point"; anchor: LatLng }
  | { type: "minOf"; points: LatLng[] }
  | { type: "none" };

export type DistanceAnchorInput = {
  userGeolocation: LatLng | null;
  searchBarAnchor: LatLng | null;
  importantLocations: LatLng[];
};

/**
 * Priority: device location → search bar resolved coords → min distance to any important location.
 */
export function resolveDistanceSortMode(
  input: DistanceAnchorInput,
): DistanceSortMode {
  if (input.userGeolocation) {
    return { type: "point", anchor: input.userGeolocation };
  }
  if (input.searchBarAnchor) {
    return { type: "point", anchor: input.searchBarAnchor };
  }
  const locs = input.importantLocations.filter(
    (p) =>
      typeof p.lat === "number" &&
      typeof p.lng === "number" &&
      !Number.isNaN(p.lat + p.lng),
  );
  if (locs.length === 0) return { type: "none" };
  if (locs.length === 1) return { type: "point", anchor: locs[0] };
  return { type: "minOf", points: locs };
}

/** Distance from property coords to sort reference; lower is closer. */
export function distanceKmForSort(
  mode: DistanceSortMode,
  property: LatLng,
): number | null {
  if (mode.type === "none") return null;
  const plat = property.lat;
  const plng = property.lng;
  if (
    typeof plat !== "number" ||
    typeof plng !== "number" ||
    Number.isNaN(plat + plng)
  ) {
    return null;
  }
  const p: LatLng = { lat: plat, lng: plng };
  if (mode.type === "point") {
    return haversineKm(p, mode.anchor);
  }
  let min = Infinity;
  for (const q of mode.points) {
    const d = haversineKm(p, q);
    if (d < min) min = d;
  }
  return Number.isFinite(min) ? min : null;
}
