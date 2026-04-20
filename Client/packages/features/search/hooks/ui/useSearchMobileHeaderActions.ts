import { useCallback, useMemo, useRef } from "react";

import type { SearchMobileHeaderProps } from "packages/features/search/components/header/SearchMobileHeader";
import { useMediaQuery } from "packages/hooks/ui/responsive/useMediaQuery";
import { screenDown } from "packages/ui/types/screens";

export type UseSearchMobileHeaderActionsParams = {
  isSearching: boolean;
  onSearch: () => void;
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
  onSearchRef.current = params.onSearch;
  onCancelSearchRef.current = params.onCancelSearch;
  onClientChangeRef.current = params.onClientChange;
  onToggleModeRef.current = params.onToggleMode;
  onBeforeSwitchToReelsRef.current = params.onBeforeSwitchToReels;

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

  const headerProps = useMemo<SearchMobileHeaderProps>(
    () => ({
      onSearch: stableOnSearch,
      onCancelSearch: stableOnCancelSearch,
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
      stableOnClientChange,
      stableOnToggleMode,
      stableOnBeforeSwitchToReels,
    ]
  );

  return { isCompactHeader, headerProps };
}
