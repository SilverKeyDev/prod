import type { SearchResult } from "../../../../../packages/schemas/search";
import { log, LOG_CATEGORIES } from "../../../../../logger";

export type StoredSearch = {
  results: SearchResult[];
  timestamp: string;
  totalCount: number;
  preferencesVersion: string;
  searchMetadata: {
    hasSearched: boolean;
    currentPage: number;
    propertiesPerPage: number;
  };
};

export function loadSearchResults(): StoredSearch | null {
  try {
    const savedData = localStorage.getItem("searchResults");
    if (savedData) {
      const parsedData = JSON.parse(savedData) as StoredSearch;
      return parsedData;
    }
  } catch (error: unknown) {
    log.error(
      LOG_CATEGORIES.SEARCH,
      "Error loading search results from localStorage",
      error,
    );
  }
  return null;
}

export function saveSearchResults(input: StoredSearch): void {
  try {
    localStorage.setItem("searchResults", JSON.stringify(input));
  } catch (error: unknown) {
    log.error(
      LOG_CATEGORIES.SEARCH,
      "Error saving search results to localStorage",
      error,
    );
  }
}
