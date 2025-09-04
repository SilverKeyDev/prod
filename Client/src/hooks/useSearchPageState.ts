import { useState, useCallback } from 'react';
import { SearchResult } from '../types/search';

// Re-export for backward compatibility
export type { SearchResult } from '../types/search';

interface UseSearchPageStateReturn {
  // Search state
  searchResults: SearchResult[];
  setSearchResults: (results: SearchResult[]) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  searchStage: string;
  setSearchStage: (stage: string) => void;
  hasSearched: boolean;
  setHasSearched: (searched: boolean) => void;
  
  // Persistent counts
  searchResultsCount: number;
  savedHomesCount: number;
  updateSearchResultsCount: (count: number) => void;
  updateSavedHomesCount: (count: number) => void;
  
  // UI state
  activeTab: "results" | "saved";
  setActiveTab: (tab: "results" | "saved") => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  showPropertyModals: boolean;
  setShowPropertyModals: (show: boolean) => void;
  isCarouselCollapsed: boolean;
  setIsCarouselCollapsed: (collapsed: boolean) => void;
  isLocalStorageLoaded: boolean;
  setIsLocalStorageLoaded: (loaded: boolean) => void;
  isMapReady: boolean;
  setIsMapReady: (ready: boolean) => void;
  
  // Helper functions
  handleTabChange: (tab: "results" | "saved") => void;
  calculatePropertyScore: (property: SearchResult) => number;
}

export function useSearchPageState(): UseSearchPageStateReturn {
  // Search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStage, setSearchStage] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);
  
  // Persistent counts - load from localStorage
  const [searchResultsCount, setSearchResultsCount] = useState<number>(() => {
    const saved = localStorage.getItem("searchResultsCount");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [savedHomesCount, setSavedHomesCount] = useState<number>(() => {
    const saved = localStorage.getItem("savedHomesCount");
    return saved ? parseInt(saved, 10) : 0;
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState<"results" | "saved">(() => {
    // Load last active tab from localStorage, default to "results"
    const savedTab = localStorage.getItem("searchPageActiveTab");
    return savedTab === "results" || savedTab === "saved"
      ? savedTab
      : "results";
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [showPropertyModals, setShowPropertyModals] = useState(false);
  const [isCarouselCollapsed, setIsCarouselCollapsed] = useState(false);
  const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Update count functions with localStorage persistence
  const updateSearchResultsCount = useCallback((count: number) => {
    setSearchResultsCount(count);
    localStorage.setItem("searchResultsCount", count.toString());
  }, []);

  const updateSavedHomesCount = useCallback((count: number) => {
    setSavedHomesCount(count);
    localStorage.setItem("savedHomesCount", count.toString());
  }, []);

  // Reset to first page when switching tabs and save to localStorage
  const handleTabChange = useCallback((tab: "results" | "saved") => {
    setActiveTab(tab);
    setCurrentPage(0);
    // Save the selected tab to localStorage
    localStorage.setItem("searchPageActiveTab", tab);
  }, []);

  // Retrieve actual backend ML match score - no frontend calculation
  const calculatePropertyScore = useCallback((property: SearchResult) => {
    // Return actual backend score or 0 if missing
    const score = property._score || 0;
    
    if (score === 0 || score === undefined || score === null) {
      // Only log once per property to avoid spam
      const logKey = `missing-score-${property.id}`;
      if (!sessionStorage.getItem(logKey)) {
        console.warn('⚠️ Missing score for property:', {
          id: property.id,
          address: property.address,
          hasScore: '_score' in property,
          scoreValue: property._score,
          scoreType: typeof property._score
        });
        sessionStorage.setItem(logKey, 'logged');
      }
    }
    
    return score;
  }, []);

  return {
    // Search state
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    searchStage,
    setSearchStage,
    hasSearched,
    setHasSearched,
    
    // Persistent counts
    searchResultsCount,
    savedHomesCount,
    updateSearchResultsCount,
    updateSavedHomesCount,
    
    // UI state
    activeTab,
    setActiveTab,
    currentPage,
    setCurrentPage,
    showPropertyModals,
    setShowPropertyModals,
    isCarouselCollapsed,
    setIsCarouselCollapsed,
    isLocalStorageLoaded,
    setIsLocalStorageLoaded,
    isMapReady,
    setIsMapReady,
    
    // Helper functions
    handleTabChange,
    calculatePropertyScore,
  };
}
