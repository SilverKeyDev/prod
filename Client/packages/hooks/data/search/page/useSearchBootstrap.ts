import { useEffect, useState } from "react";

import { log, LOG_CATEGORIES } from "logger";

import { preferencesApi } from "packages/config/api";
import type { SearchResult } from "packages/schemas/search";
import { asError } from "packages/utils";
import { loadSearchResults } from "packages/utils/domain/search/searchLocalStorage";

export function useSearchBootstrap(params: {
  setSearchResults: (r: SearchResult[]) => void;
  setHasSearched: (b: boolean) => void;
  setCurrentPage: (n: number) => void;
  setShowPropertyModals: (b: boolean) => void;
}): { isLocalStorageLoaded: boolean } {
  const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false);

  useEffect(() => {
    const initializeSearchResults = async () => {
      try {
        let currentPreferencesVersion = "0"; // Default version

        try {
          const response = await preferencesApi.get();
          if (response?.success && response.preferences) {
            const prefs = response.preferences as {
              preferences_version?: string;
            };
            currentPreferencesVersion = prefs.preferences_version ?? "1.0";
          }
        } catch (prefError: unknown) {
          const error = asError(prefError);
          log.warn(
            LOG_CATEGORIES.SEARCH,
            "Could not fetch current preferences version, using default",
            error,
          );
        }

        // Check localStorage for saved search results
        const savedSearchData = loadSearchResults();
        const savedPreferencesVersion = savedSearchData?.preferencesVersion;

        // Decide whether to load from localStorage or run fresh search
        if (
          savedSearchData?.results &&
          savedSearchData.results.length > 0 &&
          savedPreferencesVersion === currentPreferencesVersion
        ) {
          params.setSearchResults(savedSearchData.results);
          params.setHasSearched(
            savedSearchData.searchMetadata?.hasSearched ?? true,
          );
          params.setCurrentPage(
            savedSearchData.searchMetadata?.currentPage ?? 0,
          );
          params.setShowPropertyModals(true);
        }
      } catch (error: unknown) {
        log.error(
          LOG_CATEGORIES.SEARCH,
          "Error in search results initialization",
          error,
        );
        // Fallback: try to load any saved data regardless of version
        const savedSearchData = loadSearchResults();
        if (savedSearchData?.results && savedSearchData.results.length > 0) {
          params.setSearchResults(savedSearchData.results);
          params.setHasSearched(true);
          params.setShowPropertyModals(true);
        }
      }

      // Mark localStorage loading as complete
      setIsLocalStorageLoaded(true);
    };

    void initializeSearchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isLocalStorageLoaded };
}
