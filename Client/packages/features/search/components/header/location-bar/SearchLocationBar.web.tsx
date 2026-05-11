import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@ui/icons";

import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import { useSearchContextStore } from "packages/store";
import { Input } from "packages/ui";
import { Box } from "packages/ui/components/primitives";
import { getDocument, getWindow } from "packages/utils/platform";
import { submitAfterTopSuggestionIfNeeded } from "packages/utils/search/autocomplete/autocompleteSubmit";

import { reverseGeocodeAndSearchForLocationBar } from "./searchLocationBarReverseGeocode";
import {
  type GoogleSuggestion,
  type SlipstreamSuggestion,
  type Suggestion,
} from "./searchLocationBarTypes";
import {
  selectGoogleSuggestionForLocationBar,
  selectSlipstreamSuggestionForLocationBar,
} from "./searchLocationBarWebHandlers";
import { SearchLocationSuggestionList } from "./SearchLocationSuggestionList.web";
import { useSearchLocationBarSuggestionEffects } from "./useSearchLocationBarSuggestionEffects.web";

export type {
  PreciseStreetAddressPayload,
  SearchLocationBarWebProps,
} from "./searchLocationBarTypes";

export function SearchLocationBarWeb({
  scriptsReady,
  fitMapToBounds,
  onSearch,
  locationPlaceholder,
  onPreciseStreetAddressSelected,
}: import("./searchLocationBarTypes").SearchLocationBarWebProps): React.ReactElement {
  const setSearchAnchor = useSearchContextStore((s) => s.setAnchor);
  const setLocationPlaceViewportFromBar = useSearchContextStore(
    (s) => s.setLocationPlaceViewportFromBar
  );
  const clearLocationPlaceSearchArea = useSearchContextStore((s) => s.clearLocationPlaceSearchArea);
  const setLocationBarDraft = useSearchContextStore((s) => s.setLocationBarDraft);
  const setLocationBarExternalSubmit = useSearchContextStore((s) => s.setLocationBarExternalSubmit);
  const [localValue, setLocalValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [hasSelected, setHasSelected] = useState(false);
  const [isLoadingBoundary, setIsLoadingBoundary] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmedInput = localValue.trim();

  const looksLikeAddress = /\d/.test(trimmedInput);
  useSearchLocationBarSuggestionEffects({
    trimmedInput,
    hasSelected,
    localValue,
    scriptsReady,
    looksLikeAddress,
    setSuggestions,
  });

  const showCurrentLocation = isFocused && trimmedInput.length === 0 && !hasSelected;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    const doc = getDocument();
    doc?.addEventListener("mousedown", handleClickOutside);
    return () => doc?.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mapDeps = useMemo(
    () => ({
      fitMapToBounds,
      setSearchAnchor,
      setLocationPlaceViewportFromBar,
      setLocalValue,
      setHasSelected,
      setSuggestions,
      setIsFocused,
      onSearch,
    }),
    [fitMapToBounds, onSearch, setSearchAnchor, setLocationPlaceViewportFromBar, setLocalValue]
  );

  const reverseGeocodeAndSearch = useCallback(
    async (lat: number, lng: number) => {
      await reverseGeocodeAndSearchForLocationBar(lat, lng, mapDeps);
    },
    [mapDeps]
  );

  const handleCurrentLocation = useCallback(() => {
    const w = getWindow();
    const geo = w?.navigator?.geolocation;
    if (!geo) {
      showErrorToast(
        SEARCH_TRANSLATIONS["search.location_unavailable"] ?? "Unable to determine your location."
      );
      return;
    }

    setIsLocating(true);
    geo.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        void reverseGeocodeAndSearch(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setIsLocating(false);
        showErrorToast(
          SEARCH_TRANSLATIONS["search.location_unavailable"] ??
            "Unable to determine your location. Please allow location access and try again."
        );
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 }
    );
  }, [reverseGeocodeAndSearch]);

  const slipstreamDeps = useMemo(
    () => ({
      ...mapDeps,
      setIsLoadingBoundary,
    }),
    [mapDeps]
  );

  const handleSelectSlipstream = async (suggestion: SlipstreamSuggestion): Promise<void> => {
    await selectSlipstreamSuggestionForLocationBar(suggestion, slipstreamDeps);
  };

  const googleDeps = useMemo(
    () => ({
      ...mapDeps,
      setIsLoadingBoundary,
      clearLocationPlaceSearchArea,
      onPreciseStreetAddressSelected,
    }),
    [mapDeps, clearLocationPlaceSearchArea, onPreciseStreetAddressSelected]
  );

  const handleSelectGoogle = async (suggestion: GoogleSuggestion): Promise<boolean> => {
    return selectGoogleSuggestionForLocationBar(suggestion, googleDeps);
  };

  const handleSelect = async (suggestion: Suggestion): Promise<boolean> => {
    if (suggestion.kind === "slipstream") {
      await handleSelectSlipstream(suggestion);
      return false;
    }
    return handleSelectGoogle(suggestion);
  };

  const runSearch = async () => {
    await submitAfterTopSuggestionIfNeeded({
      suggestions,
      hasSelectedSuggestion: hasSelected,
      selectSuggestion: (s) => handleSelect(s),
      submit: async () => {
        await Promise.resolve(onSearch());
      },
    });
  };

  const runSearchRef = useRef(runSearch);
  runSearchRef.current = runSearch;

  useEffect(() => {
    setLocationBarDraft(localValue);
  }, [localValue, setLocationBarDraft]);

  useEffect(() => {
    setLocationBarExternalSubmit(async () => {
      await runSearchRef.current();
    });
    return () => {
      setLocationBarExternalSubmit(null);
      setLocationBarDraft("");
    };
  }, [setLocationBarExternalSubmit, setLocationBarDraft]);

  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    void runSearch();
  };

  const slipstreamSuggestions = useMemo(
    () => suggestions.filter((s): s is SlipstreamSuggestion => s.kind === "slipstream"),
    [suggestions]
  );
  const googleSuggestions = useMemo(
    () => suggestions.filter((s): s is GoogleSuggestion => s.kind === "google"),
    [suggestions]
  );

  return (
    <Box ref={containerRef} className="relative w-full min-w-0 flex-1">
      <Input
        type="text"
        value={localValue}
        onChange={(e) => {
          setHasSelected(false);
          clearLocationPlaceSearchArea();
          setLocalValue(e.target.value);
        }}
        onKeyDown={handleLocationKeyDown}
        onFocus={() => setIsFocused(true)}
        placeholder={scriptsReady ? locationPlaceholder : "Loading..."}
        disabled={!scriptsReady || isLoadingBoundary}
        leftIcon={<Icon name="map-pin" className="h-4 w-4" />}
        size="md"
        variant="search"
        autoComplete="off"
      />
      <SearchLocationSuggestionList
        slipstreamSuggestions={slipstreamSuggestions}
        googleSuggestions={googleSuggestions}
        onSelectSlipstream={(s) => void handleSelectSlipstream(s)}
        onSelectGoogle={(s) => void handleSelectGoogle(s)}
        showCurrentLocation={showCurrentLocation}
        isLocating={isLocating}
        onSelectCurrentLocation={handleCurrentLocation}
      />
    </Box>
  );
}
