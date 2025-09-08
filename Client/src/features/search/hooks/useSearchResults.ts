/**
 * Custom hook for managing search results and saved homes state
 */

import { useState, useMemo, useCallback, useEffect, useContext } from 'react';
import { createGuardedSetter } from '../../../lib/arrayUtils';
import { UserContext } from '../../../context/UserContext';
import { SearchResult } from '../../../types/search';

interface UseSearchResultsReturn {
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
}

export const useSearchResults = (): UseSearchResultsReturn => {
  const { userPreferences } = useContext(UserContext) || {};
  
  // Core state
  const [searchResults, _setSearchResults] = useState<SearchResult[]>([]);
  const [savedHomes, _setSavedHomes] = useState<SearchResult[]>([]);
  
  // Create guarded setters to prevent redundant state updates
  const setSearchResults = useMemo(() => createGuardedSetter(_setSearchResults), []);
  const setSavedHomes = useMemo(() => createGuardedSetter(_setSavedHomes), []);
  
  // Additional state
  const [favoriteAddresses, setFavoriteAddresses] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStage, setSearchStage] = useState<string>("");
  const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState<"results" | "saved">("results");
  
  // Constants
  const PROPERTIES_PER_PAGE = 1;
  
  // Initialize search results from localStorage
  useEffect(() => {
    const initializeSearchResults = async () => {
      try {
        let currentPreferencesVersion = "0"; // Default version

        try {
          if (userPreferences) {
            currentPreferencesVersion =
              userPreferences.preferences_version || "1.0";
          }
        } catch (error) {
          console.warn("❌ Error accessing user preferences:", error);
        }

        // Load saved search results from localStorage
        const savedSearchResults = localStorage.getItem("searchResults");
        const savedPreferencesVersion = localStorage.getItem(
          "searchResultsPreferencesVersion"
        );

        if (
          savedSearchResults &&
          savedPreferencesVersion === currentPreferencesVersion
        ) {
          try {
            const parsedResults = JSON.parse(savedSearchResults);
            if (Array.isArray(parsedResults) && parsedResults.length > 0) {
              console.log(
                "✅ Loaded search results from localStorage:",
                parsedResults.length,
                "properties"
              );
              setSearchResults(parsedResults);
              setHasSearched(true);
            }
          } catch (error) {
            console.warn("❌ Error parsing saved search results:", error);
          }
        } else {
          console.log(
            "🔄 Preferences version mismatch or no saved results. Will run fresh search."
          );
        }

        // Load saved tab preference
        const savedTab = localStorage.getItem("searchPageActiveTab");
        if (savedTab === "results" || savedTab === "saved") {
          setActiveTab(savedTab);
        }

        setIsLocalStorageLoaded(true);
      } catch (error) {
        console.error("❌ Error initializing search results:", error);
        setIsLocalStorageLoaded(true);
      }
    };

    initializeSearchResults();
  }, []); // Empty dependency array - only run on mount
  
  // Computed values
  const paginatedSearchResults = useMemo(
    () => searchResults.slice(
      currentPage * PROPERTIES_PER_PAGE,
      (currentPage + 1) * PROPERTIES_PER_PAGE
    ),
    [searchResults, currentPage, PROPERTIES_PER_PAGE]
  );

  const paginatedSavedHomes = useMemo(
    () => savedHomes.slice(
      currentPage * PROPERTIES_PER_PAGE,
      (currentPage + 1) * PROPERTIES_PER_PAGE
    ),
    [savedHomes, currentPage, PROPERTIES_PER_PAGE]
  );
  
  // Utility functions
  const isHomeSaved = useCallback((propertyId: string): boolean => {
    return savedHomes.some((home) => home.id === propertyId);
  }, [savedHomes]);
  
  const handleTabChange = useCallback((tab: "results" | "saved") => {
    setActiveTab(tab);
    setCurrentPage(0); // Reset to first page when switching tabs
    // Save the selected tab to localStorage
    localStorage.setItem("searchPageActiveTab", tab);
  }, []);
  
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
