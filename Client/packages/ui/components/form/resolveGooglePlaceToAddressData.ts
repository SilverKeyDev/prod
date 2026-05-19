import { log, LOG_CATEGORIES } from "packages/logger";
import { hasProperty, isFunction, isObject } from "packages/utils";

import type { AddressData } from "./AddressInput/AddressInput";

export type GooglePlaceAddressComponent = {
  longText?: string;
  shortText?: string;
  long_name?: string;
  short_name?: string;
  types?: string[];
};

/** Parse addressComponents from Google Place into structured AddressData fields. */
export function parseAddressComponentsFromGooglePlace(
  components: GooglePlaceAddressComponent[] | undefined,
  _formattedAddress: string
): Pick<AddressData, "street" | "city" | "state" | "postal_code" | "country"> {
  const result: Pick<AddressData, "street" | "city" | "state" | "postal_code" | "country"> = {};
  if (!Array.isArray(components)) return result;

  const getByType = (type: string): string | undefined => {
    const comp = components.find((c) => c.types?.includes(type));
    return comp?.longText ?? comp?.shortText ?? comp?.long_name ?? comp?.short_name;
  };

  const streetNumber = getByType("street_number");
  const route = getByType("route");
  result.street =
    streetNumber && route ? `${streetNumber} ${route}` : (streetNumber ?? route ?? undefined);
  result.city =
    getByType("locality") ?? getByType("sublocality") ?? getByType("sublocality_level_1");
  result.state = getByType("administrative_area_level_1");
  result.postal_code = getByType("postal_code");
  result.country = getByType("country");

  return result;
}

type PlaceLike = Record<string, unknown>;

/**
 * Resolves a Google Places `Place` (after `toPlace()` + optional `fetchFields`) to AddressData.
 */
export async function resolveGooglePlaceToAddressData(
  place: unknown,
  fallbackAddress: string
): Promise<AddressData> {
  const trimmedFallback = fallbackAddress.trim();
  let addressData: AddressData = { address: trimmedFallback };

  if (!isObject(place) || !hasProperty(place, "fetchFields") || !isFunction(place.fetchFields)) {
    return addressData;
  }

  try {
    const fetchFieldsMethod = place.fetchFields;
    if (typeof fetchFieldsMethod === "function") {
      await fetchFieldsMethod.call(place, {
        fields: ["formattedAddress", "addressComponents", "id", "location"],
      });
    }
  } catch (error) {
    log.warn(LOG_CATEGORIES.ERRORS, "Error fetching place fields", error);
  }

  const placeRecord = place as PlaceLike;
  const formattedAddr =
    hasProperty(placeRecord, "formattedAddress") && typeof placeRecord.formattedAddress === "string"
      ? placeRecord.formattedAddress
      : trimmedFallback;
  const placeId =
    hasProperty(placeRecord, "id") && typeof placeRecord.id === "string"
      ? placeRecord.id
      : undefined;
  const components = hasProperty(placeRecord, "addressComponents")
    ? (placeRecord.addressComponents as GooglePlaceAddressComponent[])
    : undefined;

  const parsed = parseAddressComponentsFromGooglePlace(components, formattedAddr);
  let lat: number | undefined;
  let lng: number | undefined;
  if (
    hasProperty(placeRecord, "location") &&
    placeRecord.location &&
    typeof placeRecord.location === "object" &&
    "lat" in placeRecord.location &&
    typeof (placeRecord.location as { lat: unknown }).lat === "function"
  ) {
    const loc = placeRecord.location as google.maps.LatLng;
    lat = loc.lat();
    lng = loc.lng();
  }

  addressData = {
    address: formattedAddr,
    place_id: placeId,
    ...parsed,
    lat,
    lng,
  };

  return addressData;
}

/** Extract Place from a Places autocomplete suggestion with placePrediction.toPlace(). */
export function placeFromAutocompleteSuggestion(suggestion: unknown): unknown {
  if (!suggestion || typeof suggestion !== "object") return null;
  const suggestionData = suggestion as Record<string, unknown>;
  const placePrediction = suggestionData.placePrediction as Record<string, unknown> | undefined;
  if (
    placePrediction &&
    typeof placePrediction === "object" &&
    "toPlace" in placePrediction &&
    typeof placePrediction.toPlace === "function"
  ) {
    return (placePrediction as { toPlace: () => unknown }).toPlace();
  }
  return null;
}
