import { useEffect, useMemo, useRef, useCallback } from "react";

import SearchMobileHeader from "../components/SearchMobileHeader";
import { screenDown } from "../../../../../packages/schemas/ui/screens";
import { useMediaQuery } from "../../../../../packages/hooks/ui";

export default function useMobileHeaderActions(params: {
  setMobileHeaderActions: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
  isSearching: boolean;
  onPreferences: () => void;
  onSearch: () => void;
  onCancelSearch?: () => void;
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
}): void {
  // Preserve historical behavior: show mobile header actions for `< lg` (<=1024px)
  // because Search's layout is tuned for the compact header at those widths.
  const isCompactHeader = useMediaQuery(screenDown("lg"));

  // Store latest callbacks in refs to avoid recreating header when they change
  const onPreferencesRef = useRef(params.onPreferences);
  const onSearchRef = useRef(params.onSearch);
  const onCancelSearchRef = useRef(params.onCancelSearch);
  const onClientChangeRef = useRef(params.onClientChange);
  onPreferencesRef.current = params.onPreferences;
  onSearchRef.current = params.onSearch;
  onCancelSearchRef.current = params.onCancelSearch;
  onClientChangeRef.current = params.onClientChange;

  const stableOnPreferences = useCallback(() => {
    onPreferencesRef.current();
  }, []);
  const stableOnSearch = useCallback(() => {
    onSearchRef.current();
  }, []);
  const stableOnCancelSearch = useCallback(() => {
    onCancelSearchRef.current?.();
  }, []);
  const stableOnClientChange = useCallback((clientId: string | null) => {
    onClientChangeRef.current(clientId);
  }, []);

  const mobileHeaderActions = useMemo(() => {
    if (!isCompactHeader) return null;
    return (
      <SearchMobileHeader
        onPreferences={stableOnPreferences}
        onSearch={stableOnSearch}
        onCancelSearch={stableOnCancelSearch}
        isSearching={params.isSearching}
        selectedClientId={params.selectedClientId}
        onClientChange={stableOnClientChange}
      />
    );
  }, [
    isCompactHeader,
    params.isSearching,
    params.selectedClientId,
    stableOnPreferences,
    stableOnSearch,
    stableOnCancelSearch,
    stableOnClientChange,
  ]);

  useEffect(() => {
    params.setMobileHeaderActions(mobileHeaderActions);
    return () => {
      params.setMobileHeaderActions(null);
    };
  }, [mobileHeaderActions, params.setMobileHeaderActions]);
}
