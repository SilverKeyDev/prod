import { useEffect, useMemo } from "react";

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
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
}): void {
  // Preserve historical behavior: show mobile header actions for `< lg` (<=1024px)
  // because Search's layout is tuned for the compact header at those widths.
  const isCompactHeader = useMediaQuery(screenDown("lg"));

  const mobileHeaderActions = useMemo(() => {
    if (!isCompactHeader) return null;
    return (
      <SearchMobileHeader
        onPreferences={params.onPreferences}
        onSearch={params.onSearch}
        isSearching={params.isSearching}
        selectedClientId={params.selectedClientId}
        onClientChange={params.onClientChange}
      />
    );
  }, [
    isCompactHeader,
    params.isSearching,
    params.onPreferences,
    params.onSearch,
    params.selectedClientId,
    params.onClientChange,
  ]);

  useEffect(() => {
    params.setMobileHeaderActions(mobileHeaderActions);
    return () => {
      params.setMobileHeaderActions(null);
    };
  }, [mobileHeaderActions, params.setMobileHeaderActions]);
}
