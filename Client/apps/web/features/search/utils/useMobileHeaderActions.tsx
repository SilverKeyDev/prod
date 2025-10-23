import { useEffect, useCallback } from "react";

import SearchMobileHeader from "../components/SearchMobileHeader";

export default function useMobileHeaderActions(params: {
  setMobileHeaderActions: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
  isSearching: boolean;
  onPreferences: () => void;
  onSearch: () => void;
}): void {
  // Simple wrapper for preferences handler
  const wrappedOnPreferences = useCallback(() => {
    params.onPreferences();
  }, [params.onPreferences]);

  // Mobile header actions setup
  useEffect(() => {
    // Cleanup actions when component unmounts
    return () => {
      params.setMobileHeaderActions(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.setMobileHeaderActions]);

  const handleResize = useCallback(() => {
    if (typeof window === "undefined") return; // SSR-safe guard

    const isMobile = window.innerWidth < 1024;
    let newMobileHeaderActions: React.ReactNode | null = null;

    if (isMobile) {
      newMobileHeaderActions = (
        <SearchMobileHeader
          onPreferences={wrappedOnPreferences}
          onSearch={params.onSearch}
          isSearching={params.isSearching}
        />
      );
    }

    // Always update mobile header actions when screen size changes

    params.setMobileHeaderActions(newMobileHeaderActions);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.setMobileHeaderActions,
    wrappedOnPreferences,
    params.onSearch,
    params.isSearching,
  ]);

  // Handle mobile header actions based on screen size (SSR-safe)
  useEffect(() => {
    // Set initial state immediately
    handleResize();

    // Also set it after a small delay to ensure it's set even if resize doesn't fire
    const timeoutId = setTimeout(() => {
      handleResize();
    }, 100);

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);
}
