import type { IsochroneData } from "packages/features/search/types/isochrone";

export type IsochroneImportantWaypoint = {
  address: string;
  lat: number;
  lng: number;
  commute_tolerance: number;
};

/**
 * Important locations from isochrone payload that have coordinates (same inclusion rules as web markers).
 */
export function importantWaypointsFromIsochrone(
  isochroneData: IsochroneData,
): IsochroneImportantWaypoint[] {
  const out: IsochroneImportantWaypoint[] = [];
  if (!isochroneData.locations?.length) {
    return out;
  }
  for (const location of isochroneData.locations) {
    if (!location.address) continue;
    if (out.some((e) => e.address === location.address)) continue;
    const lat = location.lat;
    const lng = location.lng;
    if (!lat || !lng) continue;
    out.push({
      address: location.address,
      lat,
      lng,
      commute_tolerance: location.commute_tolerance ?? 30,
    });
  }
  return out;
}
