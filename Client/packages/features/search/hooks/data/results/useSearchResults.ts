/**
 * Custom hook for managing search results and saved homes state
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { log, LOG_CATEGORIES } from "packages/logger";
import { useFiltersStore } from "packages/store";
import { useUserStore } from "packages/store";
import type { SearchResult } from "packages/types";
import { createGuardedSetter } from "packages/utils";
import { getLocalStorage } from "packages/utils/storage/platformStorage";

type UseSearchResultsReturn = {
  searchResults: SearchResult[];
  savedHomes: SearchResult[];
  favoriteAddresses: string[];
  isSearching: boolean;
  searchStage: string;
  isLocalStorageLoaded: boolean;
  hasSearched: boolean;
  currentPage: number;
  activeTab: "results" | "saved";

  setSearchResults: (results: SearchResult[]) => void;
  setSavedHomes: (homes: SearchResult[]) => void;
  setFavoriteAddresses: (addresses: string[]) => void;
  setIsSearching: (searching: boolean) => void;
  setSearchStage: (stage: string) => void;
  setIsLocalStorageLoaded: (loaded: boolean) => void;
  setHasSearched: (searched: boolean) => void;
  setCurrentPage: (page: number) => void;
  setActiveTab: (tab: "results" | "saved") => void;

  paginatedSearchResults: SearchResult[];
  paginatedSavedHomes: SearchResult[];

  isHomeSaved: (propertyId: string) => boolean;
  handleTabChange: (tab: "results" | "saved") => void;

  PROPERTIES_PER_PAGE: number;
};

export const useSearchResults = (): UseSearchResultsReturn => {
  const userPreferences = useUserStore((state) => state.userPreferences);

  const [searchResults, _setSearchResults] = useState<SearchResult[]>([]);
  const [savedHomes, _setSavedHomes] = useState<SearchResult[]>([]);

  const setSearchResults = useMemo(() => createGuardedSetter(_setSearchResults), []);
  const setSavedHomes = useMemo(() => createGuardedSetter(_setSavedHomes), []);

  const favoriteAddresses = useFiltersStore((s) => s.favoriteAddresses);
  const setFavoriteAddresses = useFiltersStore((s) => s.setFavoriteAddresses);
  const isSearching = useFiltersStore((s) => s.isSearching);
  const setIsSearching = useFiltersStore((s) => s.setIsSearching);
  const searchStage = useFiltersStore((s) => s.searchStage);
  const setSearchStage = useFiltersStore((s) => s.setSearchStage);
  const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const currentPage = useFiltersStore((s) => s.currentPage);
  const setCurrentPage = useFiltersStore((s) => s.setCurrentPage);
  const activeTab = useFiltersStore((s) => s.activeTab);
  const setActiveTab = useFiltersStore((s) => s.setActiveTab);

  const PROPERTIES_PER_PAGE = 1;

  useEffect(() => {
    const initializeSearchResults = () => {
      try {
        let currentPreferencesVersion = "0";

        try {
          if (userPreferences) {
            currentPreferencesVersion = userPreferences.preferences_version ?? "1.0";
          }
        } catch (error: unknown) {
          log.warn(LOG_CATEGORIES.SEARCH, "Error accessing user preferences", error);
        }

        const local = getLocalStorage();
        const savedSearchResults = local.getItem("searchResults");
        const savedPreferencesVersion = local.getItem("searchResultsPreferencesVersion");

        if (savedSearchResults && savedPreferencesVersion === currentPreferencesVersion) {
          try {
            const parsedResults = JSON.parse(savedSearchResults) as unknown[];
            if (Array.isArray(parsedResults) && parsedResults.length > 0) {
              const validResults = parsedResults.filter(
                (result: unknown): result is SearchResult => {
                  return (
                    result !== null &&
                    typeof result === "object" &&
                    "id" in result &&
                    "address" in result
                  );
                }
              );

              if (validResults.length > 0) {
                log.info(LOG_CATEGORIES.SEARCH, "Loaded search results from localStorage", {
                  count: validResults.length,
                });
                setSearchResults(validResults);
                setHasSearched(true);
              }
            }
          } catch (error: unknown) {
            log.warn(LOG_CATEGORIES.SEARCH, "Error parsing saved search results", error);
          }
        } else {
          log.info(
            LOG_CATEGORIES.SEARCH,
            "Preferences version mismatch or no saved results. Will run fresh search"
          );
        }

        setIsLocalStorageLoaded(true);
      } catch (error: unknown) {
        log.error(LOG_CATEGORIES.ERRORS, "Error initializing search results", error);
        setIsLocalStorageLoaded(true);
      }
    };

    void initializeSearchResults();
  }, [setSearchResults, userPreferences]);

  const paginatedSearchResults = useMemo(
    () =>
      searchResults.slice(
        currentPage * PROPERTIES_PER_PAGE,
        (currentPage + 1) * PROPERTIES_PER_PAGE
      ),
    [searchResults, currentPage, PROPERTIES_PER_PAGE]
  );

  const paginatedSavedHomes = useMemo(
    () =>
      savedHomes.slice(currentPage * PROPERTIES_PER_PAGE, (currentPage + 1) * PROPERTIES_PER_PAGE),
    [savedHomes, currentPage, PROPERTIES_PER_PAGE]
  );

  const isHomeSaved = useCallback(
    (propertyId: string): boolean => {
      return savedHomes.some((home) => home.id === propertyId);
    },
    [savedHomes]
  );

  const handleTabChange = useCallback(
    (tab: "results" | "saved") => {
      setActiveTab(tab);
      setCurrentPage(0);
    },
    [setActiveTab, setCurrentPage]
  );

  return {
    searchResults,
    savedHomes,
    favoriteAddresses,
    isSearching,
    searchStage,
    isLocalStorageLoaded,
    hasSearched,
    currentPage,
    activeTab,

    setSearchResults,
    setSavedHomes,
    setFavoriteAddresses,
    setIsSearching,
    setSearchStage,
    setIsLocalStorageLoaded,
    setHasSearched,
    setCurrentPage,
    setActiveTab,

    paginatedSearchResults,
    paginatedSavedHomes,

    isHomeSaved,
    handleTabChange,

    PROPERTIES_PER_PAGE,
  };
};
