import type { IsochroneData } from "packages/types/domain/api";
import type { CommuteMapDestination } from "packages/utils/propertyDetails/location/commuteMapDestinations";

export type UsePropertyCommuteLocationMapParams = {
  mapContainer: unknown;
  /** Web: host element for inline Street View; native ignores. */
  streetViewContainer?: unknown;
  originLat: number;
  originLng: number;
  listingMarkerTitle: string;
  destinations: CommuteMapDestination[];
  enabled: boolean;
  /** Search commute overlay (isochrone); web-only rendering. */
  searchOverlay?: IsochroneData | null;
};

/** Native / non-web: interactive commute map is web-only; no-op here. */
export function usePropertyCommuteLocationMap(_params: UsePropertyCommuteLocationMapParams): void {}
