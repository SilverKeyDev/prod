/**
 * Whether a Google Places (new API) result represents a street-level address suitable
 * for opening property details directly (vs area search for city/ZIP/neighborhood).
 */

export type GooglePlaceAddressComponentLike = {
  types?: string[];
  longText?: string;
  shortText?: string;
  long_name?: string;
  short_name?: string;
};

const PRECISE_PLACE_TYPES = new Set([
  "street_address",
  "premise",
  "subpremise",
]);

function componentHasType(
  components: GooglePlaceAddressComponentLike[],
  placeType: string,
): boolean {
  return components.some((c) => (c.types ?? []).includes(placeType));
}

export function isGooglePlacePreciseStreetAddress(params: {
  types?: string[];
  addressComponents?: GooglePlaceAddressComponentLike[];
}): boolean {
  const types = params.types ?? [];
  const components = params.addressComponents ?? [];

  const hasPrecisePlaceType = types.some((t) => PRECISE_PLACE_TYPES.has(t));
  if (hasPrecisePlaceType) {
    return true;
  }

  const hasStreetNumber = componentHasType(components, "street_number");
  const hasRoute = componentHasType(components, "route");
  if (hasStreetNumber && hasRoute) {
    return true;
  }

  return false;
}
