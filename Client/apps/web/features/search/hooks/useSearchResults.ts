/**
 * Custom hook for managing search results and saved homes state
 */

import { useState, useMemo, useCallback, useEffect } from "react";

import type { SearchResult } from "../../../../../packages/schemas";
import { useFiltersStore } from "../../../../../packages/store/filters.slice";
import { useUserStore } from "../../../../../packages/store/user.slice";
import { createGuardedSetter } from "../../../../../packages/utils/array";
import { log, LOG_CATEGORIES } from "../../../../../logger";

type UseSearchResultsReturn = {
  // State
  searchResults: SearchResult[];
  savedHomes: SearchResult[];
  favoriteAddresses: string[];
  isSearching: boolean;
  searchStage: string;
  isLocalStorageLoaded: boolean;
  hasSearched: boolean;
  currentPage: number;
  activeTab: "results" | "saved";

  // Setters
  setSearchResults: (results: SearchResult[]) => void;
  setSavedHomes: (homes: SearchResult[]) => void;
  setFavoriteAddresses: (addresses: string[]) => void;
  setIsSearching: (searching: boolean) => void;
  setSearchStage: (stage: string) => void;
  setIsLocalStorageLoaded: (loaded: boolean) => void;
  setHasSearched: (searched: boolean) => void;
  setCurrentPage: (page: number) => void;
  setActiveTab: (tab: "results" | "saved") => void;

  // Computed values
  paginatedSearchResults: SearchResult[];
  paginatedSavedHomes: SearchResult[];

  // Utility functions
  isHomeSaved: (propertyId: string) => boolean;
  handleTabChange: (tab: "results" | "saved") => void;

  // Constants
  PROPERTIES_PER_PAGE: number;
};

export const useSearchResults = (): UseSearchResultsReturn => {
  const userPreferences = useUserStore((state) => state.userPreferences);

  // Core state
  const [searchResults, _setSearchResults] = useState<SearchResult[]>([]);
  const [savedHomes, _setSavedHomes] = useState<SearchResult[]>([]);

  // Create guarded setters to prevent redundant state updates
  const setSearchResults = useMemo(
    () => createGuardedSetter(_setSearchResults),
    [],
  );
  const setSavedHomes = useMemo(() => createGuardedSetter(_setSavedHomes), []);

  // Additional state
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

  // Constants
  const PROPERTIES_PER_PAGE = 1;

  // Initialize search results from localStorage
  useEffect(() => {
    const initializeSearchResults = () => {
      try {
        let currentPreferencesVersion = "0"; // Default version

        try {
          if (userPreferences) {
            currentPreferencesVersion =
              userPreferences.preferences_version ?? "1.0";
          }
        } catch (error: unknown) {
          log.warn(
            LOG_CATEGORIES.SEARCH,
            "Error accessing user preferences",
            error,
          );
        }

        // Load saved search results from localStorage
        const savedSearchResults = localStorage.getItem("searchResults");
        const savedPreferencesVersion = localStorage.getItem(
          "searchResultsPreferencesVersion",
        );

        if (
          savedSearchResults &&
          savedPreferencesVersion === currentPreferencesVersion
        ) {
          try {
            const parsedResults = JSON.parse(savedSearchResults) as unknown[];
            if (Array.isArray(parsedResults) && parsedResults.length > 0) {
              // Validate that parsed results are valid SearchResult objects
              const validResults = parsedResults.filter(
                (result: unknown): result is SearchResult => {
                  return (
                    result !== null &&
                    typeof result === "object" &&
                    "id" in result &&
                    "address" in result
                  );
                },
              );

              if (validResults.length > 0) {
                log.info(
                  LOG_CATEGORIES.SEARCH,
                  "Loaded search results from localStorage",
                  {
                    count: validResults.length,
                  },
                );
                setSearchResults(validResults);
                setHasSearched(true);
              }
            }
          } catch (error: unknown) {
            log.warn(
              LOG_CATEGORIES.SEARCH,
              "Error parsing saved search results",
              error,
            );
          }
        } else {
          log.info(
            LOG_CATEGORIES.SEARCH,
            "Preferences version mismatch or no saved results. Will run fresh search",
          );
        }

        setIsLocalStorageLoaded(true);
      } catch (error: unknown) {
        log.error(
          LOG_CATEGORIES.ERRORS,
          "Error initializing search results",
          error,
        );
        setIsLocalStorageLoaded(true);
      }
    };

    void initializeSearchResults();
  }, [setSearchResults, userPreferences]); // Include dependencies

  // Computed values
  const paginatedSearchResults = useMemo(
    () =>
      searchResults.slice(
        currentPage * PROPERTIES_PER_PAGE,
        (currentPage + 1) * PROPERTIES_PER_PAGE,
      ),
    [searchResults, currentPage, PROPERTIES_PER_PAGE],
  );

  const paginatedSavedHomes = useMemo(
    () =>
      savedHomes.slice(
        currentPage * PROPERTIES_PER_PAGE,
        (currentPage + 1) * PROPERTIES_PER_PAGE,
      ),
    [savedHomes, currentPage, PROPERTIES_PER_PAGE],
  );

  // Utility functions
  const isHomeSaved = useCallback(
    (propertyId: string): boolean => {
      return savedHomes.some((home) => home.id === propertyId);
    },
    [savedHomes],
  );

  const handleTabChange = useCallback(
    (tab: "results" | "saved") => {
      setActiveTab(tab);
      setCurrentPage(0); // Reset to first page when switching tabs
    },
    [setActiveTab, setCurrentPage],
  );

  return {
    // State
    searchResults,
    savedHomes,
    favoriteAddresses,
    isSearching,
    searchStage,
    isLocalStorageLoaded,
    hasSearched,
    currentPage,
    activeTab,

    // Setters
    setSearchResults,
    setSavedHomes,
    setFavoriteAddresses,
    setIsSearching,
    setSearchStage,
    setIsLocalStorageLoaded,
    setHasSearched,
    setCurrentPage,
    setActiveTab,

    // Computed values
    paginatedSearchResults,
    paginatedSavedHomes,

    // Utility functions
    isHomeSaved,
    handleTabChange,

    // Constants
    PROPERTIES_PER_PAGE,
  };
};
