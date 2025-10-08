import { useEffect, useCallback } from "react";

import SearchMobileHeader from "../SearchMobileHeader";

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
    console.log("🔧 [MOBILE_HEADER_HOOK] Preferences button clicked");
    params.onPreferences();
  }, [params.onPreferences]);

  // Mobile header actions setup
  useEffect(() => {
    console.log("🔧 [MOBILE_HEADER_HOOK] useMobileHeaderActions initialized");

    // Cleanup actions when component unmounts
    return () => {
      console.log(
        "🔧 [MOBILE_HEADER_HOOK] Cleanup: setting mobileHeaderActions to null"
      );
      params.setMobileHeaderActions(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.setMobileHeaderActions]);

  const handleResize = useCallback(() => {
    if (typeof window === "undefined") return; // SSR-safe guard

    const isMobile = window.innerWidth < 1024;
    let newMobileHeaderActions: React.ReactNode | null = null;

    console.log("🔧 [MOBILE_HEADER_HOOK] handleResize called:", {
      windowWidth: window.innerWidth,
      isMobile,
    });

    if (isMobile) {
      newMobileHeaderActions = (
        <SearchMobileHeader
          onPreferences={wrappedOnPreferences}
          onSearch={params.onSearch}
          isSearching={params.isSearching}
        />
      );
      console.log(
        "🔧 [MOBILE_HEADER_HOOK] Created SearchMobileHeader for mobile view"
      );
    }

    // Always update mobile header actions when screen size changes
    console.log("🔧 [MOBILE_HEADER_HOOK] Updating mobileHeaderActions:", {
      isMobile,
      hasNewActions: !!newMobileHeaderActions,
    });
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
    console.log(
      "🔧 [MOBILE_HEADER_HOOK] Main effect triggered - setting up resize listener"
    );

    // Set initial state immediately
    handleResize();

    // Also set it after a small delay to ensure it's set even if resize doesn't fire
    const timeoutId = setTimeout(() => {
      console.log(
        "🔧 [MOBILE_HEADER_HOOK] Timeout fallback - ensuring mobile header actions are set"
      );
      handleResize();
    }, 100);

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      console.log(
        "🔧 [MOBILE_HEADER_HOOK] Cleanup: removing resize listener and timeout"
      );
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);
}
