import { useEffect } from "react";

import type { Dispatch, SetStateAction } from "react";

import { searchApi } from "packages/features/search/api/search";
import { log } from "packages/logger";
import type { GoogleMapsWindow } from "packages/types/integrations/google-maps";
import { asError } from "packages/utils";
import { getWindow } from "packages/utils/core/platform";
import {
  SUPPORTED_SERVICE_AREA_GOOGLE_LOCATION_RESTRICTION,
  SUPPORTED_SERVICE_AREA_STATE_SHORT,
} from "packages/utils/product/search/locations/serviceAreaAvailability";

import type { GoogleSuggestion, SlipstreamSuggestion, Suggestion } from "./searchLocationBarTypes";

type Params = {
  trimmedInput: string;
  hasSelected: boolean;
  localValue: string;
  scriptsReady: boolean;
  looksLikeAddress: boolean;
  setSuggestions: Dispatch<SetStateAction<Suggestion[]>>;
};

/**
 * Slipstream area suggestions + Google Places autocomplete (web-only).
 * Extracted to keep SearchLocationBar under file/function line limits.
 */
export function useSearchLocationBarSuggestionEffects({
  trimmedInput,
  hasSelected,
  localValue,
  scriptsReady,
  looksLikeAddress,
  setSuggestions,
}: Params): void {
  useEffect(() => {
    if (trimmedInput.length < 2 || hasSelected) return;

    const ac = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const resp = await searchApi.getAreaSuggestions(
            {
              keyword: trimmedInput,
              state: SUPPORTED_SERVICE_AREA_STATE_SHORT,
              limit: 6,
            },
            { signal: ac.signal }
          );
          if (ac.signal.aborted) return;
          if (resp.success && resp.areas) {
            const slipstreamItems: SlipstreamSuggestion[] = resp.areas.map((area) => ({
              kind: "slipstream" as const,
              area,
              description: area.label || area.name,
            }));
            setSuggestions((prev) => {
              const googleItems = prev.filter((s) => s.kind === "google");
              return [...slipstreamItems, ...googleItems];
            });
          }
        } catch (err: unknown) {
          if (ac.signal.aborted) return;
          log.warn("ERRORS", "Slipstream area suggestion error", err);
        }
      })();
    }, 300);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [trimmedInput, hasSelected, setSuggestions]);

  useEffect(() => {
    if (!scriptsReady || trimmedInput.length < 3 || hasSelected || !looksLikeAddress) {
      setSuggestions((prev) => prev.filter((s) => s.kind === "slipstream"));
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const win = getWindow();
        const googleMapsWindow = win as unknown as GoogleMapsWindow | null;
        if (!googleMapsWindow?.google?.maps?.places) {
          return;
        }
        const sessionToken = new googleMapsWindow.google.maps.places.AutocompleteSessionToken();
        const request = {
          input: localValue,
          sessionToken,
          includedRegionCodes: ["US"],
          locationRestriction: SUPPORTED_SERVICE_AREA_GOOGLE_LOCATION_RESTRICTION,
        };
        const { suggestions: fetched } =
          await googleMapsWindow.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );
        const built: GoogleSuggestion[] = (
          fetched as Array<{
            placePrediction: import("./searchLocationBarTypes").GooglePlacePrediction | null;
          }>
        ).flatMap((s) => {
          const prediction = s.placePrediction;
          if (!prediction) return [];
          return [
            {
              kind: "google" as const,
              description: prediction.text.text,
              placePrediction: prediction,
            },
          ];
        });
        setSuggestions((prev) => {
          const slipstreamItems = prev.filter((s) => s.kind === "slipstream");
          return [...slipstreamItems, ...built];
        });
      } catch (err: unknown) {
        const error = asError(err);
        log.error("ERRORS", "Search location autocomplete error", error);
      }
    };
    const debounceTimer = setTimeout(() => void fetchSuggestions(), 400);
    return () => clearTimeout(debounceTimer);
  }, [localValue, trimmedInput, scriptsReady, hasSelected, looksLikeAddress, setSuggestions]);
}
