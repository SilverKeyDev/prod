import { useEffect, useCallback, useRef } from "react"; // Import useRef

import SearchMobileHeader from "../SearchMobileHeader";

export default function useMobileHeaderActions(params: {
  setMobileHeaderActions: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
  isSearching: boolean;
  onPreferences: () => void;
  onSearch: () => void;
}): void {
  // Mobile header actions setup
  useEffect(() => {
    // Cleanup actions when component unmounts
    return () => {
      params.setMobileHeaderActions(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.setMobileHeaderActions]);

  // Ref to track if we are currently in mobile view to prevent unnecessary updates
  const isMobileViewRef = useRef<boolean | null>(null);

  const handleResize = useCallback(() => {
    if (typeof window === "undefined") return; // SSR-safe guard

    const isMobile = window.innerWidth < 1024;
    let newMobileHeaderActions: React.ReactNode | null = null;

    if (isMobile) {
      newMobileHeaderActions = (
        <SearchMobileHeader
          onPreferences={params.onPreferences}
          onSearch={params.onSearch}
          isSearching={params.isSearching}
        />
      );
    }

    // Update state if mobile view status has changed OR if this is the initial load
    if (
      isMobile !== isMobileViewRef.current ||
      isMobileViewRef.current === null
    ) {
      params.setMobileHeaderActions(newMobileHeaderActions);
      isMobileViewRef.current = isMobile;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.setMobileHeaderActions,
    params.onPreferences,
    params.onSearch,
    params.isSearching,
  ]);

  // Handle mobile header actions based on screen size (SSR-safe)
  useEffect(() => {
    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);
}
