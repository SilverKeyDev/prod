import { useEffect } from "react";

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

  // Auto-zoom to selected property when it changes
  useEffect(() => {
    if (selectedProperty && googleMapRef.current) {
      mapFocusOnCurrentProperty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperty, mapFocusOnCurrentProperty]);

  // Focus map on current property when page changes (arrow clicks)
  useEffect(() => {
    if (
      googleMapRef.current &&
      (searchResults.length > 0 || savedHomes.length > 0)
    ) {
      mapFocusOnCurrentProperty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    searchResults.length,
    savedHomes.length,
    mapFocusOnCurrentProperty,
  ]);

  // Focus map on current property when tab changes
  useEffect(() => {
    if (
      googleMapRef.current &&
      (searchResults.length > 0 || savedHomes.length > 0)
    ) {
      // Use MapZoomController to focus on current property after tab switch
      const timeoutId = setTimeout(() => {
        mapFocusOnCurrentProperty();
      }, 100); // Small delay to ensure tab switch is complete

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    searchResults.length,
    savedHomes.length,
    mapFocusOnCurrentProperty,
  ]);
}
