import type { GooglePlaceAddressComponentLike } from "packages/utils/search/places/isGooglePlacePreciseStreetAddress";

export const SUPPORTED_SERVICE_AREA_STATE_SHORT = "GA";
export const SUPPORTED_SERVICE_AREA_STATE_LONG = "Georgia";
export const SUPPORTED_SERVICE_AREA_COUNTRY = "US";
export const SUPPORTED_SERVICE_AREA_WARNING =
  "SilverKey is only available in Georgia areas right now.";

export const SUPPORTED_SERVICE_AREA_BOUNDS = {
  north: 35.1,
  south: 30.35,
  east: -80.75,
  west: -85.7,
} as const;

export const SUPPORTED_SERVICE_AREA_GOOGLE_LOCATION_RESTRICTION = {
  north: SUPPORTED_SERVICE_AREA_BOUNDS.north,
  south: SUPPORTED_SERVICE_AREA_BOUNDS.south,
  east: SUPPORTED_SERVICE_AREA_BOUNDS.east,
  west: SUPPORTED_SERVICE_AREA_BOUNDS.west,
} as const;

function componentText(component: GooglePlaceAddressComponentLike): string[] {
  return [
    component.shortText,
    component.longText,
    component.short_name,
    component.long_name,
  ].flatMap((value) => (typeof value === "string" ? [value.trim().toLowerCase()] : []));
}

export function isSupportedServiceAreaAddressComponents(
  addressComponents: readonly GooglePlaceAddressComponentLike[] | undefined
): boolean {
  const stateComponent = addressComponents?.find((component) =>
    (component.types ?? []).includes("administrative_area_level_1")
  );

  if (!stateComponent) {
    return false;
  }

  const textValues = componentText(stateComponent);
  return (
    textValues.includes(SUPPORTED_SERVICE_AREA_STATE_SHORT.toLowerCase()) ||
    textValues.includes(SUPPORTED_SERVICE_AREA_STATE_LONG.toLowerCase())
  );
}

export function isSupportedServiceAreaCoordinates(params: { lat: number; lng: number }): boolean {
  const { lat, lng } = params;
  return (
    lat >= SUPPORTED_SERVICE_AREA_BOUNDS.south &&
    lat <= SUPPORTED_SERVICE_AREA_BOUNDS.north &&
    lng >= SUPPORTED_SERVICE_AREA_BOUNDS.west &&
    lng <= SUPPORTED_SERVICE_AREA_BOUNDS.east
  );
}
