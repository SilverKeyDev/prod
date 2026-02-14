import { useEffect, useRef } from "react";

export function usePropertyFocus(params: {
  googleMapRef: React.MutableRefObject<google.maps.Map | null>;
  activeTab: "results" | "saved";
  searchResults: unknown[];
  savedHomes: unknown[];
  currentPage: number;
  mapFocusOnCurrentProperty: () => void;
  selectedProperty?: unknown;
}): void {
  const {
    googleMapRef,
    activeTab,
    searchResults,
    savedHomes,
    currentPage,
    mapFocusOnCurrentProperty,
    selectedProperty,
  } = params;

  // Track previous values to avoid unnecessary focusing
  const prevPageRef = useRef(currentPage);
  const prevTabRef = useRef(activeTab);
  const hasDataRef = useRef(false);

  // Update data availability flag without triggering effects
  const hasData = searchResults.length > 0 || savedHomes.length > 0;
  hasDataRef.current = hasData;

  // Auto-zoom to selected property when it changes
  useEffect(() => {
    if (selectedProperty && googleMapRef.current) {
      mapFocusOnCurrentProperty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperty]);

  // Focus map when currentPage or activeTab changes (consolidated effect)
  useEffect(() => {
    if (!googleMapRef.current || !hasDataRef.current) return;

    const pageChanged = prevPageRef.current !== currentPage;
    const tabChanged = prevTabRef.current !== activeTab;

    // Only focus if page or tab actually changed
    if (pageChanged || tabChanged) {
      // Add small delay for tab changes to ensure UI is ready
      const delay = tabChanged ? 100 : 0;

      const timeoutId = setTimeout(() => {
        mapFocusOnCurrentProperty();
      }, delay);

      // Update previous values
      prevPageRef.current = currentPage;
      prevTabRef.current = activeTab;

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, activeTab]);
}
