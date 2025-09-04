import { useCallback } from 'react';
import { SearchResult } from './useSearchPageState';

interface SearchCacheData {
  results: SearchResult[];
  timestamp: number;
  preferencesVersion: string;
  searchMetadata: {
    hasSearched: boolean;
    currentPage: number;
  };
}

interface UseSearchCacheReturn {
  saveSearchResultsToLocalStorage: (results: SearchResult[]) => Promise<void>;
  loadSearchResultsFromLocalStorage: () => SearchCacheData | null;
  clearSearchCache: () => void;
  deduplicateSearchResults: (results: SearchResult[]) => SearchResult[];
  resetAndUpdateSearchCache: (newResults: SearchResult[]) => Promise<SearchResult[]>;
}

export function useSearchCache(): UseSearchCacheReturn {
  // Deduplicate search results by ID, prioritizing properties with scores
  const deduplicateSearchResults = useCallback((results: SearchResult[]): SearchResult[] => {
    const deduplicatedResults = new Map<string, SearchResult>();
    
    results.forEach(property => {
      const existingProperty = deduplicatedResults.get(property.id);
      
      if (!existingProperty) {
        // First occurrence of this property
        deduplicatedResults.set(property.id, property);
      } else {
        // Property already exists, prioritize the one with a score
        const currentHasScore = property._score !== undefined && property._score !== null;
        const existingHasScore = existingProperty._score !== undefined && existingProperty._score !== null;
        
        if (currentHasScore && !existingHasScore) {
          // Current property has score, existing doesn't - use current
          deduplicatedResults.set(property.id, property);
        } else if (currentHasScore && existingHasScore) {
          // Both have scores, use the higher score
          if ((property._score || 0) > (existingProperty._score || 0)) {
            deduplicatedResults.set(property.id, property);
          }
        }
        // If current doesn't have score but existing does, keep existing
      }
    });

    const finalResults = Array.from(deduplicatedResults.values());
    
    if (finalResults.length !== results.length) {
      console.log('🔍 Search results deduplicated:', {
        originalCount: results.length,
        finalCount: finalResults.length,
        duplicatesRemoved: results.length - finalResults.length
      });
    }

    return finalResults;
  }, []);

  // Save search results to localStorage with preferences version and deduplication
  const saveSearchResultsToLocalStorage = useCallback(async (results: SearchResult[]) => {
    try {
      // First, clear any existing search cache to ensure fresh start
      localStorage.removeItem("searchResults");
      console.log("🧹 Cleared existing search cache before saving new results");

      // Deduplicate results before saving
      const deduplicatedResults = deduplicateSearchResults(results);

      // Fetch current user preferences to get the version
      let preferencesVersion = "1.0"; // Default version

      try {
        const idToken = localStorage.getItem("id_token");
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

        if (idToken) {
          const response = await fetch(`${apiBaseUrl}/api/v1/preferences`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            preferencesVersion = data.preferences?.preferences_version || "1.0";
          }
        }
      } catch (error) {
        console.warn("⚠️ Could not fetch preferences version:", error);
      }

      const searchData: SearchCacheData = {
        results: deduplicatedResults,
        timestamp: Date.now(),
        preferencesVersion,
        searchMetadata: {
          hasSearched: true,
          currentPage: 0,
        },
      };

      localStorage.setItem("searchResults", JSON.stringify(searchData));
      console.log("✅ Search results saved to localStorage (deduplicated):", {
        originalCount: results.length,
        savedCount: deduplicatedResults.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ Error saving search results to localStorage:", error);
    }
  }, [deduplicateSearchResults]);

  // Load search results from localStorage
  const loadSearchResultsFromLocalStorage = useCallback((): SearchCacheData | null => {
    try {
      const savedData = localStorage.getItem("searchResults");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return parsedData;
      }
    } catch (error) {
      console.error(
        "❌ Error loading search results from localStorage:",
        error
      );
    }
    return null;
  }, []);

  // Clear search cache
  const clearSearchCache = useCallback(() => {
    try {
      localStorage.removeItem("searchResults");
      console.log("✅ Search cache cleared");
    } catch (error) {
      console.error("❌ Error clearing search cache:", error);
    }
  }, []);

  // Reset and update localStorage with fresh search results
  const resetAndUpdateSearchCache = useCallback(async (newResults: SearchResult[]) => {
    try {
      // Clear all search-related localStorage items
      localStorage.removeItem("searchResults");
      localStorage.removeItem("searchResultsCount");
      localStorage.removeItem("searchPageActiveTab");
      console.log("🧹 Reset search localStorage completely");

      // Save new deduplicated results
      await saveSearchResultsToLocalStorage(newResults);
      
      // Update search results count
      const deduplicatedResults = deduplicateSearchResults(newResults);
      localStorage.setItem("searchResultsCount", deduplicatedResults.length.toString());
      
      // Reset to results tab
      localStorage.setItem("searchPageActiveTab", "results");
      
      console.log("✅ Search cache reset and updated with fresh results:", {
        count: deduplicatedResults.length,
        timestamp: new Date().toISOString()
      });
      
      return deduplicatedResults;
    } catch (error) {
      console.error("❌ Error resetting and updating search cache:", error);
      return newResults;
    }
  }, [saveSearchResultsToLocalStorage, deduplicateSearchResults]);

  return {
    saveSearchResultsToLocalStorage,
    loadSearchResultsFromLocalStorage,
    clearSearchCache,
    deduplicateSearchResults,
    resetAndUpdateSearchCache,
  };
}
