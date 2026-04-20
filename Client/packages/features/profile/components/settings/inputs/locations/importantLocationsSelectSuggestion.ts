import { log, LOG_CATEGORIES } from "packages/logger";
import { hasProperty, isFunction, isObject } from "packages/utils";
import {
  type GooglePlaceAddressComponentLike,
  isGooglePlacePreciseStreetAddress,
} from "packages/utils/search/places/isGooglePlacePreciseStreetAddress";

import type { Suggestion } from "./importantLocationsInputTypes";

export async function applyImportantLocationSuggestionSelection(
  suggestion: Suggestion,
  setters: {
    setLocationAddress: (v: string) => void;
    setIsSpecificAddress: (v: boolean) => void;
    setSuggestions: (v: Suggestion[]) => void;
    setHighlightedIndex: (v: number) => void;
  }
): Promise<void> {
  const { setLocationAddress, setIsSpecificAddress, setSuggestions, setHighlightedIndex } = setters;

  const suggestionData = suggestion as Record<string, unknown>;
  const placePrediction = suggestionData.placePrediction as Record<string, unknown>;
  const place =
    placePrediction &&
    typeof placePrediction === "object" &&
    "toPlace" in placePrediction &&
    typeof placePrediction.toPlace === "function"
      ? (
          placePrediction as {
            toPlace: () => unknown;
          }
        ).toPlace()
      : null;
  if (isObject(place) && hasProperty(place, "fetchFields") && isFunction(place.fetchFields)) {
    try {
      const fetchFieldsMethod = place.fetchFields;
      if (typeof fetchFieldsMethod === "function") {
        await fetchFieldsMethod.call(place, {
          fields: ["displayName", "formattedAddress", "types", "addressComponents"],
        });
      }
    } catch (error) {
      log.warn(LOG_CATEGORIES.ERRORS, "Error fetching place fields", error);
    }
    if (hasProperty(place, "formattedAddress") && typeof place.formattedAddress === "string") {
      setLocationAddress(place.formattedAddress);
    }

    const placeTypes = hasProperty(place, "types") && Array.isArray(place.types) ? place.types : [];
    const addressComponents =
      hasProperty(place, "addressComponents") && Array.isArray(place.addressComponents)
        ? (place.addressComponents as GooglePlaceAddressComponentLike[])
        : [];

    const isPrecise = isGooglePlacePreciseStreetAddress({
      types: placeTypes as string[],
      addressComponents,
    });
    setIsSpecificAddress(isPrecise);
  }
  setSuggestions([]);
  setHighlightedIndex(-1);
}
