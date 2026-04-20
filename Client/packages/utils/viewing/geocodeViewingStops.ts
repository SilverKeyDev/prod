import type { ViewingStop } from "packages/api/viewings";

export type { ViewingStop };

/** Default: no geocoding (native / server routing may geocode later). */
export async function geocodeViewingStopsIfNeeded(stops: ViewingStop[]): Promise<ViewingStop[]> {
  return stops;
}
