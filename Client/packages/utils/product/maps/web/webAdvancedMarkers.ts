import { env } from "packages/config";

type MapWithOptionalMapId = google.maps.Map & {
  getMapId?: () => string | null | undefined;
};

/**
 * Whether a Cloud Map ID is configured for web (Vite / Metro env).
 * Advanced Markers require this on the Map instance.
 */
export function isWebCloudMapIdConfigured(): boolean {
  return Boolean(env.googleMapsId?.trim());
}

/**
 * True when the live map was created with a non-empty Cloud Map ID.
 */
export function mapHasCloudMapId(map: google.maps.Map | null | undefined): boolean {
  if (!map) {
    return false;
  }
  const getMapId = (map as MapWithOptionalMapId).getMapId;
  if (typeof getMapId === "function") {
    const id = getMapId.call(map);
    return Boolean(typeof id === "string" && id.trim());
  }
  return isWebCloudMapIdConfigured();
}

/**
 * Advanced Markers are only supported when the map has a valid Cloud Map ID.
 */
export function canUseWebAdvancedMarkers(map?: google.maps.Map | null): boolean {
  if (map) {
    return mapHasCloudMapId(map);
  }
  return isWebCloudMapIdConfigured();
}
