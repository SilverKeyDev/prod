import { useCallback, useMemo, useRef } from "react";

import { useMediaQuery } from "packages/hooks/ui";
import { screenDown } from "packages/schemas/app/ui/screens";

import type { SearchMobileHeaderProps } from "./header/SearchMobileHeader";

export type UseSearchMobileHeaderActionsParams = {
  isSearching: boolean;
  /** Called when filters are changed (e.g. trigger search) */
  onPreferencesChanged?: () => void | Promise<void>;
  onSearch: () => void;
  onCancelSearch?: () => void;
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
export function useSearchMobileHeaderActions(
  params: UseSearchMobileHeaderActionsParams,
): { isCompactHeader: boolean; headerProps: SearchMobileHeaderProps } {
  const isCompactHeader = useMediaQuery(screenDown("lg"));

  const onPreferencesChangedRef = useRef(params.onPreferencesChanged);
  const onSearchRef = useRef(params.onSearch);
  const onCancelSearchRef = useRef(params.onCancelSearch);
  const onClientChangeRef = useRef(params.onClientChange);
  const onToggleModeRef = useRef(params.onToggleMode);
  const onBeforeSwitchToReelsRef = useRef(params.onBeforeSwitchToReels);
  onPreferencesChangedRef.current = params.onPreferencesChanged;
  onSearchRef.current = params.onSearch;
  onCancelSearchRef.current = params.onCancelSearch;
  onClientChangeRef.current = params.onClientChange;
  onToggleModeRef.current = params.onToggleMode;
  onBeforeSwitchToReelsRef.current = params.onBeforeSwitchToReels;

  const stableOnPreferencesChanged = useCallback(() => {
    void onPreferencesChangedRef.current?.();
  }, []);
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
      onPreferencesChanged: stableOnPreferencesChanged,
      onSearch: stableOnSearch,
      onCancelSearch: stableOnCancelSearch,
      isSearching: params.isSearching,
      selectedClientId: params.selectedClientId,
      onClientChange: stableOnClientChange,
      mode: params.mode,
      onToggleMode: params.onToggleMode ? stableOnToggleMode : undefined,
      onBeforeSwitchToReels: stableOnBeforeSwitchToReels,
    }),
    [
      params.isSearching,
      params.selectedClientId,
      params.mode,
      params.onToggleMode,
      stableOnPreferencesChanged,
      stableOnSearch,
      stableOnCancelSearch,
      stableOnClientChange,
      stableOnToggleMode,
      stableOnBeforeSwitchToReels,
    ],
  );

  return { isCompactHeader, headerProps };
}
