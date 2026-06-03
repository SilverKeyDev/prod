import { useEffect, useState } from "react";

import type { SearchResult } from "@/features/search/types";

/**
 * Bootstrap hook for search page initialization.
 * Search results are always loaded from the database via useSearchResultsData - no localStorage.
 */
export function useSearchBootstrap(_params: {
  setSearchResults: (r: SearchResult[]) => void;
  setHasSearched: (b: boolean) => void;
  setCurrentPage: (n: number) => void;
  setShowPropertyModals: (show: boolean) => void;
}): { isLocalStorageLoaded: boolean } {
  const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false);

  useEffect(() => {
    // No localStorage - search results come from DB via useSearchResultsData
    setIsLocalStorageLoaded(true);
  }, []);

  return { isLocalStorageLoaded };
}
