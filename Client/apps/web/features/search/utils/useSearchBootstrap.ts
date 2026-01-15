// External libraries
import { useState, useEffect } from "react";

// Internal utilities
import type { SearchResult } from "../../../../../packages/schemas/search";
import { asError } from "../../../../../packages/utils/error";
import { loadSearchResults } from "./localStorage";
import { log, LOG_CATEGORIES } from "../../../../../logger";

export function useSearchBootstrap(params: {
  env: { apiBaseUrl: string };
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
          const { apiBaseUrl } = params.env;

          // Use fetch with credentials to send HTTP-only cookies
          const response = await fetch(`${apiBaseUrl}/api/v1/preferences`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Send HTTP-only cookies
          });

          if (response?.ok) {
            const data = (await response.json()) as {
              preferences?: { preferences_version?: string };
            };
            currentPreferencesVersion =
              data.preferences?.preferences_version ?? "1.0";
          }
        } catch (prefError: unknown) {
          const error = asError(prefError);
          log.warn(LOG_CATEGORIES.SEARCH, "Could not fetch current preferences version, using default", error);
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
        log.error(LOG_CATEGORIES.SEARCH, "Error in search results initialization", error);
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
  }, [params.env.apiBaseUrl]);

  return { isLocalStorageLoaded };
}
