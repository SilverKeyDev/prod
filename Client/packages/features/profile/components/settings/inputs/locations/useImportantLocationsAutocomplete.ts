import { useCallback, useEffect, useState } from "react";

import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import { log } from "packages/logger";
import type { GoogleMapsWindow } from "packages/types/integrations/google-maps";
import { asError } from "packages/utils";
import { getWindow } from "packages/utils/core/platform";
import {
  SUPPORTED_SERVICE_AREA_GOOGLE_LOCATION_RESTRICTION,
  SUPPORTED_SERVICE_AREA_WARNING,
} from "packages/utils/product/search/locations/serviceAreaAvailability";

import type { GooglePlacePrediction, Suggestion } from "./importantLocationsInputTypes";
import { applyImportantLocationSuggestionSelection } from "./importantLocationsSelectSuggestion";

type UseImportantLocationsAutocompleteOptions = {
  scriptsReady?: boolean;
  locationAddress: string;
  hasSelected: boolean;
  setLocationAddress: (value: string) => void;
  setIsSpecificAddress: (value: boolean) => void;
  setHasSelected: (value: boolean) => void;
  setHasSupportedLocationSelection: (value: boolean) => void;
};

export function useImportantLocationsAutocomplete({
  scriptsReady,
  locationAddress,
  hasSelected,
  setLocationAddress,
  setIsSpecificAddress,
  setHasSelected,
  setHasSupportedLocationSelection,
}: UseImportantLocationsAutocompleteOptions) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!scriptsReady || locationAddress.trim().length < 3 || hasSelected) {
      setSuggestions([]);
      setAutocompleteError(null);
      return;
    }
    setAutocompleteError(null);
    const fetchSuggestions = async () => {
      try {
        const win = getWindow();
        const googleMapsWindow = win as unknown as GoogleMapsWindow | null;
        if (!googleMapsWindow?.google?.maps?.places) {
          setSuggestions([]);
          return;
        }
        const sessionToken = new googleMapsWindow.google.maps.places.AutocompleteSessionToken();
        const request = {
          input: locationAddress,
          sessionToken,
          includedRegionCodes: ["US"],
          locationRestriction: SUPPORTED_SERVICE_AREA_GOOGLE_LOCATION_RESTRICTION,
        };
        const { suggestions: fetched } =
          await googleMapsWindow.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );
        const built: Suggestion[] = (
          fetched as Array<{
            placePrediction: GooglePlacePrediction | null;
          }>
        ).flatMap((s) => {
          const prediction = s.placePrediction;
          if (!prediction) return [];
          return [
            {
              description: prediction.text.text,
              placePrediction: prediction,
            },
          ];
        });
        setSuggestions(built);
      } catch (err: unknown) {
        const error = asError(err);
        log.error("ERRORS", "Autocomplete fetch error", error);
        setSuggestions([]);
        setAutocompleteError("Address search unavailable. You can type an address manually.");
      }
    };
    const t = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(t);
  }, [locationAddress, scriptsReady, hasSelected]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const handleSelect = useCallback(
    async (suggestion: Suggestion) => {
      setHasSelected(true);
      const result = await applyImportantLocationSuggestionSelection(suggestion, {
        setLocationAddress,
        setIsSpecificAddress,
        setSuggestions,
        setHighlightedIndex,
      });
      if (!result.isSupportedServiceArea) {
        showWarningToast(SUPPORTED_SERVICE_AREA_WARNING);
        setHasSelected(false);
        setHasSupportedLocationSelection(false);
        setIsSpecificAddress(false);
        return;
      }
      setHasSupportedLocationSelection(true);
    },
    [setHasSelected, setHasSupportedLocationSelection, setIsSpecificAddress, setLocationAddress]
  );

  const handleAddressKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (suggestions.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (
        e.key === "Enter" &&
        highlightedIndex >= 0 &&
        highlightedIndex < suggestions.length
      ) {
        e.preventDefault();
        void handleSelect(suggestions[highlightedIndex]);
      } else if (e.key === "Escape") {
        setSuggestions([]);
        setHighlightedIndex(-1);
      }
    },
    [suggestions, highlightedIndex, handleSelect]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setHighlightedIndex(-1);
  }, []);

  return {
    suggestions,
    highlightedIndex,
    autocompleteError,
    handleSelect,
    handleAddressKeyDown,
    clearSuggestions,
  };
}
