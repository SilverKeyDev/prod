/// <reference types="google.maps" />
import { useCallback, useMemo, useRef } from "react";

import type { PreciseStreetAddressPayload } from "packages/features/search/components/header/location-bar/searchLocationBarTypes";
import type { SearchMobileHeaderProps } from "packages/features/search/components/header/SearchMobileHeader";
import { useMediaQuery } from "packages/hooks/ui/responsive/useMediaQuery";
import { screenDown } from "packages/ui/types/screens";

export type UseSearchMobileHeaderActionsParams = {
  isSearching: boolean;
  onSearch: () => void;
  onLocationSearchSubmit: () => void | Promise<void>;
  fitMapToBounds: (bounds: google.maps.LatLngBounds) => void;
  onPreciseStreetAddressSelected?: (payload: PreciseStreetAddressPayload) => void;
  onCancelSearch?: () => void;
  /** When false, Search is disabled until user adds a location in Preferences */
  hasLocations?: boolean;
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
  mode?: "map" | "reels";
  onToggleMode?: () => void;
  onBeforeSwitchToReels?: () => void;
};

/**
 * Returns stable header props and compact-header flag for SearchMobileHeader.
 * Caller (SearchPage) builds the header node and sets it via setMobileHeaderActions.
 */
export function useSearchMobileHeaderActions(params: UseSearchMobileHeaderActionsParams): {
  isCompactHeader: boolean;
  headerProps: SearchMobileHeaderProps;
} {
  const isCompactHeader = useMediaQuery(screenDown("lg"));

  const onSearchRef = useRef(params.onSearch);
  const onCancelSearchRef = useRef(params.onCancelSearch);
  const onClientChangeRef = useRef(params.onClientChange);
  const onToggleModeRef = useRef(params.onToggleMode);
  const onBeforeSwitchToReelsRef = useRef(params.onBeforeSwitchToReels);
  const fitMapToBoundsRef = useRef(params.fitMapToBounds);
  const onLocationSearchSubmitRef = useRef(params.onLocationSearchSubmit);
  const onPreciseStreetAddressSelectedRef = useRef(params.onPreciseStreetAddressSelected);
  onSearchRef.current = params.onSearch;
  onCancelSearchRef.current = params.onCancelSearch;
  onClientChangeRef.current = params.onClientChange;
  onToggleModeRef.current = params.onToggleMode;
  onBeforeSwitchToReelsRef.current = params.onBeforeSwitchToReels;
  fitMapToBoundsRef.current = params.fitMapToBounds;
  onLocationSearchSubmitRef.current = params.onLocationSearchSubmit;
  onPreciseStreetAddressSelectedRef.current = params.onPreciseStreetAddressSelected;

  const stableOnSearch = useCallback(() => {
    void onSearchRef.current();
  }, []);
  const stableOnCancelSearch = useCallback(() => {
    onCancelSearchRef.current?.();
  }, []);
  const stableOnClientChange = useCallback((clientId: string | null) => {
    onClientChangeRef.current(clientId);
  }, []);
  const stableOnToggleMode = useCallback(() => {
    onToggleModeRef.current?.();
  }, []);
  const stableOnBeforeSwitchToReels = useCallback(() => {
    onBeforeSwitchToReelsRef.current?.();
  }, []);

  const stableFitMapToBounds = useCallback((bounds: google.maps.LatLngBounds) => {
    fitMapToBoundsRef.current(bounds);
  }, []);

  const stableOnLocationSearchSubmit = useCallback(() => {
    void onLocationSearchSubmitRef.current();
  }, []);

  const stableOnPreciseStreetAddressSelected = useCallback(
    (payload: PreciseStreetAddressPayload) => {
      onPreciseStreetAddressSelectedRef.current?.(payload);
    },
    []
  );

  const headerProps = useMemo<SearchMobileHeaderProps>(
    () => ({
      onSearch: stableOnSearch,
      onCancelSearch: stableOnCancelSearch,
      onLocationSearchSubmit: stableOnLocationSearchSubmit,
      fitMapToBounds: stableFitMapToBounds,
      onPreciseStreetAddressSelected: stableOnPreciseStreetAddressSelected,
      isSearching: params.isSearching,
      hasLocations: params.hasLocations ?? true,
      selectedClientId: params.selectedClientId,
      onClientChange: stableOnClientChange,
      mode: params.mode,
      onToggleMode: params.onToggleMode ? stableOnToggleMode : undefined,
      onBeforeSwitchToReels: stableOnBeforeSwitchToReels,
    }),
    [
      params.isSearching,
      params.hasLocations,
      params.selectedClientId,
      params.mode,
      params.onToggleMode,
      stableOnSearch,
      stableOnCancelSearch,
      stableOnLocationSearchSubmit,
      stableFitMapToBounds,
      stableOnPreciseStreetAddressSelected,
      stableOnClientChange,
      stableOnToggleMode,
      stableOnBeforeSwitchToReels,
    ]
  );

  return { isCompactHeader, headerProps };
}
