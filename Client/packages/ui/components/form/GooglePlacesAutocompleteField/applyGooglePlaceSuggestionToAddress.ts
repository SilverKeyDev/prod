import { log, LOG_CATEGORIES } from "packages/logger";
import { hasProperty, isFunction, isObject } from "packages/utils";

import type { GooglePlacesSuggestion } from "./types";

/**
 * Resolves a Places autocomplete suggestion to a formatted address (same flow as important locations).
 */
export async function applyGooglePlaceSuggestionToAddress(
  suggestion: GooglePlacesSuggestion,
  setters: {
    setAddress: (v: string) => void;
    setSuggestions: (v: GooglePlacesSuggestion[]) => void;
    setHighlightedIndex: (v: number) => void;
  }
): Promise<void> {
  const { setAddress, setSuggestions, setHighlightedIndex } = setters;

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
      setAddress(place.formattedAddress);
    }
  }
  setSuggestions([]);
  setHighlightedIndex(-1);
}
