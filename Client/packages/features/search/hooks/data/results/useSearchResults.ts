/**
 * Custom hook for managing search results and saved homes state
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { useConsolidatedSearchStore } from "packages/store";
import type { SearchResult } from "packages/types";
import { createGuardedSetter } from "packages/utils";

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
  const [searchResults, _setSearchResults] = useState<SearchResult[]>([]);
  const [savedHomes, _setSavedHomes] = useState<SearchResult[]>([]);

  const setSearchResults = useMemo(() => createGuardedSetter(_setSearchResults), []);
  const setSavedHomes = useMemo(() => createGuardedSetter(_setSavedHomes), []);

  const favoriteAddresses = useConsolidatedSearchStore((s) => s.favoriteAddresses);
  const setFavoriteAddresses = useConsolidatedSearchStore((s) => s.setFavoriteAddresses);
  const isSearching = useConsolidatedSearchStore((s) => s.isSearching);
  const setIsSearching = useConsolidatedSearchStore((s) => s.setIsSearching);
  const searchStage = useConsolidatedSearchStore((s) => s.searchStage);
  const setSearchStage = useConsolidatedSearchStore((s) => s.setSearchStage);
  const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const currentPage = useConsolidatedSearchStore((s) => s.currentPage);
  const setCurrentPage = useConsolidatedSearchStore((s) => s.setCurrentPage);
  const activeTab = useConsolidatedSearchStore((s) => s.activeTab);
  const setActiveTab = useConsolidatedSearchStore((s) => s.setActiveTab);

  const PROPERTIES_PER_PAGE = 1;

  useEffect(() => {
    // Search results come from DB via useSearchResultsData - no localStorage
    setIsLocalStorageLoaded(true);
  }, []);

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
