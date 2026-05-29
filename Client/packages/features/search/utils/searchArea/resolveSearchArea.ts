import type { ViewportPolygonPoint } from "packages/types/domain/api";
import { defaultPilotSearchViewportRing } from "packages/utils/search/locations/defaultPilotSearchViewport";
import { isSupportedServiceAreaCoordinates } from "packages/utils/search/locations/serviceAreaAvailability";

import type { IsochroneData } from "@/features/search/types/isochrone";
import { extractViewportRingFromIsochroneGeometry } from "@/features/search/utils/map/extractViewportRingFromIsochroneGeometry";
import { centroidOfViewportRing } from "@/features/search/utils/map/mapViewport";
import {
  GEOLOCATION_SEARCH_LAT_DELTA,
  GEOLOCATION_SEARCH_LNG_DELTA,
  viewportRingFromCenter,
  viewportRingFromGeolocation,
} from "@/features/search/utils/map/viewportRingFromCenter";

import {
  type DeviceLocationResult,
  requestDeviceLocationForSearch,
} from "./requestDeviceLocationForSearch";

export type SearchAreaMode = "location_bar" | "isochrone" | "geolocation" | "default_market";

export type SearchAreaWarning = "geolocation_denied" | "geolocation_unavailable";

export type ResolvedSearchArea = {
  mode: SearchAreaMode;
  searchSource: "location" | "preferences";
  viewportRing: ViewportPolygonPoint[];
  center: { lat: number; lng: number };
  isochroneData: IsochroneData | null;
  warnings: SearchAreaWarning[];
};

export type ResolveSearchAreaInput = {
  locationPlaceViewportRing: ViewportPolygonPoint[] | null | undefined;
  locationPlaceLabel?: string | null;
  importantLocations: unknown;
  /** When set (native), used instead of browser geolocation. */
  requestLocation?: () => Promise<DeviceLocationResult>;
  fetchIsochrone: () => Promise<IsochroneData | null>;
  /** Optional map bounds fallback when geolocation fails (web). */
  mapBoundsRing?: ViewportPolygonPoint[] | null;
};

export function userPreferencesHasImportantLocations(important_locations: unknown): boolean {
  return Array.isArray(important_locations) && important_locations.length > 0;
}

function ringFromLocationBar(
  ring: ViewportPolygonPoint[] | null | undefined
): ViewportPolygonPoint[] | null {
  if (!ring || ring.length < 4) {
    return null;
  }
  if (!ring.every((p) => isSupportedServiceAreaCoordinates(p))) {
    return null;
  }
  return ring;
}

function ringFromIsochrone(isochroneData: IsochroneData): ViewportPolygonPoint[] | null {
  const fromGeometry = extractViewportRingFromIsochroneGeometry(
    isochroneData?.isochrone?.geometry as { type?: string; coordinates?: unknown }
  );
  if (fromGeometry && fromGeometry.length >= 4) {
    return fromGeometry;
  }
  const center = isochroneData?.center;
  const lat = center?.lat;
  const lng = center?.lng ?? (center as { lon?: number } | undefined)?.lon;
  if (typeof lat === "number" && typeof lng === "number") {
    return viewportRingFromGeolocation(lat, lng);
  }
  return null;
}

async function resolveGeolocationOrDefault(
  requestLocation: () => Promise<DeviceLocationResult>,
  mapBoundsRing?: ViewportPolygonPoint[] | null
): Promise<Pick<ResolvedSearchArea, "mode" | "viewportRing" | "center" | "warnings">> {
  const loc = await requestLocation();
  if (loc.status === "granted" && isSupportedServiceAreaCoordinates(loc)) {
    const ring = viewportRingFromGeolocation(loc.lat, loc.lng);
    return {
      mode: "geolocation",
      viewportRing: ring,
      center: { lat: loc.lat, lng: loc.lng },
      warnings: [],
    };
  }

  const warnings: SearchAreaWarning[] =
    loc.status === "denied" ? ["geolocation_denied"] : ["geolocation_unavailable"];

  if (mapBoundsRing && mapBoundsRing.length >= 4) {
    return {
      mode: "default_market",
      viewportRing: mapBoundsRing,
      center: centroidOfViewportRing(mapBoundsRing),
      warnings,
    };
  }

  const ring = defaultPilotSearchViewportRing();
  return {
    mode: "default_market",
    viewportRing: ring,
    center: centroidOfViewportRing(ring),
    warnings,
  };
}

/**
 * Resolve which search area to use before polygon search.
 * Priority: location bar ring → important locations isochrone → geolocation → default pilot market.
 */
export async function resolveSearchArea(
  input: ResolveSearchAreaInput
): Promise<ResolvedSearchArea> {
  const barRing = ringFromLocationBar(input.locationPlaceViewportRing);
  if (barRing) {
    return {
      mode: "location_bar",
      searchSource: "location",
      viewportRing: barRing,
      center: centroidOfViewportRing(barRing),
      isochroneData: null,
      warnings: [],
    };
  }

  if (userPreferencesHasImportantLocations(input.importantLocations)) {
    const isochroneData = await input.fetchIsochrone();
    const isoRing = isochroneData ? ringFromIsochrone(isochroneData) : null;
    if (isoRing && isochroneData) {
      return {
        mode: "isochrone",
        searchSource: "preferences",
        viewportRing: isoRing,
        center: centroidOfViewportRing(isoRing),
        isochroneData,
        warnings: [],
      };
    }
  }

  const requestLocation = input.requestLocation ?? requestDeviceLocationForSearch;
  const geoResolved = await resolveGeolocationOrDefault(requestLocation, input.mapBoundsRing);

  return {
    ...geoResolved,
    searchSource: "location",
    isochroneData: null,
  };
}

/** Native map region → viewport ring when geolocation unavailable. */
export function viewportRingFromMapRegion(region: {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}): ViewportPolygonPoint[] {
  return viewportRingFromCenter(
    { lat: region.latitude, lng: region.longitude },
    region.latitudeDelta,
    region.longitudeDelta
  );
}

export { GEOLOCATION_SEARCH_LAT_DELTA, GEOLOCATION_SEARCH_LNG_DELTA };
